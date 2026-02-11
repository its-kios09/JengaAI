"""Auth service — handles user registration, login, password reset."""

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
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

RESET_CODE_EXPIRY_MINUTES = 15


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def register(self, email: str, password: str, full_name: str) -> User:
        existing = await self._get_user_by_email(email)
        if existing:
            raise ValueError("Email already registered")

        user = User(
            email=email.lower().strip(),
            hashed_password=hash_password(password),
            full_name=full_name.strip(),
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        await email_service.send_welcome(user.email, user.full_name)
        logger.info("User registered: %s", user.email)
        return user

    async def login(self, email: str, password: str) -> dict:
        user = await self._get_user_by_email(email.lower().strip())
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")
        if not user.is_active:
            raise ValueError("Account is deactivated")
        logger.info("User logged in: %s", user.email)
        return self._create_tokens(user)

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
        if full_name:
            user.full_name = full_name.strip()
        user.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def forgot_password(self, email: str) -> bool:
        """Generate a short reset code, store in DB, and send email."""
        user = await self._get_user_by_email(email.lower().strip())
        if not user:
            logger.info("Password reset requested for unknown email: %s", email)
            return False

        # Invalidate any existing reset codes for this user
        existing = await self.db.execute(
            select(PasswordReset).where(
                and_(
                    PasswordReset.user_id == user.id,
                    PasswordReset.used == False,
                )
            )
        )
        for old_reset in existing.scalars().all():
            old_reset.used = True

        # Generate short, URL-safe code
        code = secrets.token_urlsafe(32)

        reset = PasswordReset(
            user_id=user.id,
            code=code,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=RESET_CODE_EXPIRY_MINUTES),
        )
        self.db.add(reset)
        await self.db.commit()

        sent = await email_service.send_password_reset(user.email, code)
        logger.info("Password reset for %s — code generated, email sent: %s", user.email, sent)
        return sent

    async def reset_password(self, code: str, new_password: str) -> None:
        """Reset password using the code from email."""
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

        # Update password
        user.hashed_password = hash_password(new_password)
        user.updated_at = now

        # Mark code as used
        reset.used = True

        await self.db.commit()
        logger.info("Password reset for: %s", user.email)

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
