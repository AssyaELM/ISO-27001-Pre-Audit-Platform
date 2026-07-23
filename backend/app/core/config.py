from functools import lru_cache
from os import getenv


class Settings:
    app_name: str = getenv("APP_NAME", "CapISO API")
    app_version: str = getenv("APP_VERSION", "0.1.0")
    service_name: str = getenv("SERVICE_NAME", "capiso-api")
    api_v1_prefix: str = getenv("API_V1_PREFIX", "/api/v1")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

