from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routes.auth import (
    ADMIN_ROLE,
    MEMBERSHIP_STATUS_ACTIVE,
    ORG_STATUS_ACTIVE,
    get_current_user,
)
from app.db.session import get_session
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User


@dataclass(frozen=True)
class OrganizationAccess:
    organization: Organization
    membership: OrganizationMember
    user: User


def require_organization_member(
    organization_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> OrganizationAccess:
    row = session.execute(
        select(Organization, OrganizationMember)
        .join(
            OrganizationMember,
            OrganizationMember.organization_id == Organization.id,
        )
        .where(
            Organization.id == organization_id,
            Organization.status == ORG_STATUS_ACTIVE,
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.status == MEMBERSHIP_STATUS_ACTIVE,
        )
    ).one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization resource not found",
        )
    organization, membership = row
    return OrganizationAccess(organization, membership, current_user)


def require_organization_admin(
    access: OrganizationAccess = Depends(require_organization_member),
) -> OrganizationAccess:
    if access.membership.role != ADMIN_ROLE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization administrator role required",
        )
    return access
