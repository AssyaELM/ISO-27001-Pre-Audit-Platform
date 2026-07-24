from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies.organizations import (
    OrganizationAccess,
    require_organization_admin,
    require_organization_member,
)
from app.api.routes.auth import get_current_user
from app.db.session import get_session
from app.models.onboarding import OnboardingSession
from app.models.user import User
from app.onboarding.catalog_v1 import ONBOARDING_CATALOG
from app.schemas.onboarding import (
    OnboardingDetailResponse,
    OnboardingReviewResponse,
    OnboardingSessionResponse,
    OnboardingStep1Input,
    OnboardingStep2Input,
    OnboardingStep3Input,
    OnboardingValidatedResponse,
)
from app.services.onboarding import (
    clone_onboarding,
    create_or_resume_onboarding,
    get_active_onboarding,
    get_latest_validated_onboarding,
    onboarding_answers,
    onboarding_summary,
    require_active_onboarding,
    review_onboarding,
    save_step_1,
    save_step_2,
    save_step_3,
)


router = APIRouter(tags=["onboarding"])


@router.get("/onboarding/catalog")
def get_onboarding_catalog(
    _current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    return ONBOARDING_CATALOG


@router.post(
    "/organizations/{organization_id}/onboarding",
    response_model=OnboardingSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_onboarding(
    organization_id: UUID,
    access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> OnboardingSession:
    existing = get_active_onboarding(session, organization_id)
    if existing is not None:
        return existing
    try:
        onboarding = create_or_resume_onboarding(
            session, organization_id, access.user.id
        )
        session.commit()
        return onboarding
    except Exception:
        session.rollback()
        raise


def _visible_onboarding(session: Session, organization_id: UUID) -> OnboardingSession:
    onboarding = get_active_onboarding(session, organization_id)
    if onboarding is None:
        onboarding = session.scalar(
            select(OnboardingSession)
            .where(OnboardingSession.organization_id == organization_id)
            .order_by(OnboardingSession.version.desc())
        )
    if onboarding is None:
        raise HTTPException(status_code=404, detail="Onboarding session not found")
    return onboarding


@router.get(
    "/organizations/{organization_id}/onboarding",
    response_model=OnboardingDetailResponse,
)
def read_onboarding(
    organization_id: UUID,
    access: OrganizationAccess = Depends(require_organization_member),
    session: Session = Depends(get_session),
) -> OnboardingDetailResponse:
    onboarding = _visible_onboarding(session, organization_id)
    review = review_onboarding(session, onboarding)
    return OnboardingDetailResponse(
        organization={
            "name": access.organization.name,
            "country": access.organization.country,
            "sector": access.organization.sector,
            "size_range": access.organization.size_range,
        },
        session=onboarding,
        answers=onboarding_answers(session, onboarding),
        warnings=review.warnings,
        indicators={
            "completion_percentage": review.completion_percentage,
            "missing_information_count": len(review.blocking_errors),
            "unknown_items_count": len(review.unknown_items),
            "derived_context": review.derived_context,
        },
    )


def _save_step(
    session: Session,
    organization_id: UUID,
    payload,
    saver,
) -> OnboardingDetailResponse | None:
    onboarding = require_active_onboarding(session, organization_id, editable=True)
    try:
        saver(session, onboarding, payload)
        session.commit()
    except Exception:
        session.rollback()
        raise
    return None


@router.put(
    "/organizations/{organization_id}/onboarding/steps/1",
    response_model=OnboardingSessionResponse,
)
def put_onboarding_step_1(
    organization_id: UUID,
    payload: OnboardingStep1Input,
    _access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> OnboardingSession:
    onboarding = require_active_onboarding(session, organization_id, editable=True)
    try:
        save_step_1(session, onboarding, payload)
        session.commit()
        return onboarding
    except Exception:
        session.rollback()
        raise


@router.put(
    "/organizations/{organization_id}/onboarding/steps/2",
    response_model=OnboardingSessionResponse,
)
def put_onboarding_step_2(
    organization_id: UUID,
    payload: OnboardingStep2Input,
    _access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> OnboardingSession:
    onboarding = require_active_onboarding(session, organization_id, editable=True)
    try:
        save_step_2(session, onboarding, payload)
        session.commit()
        return onboarding
    except Exception:
        session.rollback()
        raise


@router.put(
    "/organizations/{organization_id}/onboarding/steps/3",
    response_model=OnboardingSessionResponse,
)
def put_onboarding_step_3(
    organization_id: UUID,
    payload: OnboardingStep3Input,
    _access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> OnboardingSession:
    onboarding = require_active_onboarding(session, organization_id, editable=True)
    try:
        save_step_3(session, onboarding, payload)
        session.commit()
        return onboarding
    except Exception:
        session.rollback()
        raise


@router.post(
    "/organizations/{organization_id}/onboarding/review",
    response_model=OnboardingReviewResponse,
)
def review_active_onboarding(
    organization_id: UUID,
    _access: OrganizationAccess = Depends(require_organization_member),
    session: Session = Depends(get_session),
) -> OnboardingReviewResponse:
    onboarding = _visible_onboarding(session, organization_id)
    review = review_onboarding(session, onboarding)
    session.commit()
    return review


@router.post(
    "/organizations/{organization_id}/onboarding/submit",
    response_model=OnboardingSessionResponse,
)
def submit_onboarding(
    organization_id: UUID,
    _access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> OnboardingSession:
    onboarding = require_active_onboarding(session, organization_id, editable=True)
    review = review_onboarding(session, onboarding)
    if review.blocking_errors:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"blocking_errors": review.blocking_errors},
        )
    try:
        onboarding.status = "pending_review"
        onboarding.submitted_at = datetime.now(UTC)
        session.commit()
        return onboarding
    except Exception:
        session.rollback()
        raise


@router.post(
    "/organizations/{organization_id}/onboarding/validate",
    response_model=OnboardingValidatedResponse,
)
def validate_onboarding(
    organization_id: UUID,
    access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> OnboardingValidatedResponse:
    onboarding = require_active_onboarding(session, organization_id)
    if onboarding.status != "pending_review":
        raise HTTPException(status_code=409, detail="Onboarding must be submitted first")
    review = review_onboarding(session, onboarding)
    if review.blocking_errors:
        raise HTTPException(
            status_code=409, detail={"blocking_errors": review.blocking_errors}
        )
    try:
        now = datetime.now(UTC)
        onboarding.status = "validated"
        onboarding.validated_by_user_id = access.user.id
        onboarding.validated_at = now
        onboarding.completion_percentage = 100
        summary = onboarding_summary(session, access.organization, onboarding)
        session.commit()
        return OnboardingValidatedResponse(
            session=onboarding,
            summary=summary,
            suggested_future_evidence_categories=[
                "asset_inventory",
                "architecture_diagram",
                "supplier_contracts",
                "data_register",
            ],
        )
    except Exception:
        session.rollback()
        raise


@router.post(
    "/organizations/{organization_id}/onboarding/revise",
    response_model=OnboardingSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def revise_onboarding(
    organization_id: UUID,
    access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> OnboardingSession:
    if get_active_onboarding(session, organization_id) is not None:
        raise HTTPException(status_code=409, detail="An active onboarding already exists")
    source = get_latest_validated_onboarding(session, organization_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Validated onboarding not found")
    try:
        clone = clone_onboarding(session, source, access.user.id)
        session.commit()
        return clone
    except Exception:
        session.rollback()
        raise
