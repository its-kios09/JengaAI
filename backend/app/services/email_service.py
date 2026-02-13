"""Email service using Resend API."""

from __future__ import annotations

import logging
from typing import Optional

import resend

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self) -> None:
        if settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY

    def _is_configured(self) -> bool:
        return bool(settings.RESEND_API_KEY)

    async def send_verification(self, to_email: str, code: str) -> bool:
        verify_link = f"{settings.FRONTEND_URL}/verify-email?code={code}"

        if not self._is_configured():
            logger.warning("Resend not configured. DEV ONLY — Verify link: %s", verify_link)
            return False

        try:
            params: resend.Emails.SendParams = {
                "from": settings.EMAIL_FROM,
                "to": [to_email],
                "subject": "Verify your Jenga-AI email",
                "html": self._verification_template(verify_link),
            }
            result = resend.Emails.send(params)
            logger.info("Verification email sent to %s (id: %s)", to_email, result.get("id"))
            return True
        except Exception as exc:
            logger.error("Failed to send verification email to %s: %s", to_email, exc)
            return False

    async def send_password_reset(self, to_email: str, code: str) -> bool:
        reset_link = f"{settings.FRONTEND_URL}/reset-password?code={code}"

        if not self._is_configured():
            logger.warning("Resend not configured. DEV ONLY — Reset link: %s", reset_link)
            return False

        try:
            params: resend.Emails.SendParams = {
                "from": settings.EMAIL_FROM,
                "to": [to_email],
                "subject": "Reset your Jenga-AI password",
                "html": self._reset_password_template(reset_link),
            }
            result = resend.Emails.send(params)
            logger.info("Reset email sent to %s (id: %s)", to_email, result.get("id"))
            return True
        except Exception as exc:
            logger.error("Failed to send reset email to %s: %s", to_email, exc)
            return False

    async def send_welcome(self, to_email: str, full_name: str) -> bool:
        if not self._is_configured():
            logger.info("Resend not configured. Skipping welcome email for %s", to_email)
            return False

        try:
            params: resend.Emails.SendParams = {
                "from": settings.EMAIL_FROM,
                "to": [to_email],
                "subject": "Welcome to Jenga-AI",
                "html": self._welcome_template(full_name),
            }
            result = resend.Emails.send(params)
            logger.info("Welcome email sent to %s (id: %s)", to_email, result.get("id"))
            return True
        except Exception as exc:
            logger.error("Failed to send welcome email to %s: %s", to_email, exc)
            return False

    def _verification_template(self, verify_link: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h1 style="font-size: 24px; font-weight: 700; color: #18181b; margin: 0 0 8px;">Jenga-AI</h1>
                <h2 style="font-size: 18px; font-weight: 600; color: #18181b; margin: 0 0 24px;">Verify your email</h2>
                <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                    Thanks for signing up! Click the button below to verify your email address. This link expires in 24 hours.
                </p>
                <a href="{verify_link}"
                   style="display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    Verify Email
                </a>
                <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 32px 0 0;">
                    If you didn't create an account, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    If the button doesn't work, copy and paste this link:<br>
                    <a href="{verify_link}" style="color: #3b82f6; word-break: break-all;">{verify_link}</a>
                </p>
            </div>
        </body>
        </html>
        """

    def _reset_password_template(self, reset_link: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h1 style="font-size: 24px; font-weight: 700; color: #18181b; margin: 0 0 8px;">Jenga-AI</h1>
                <h2 style="font-size: 18px; font-weight: 600; color: #18181b; margin: 0 0 24px;">Reset your password</h2>
                <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                    We received a request to reset your password. Click the button below to choose a new one. This link expires in 15 minutes.
                </p>
                <a href="{reset_link}"
                   style="display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    Reset Password
                </a>
                <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 32px 0 0;">
                    If you didn't request this, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    If the button doesn't work, copy and paste this link:<br>
                    <a href="{reset_link}" style="color: #3b82f6; word-break: break-all;">{reset_link}</a>
                </p>
            </div>
        </body>
        </html>
        """

    def _welcome_template(self, full_name: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h1 style="font-size: 24px; font-weight: 700; color: #18181b; margin: 0 0 8px;">Jenga-AI</h1>
                <h2 style="font-size: 18px; font-weight: 600; color: #18181b; margin: 0 0 24px;">Welcome, {full_name}!</h2>
                <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                    Your account is ready. Start building powerful NLP models for African languages — from simple classifiers to multi-task fusion models.
                </p>
                <a href="{settings.FRONTEND_URL}/dashboard"
                   style="display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    Go to Dashboard
                </a>
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    Built for Kenya. Built for Africa. Built for everyone.
                </p>
            </div>
        </body>
        </html>
        """


email_service = EmailService()
