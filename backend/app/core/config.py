from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "CapISO API"
    app_version: str = "0.1.0"
    service_name: str = "capiso-api"
    app_env: str = "development"
    app_secret_key: str = Field(default="change-me-change-me-change-me-change-me", repr=False)
    api_v1_prefix: str = "/api/v1"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    database_url: str = Field(
        default="postgresql+psycopg://capiso:change-me@localhost:5433/capiso",
        repr=False,
    )
    database_echo: bool = False
    testing: bool = False
    frontend_url: str = "http://localhost:5173"
    email_from: str = "no-reply@capiso.local"
    email_verification_expire_hours: int = 24
    email_resend_cooldown_seconds: int = 60
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = Field(default=None, repr=False)
    smtp_password: str | None = Field(default=None, repr=False)
    smtp_use_tls: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
