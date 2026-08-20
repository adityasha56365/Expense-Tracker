# app/core/config.py
import os
from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    MONGODB_URL: str = Field(
        default_factory=lambda: os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL") or "mongodb://localhost:27017/expense_tracker"
    )
    DATABASE_NAME: str = "expense_tracker"
    SECRET_KEY: str = Field(
        default_factory=lambda: os.getenv("SECRET_KEY") or "smart-expense-tracker-secret-key-2026-prod"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    CORS_ORIGINS: str = "*"
    TESSERACT_CMD: str = "tesseract"
    GEMINI_API_KEY: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
