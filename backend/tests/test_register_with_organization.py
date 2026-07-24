import asyncio
from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi import HTTPException
from sqlalchemy import delete, func, select, text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes.auth import (
    ADMIN_ROLE,
    MEMBERSHIP_STATUS_ACTIVE,
    MEMBERSHIP_STATUS_PENDING,
    ORG_STATUS_ACTIVE,
    ORG_STATUS_PENDING,
    _token_hash,
    login,
    register_with_organization,
    verify_email,
)
from app.api.routes.organizations import create_organization, list_organizations
from app.core.security import verify_password
from app.db.session import SessionLocal, engine
from app.models.email_verification_token import EmailVerificationToken
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterWithOrganizationRequest, VerifyEmailRequest
from app.schemas.organization import OrganizationCreateRequest
from app.services.email import EmailService


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
    user_ids = select(User.id).where(User.email.like("signup-test-%@example.com"))
    org_ids = select(Organization.id).where(Organization.slug.like("signup-test-%"))
    session.execute(
        delete(EmailVerificationToken).where(
            (EmailVerificationToken.user_id.in_(user_ids))
            | (EmailVerificationToken.organization_id.in_(org_ids))
        )
    )
    session.execute(
        delete(OrganizationMember).where(
            (OrganizationMember.user_id.in_(user_ids))
            | (OrganizationMember.organization_id.in_(org_ids))
        )
    )
    session.execute(delete(Organization).where(Organization.slug.like("signup-test-%")))
    session.execute(delete(User).where(User.email.like("signup-test-%@example.com")))
    session.commit()


def _payload(email: str = "signup-test-owner@example.com") -> RegisterWithOrganizationRequest:
    return RegisterWithOrganizationRequest(
        first_name=" Sara ",
        last_name=" Amrani ",
        email=email,
        password="MotDePasseLongEtUnique123!",
        organization=OrganizationCreateRequest(
            name=" Signup Test Atlas ",
            slug="signup-test-atlas",
            country=" ma ",
            sector="software_saas",
            size_range="11_50",
        ),
    )


def _extract_token(email_service: FakeEmailService) -> str:
    assert email_service.messages
    url = str(email_service.messages[-1]["verification_url"])
    return parse_qs(urlparse(url).query)["token"][0]


def test_register_with_organization_creates_pending_graph_and_hashed_token(db_session) -> None:
    email_service = FakeEmailService()
    response = asyncio.run(register_with_organization(_payload(), db_session, email_service))
    raw_token = _extract_token(email_service)

    user = db_session.scalar(select(User).where(User.email == "signup-test-owner@example.com"))
    organization = db_session.scalar(
        select(Organization).where(Organization.slug == "signup-test-atlas")
    )
    membership = db_session.scalar(
        select(OrganizationMember).where(OrganizationMember.user_id == user.id)
    )
    token = db_session.scalar(
        select(EmailVerificationToken).where(EmailVerificationToken.user_id == user.id)
    )

    assert response.status == "pending_email_verification"
    assert response.organization is not None
    assert response.organization.current_user_role == ADMIN_ROLE
    assert response.organization.membership_status == MEMBERSHIP_STATUS_PENDING
    assert "access_token" not in response.model_dump()
    assert "password_hash" not in response.model_dump()
    assert raw_token not in response.model_dump_json()
    assert user.email == "signup-test-owner@example.com"
    assert user.first_name == "Sara"
    assert user.last_name == "Amrani"
    assert user.is_active is True
    assert user.is_verified is False
    assert verify_password("MotDePasseLongEtUnique123!", user.password_hash)
    assert organization.status == ORG_STATUS_PENDING
    assert organization.country == "MA"
    assert organization.sector == "software_saas"
    assert organization.size_range == "11_50"
    assert membership.role == ADMIN_ROLE
    assert membership.status == MEMBERSHIP_STATUS_PENDING
    assert token.organization_id == organization.id
    assert token.membership_id == membership.id
    assert token.token_hash == _token_hash(raw_token)
    assert raw_token != token.token_hash


def test_register_with_organization_rejects_duplicate_email_without_orphan_org(db_session) -> None:
    email_service = FakeEmailService()
    asyncio.run(register_with_organization(_payload(), db_session, email_service))

    duplicate = _payload()
    duplicate.organization.slug = "signup-test-second"
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(register_with_organization(duplicate, db_session, email_service))

    assert exc_info.value.status_code == 409
    assert db_session.scalar(
        select(func.count()).select_from(Organization).where(
            Organization.slug == "signup-test-second"
        )
    ) == 0


