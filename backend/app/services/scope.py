from __future__ import annotations

import uuid
from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.onboarding import (
    OnboardingSession,
    OrganizationActivity,
    OrganizationDataCategory,
    OrganizationProcess,
    OrganizationProfile,
    OrganizationSite,
    OrganizationSupplier,
    OrganizationSystem,
    OrganizationTeam,
)
from app.models.scope import IsmsScope, ScopeClarification, ScopeElement
from app.schemas.scope import ScopeReviewResponse


def utc_now() -> datetime:
    return datetime.now(UTC)


def _items(session: Session, model, onboarding_id: UUID):
    return list(
        session.scalars(
            select(model)
            .where(model.onboarding_session_id == onboarding_id)
            .order_by(model.created_at, model.id)
        ).all()
    )


def scope_suggestion(
    element_type: str, item: object
) -> tuple[str, str, bool]:
    if element_type == "activity":
        return (
            "include_recommended",
            "Activité principale sélectionnée pendant l’onboarding.",
            False,
        )
    if element_type == "process":
        return (
            "include_recommended",
            "Ce processus soutient directement l’activité préparée.",
            False,
        )
    if element_type == "team":
        return (
            "include_recommended",
            "Cette équipe participe à l’activité préparée.",
            False,
        )
    if element_type == "site":
        site = item
        if site.site_type in {"headquarters", "technical_site", "datacenter"}:
            return (
                "include_recommended",
                "Ce site est déclaré comme directement concerné par l’activité.",
                False,
            )
        return (
            "review_required",
            "Le lien précis de ce site avec l’activité doit être confirmé.",
            False,
        )
    if element_type == "system":
        system = item
        if system.identification_status == "to_determine":
            return (
                "insufficient_information",
                "Le système n’est pas suffisamment identifié.",
                True,
            )
        if system.supported_activity_or_process:
            return (
                "include_recommended",
                "Ce système soutient une activité ou un processus déclaré.",
                True,
            )
        return (
            "review_required",
            "Le lien du système avec l’activité préparée doit être confirmé.",
            False,
        )
    if element_type == "data_category":
        category = item
        if category.category_type == "unknown":
            return (
                "insufficient_information",
                "La catégorie d’information n’est pas encore identifiée.",
                True,
            )
        return (
            "include_recommended",
            "Cette catégorie d’information est traitée dans l’activité préparée.",
            False,
        )
    if element_type == "supplier":
        supplier = item
        if (
            supplier.criticality == "high"
            or supplier.processes_or_hosts_data == "yes"
            or supplier.has_system_access == "yes"
        ):
            return (
                "include_recommended",
                "Ce fournisseur est critique, traite des données ou accède aux systèmes.",
                True,
            )
        if (
            supplier.criticality == "to_determine"
            or supplier.processes_or_hosts_data == "unknown"
            or supplier.has_system_access == "unknown"
        ):
            return (
                "insufficient_information",
                "Les dépendances et la criticité de ce fournisseur sont incomplètes.",
                True,
            )
        if not supplier.related_service_or_system:
            return (
                "review_required",
                "Le service ou système lié à ce fournisseur n’est pas identifié.",
                False,
            )
        return (
            "review_required",
            "La place de ce fournisseur dans la frontière du SMSI doit être confirmée.",
            False,
        )
    raise ValueError(f"Unsupported scope element type: {element_type}")


def build_scope_description(
    activities: list[OrganizationActivity],
    teams: list[OrganizationTeam],
    systems: list[OrganizationSystem],
    data_categories: list[OrganizationDataCategory],
    suppliers: list[OrganizationSupplier],
) -> str:
    activity = activities[0].name if activities else "l’activité déclarée"
    fragments = [f"Le périmètre préliminaire du SMSI couvre les activités liées à {activity}"]
    if teams:
        fragments.append(
            "les équipes "
            + ", ".join((item.custom_name or item.team_type).replace("_", " ") for item in teams)
        )
    if systems:
        fragments.append("les systèmes utilisés pour son développement, son exploitation ou son support")
    if data_categories:
        fragments.append("les catégories d’informations traitées")
    if suppliers:
        fragments.append("les fournisseurs associés")
    return ", incluant ".join((fragments[0], ", ".join(fragments[1:]))) + "."


