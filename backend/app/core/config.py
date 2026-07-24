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
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(
        default="postgresql+psycopg://capiso:change-me@localhost:5432/capiso",
        repr=False,
    )
    database_echo: bool = False
    testing: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
