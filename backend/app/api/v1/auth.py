"""Auth API router — register, login, refresh, profile, password reset."""

from __future__ import annotations

import logging
import os
import uuid as uuid_mod
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.rate_limit import limiter
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Create a new user account. Rate limited: 5/minute."""
    service = AuthService(db)
    try:
        user = await service.register(
            email=body.email, password=body.password, full_name=body.full_name
        )
        return user
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and return tokens. Rate limited: 10/minute."""
    service = AuthService(db)
    try:
        tokens = await service.login(email=body.email, password=body.password)
        return tokens
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
async def refresh(request: Request, body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token. Rate limited: 20/minute."""
    service = AuthService(db)
    try:
        tokens = await service.refresh_token(body.refresh_token)
        return tokens
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    try:
        user = await service.update_profile(
            user_id=current_user.id, full_name=request.full_name, email=request.email
        )
        return user
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/minute")
async def forgot_password(request: Request, body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request password reset. Rate limited: 3/minute."""
    service = AuthService(db)
    await service.forgot_password(email=body.email)
    return MessageResponse(
        message="If an account with that email exists, we've sent a password reset link."
    )


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password(request: Request, body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password with code. Rate limited: 5/minute."""
    service = AuthService(db)
    try:
        await service.reset_password(code=body.code, new_password=body.new_password)
        return MessageResponse(message="Password reset successfully.")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))





AVATAR_DIR = Path("uploads/avatars")
AVATAR_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload or update user avatar. Max 5MB, JPEG/PNG/WebP/GIF."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="File must be JPEG, PNG, WebP, or GIF")

    contents = await file.read()
    if len(contents) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=400, detail="File must be under 5MB")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename else "jpg"
    filename = f"{current_user.id}_{uuid_mod.uuid4().hex[:8]}.{ext}"
    filepath = AVATAR_DIR / filename

    # Delete old avatar file if exists
    if current_user.avatar_url:
        old_file = Path(current_user.avatar_url.lstrip("/"))
        if old_file.exists():
            old_file.unlink()

    with open(filepath, "wb") as f:
        f.write(contents)

    current_user.avatar_url = f"/uploads/avatars/{filename}"
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/me/avatar", response_model=UserResponse)
async def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove user avatar."""
    if current_user.avatar_url:
        old_file = Path(current_user.avatar_url.lstrip("/"))
        if old_file.exists():
            old_file.unlink()
        current_user.avatar_url = None
        await db.commit()
        await db.refresh(current_user)
    return current_user


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change password for authenticated user."""
    service = AuthService(db)
    try:
        await service.change_password(
            user_id=current_user.id,
            current_password=body.current_password,
            new_password=body.new_password,
        )
        return MessageResponse(message="Password changed successfully.")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/verify-email", response_model=MessageResponse)
@limiter.limit("10/minute")
async def verify_email(request: Request, code: str, db: AsyncSession = Depends(get_db)):
    """Verify email address using code sent during registration."""
    service = AuthService(db)
    try:
        await service.verify_email(code=code)
        return MessageResponse(message="Email verified successfully.")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("2/minute")
async def resend_verification(request: Request, body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Resend email verification. Rate limited: 2/minute."""
    service = AuthService(db)
    await service.resend_verification(email=body.email)
    return MessageResponse(
        message="If an unverified account with that email exists, we've sent a verification link."
    )
