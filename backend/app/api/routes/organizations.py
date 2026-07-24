import re
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.routes.auth import get_current_user
from app.db.session import get_session
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.schemas.organization import OrganizationCreateRequest, OrganizationResponse


router = APIRouter(prefix="/organizations", tags=["organizations"])
ADMIN_ROLE = "administrateur_entreprise"


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    if not slug:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Organization slug cannot be blank",
        )
    return slug


def _visible_organization_query(user_id: UUID):
    return (
        select(Organization)
        .join(OrganizationMember)
        .where(OrganizationMember.user_id == user_id)
        .order_by(Organization.created_at.desc())
    )


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Organization:
    organization = Organization(
        name=payload.name,
        slug=_slugify(payload.slug or payload.name),
        sector=payload.sector,
        size_range=payload.size_range,
        country=payload.country,
        language=payload.language,
        timezone=payload.timezone,
        description=payload.description,
    )

    try:
        session.add(organization)
        session.flush()
        session.add(
            OrganizationMember(
                organization_id=organization.id,
                user_id=current_user.id,
                role=ADMIN_ROLE,
            )
        )
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization slug already exists",
        ) from exc
    except Exception:
        session.rollback()
        raise

    session.refresh(organization)
    return organization


@router.get("", response_model=list[OrganizationResponse])
def list_organizations(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[Organization]:
    return list(session.scalars(_visible_organization_query(current_user.id)).all())


@router.get("/{organization_id}", response_model=OrganizationResponse)
def get_organization(
    organization_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Organization:
    organization = session.scalar(
        _visible_organization_query(current_user.id).where(Organization.id == organization_id)
    )
    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return organization
