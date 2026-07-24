import uuid

import pytest
from fastapi import HTTPException
from sqlalchemy import delete, func, select, text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes.organizations import (
    ADMIN_ROLE,
    create_organization,
    get_organization,
    list_organizations,
)
from app.core.security import get_password_hash
from app.db.session import SessionLocal, engine
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.schemas.organization import OrganizationCreateRequest, OrganizationResponse


pytestmark = pytest.mark.integration


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
    session.execute(delete(OrganizationMember).where(OrganizationMember.role == ADMIN_ROLE))
    session.execute(delete(Organization).where(Organization.slug.like("org-test-%")))
    session.execute(delete(User).where(User.email.like("org-test-%@example.com")))
    session.commit()


def _create_user(session, suffix: str) -> User:
    user = User(
        email=f"org-test-{suffix}@example.com",
        first_name="Test",
        last_name=suffix,
        password_hash=get_password_hash("CorrectHorse42!"),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def test_create_organization_creates_admin_membership_in_one_commit(db_session) -> None:
    user = _create_user(db_session, "owner")

    organization = create_organization(
        OrganizationCreateRequest(name="Org Test Main", slug="org-test-main"),
        user,
        db_session,
    )

    membership = db_session.scalar(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == organization.id,
            OrganizationMember.user_id == user.id,
        )
    )

    assert membership is not None
    assert membership.role == ADMIN_ROLE
    assert OrganizationResponse.model_validate(organization).slug == "org-test-main"


def test_create_organization_rolls_back_if_membership_creation_fails(
    db_session,
    monkeypatch,
) -> None:
    user = _create_user(db_session, "rollback")
    original_add = db_session.add

    def fail_on_member(instance) -> None:
        if isinstance(instance, OrganizationMember):
            raise RuntimeError("membership failed")
        original_add(instance)

    monkeypatch.setattr(db_session, "add", fail_on_member)

    with pytest.raises(RuntimeError):
        create_organization(
            OrganizationCreateRequest(name="Org Test Rollback", slug="org-test-rollback"),
            user,
            db_session,
        )

    assert db_session.scalar(
        select(func.count()).select_from(Organization).where(
            Organization.slug == "org-test-rollback"
        )
    ) == 0


def test_list_organizations_only_returns_current_user_memberships(db_session) -> None:
    owner = _create_user(db_session, "owner-list")
    other = _create_user(db_session, "other-list")
    visible = create_organization(
        OrganizationCreateRequest(name="Org Test Visible", slug="org-test-visible"),
        owner,
        db_session,
    )
    create_organization(
        OrganizationCreateRequest(name="Org Test Hidden", slug="org-test-hidden"),
        other,
        db_session,
    )

    organizations = list_organizations(owner, db_session)

    assert [organization.id for organization in organizations] == [visible.id]


def test_get_organization_requires_membership(db_session) -> None:
    owner = _create_user(db_session, "owner-get")
    other = _create_user(db_session, "other-get")
    organization = create_organization(
        OrganizationCreateRequest(name="Org Test Private", slug="org-test-private"),
        owner,
        db_session,
    )

    with pytest.raises(HTTPException) as exc_info:
        get_organization(organization.id, other, db_session)

    assert exc_info.value.status_code == 404


def test_create_organization_rejects_duplicate_slug(db_session) -> None:
    owner = _create_user(db_session, "owner-duplicate")
    other = _create_user(db_session, "other-duplicate")
    create_organization(
        OrganizationCreateRequest(name="Org Test Duplicate", slug="org-test-duplicate"),
        owner,
        db_session,
    )

    with pytest.raises(HTTPException) as exc_info:
        create_organization(
            OrganizationCreateRequest(name="Org Test Duplicate 2", slug="org-test-duplicate"),
            other,
            db_session,
        )

    assert exc_info.value.status_code == 409


def test_get_organization_rejects_unknown_id(db_session) -> None:
    owner = _create_user(db_session, "owner-missing")

    with pytest.raises(HTTPException) as exc_info:
        get_organization(uuid.uuid4(), owner, db_session)

    assert exc_info.value.status_code == 404
