"""Application settings loaded from environment variables."""

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Jenga-AI backend settings.

    All values can be overridden via environment variables or a .env file.
    """

    # App
    APP_NAME: str = "Jenga-AI API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/jenga_ai"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth / JWT
    SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # File uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 500

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # MLflow
    MLFLOW_TRACKING_URI: Optional[str] = None

    # Compute / Export
    RUNPOD_API_KEY: Optional[str] = None
    NOTEBOOKS_DIR: str = "./generated_notebooks"
    PACKAGES_DIR: str = "./generated_packages"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