def _element_name(element_type: str, item: object) -> str:
    field_map = {
        "activity": "name",
        "process": "custom_name",
        "team": "custom_name",
        "site": "name",
        "system": "name",
        "data_category": "custom_name",
        "supplier": "name",
    }
    value = getattr(item, field_map[element_type], None)
    if value:
        return value
    fallback = {
        "process": getattr(item, "process_type", None),
        "team": getattr(item, "team_type", None),
        "data_category": getattr(item, "category_type", None),
    }.get(element_type)
    return str(fallback or element_type).replace("_", " ")


def _add_clarification(
    session: Session,
    scope: IsmsScope,
    element: ScopeElement,
    *,
    description: str | None = None,
) -> ScopeClarification:
    clarification = ScopeClarification(
        organization_id=scope.organization_id,
        scope_id=scope.id,
        scope_element_id=element.id,
        title=f"Clarifier si {element.element_name_snapshot} doit être inclus dans le périmètre SMSI",
        description=description
        or (
            f"{element.element_name_snapshot} nécessite une confirmation factuelle "
            "avant la validation du périmètre."
        ),
        status="todo",
    )
    session.add(clarification)
    return clarification


def generate_scope(
    session: Session,
    onboarding: OnboardingSession,
    user_id: UUID,
    name: str,
) -> IsmsScope:
    if onboarding.status != "validated":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A scope can only be generated from validated onboarding",
        )
    active = session.scalar(
        select(IsmsScope).where(
            IsmsScope.organization_id == onboarding.organization_id,
            IsmsScope.status.in_(("draft", "pending_review")),
        )
    )
    if active is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active scope already exists",
        )
    next_version = (
        session.scalar(
            select(func.coalesce(func.max(IsmsScope.version), 0)).where(
                IsmsScope.organization_id == onboarding.organization_id
            )
        )
        + 1
    )
    activities = _items(session, OrganizationActivity, onboarding.id)
    processes = _items(session, OrganizationProcess, onboarding.id)
    teams = _items(session, OrganizationTeam, onboarding.id)
    sites = _items(session, OrganizationSite, onboarding.id)
    systems = _items(session, OrganizationSystem, onboarding.id)
    data_categories = _items(session, OrganizationDataCategory, onboarding.id)
    suppliers = _items(session, OrganizationSupplier, onboarding.id)
    profile = session.scalar(
        select(OrganizationProfile).where(
            OrganizationProfile.onboarding_session_id == onboarding.id
        )
    )
    scope = IsmsScope(
        organization_id=onboarding.organization_id,
        version=next_version,
        name=name,
        description=build_scope_description(
            activities, teams, systems, data_categories, suppliers
        ),
        status="draft",
        based_on_onboarding_session_id=onboarding.id,
        owner_user_id=user_id,
    )
    session.add(scope)
    session.flush()

    candidates = (
        ("activity", activities),
        ("process", processes),
        ("team", teams),
        ("site", sites),
        ("system", systems),
        ("data_category", data_categories),
        ("supplier", suppliers),
    )
    for element_type, items in candidates:
        for item in items:
            suggestion, reason, clarify = scope_suggestion(element_type, item)
            if (
                element_type == "data_category"
                and profile
                and profile.highest_sensitivity_level
                in {"confidential", "highly_confidential"}
            ):
                clarify = True
            element = ScopeElement(
                scope_id=scope.id,
                source_onboarding_session_id=onboarding.id,
                source_type=element_type,
                source_id=item.id,
                element_type=element_type,
                element_name_snapshot=_element_name(element_type, item),
                capiso_suggestion=suggestion,
                suggestion_reason=reason,
                user_decision="to_determine",
                status="needs_clarification" if clarify else "pending",
            )
            session.add(element)
            session.flush()
            if clarify:
                _add_clarification(session, scope, element)

    if profile and profile.hosting_models:
        unknown_hosting = "unknown" in profile.hosting_models
        element = ScopeElement(
            scope_id=scope.id,
            source_onboarding_session_id=onboarding.id,
            source_type="hosting",
            source_id=uuid.uuid5(onboarding.id, "hosting"),
            element_type="hosting",
            element_name_snapshot="Hébergement principal",
            capiso_suggestion=(
                "insufficient_information" if unknown_hosting else "include_recommended"
            ),
            suggestion_reason=(
                "Le modèle d’hébergement n’est pas identifié."
                if unknown_hosting
                else "L’hébergement soutient les systèmes de l’activité préparée."
            ),
            user_decision="to_determine",
            status="needs_clarification" if unknown_hosting else "pending",
        )
        session.add(element)
        session.flush()
        if unknown_hosting:
            _add_clarification(session, scope, element)
    session.flush()
    return scope


