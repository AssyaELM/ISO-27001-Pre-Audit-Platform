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
from app.db.session import get_session
from app.models.onboarding import OnboardingSession
from app.models.organization_member import OrganizationMember
from app.models.scope import IsmsScope, ScopeClarification, ScopeElement
from app.schemas.scope import (
    ScopeClarificationPatchRequest,
    ScopeClarificationResponse,
    ScopeCreateFromOnboardingRequest,
    ScopeDetailResponse,
    ScopeElementPatchRequest,
    ScopeElementResponse,
    ScopePatchRequest,
    ScopeResponse,
    ScopeReviewResponse,
)
from app.services.scope import (
    clone_scope,
    ensure_scope_editable,
    generate_scope,
    get_scope,
    get_scope_element,
    review_scope,
    update_scope_element,
)


router = APIRouter(prefix="/organizations/{organization_id}/scopes", tags=["scopes"])


@router.post(
    "/from-onboarding",
    response_model=ScopeDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_scope_from_onboarding(
    organization_id: UUID,
    payload: ScopeCreateFromOnboardingRequest,
    access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> IsmsScope:
    onboarding = session.scalar(
        select(OnboardingSession).where(
            OnboardingSession.id == payload.onboarding_session_id,
            OnboardingSession.organization_id == organization_id,
        )
    )
    if onboarding is None:
        raise HTTPException(status_code=404, detail="Onboarding session not found")
    try:
        scope = generate_scope(session, onboarding, access.user.id, payload.name)
        session.commit()
        return scope
    except Exception:
        session.rollback()
        raise


@router.get("", response_model=list[ScopeResponse])
def list_scopes(
    organization_id: UUID,
    _access: OrganizationAccess = Depends(require_organization_member),
    session: Session = Depends(get_session),
) -> list[IsmsScope]:
    return list(
        session.scalars(
            select(IsmsScope)
            .where(IsmsScope.organization_id == organization_id)
            .order_by(IsmsScope.version.desc())
        ).all()
    )


@router.get("/{scope_id}", response_model=ScopeDetailResponse)
def read_scope(
    organization_id: UUID,
    scope_id: UUID,
    _access: OrganizationAccess = Depends(require_organization_member),
    session: Session = Depends(get_session),
) -> IsmsScope:
    return get_scope(session, organization_id, scope_id)


@router.patch("/{scope_id}", response_model=ScopeResponse)
def patch_scope(
    organization_id: UUID,
    scope_id: UUID,
    payload: ScopePatchRequest,
    _access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> IsmsScope:
    scope = get_scope(session, organization_id, scope_id)
    ensure_scope_editable(scope)
    values = payload.model_dump(exclude_unset=True)
    for key, value in values.items():
        setattr(scope, key, value)
    try:
        session.commit()
        return scope
    except Exception:
        session.rollback()
        raise


@router.get("/{scope_id}/elements", response_model=list[ScopeElementResponse])
def list_scope_elements(
    organization_id: UUID,
    scope_id: UUID,
    _access: OrganizationAccess = Depends(require_organization_member),
    session: Session = Depends(get_session),
) -> list[ScopeElement]:
    scope = get_scope(session, organization_id, scope_id)
    return list(
        session.scalars(
            select(ScopeElement)
            .where(ScopeElement.scope_id == scope.id)
            .order_by(ScopeElement.created_at, ScopeElement.id)
        ).all()
    )


@router.patch(
    "/{scope_id}/elements/{element_id}",
    response_model=ScopeElementResponse,
)
def patch_scope_element(
    organization_id: UUID,
    scope_id: UUID,
    element_id: UUID,
    payload: ScopeElementPatchRequest,
    _access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> ScopeElement:
    scope = get_scope(session, organization_id, scope_id)
    element = get_scope_element(session, scope, element_id)
    try:
        update_scope_element(
            session,
            scope,
            element,
            payload.user_decision,
            payload.justification,
        )
        session.commit()
        return element
    except Exception:
        session.rollback()
        raise


@router.get(
    "/{scope_id}/clarifications",
    response_model=list[ScopeClarificationResponse],
)
def list_scope_clarifications(
    organization_id: UUID,
    scope_id: UUID,
    _access: OrganizationAccess = Depends(require_organization_member),
    session: Session = Depends(get_session),
) -> list[ScopeClarification]:
    scope = get_scope(session, organization_id, scope_id)
    return list(
        session.scalars(
            select(ScopeClarification)
            .where(ScopeClarification.scope_id == scope.id)
            .order_by(ScopeClarification.created_at, ScopeClarification.id)
        ).all()
    )


@router.patch(
    "/{scope_id}/clarifications/{clarification_id}",
    response_model=ScopeClarificationResponse,
)
def patch_scope_clarification(
    organization_id: UUID,
    scope_id: UUID,
    clarification_id: UUID,
    payload: ScopeClarificationPatchRequest,
    _access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> ScopeClarification:
    scope = get_scope(session, organization_id, scope_id)
    ensure_scope_editable(scope)
    clarification = session.scalar(
        select(ScopeClarification).where(
            ScopeClarification.id == clarification_id,
            ScopeClarification.scope_id == scope.id,
            ScopeClarification.organization_id == organization_id,
        )
    )
    if clarification is None:
        raise HTTPException(status_code=404, detail="Clarification not found")
    values = payload.model_dump(exclude_unset=True)
    assigned_to = values.get("assigned_to_user_id")
    if assigned_to is not None:
        membership = session.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == assigned_to,
                OrganizationMember.status == "active",
            )
        )
        if membership is None:
            raise HTTPException(status_code=422, detail="Assignee is not an active member")
    for key, value in values.items():
        setattr(clarification, key, value)
    if clarification.status == "resolved":
        clarification.resolved_at = datetime.now(UTC)
    elif "status" in values:
        clarification.resolved_at = None
    try:
        session.commit()
        return clarification
    except Exception:
        session.rollback()
        raise


@router.post("/{scope_id}/review", response_model=ScopeReviewResponse)
def review_current_scope(
    organization_id: UUID,
    scope_id: UUID,
    _access: OrganizationAccess = Depends(require_organization_member),
    session: Session = Depends(get_session),
) -> ScopeReviewResponse:
    scope = get_scope(session, organization_id, scope_id)
    review = review_scope(session, scope)
    session.commit()
    return review


@router.post("/{scope_id}/submit", response_model=ScopeResponse)
def submit_scope(
    organization_id: UUID,
    scope_id: UUID,
    _access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> IsmsScope:
    scope = get_scope(session, organization_id, scope_id)
    ensure_scope_editable(scope)
    review = review_scope(session, scope)
    if review.blocking_errors:
        session.rollback()
        raise HTTPException(
            status_code=409, detail={"blocking_errors": review.blocking_errors}
        )
    try:
        scope.status = "pending_review"
        session.commit()
        return scope
    except Exception:
        session.rollback()
        raise


@router.post("/{scope_id}/validate", response_model=ScopeDetailResponse)
def validate_scope(
    organization_id: UUID,
    scope_id: UUID,
    access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> IsmsScope:
    scope = get_scope(session, organization_id, scope_id)
    if scope.status != "pending_review":
        raise HTTPException(status_code=409, detail="Scope must be submitted first")
    review = review_scope(session, scope)
    if review.blocking_errors:
        session.rollback()
        raise HTTPException(
            status_code=409, detail={"blocking_errors": review.blocking_errors}
        )
    try:
        scope.status = "validated"
        scope.validated_by_user_id = access.user.id
        scope.validated_at = datetime.now(UTC)
        for element in session.scalars(
            select(ScopeElement).where(ScopeElement.scope_id == scope.id)
        ):
            if element.user_decision != "to_determine":
                element.status = "validated"
        session.commit()
        return scope
    except Exception:
        session.rollback()
        raise


@router.post(
    "/{scope_id}/revise",
    response_model=ScopeDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def revise_scope(
    organization_id: UUID,
    scope_id: UUID,
    access: OrganizationAccess = Depends(require_organization_admin),
    session: Session = Depends(get_session),
) -> IsmsScope:
    source = get_scope(session, organization_id, scope_id)
    if source.status != "validated":
        raise HTTPException(status_code=409, detail="Only a validated scope can be revised")
    try:
        clone = clone_scope(session, source, access.user.id)
        session.commit()
        return clone
    except Exception:
        session.rollback()
        raise
