from sqlalchemy import CheckConstraint, UniqueConstraint

from app.db.base import Base
from app.models import Organization, OrganizationMember, User


def test_identity_models_are_registered() -> None:
    assert User.__table__ is Base.metadata.tables["users"]
    assert Organization.__table__ is Base.metadata.tables["organizations"]
    assert OrganizationMember.__table__ is Base.metadata.tables["organization_members"]


def test_user_table_has_required_auth_columns() -> None:
    columns = User.__table__.columns

    assert {"id", "email", "password_hash", "first_name", "last_name"}.issubset(
        columns.keys()
    )
    assert columns["email"].nullable is False
    assert columns["password_hash"].nullable is False
    assert columns["is_active"].nullable is False
    assert columns["is_active"].server_default is not None


def test_organization_member_has_org_user_uniqueness() -> None:
    constraints = {
        constraint.name
        for constraint in OrganizationMember.__table__.constraints
        if isinstance(constraint, UniqueConstraint)
    }

    assert "uq_organization_members_org_user" in constraints


def test_organization_member_role_is_constrained() -> None:
    constraints = {
        constraint.name
        for constraint in OrganizationMember.__table__.constraints
        if isinstance(constraint, CheckConstraint)
    }

    assert "ck_organization_members_role" in constraints
