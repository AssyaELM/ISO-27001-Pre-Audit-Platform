import asyncio
import uuid
from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import ValidationError
from sqlalchemy import delete, func, select, text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes.auth import (
    _token_hash,
    get_current_user,
    login,
    read_current_user,
    register,
    resend_verification,
    verify_email,
)
from app.core.security import get_password_hash, verify_password
from app.db.session import SessionLocal, engine
from app.models.email_verification_token import EmailVerificationToken
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    ResendVerificationRequest,
    UserResponse,
    VerifyEmailRequest,
    normalize_email,
)
from app.services.email import EmailService


TEST_EMAIL = "auth-test-user@example.com"
pytestmark = pytest.mark.integration


class FakeEmailService(EmailService):
    def __init__(self) -> None:
        self.messages: list[dict[str, object]] = []

    async def send_verification_email(
        self,
        recipient: str,
        verification_url: str,
        expires_at: datetime,
        first_name: str | None = None,
        organization_name: str | None = None,
    ) -> None:
        self.messages.append(
            {
                "recipient": recipient,
                "verification_url": verification_url,
                "expires_at": expires_at,
                "first_name": first_name,
                "organization_name": organization_name,
            }
        )


@pytest.fixture
def db_session():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        pytest.skip(f"PostgreSQL is not available: {exc}")

    session = SessionLocal()
    _cleanup(session)
    try:
        yield session
    finally:
        session.rollback()
        _cleanup(session)
        session.close()


def _cleanup(session) -> None:
    session.execute(
        delete(EmailVerificationToken).where(
            EmailVerificationToken.user_id.in_(
                select(User.id).where(User.email.like("auth-test-%@example.com"))
            )
        )
    )
    session.execute(delete(User).where(User.email.like("auth-test-%@example.com")))
    session.commit()


def _register_user(db_session, email: str = TEST_EMAIL) -> tuple[User, FakeEmailService, str]:
    email_service = FakeEmailService()
    asyncio.run(
        register(
            RegisterRequest(
                email=f"  {email.upper()}  ",
                password="CorrectHorse42!",
                first_name=" Ada ",
                last_name=" Lovelace ",
            ),
            db_session,
            email_service,
        )
    )
    user = db_session.scalar(select(User).where(User.email == email))
    assert user is not None
    raw_token = _extract_token(email_service)
    return user, email_service, raw_token


def _extract_token(email_service: FakeEmailService) -> str:
    assert email_service.messages
    url = str(email_service.messages[-1]["verification_url"])
    token = parse_qs(urlparse(url).query)["token"][0]
    assert token
    return token


def test_normalize_email_strips_and_lowercases() -> None:
    assert normalize_email("  USER@Example.COM  ") == "user@example.com"


def test_register_creates_unverified_user_token_and_email(db_session) -> None:
    response = asyncio.run(
        register(
            RegisterRequest(
                email=f"  {TEST_EMAIL.upper()}  ",
                password="CorrectHorse42!",
                first_name=" Ada ",
                last_name=" Lovelace ",
            ),
            db_session,
            FakeEmailService(),
        )
    )
    user = db_session.scalar(select(User).where(User.email == TEST_EMAIL))
    token = db_session.scalar(
        select(EmailVerificationToken).where(EmailVerificationToken.user_id == user.id)
    )

    assert response.status == "pending_email_verification"
    assert response.organization is None
    assert response.email_masked == "a*************@example.com"
    assert user.first_name == "Ada"
    assert user.last_name == "Lovelace"
    assert user.is_active is True
    assert user.is_verified is False
    assert user.email_verified_at is None
    assert verify_password("CorrectHorse42!", user.password_hash)
    assert user.password_hash != "CorrectHorse42!"
    assert token is not None
    assert len(token.token_hash) == 64
    assert "access_token" not in response.model_dump()


def test_user_response_does_not_expose_password_hash(db_session) -> None:
    user, _, _ = _register_user(db_session)

    response = UserResponse.model_validate(user).model_dump()

    assert "password" not in response
    assert "password_hash" not in response


def test_register_rejects_duplicate_email_without_second_user(db_session) -> None:
    _register_user(db_session)
    payload = RegisterRequest(
        email=TEST_EMAIL,
        password="CorrectHorse42!",
        first_name="Ada",
        last_name="Lovelace",
    )

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(register(payload, db_session, FakeEmailService()))

    assert exc_info.value.status_code == 409
    assert db_session.scalar(
        select(func.count()).select_from(User).where(User.email.like("auth-test-%@example.com"))
    ) == 1