def get_scope(
    session: Session, organization_id: UUID, scope_id: UUID
) -> IsmsScope:
    scope = session.scalar(
        select(IsmsScope).where(
            IsmsScope.id == scope_id,
            IsmsScope.organization_id == organization_id,
        )
    )
    if scope is None:
        raise HTTPException(status_code=404, detail="Scope not found")
    return scope


def ensure_scope_editable(scope: IsmsScope) -> None:
    if scope.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only a draft scope can be modified",
        )


def get_scope_element(
    session: Session, scope: IsmsScope, element_id: UUID
) -> ScopeElement:
    element = session.scalar(
        select(ScopeElement).where(
            ScopeElement.id == element_id, ScopeElement.scope_id == scope.id
        )
    )
    if element is None:
        raise HTTPException(status_code=404, detail="Scope element not found")
    return element


def has_open_clarification(session: Session, element_id: UUID) -> bool:
    return (
        session.scalar(
            select(ScopeClarification.id).where(
                ScopeClarification.scope_element_id == element_id,
                ScopeClarification.status.in_(("todo", "in_progress")),
            )
        )
        is not None
    )


def update_scope_element(
    session: Session,
    scope: IsmsScope,
    element: ScopeElement,
    user_decision: str,
    justification: str | None,
) -> ScopeElement:
    ensure_scope_editable(scope)
    if user_decision == "exclude" and not (justification or "").strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="A non-empty justification is required to exclude an element",
        )
    element.user_decision = user_decision
    element.justification = (justification or "").strip() or None
    element.status = (
        "needs_clarification" if user_decision == "to_determine" else "validated"
    )
    if user_decision == "to_determine" and not has_open_clarification(session, element.id):
        critical = (
            element.capiso_suggestion == "insufficient_information"
            or element.element_type in {"activity", "system", "data_category", "supplier"}
        )
        if critical:
            _add_clarification(session, scope, element)
    session.flush()
    return element


def _source_supplier(
    session: Session, element: ScopeElement
) -> OrganizationSupplier | None:
    if element.element_type != "supplier":
        return None
    return session.get(OrganizationSupplier, element.source_id)


