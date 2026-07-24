import uuid

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import delete, text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes.auth import get_current_user, login, read_current_user, register
from app.core.security import verify_password
from app.db.session import SessionLocal, engine
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse, normalize_email


TEST_EMAIL = "auth-test-user@example.com"
pytestmark = pytest.mark.integration


@pytest.fixture
def db_session():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        pytest.skip(f"PostgreSQL is not available: {exc}")

    session = SessionLocal()
    session.execute(delete(User).where(User.email.like("auth-test-%@example.com")))
    session.commit()
    try:
        yield session
    finally:
        session.rollback()
        session.execute(delete(User).where(User.email.like("auth-test-%@example.com")))
        session.commit()
        session.close()


def test_normalize_email_strips_and_lowercases() -> None:
    assert normalize_email("  USER@Example.COM  ") == "user@example.com"


def test_password_hash_is_not_plain_text(db_session) -> None:
    user = register(
        RegisterRequest(
            email=f"  {TEST_EMAIL.upper()}  ",
            password="CorrectHorse42!",
            first_name=" Ada ",
            last_name=" Lovelace ",
        ),
        db_session,
    )

    assert user.email == TEST_EMAIL
    assert user.first_name == "Ada"
    assert user.last_name == "Lovelace"
    assert user.password_hash != "CorrectHorse42!"
    assert verify_password("CorrectHorse42!", user.password_hash)


def test_user_response_does_not_expose_password_hash(db_session) -> None:
    user = register(
        RegisterRequest(
            email=TEST_EMAIL,
            password="CorrectHorse42!",
            first_name="Ada",
            last_name="Lovelace",
        ),
        db_session,
    )

    response = UserResponse.model_validate(user).model_dump()

    assert "password" not in response
    assert "password_hash" not in response


def test_register_rejects_duplicate_email(db_session) -> None:
    payload = RegisterRequest(
        email=TEST_EMAIL,
        password="CorrectHorse42!",
        first_name="Ada",
        last_name="Lovelace",
    )
    register(payload, db_session)

    with pytest.raises(HTTPException) as exc_info:
        register(payload, db_session)

    assert exc_info.value.status_code == 409


def test_login_and_me_return_current_user(db_session) -> None:
    user = register(
        RegisterRequest(
            email=TEST_EMAIL,
            password="CorrectHorse42!",
            first_name="Ada",
            last_name="Lovelace",
        ),
        db_session,
    )

    token = login(
        LoginRequest(email=" AUTH-TEST-USER@EXAMPLE.COM ", password="CorrectHorse42!"),
        db_session,
    )
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=token.access_token,
    )
    current_user = get_current_user(credentials, db_session)

    assert current_user.id == user.id
    assert read_current_user(current_user) is current_user


def test_login_rejects_invalid_password(db_session) -> None:
    register(
        RegisterRequest(
            email=TEST_EMAIL,
            password="CorrectHorse42!",
            first_name="Ada",
            last_name="Lovelace",
        ),
        db_session,
    )

    with pytest.raises(HTTPException) as exc_info:
        login(LoginRequest(email=TEST_EMAIL, password="wrong-password"), db_session)

    assert exc_info.value.status_code == 401


def test_me_rejects_invalid_token(db_session) -> None:
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=f"invalid-{uuid.uuid4()}",
    )

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials, db_session)

    assert exc_info.value.status_code == 401