def test_register_with_organization_rolls_back_when_membership_fails(
    db_session,
    monkeypatch,
) -> None:
    original_add = db_session.add

    def fail_on_member(instance) -> None:
        if isinstance(instance, OrganizationMember):
            raise RuntimeError("membership failed")
        original_add(instance)

    monkeypatch.setattr(db_session, "add", fail_on_member)

    with pytest.raises(RuntimeError):
        asyncio.run(register_with_organization(_payload(), db_session, FakeEmailService()))

    assert db_session.scalar(
        select(func.count()).select_from(User).where(User.email.like("signup-test-%@example.com"))
    ) == 0
    assert db_session.scalar(
        select(func.count()).select_from(Organization).where(
            Organization.slug.like("signup-test-%")
        )
    ) == 0
    assert db_session.scalar(
        select(func.count()).select_from(EmailVerificationToken).where(
            EmailVerificationToken.user_id.in_(
                select(User.id).where(User.email.like("signup-test-%@example.com"))
            )
        )
    ) == 0


def test_register_with_organization_rolls_back_when_token_fails(db_session, monkeypatch) -> None:
    original_add = db_session.add

    def fail_on_token(instance) -> None:
        if isinstance(instance, EmailVerificationToken):
            raise RuntimeError("token failed")
        original_add(instance)

    monkeypatch.setattr(db_session, "add", fail_on_token)

    with pytest.raises(RuntimeError):
        asyncio.run(register_with_organization(_payload(), db_session, FakeEmailService()))

    assert db_session.scalar(
        select(func.count()).select_from(User).where(User.email.like("signup-test-%@example.com"))
    ) == 0
    assert db_session.scalar(
        select(func.count()).select_from(Organization).where(
            Organization.slug.like("signup-test-%")
        )
    ) == 0


def test_verify_email_activates_precise_organization_membership_and_login(db_session) -> None:
    email_service = FakeEmailService()
    asyncio.run(register_with_organization(_payload(), db_session, email_service))
    raw_token = _extract_token(email_service)

    response = verify_email(VerifyEmailRequest(token=raw_token), db_session)

    user = db_session.scalar(select(User).where(User.email == "signup-test-owner@example.com"))
    organization = db_session.scalar(
        select(Organization).where(Organization.slug == "signup-test-atlas")
    )
    membership = db_session.scalar(
        select(OrganizationMember).where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.organization_id == organization.id,
        )
    )
    token = db_session.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == _token_hash(raw_token)
        )
    )

    login_response = login(
        LoginRequest(email="signup-test-owner@example.com", password="MotDePasseLongEtUnique123!"),
        db_session,
    )
    visible_organizations = list_organizations(user, db_session)
    second_org = create_organization(
        OrganizationCreateRequest(
            name="Signup Test Second",
            slug="signup-test-second",
            country="FR",
            sector="it_services",
            size_range="1_10",
        ),
        user,
        db_session,
    )

    assert response.status == "verified"
    assert user.is_verified is True
    assert user.email_verified_at is not None
    assert organization.status == ORG_STATUS_ACTIVE
    assert membership.status == MEMBERSHIP_STATUS_ACTIVE
    assert token.used_at is not None
    assert login_response.access_token
    assert [item.id for item in visible_organizations] == [organization.id]
    assert second_org.status == ORG_STATUS_ACTIVE


def test_verify_email_invalidates_other_active_tokens(db_session) -> None:
    email_service = FakeEmailService()
    asyncio.run(register_with_organization(_payload(), db_session, email_service))
    raw_token = _extract_token(email_service)
    user = db_session.scalar(select(User).where(User.email == "signup-test-owner@example.com"))
    extra_token = EmailVerificationToken(
        user_id=user.id,
        token_hash=_token_hash("signup-extra-token"),
        expires_at=datetime.now(UTC) + timedelta(hours=1),
    )
    db_session.add(extra_token)
    db_session.commit()

    verify_email(VerifyEmailRequest(token=raw_token), db_session)
    db_session.refresh(extra_token)

    assert extra_token.invalidated_at is not None


def test_non_verified_user_cannot_create_access_token_or_use_organizations(db_session) -> None:
    asyncio.run(register_with_organization(_payload(), db_session, FakeEmailService()))
    user = db_session.scalar(select(User).where(User.email == "signup-test-owner@example.com"))

    with pytest.raises(HTTPException) as exc_info:
        login(
            LoginRequest(
                email="signup-test-owner@example.com",
                password="MotDePasseLongEtUnique123!",
            ),
            db_session,
        )

    assert exc_info.value.status_code == 403
    assert list_organizations(user, db_session) == []
