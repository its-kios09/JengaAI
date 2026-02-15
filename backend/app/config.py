"""Application settings loaded from environment variables."""

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings

_env_file = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    """Jenga-AI backend settings.

    All values can be overridden via environment variables or a .env file.
    Values without defaults are REQUIRED (must be in .env).
    """

    APP_NAME: str = "Jenga-AI API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    DATABASE_URL: str

    REDIS_URL: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 500

    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    MLFLOW_TRACKING_URI: Optional[str] = None

    RUNPOD_API_KEY: Optional[str] = None
    NOTEBOOKS_DIR: str = "./generated_notebooks"
    PACKAGES_DIR: str = "./generated_packages"

    RESEND_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "onboarding@resend.dev"
    FRONTEND_URL: str

    model_config = {
        "env_file": str(_env_file),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