def test_login_rejects_unverified_after_valid_password(db_session) -> None:
    _register_user(db_session)

    with pytest.raises(HTTPException) as exc_info:
        login(LoginRequest(email=TEST_EMAIL, password="CorrectHorse42!"), db_session)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == "email_verification_required"


def test_verify_email_allows_login_and_me(db_session) -> None:
    user, _, raw_token = _register_user(db_session)

    response = verify_email(VerifyEmailRequest(token=raw_token), db_session)
    db_session.refresh(user)
    token = db_session.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == _token_hash(raw_token)
        )
    )
    login_response = login(
        LoginRequest(email=" AUTH-TEST-USER@EXAMPLE.COM ", password="CorrectHorse42!"),
        db_session,
    )
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=login_response.access_token,
    )
    current_user = get_current_user(credentials, db_session)

    assert response.status == "verified"
    assert user.is_verified is True
    assert user.email_verified_at is not None
    assert token.used_at is not None
    assert current_user.id == user.id
    assert read_current_user(current_user) is current_user


def test_verify_email_rejects_unknown_expired_used_invalidated_and_empty_tokens(db_session) -> None:
    user, _, raw_token = _register_user(db_session)
    token = db_session.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == _token_hash(raw_token)
        )
    )

    with pytest.raises(HTTPException) as exc_info:
        verify_email(VerifyEmailRequest(token=f"invalid-{uuid.uuid4()}"), db_session)
    assert exc_info.value.status_code == 400

    token.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    db_session.commit()
    with pytest.raises(HTTPException) as exc_info:
        verify_email(VerifyEmailRequest(token=raw_token), db_session)
    assert exc_info.value.status_code == 400

    token.expires_at = datetime.now(UTC) + timedelta(hours=1)
    token.used_at = datetime.now(UTC)
    db_session.commit()
    with pytest.raises(HTTPException) as exc_info:
        verify_email(VerifyEmailRequest(token=raw_token), db_session)
    assert exc_info.value.status_code == 400

    token.used_at = None
    token.invalidated_at = datetime.now(UTC)
    db_session.commit()
    with pytest.raises(HTTPException) as exc_info:
        verify_email(VerifyEmailRequest(token=raw_token), db_session)
    assert exc_info.value.status_code == 400

    assert user.is_verified is False
    with pytest.raises(ValidationError):
        VerifyEmailRequest(token=" ")


def test_resend_verification_is_generic_and_rate_limited(db_session) -> None:
    user, email_service, _ = _register_user(db_session)
    first_token_count = db_session.scalar(
        select(func.count()).select_from(EmailVerificationToken).where(
            EmailVerificationToken.user_id == user.id
        )
    )

    response = asyncio.run(
        resend_verification(
            ResendVerificationRequest(email=TEST_EMAIL),
            db_session,
            email_service,
        )
    )
    second_token_count = db_session.scalar(
        select(func.count()).select_from(EmailVerificationToken).where(
            EmailVerificationToken.user_id == user.id
        )
    )

    assert "Si un compte en attente" in response.message
    assert second_token_count == first_token_count

    existing_token = db_session.scalar(
        select(EmailVerificationToken).where(EmailVerificationToken.user_id == user.id)
    )
    existing_token.created_at = datetime.now(UTC) - timedelta(minutes=2)
    db_session.commit()

    asyncio.run(
        resend_verification(
            ResendVerificationRequest(email=TEST_EMAIL),
            db_session,
            email_service,
        )
    )
    tokens = list(
        db_session.scalars(
            select(EmailVerificationToken).where(EmailVerificationToken.user_id == user.id)
        ).all()
    )

    assert len(tokens) == 2
    assert any(token.invalidated_at is not None for token in tokens)
    assert len(email_service.messages) == 2


def test_resend_verification_does_not_expose_unknown_or_verified_accounts(db_session) -> None:
    user = User(
        email="auth-test-verified@example.com",
        first_name="Verified",
        last_name="User",
        password_hash=get_password_hash("CorrectHorse42!"),
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    email_service = FakeEmailService()

    unknown_response = asyncio.run(
        resend_verification(
            ResendVerificationRequest(email="auth-test-missing@example.com"),
            db_session,
            email_service,
        )
    )
    verified_response = asyncio.run(
        resend_verification(
            ResendVerificationRequest(email="auth-test-verified@example.com"),
            db_session,
            email_service,
        )
    )

    assert unknown_response == verified_response
    assert email_service.messages == []


def test_me_rejects_invalid_token(db_session) -> None:
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=f"invalid-{uuid.uuid4()}",
    )

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials, db_session)

    assert exc_info.value.status_code == 401
