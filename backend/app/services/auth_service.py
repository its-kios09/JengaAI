"""Auth service — handles user registration, login, password reset, email verification."""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.models.password_reset import PasswordReset
from app.models.email_verification import EmailVerification
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

RESET_CODE_EXPIRY_MINUTES = 15
VERIFY_CODE_EXPIRY_HOURS = 24


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Register ──────────────────────────────────────

    async def register(self, email: str, password: str, full_name: str) -> User:
        existing = await self._get_user_by_email(email)
        if existing:
            raise ValueError("Email already registered")

        user = User(
            email=email.lower().strip(),
            hashed_password=hash_password(password),
            full_name=full_name.strip(),
            is_verified=False,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        # Send verification email
        await self._send_verification_email(user)

        logger.info("User registered: %s", user.email)
        return user

    # ── Login ─────────────────────────────────────────

    async def login(self, email: str, password: str) -> dict:
        user = await self._get_user_by_email(email.lower().strip())
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")
        if not user.is_active:
            raise ValueError("Account is deactivated")
        if not user.is_verified:
            raise ValueError("Please verify your email before logging in")
        logger.info("User logged in: %s", user.email)
        return self._create_tokens(user)

    # ── Token refresh ─────────────────────────────────

    async def refresh_token(self, refresh_token: str) -> dict:
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise ValueError("Invalid or expired refresh token")
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token")
        user = await self.db.get(User, UUID(user_id))
        if not user or not user.is_active:
            raise ValueError("User not found or deactivated")
        return self._create_tokens(user)

    # ── Profile ───────────────────────────────────────

    async def get_user(self, user_id: UUID) -> Optional[User]:
        return await self.db.get(User, user_id)

    async def update_profile(self, user_id: UUID, full_name: Optional[str] = None, email: Optional[str] = None) -> User:
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError("User not found")
        if email and email.lower().strip() != user.email:
            existing = await self._get_user_by_email(email.lower().strip())
            if existing:
                raise ValueError("Email already in use")
            user.email = email.lower().strip()
            # Re-verify on email change
            user.is_verified = False
            await self._send_verification_email(user)
        if full_name:
            user.full_name = full_name.strip()
        user.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    # ── Email verification ────────────────────────────

    async def verify_email(self, code: str) -> None:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(EmailVerification).where(
                and_(
                    EmailVerification.code == code,
                    EmailVerification.used == False,
                    EmailVerification.expires_at > now,
                )
            )
        )
        verification = result.scalar_one_or_none()
        if not verification:
            raise ValueError("Invalid or expired verification code")

        user = await self.db.get(User, verification.user_id)
        if not user:
            raise ValueError("User not found")

        user.is_verified = True
        user.updated_at = now
        verification.used = True
        await self.db.commit()
        logger.info("Email verified: %s", user.email)

    async def resend_verification(self, email: str) -> None:
        user = await self._get_user_by_email(email.lower().strip())
        if not user or user.is_verified:
            return  # Silent — don't reveal account state
        await self._send_verification_email(user)

    async def _send_verification_email(self, user: User) -> None:
        # Invalidate old codes
        existing = await self.db.execute(
            select(EmailVerification).where(
                and_(
                    EmailVerification.user_id == user.id,
                    EmailVerification.used == False,
                )
            )
        )
        for old in existing.scalars().all():
            old.used = True

        code = secrets.token_urlsafe(32)
        verification = EmailVerification(
            user_id=user.id,
            code=code,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=VERIFY_CODE_EXPIRY_HOURS),
        )
        self.db.add(verification)
        await self.db.commit()

        await email_service.send_verification(user.email, code)

    # ── Forgot / Reset password ───────────────────────

    async def forgot_password(self, email: str) -> bool:
        user = await self._get_user_by_email(email.lower().strip())
        if not user:
            logger.info("Password reset requested for unknown email: %s", email)
            return False

        # Invalidate old codes
        existing = await self.db.execute(
            select(PasswordReset).where(
                and_(
                    PasswordReset.user_id == user.id,
                    PasswordReset.used == False,
                )
            )
        )
        for old in existing.scalars().all():
            old.used = True

        code = secrets.token_urlsafe(32)
        reset = PasswordReset(
            user_id=user.id,
            code=code,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=RESET_CODE_EXPIRY_MINUTES),
        )
        self.db.add(reset)
        await self.db.commit()

        sent = await email_service.send_password_reset(user.email, code)
        logger.info("Password reset for %s — email sent: %s", user.email, sent)
        return sent

    async def reset_password(self, code: str, new_password: str) -> None:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(PasswordReset).where(
                and_(
                    PasswordReset.code == code,
                    PasswordReset.used == False,
                    PasswordReset.expires_at > now,
                )
            )
        )
        reset = result.scalar_one_or_none()
        if not reset:
            raise ValueError("Invalid or expired reset code")

        user = await self.db.get(User, reset.user_id)
        if not user:
            raise ValueError("User not found")

        user.hashed_password = hash_password(new_password)
        user.updated_at = now
        reset.used = True
        await self.db.commit()
        logger.info("Password reset for: %s", user.email)

    # ── Helpers ───────────────────────────────────────

    async def _get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    def _create_tokens(self, user: User) -> dict:
        token_data = {"sub": str(user.id), "email": user.email}
        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "token_type": "bearer",
        }