def review_scope(session: Session, scope: IsmsScope) -> ScopeReviewResponse:
    elements = list(
        session.scalars(
            select(ScopeElement)
            .where(ScopeElement.scope_id == scope.id)
            .order_by(ScopeElement.created_at, ScopeElement.id)
        ).all()
    )
    open_clarifications = list(
        session.scalars(
            select(ScopeClarification).where(
                ScopeClarification.scope_id == scope.id,
                ScopeClarification.status.in_(("todo", "in_progress")),
            )
        ).all()
    )
    blocking: list[str] = []
    warnings: list[str] = []
    dependencies: list[str] = []
    included = [item for item in elements if item.user_decision == "include"]

    if not any(item.element_type == "activity" for item in included):
        blocking.append("Au moins une activité principale doit être incluse.")
    if not any(item.element_type == "team" for item in included):
        blocking.append("Au moins une équipe doit être incluse.")
    if not any(item.element_type == "data_category" for item in included):
        blocking.append("Au moins une catégorie d’information doit être incluse.")
    if any(item.element_type == "system" for item in elements) and not any(
        item.element_type == "system" for item in included
    ):
        blocking.append(
            "Au moins un système doit être inclus lorsque l’activité dépend de systèmes."
        )
    for element in elements:
        if element.user_decision == "exclude" and not (element.justification or "").strip():
            blocking.append(
                f"L’exclusion de « {element.element_name_snapshot} » doit être justifiée."
            )
        if element.user_decision != "to_determine":
            continue
        supplier = _source_supplier(session, element)
        is_critical_supplier = bool(
            supplier
            and (
                supplier.criticality == "high"
                or supplier.processes_or_hosts_data == "yes"
                or supplier.has_system_access == "yes"
            )
        )
        is_critical = (
            element.element_type == "activity"
            or (
                element.element_type == "system"
                and element.capiso_suggestion
                in {"include_recommended", "insufficient_information"}
            )
            or is_critical_supplier
            or element.capiso_suggestion == "insufficient_information"
        )
        message = f"« {element.element_name_snapshot} » reste à déterminer."
        (blocking if is_critical else warnings).append(message)
        if not has_open_clarification(session, element.id):
            _add_clarification(session, scope, element)

    session.flush()
    open_clarifications = list(
        session.scalars(
            select(ScopeClarification).where(
                ScopeClarification.scope_id == scope.id,
                ScopeClarification.status.in_(("todo", "in_progress")),
            )
        ).all()
    )
    critical_element_ids = {
        item.id
        for item in elements
        if item.capiso_suggestion == "insufficient_information"
        or item.element_type in {"activity", "system", "data_category", "supplier"}
    }
    for clarification in open_clarifications:
        if clarification.scope_element_id in critical_element_ids:
            message = f"Clarification critique ouverte : {clarification.title}"
            if message not in blocking:
                blocking.append(message)

    included_system_names = {
        item.element_name_snapshot.lower()
        for item in included
        if item.element_type == "system"
    }
    for supplier_element in (
        item for item in included if item.element_type == "supplier"
    ):
        supplier = _source_supplier(session, supplier_element)
        if supplier and supplier.related_service_or_system:
            if not any(
                name in supplier.related_service_or_system.lower()
                or supplier.related_service_or_system.lower() in name
                for name in included_system_names
            ):
                dependencies.append(
                    f"Le fournisseur « {supplier.name} » référence un système non inclus."
                )
    warnings.extend(dependencies)
    counts = {
        "total": len(elements),
        "included": sum(item.user_decision == "include" for item in elements),
        "excluded": sum(item.user_decision == "exclude" for item in elements),
        "to_determine": sum(
            item.user_decision == "to_determine" for item in elements
        ),
        "open_clarifications": len(open_clarifications),
    }
    return ScopeReviewResponse(
        blocking_errors=blocking,
        warnings=warnings,
        counts=counts,
        open_clarifications=open_clarifications,
        dependency_issues=dependencies,
    )


def clone_scope(session: Session, source: IsmsScope, user_id: UUID) -> IsmsScope:
    active = session.scalar(
        select(IsmsScope).where(
            IsmsScope.organization_id == source.organization_id,
            IsmsScope.status.in_(("draft", "pending_review")),
        )
    )
    if active is not None:
        raise HTTPException(status_code=409, detail="An active scope already exists")
    next_version = (
        session.scalar(
            select(func.coalesce(func.max(IsmsScope.version), 0)).where(
                IsmsScope.organization_id == source.organization_id
            )
        )
        + 1
    )
    new = IsmsScope(
        organization_id=source.organization_id,
        version=next_version,
        name=source.name,
        description=source.description,
        status="draft",
        based_on_onboarding_session_id=source.based_on_onboarding_session_id,
        owner_user_id=user_id,
    )
    session.add(new)
    session.flush()
    element_map: dict[UUID, ScopeElement] = {}
    for item in session.scalars(
        select(ScopeElement).where(ScopeElement.scope_id == source.id)
    ):
        clone = ScopeElement(
            scope_id=new.id,
            source_onboarding_session_id=item.source_onboarding_session_id,
            source_type=item.source_type,
            source_id=item.source_id,
            element_type=item.element_type,
            element_name_snapshot=item.element_name_snapshot,
            capiso_suggestion=item.capiso_suggestion,
            suggestion_reason=item.suggestion_reason,
            user_decision=item.user_decision,
            justification=item.justification,
            status="needs_clarification"
            if item.user_decision == "to_determine"
            else "validated",
        )
        session.add(clone)
        session.flush()
        element_map[item.id] = clone
    for item in session.scalars(
        select(ScopeClarification).where(ScopeClarification.scope_id == source.id)
    ):
        session.add(
            ScopeClarification(
                organization_id=new.organization_id,
                scope_id=new.id,
                scope_element_id=element_map[item.scope_element_id].id,
                title=item.title,
                description=item.description,
                assigned_to_user_id=item.assigned_to_user_id,
                due_date=item.due_date,
                status=item.status,
                resolution_comment=item.resolution_comment,
                resolved_at=item.resolved_at,
            )
        )
    session.flush()
    return new
