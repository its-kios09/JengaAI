"""Pydantic v2 schemas for Auth API."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


def validate_password_strength(password: str) -> str:
    """Enforce password strength rules."""
    errors = []
    if len(password) < 8:
        errors.append("at least 8 characters")
    if not re.search(r"[A-Z]", password):
        errors.append("one uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("one lowercase letter")
    if not re.search(r"\d", password):
        errors.append("one number")
    if errors:
        raise ValueError(f"Password must contain: {', '.join(errors)}")
    return password


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)

    @field_validator("password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        return validate_password_strength(v)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str = Field(serialization_alias="accessToken")
    refresh_token: str = Field(serialization_alias="refreshToken")
    token_type: str = Field(default="bearer", serialization_alias="tokenType")


class RefreshRequest(BaseModel):
    refresh_token: str = Field(alias="refreshToken")
    model_config = {"populate_by_name": True}


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str = Field(serialization_alias="fullName")
    is_active: bool = Field(serialization_alias="isActive")
    is_verified: bool = Field(serialization_alias="isVerified")
    avatar_url: str | None = Field(default=None, serialization_alias="avatarUrl")
    created_at: datetime = Field(serialization_alias="createdAt")
    model_config = {"from_attributes": True, "populate_by_name": True}


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    code: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        return validate_password_strength(v)


class MessageResponse(BaseModel):
    message: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        return validate_password_strength(v)
