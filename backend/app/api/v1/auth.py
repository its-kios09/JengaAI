"""Auth API router — register, login, refresh, profile, password reset."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.auth import (
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
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        user = await service.register(
            email=request.email, password=request.password, full_name=request.full_name
        )
        return user
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        tokens = await service.login(email=request.email, password=request.password)
        return tokens
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        tokens = await service.refresh_token(request.refresh_token)
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
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset. Always returns success to prevent email enumeration."""
    service = AuthService(db)
    await service.forgot_password(email=request.email)
    return MessageResponse(
        message="If an account with that email exists, we've sent a password reset link."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using the code from email."""
    service = AuthService(db)
    try:
        await service.reset_password(code=request.code, new_password=request.new_password)
        return MessageResponse(message="Password reset successfully.")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
