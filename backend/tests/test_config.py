from app.core.config import Settings


def test_database_url_loads_from_environment(monkeypatch) -> None:
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://capiso:example@localhost:5432/capiso_test",
    )

    settings = Settings()

    assert settings.database_url == (
        "postgresql+psycopg://capiso:example@localhost:5432/capiso_test"
    )


def test_database_echo_loads_from_environment(monkeypatch) -> None:
    monkeypatch.setenv("DATABASE_ECHO", "true")

    settings = Settings()

    assert settings.database_echo is True


def test_settings_keep_existing_application_defaults() -> None:
    settings = Settings()

    assert settings.app_name == "CapISO API"
    assert settings.service_name == "capiso-api"
    assert settings.api_v1_prefix == "/api/v1"

