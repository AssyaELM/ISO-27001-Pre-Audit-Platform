import subprocess
import sys

from sqlalchemy.orm import Session

import app.models
from app.db.base import Base


def test_base_metadata_exists() -> None:
    assert Base.metadata is not None
    assert set(Base.metadata.tables) == {
        "organization_members",
        "organizations",
        "users",
    }


def test_session_factory_is_configured() -> None:
    from app.db.session import SessionLocal

    session = SessionLocal()
    try:
        assert isinstance(session, Session)
        assert session.expire_on_commit is False
    finally:
        session.close()


def test_get_session_closes_session(monkeypatch) -> None:
    from app.db import session as session_module

    closed = {"value": False}

    class DummySession:
        def close(self) -> None:
            closed["value"] = True

    monkeypatch.setattr(session_module, "SessionLocal", DummySession)

    dependency = session_module.get_session()
    yielded = next(dependency)
    assert isinstance(yielded, DummySession)

    try:
        next(dependency)
    except StopIteration:
        pass

    assert closed["value"] is True


def test_importing_app_does_not_import_database_session() -> None:
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            (
                "import sys; "
                "import app.main; "
                "raise SystemExit(0 if 'app.db.session' not in sys.modules else 1)"
            ),
        ],
        check=False,
    )

    assert result.returncode == 0
