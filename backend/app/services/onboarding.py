from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models.onboarding import (
    OnboardingSession,
    OrganizationActivity,
    OrganizationDataCategory,
    OrganizationExternalRequirement,
    OrganizationProcess,
    OrganizationProfile,
    OrganizationSite,
    OrganizationSupplier,
    OrganizationSystem,
    OrganizationTeam,
)
from app.models.organization import Organization
from app.onboarding.catalog_v1 import ONBOARDING_SCHEMA_VERSION
from app.schemas.onboarding import (
    OnboardingReviewResponse,
    OnboardingStep1Input,
    OnboardingStep2Input,
    OnboardingStep3Input,
)


EDITABLE_ONBOARDING_STATUSES = {"draft"}


def utc_now() -> datetime:
    return datetime.now(UTC)


def get_active_onboarding(session: Session, organization_id: UUID) -> OnboardingSession | None:
    return session.scalar(
        select(OnboardingSession)
        .where(
            OnboardingSession.organization_id == organization_id,
            OnboardingSession.status.in_(("draft", "pending_review")),
        )
        .order_by(OnboardingSession.version.desc())
    )


def get_latest_validated_onboarding(
    session: Session, organization_id: UUID
) -> OnboardingSession | None:
    return session.scalar(
        select(OnboardingSession)
        .where(
            OnboardingSession.organization_id == organization_id,
            OnboardingSession.status == "validated",
        )
        .order_by(OnboardingSession.version.desc())
    )


def create_or_resume_onboarding(
    session: Session, organization_id: UUID, user_id: UUID
) -> OnboardingSession:
    active = get_active_onboarding(session, organization_id)
    if active is not None:
        return active
    next_version = (
        session.scalar(
            select(func.coalesce(func.max(OnboardingSession.version), 0)).where(
                OnboardingSession.organization_id == organization_id
            )
        )
        + 1
    )
    onboarding = OnboardingSession(
        organization_id=organization_id,
        version=next_version,
        schema_version=ONBOARDING_SCHEMA_VERSION,
        status="draft",
        started_by_user_id=user_id,
    )
    session.add(onboarding)
    session.flush()
    return onboarding


def require_active_onboarding(
    session: Session, organization_id: UUID, *, editable: bool = False
) -> OnboardingSession:
    onboarding = get_active_onboarding(session, organization_id)
    if onboarding is None:
        raise HTTPException(status_code=404, detail="Active onboarding session not found")
    if editable and onboarding.status not in EDITABLE_ONBOARDING_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Submitted onboarding cannot be edited; revise it first",
        )
    return onboarding


def _profile(session: Session, onboarding: OnboardingSession) -> OrganizationProfile:
    profile = session.scalar(
        select(OrganizationProfile).where(
            OrganizationProfile.onboarding_session_id == onboarding.id
        )
    )
    if profile is None:
        profile = OrganizationProfile(
            organization_id=onboarding.organization_id,
            onboarding_session_id=onboarding.id,
        )
        session.add(profile)
        session.flush()
    return profile


def save_step_1(
    session: Session,
    onboarding: OnboardingSession,
    payload: OnboardingStep1Input,
) -> OnboardingSession:
    session.execute(
        delete(OrganizationActivity).where(
            OrganizationActivity.onboarding_session_id == onboarding.id
        )
    )
    session.execute(
        delete(OrganizationProcess).where(
            OrganizationProcess.onboarding_session_id == onboarding.id
        )
    )
    session.add(
        OrganizationActivity(
            organization_id=onboarding.organization_id,
            onboarding_session_id=onboarding.id,
            name=payload.activity.name,
            description=payload.activity.description,
            nature_types=list(dict.fromkeys(payload.activity.nature_types)),
            is_primary=True,
        )
    )
    seen: set[tuple[str, str | None]] = set()
    for item in payload.processes:
        key = (item.type, item.custom_name)
        if key in seen:
            continue
        seen.add(key)
        session.add(
            OrganizationProcess(
                organization_id=onboarding.organization_id,
                onboarding_session_id=onboarding.id,
                process_type=item.type,
                custom_name=item.custom_name,
            )
        )
    onboarding.current_step = max(onboarding.current_step, 2)
    session.flush()
    update_completion(session, onboarding)
    return onboarding


def _placeholder_system_name(system_type: str) -> str:
    return f"Système principal non identifié — {system_type.replace('_', ' ')}"


def save_step_2(
    session: Session,
    onboarding: OnboardingSession,
    payload: OnboardingStep2Input,
) -> OnboardingSession:
    for model in (OrganizationTeam, OrganizationSite, OrganizationSystem):
        session.execute(
            delete(model).where(model.onboarding_session_id == onboarding.id)
        )
    profile = _profile(session, onboarding)
    profile.work_mode = payload.work_mode
    profile.multiple_sites_status = payload.multiple_sites_status
    profile.regular_external_contractors_status = (
        payload.regular_external_contractors_status
    )
    profile.system_categories = list(dict.fromkeys(payload.system_categories))
    profile.hosting_models = list(dict.fromkeys(payload.hosting_models))
    profile.selected_cloud_providers = list(
        dict.fromkeys(payload.selected_cloud_providers)
    )
    if "unknown" in profile.system_categories:
        profile.systems_identification_status = "unknown"
    elif "no_critical_system_identified" in profile.system_categories:
        profile.systems_identification_status = "none_identified"
    elif payload.systems:
        profile.systems_identification_status = (
            "to_determine"
            if any(item.identification_status == "to_determine" for item in payload.systems)
            else "identified"
        )
    else:
        profile.systems_identification_status = None

    seen_teams: set[tuple[str, str | None]] = set()
    for item in payload.teams:
        key = (item.type, item.custom_name)
        if key not in seen_teams:
            seen_teams.add(key)
            session.add(
                OrganizationTeam(
                    organization_id=onboarding.organization_id,
                    onboarding_session_id=onboarding.id,
                    team_type=item.type,
                    custom_name=item.custom_name,
                )
            )
    for site in payload.sites:
        session.add(
            OrganizationSite(
                organization_id=onboarding.organization_id,
                onboarding_session_id=onboarding.id,
                **site.model_dump(),
            )
        )
    for system in payload.systems:
        values = system.model_dump()
        values["name"] = values["name"] or _placeholder_system_name(values["system_type"])
        session.add(
            OrganizationSystem(
                organization_id=onboarding.organization_id,
                onboarding_session_id=onboarding.id,
                **values,
            )
        )
    if (
        not payload.systems
        and profile.system_categories
        and "unknown" not in profile.system_categories
        and "no_critical_system_identified" not in profile.system_categories
    ):
        for category in profile.system_categories[:5]:
            session.add(
                OrganizationSystem(
                    organization_id=onboarding.organization_id,
                    onboarding_session_id=onboarding.id,
                    name=_placeholder_system_name(category),
                    system_type=category,
                    identification_status="to_determine",
                )
            )
        profile.systems_identification_status = "to_determine"
    onboarding.current_step = max(onboarding.current_step, 3)
    session.flush()
    update_completion(session, onboarding)
    return onboarding


def save_step_3(
    session: Session,
    onboarding: OnboardingSession,
    payload: OnboardingStep3Input,
) -> OnboardingSession:
    for model in (
        OrganizationDataCategory,
        OrganizationSupplier,
        OrganizationExternalRequirement,
    ):
        session.execute(
            delete(model).where(model.onboarding_session_id == onboarding.id)
        )
    profile = _profile(session, onboarding)
    profile.highest_sensitivity_level = payload.highest_sensitivity_level
    profile.suppliers_identification_status = payload.suppliers_identification_status
    for item in payload.data_categories:
        session.add(
            OrganizationDataCategory(
                organization_id=onboarding.organization_id,
                onboarding_session_id=onboarding.id,
                category_type=item.type,
                custom_name=item.custom_name,
            )
        )
    for item in payload.suppliers:
        session.add(
            OrganizationSupplier(
                organization_id=onboarding.organization_id,
                onboarding_session_id=onboarding.id,
                **item.model_dump(),
            )
        )
    for item in payload.external_requirements:
        session.add(
            OrganizationExternalRequirement(
                organization_id=onboarding.organization_id,
                onboarding_session_id=onboarding.id,
                **item.model_dump(),
            )
        )
    session.flush()
    update_completion(session, onboarding)
    return onboarding


def _all(session: Session, model, onboarding_id: UUID):
    return list(
        session.scalars(
            select(model)
            .where(model.onboarding_session_id == onboarding_id)
            .order_by(model.created_at, model.id)
        ).all()
    )


def review_onboarding(
    session: Session, onboarding: OnboardingSession
) -> OnboardingReviewResponse:
    activities = _all(session, OrganizationActivity, onboarding.id)
    processes = _all(session, OrganizationProcess, onboarding.id)
    teams = _all(session, OrganizationTeam, onboarding.id)
    sites = _all(session, OrganizationSite, onboarding.id)
    systems = _all(session, OrganizationSystem, onboarding.id)
    data_categories = _all(session, OrganizationDataCategory, onboarding.id)
    suppliers = _all(session, OrganizationSupplier, onboarding.id)
    profile = session.scalar(
        select(OrganizationProfile).where(
            OrganizationProfile.onboarding_session_id == onboarding.id
        )
    )
    blocking: list[str] = []
    warnings: list[str] = []
    unknown: list[str] = []

    if not activities or not activities[0].name.strip():
        blocking.append("Le nom de l’activité principale est obligatoire.")
    if not activities or not activities[0].nature_types:
        blocking.append("Au moins une nature d’activité doit être sélectionnée.")
    if not processes:
        blocking.append("Au moins un processus important doit être sélectionné.")
    if not teams:
        blocking.append("Au moins une équipe ou fonction doit être sélectionnée.")
    if profile is None or not profile.work_mode:
        blocking.append("Le mode de travail est obligatoire.")
    if profile and profile.multiple_sites_status == "yes" and not sites:
        blocking.append("Au moins un site est requis lorsque plusieurs sites sont déclarés.")
    if (
        profile is None
        or (
            not profile.system_categories
            and not systems
            and profile.systems_identification_status not in {"unknown", "none_identified"}
        )
    ):
        blocking.append("Les systèmes doivent être renseignés ou explicitement inconnus.")
    if profile is None or not profile.hosting_models:
        blocking.append("Au moins un modèle d’hébergement doit être indiqué.")
    if not data_categories:
        blocking.append(
            "Au moins une catégorie d’information, y compris unknown, doit être indiquée."
        )
    if profile is None or not profile.suppliers_identification_status:
        blocking.append("Le statut d’identification des fournisseurs est obligatoire.")

    if profile:
        if profile.multiple_sites_status == "unknown":
            unknown.append("Nombre et localisation des sites à confirmer")
        if profile.regular_external_contractors_status == "unknown":
            unknown.append("Recours à des prestataires réguliers à confirmer")
        if "unknown" in profile.hosting_models:
            unknown.append("Modèle d’hébergement à confirmer")
        if profile.highest_sensitivity_level == "unknown":
            unknown.append("Niveau de sensibilité le plus élevé à confirmer")
        if profile.suppliers_identification_status == "unknown":
            unknown.append("Fournisseurs critiques à identifier")
    for system in systems:
        if system.identification_status == "to_determine":
            unknown.append(system.name)
    for supplier in suppliers:
        if (
            supplier.criticality == "to_determine"
            or supplier.processes_or_hosts_data == "unknown"
            or supplier.has_system_access == "unknown"
        ):
            unknown.append(f"Informations fournisseur à confirmer : {supplier.name}")
    if any(item.category_type == "unknown" for item in data_categories):
        unknown.append("Catégories d’informations à confirmer")
    warnings.extend(unknown)

    derived: list[str] = []
    if profile:
        if set(profile.hosting_models) & {
            "public_cloud",
            "private_cloud",
            "mainly_third_party_saas",
            "hybrid",
        }:
            derived.append("cloud_used")
        if profile.work_mode in {"hybrid", "mainly_remote", "fully_remote"}:
            derived.append("remote_work_used")
        if profile.regular_external_contractors_status == "yes":
            derived.append("external_contractors_present")
        if profile.multiple_sites_status == "yes":
            derived.append("multiple_sites_present")
        if profile.highest_sensitivity_level in {"confidential", "highly_confidential"}:
            derived.append("sensitive_data_present")
    if any(item.process_type == "software_development" for item in processes):
        derived.append("software_development_present")
    if any(item.criticality == "high" for item in suppliers):
        derived.append("critical_suppliers_present")

    completed = 10 - len(blocking)
    completion = max(0, min(100, round(completed / 10 * 100)))
    onboarding.completion_percentage = completion
    session.flush()
    return OnboardingReviewResponse(
        completion_percentage=completion,
        blocking_errors=blocking,
        warnings=warnings,
        unknown_items=unknown,
        derived_context=derived,
    )


def update_completion(session: Session, onboarding: OnboardingSession) -> int:
    review = review_onboarding(session, onboarding)
    return review.completion_percentage


def onboarding_answers(session: Session, onboarding: OnboardingSession) -> dict[str, object]:
    profile = session.scalar(
        select(OrganizationProfile).where(
            OrganizationProfile.onboarding_session_id == onboarding.id
        )
    )
    activities = _all(session, OrganizationActivity, onboarding.id)
    return {
        "activity": (
            {
                "name": activities[0].name,
                "description": activities[0].description,
                "nature_types": activities[0].nature_types,
            }
            if activities
            else None
        ),
        "processes": [
            {"type": item.process_type, "custom_name": item.custom_name}
            for item in _all(session, OrganizationProcess, onboarding.id)
        ],
        "teams": [
            {"type": item.team_type, "custom_name": item.custom_name}
            for item in _all(session, OrganizationTeam, onboarding.id)
        ],
        "profile": (
            {
                "work_mode": profile.work_mode,
                "multiple_sites_status": profile.multiple_sites_status,
                "regular_external_contractors_status": (
                    profile.regular_external_contractors_status
                ),
                "system_categories": profile.system_categories,
                "hosting_models": profile.hosting_models,
                "selected_cloud_providers": profile.selected_cloud_providers,
                "highest_sensitivity_level": profile.highest_sensitivity_level,
                "systems_identification_status": profile.systems_identification_status,
                "suppliers_identification_status": profile.suppliers_identification_status,
            }
            if profile
            else None
        ),
        "sites": [
            {
                "id": str(item.id),
                "name": item.name,
                "city": item.city,
                "country": item.country,
                "site_type": item.site_type,
            }
            for item in _all(session, OrganizationSite, onboarding.id)
        ],
        "systems": [
            {
                "id": str(item.id),
                "name": item.name,
                "system_type": item.system_type,
                "supported_activity_or_process": item.supported_activity_or_process,
                "provider_or_host": item.provider_or_host,
                "identification_status": item.identification_status,
            }
            for item in _all(session, OrganizationSystem, onboarding.id)
        ],
        "data_categories": [
            {"type": item.category_type, "custom_name": item.custom_name}
            for item in _all(session, OrganizationDataCategory, onboarding.id)
        ],
        "suppliers": [
            {
                "id": str(item.id),
                "name": item.name,
                "supplier_type": item.supplier_type,
                "related_service_or_system": item.related_service_or_system,
                "processes_or_hosts_data": item.processes_or_hosts_data,
                "has_system_access": item.has_system_access,
                "criticality": item.criticality,
            }
            for item in _all(session, OrganizationSupplier, onboarding.id)
        ],
        "external_requirements": [
            {
                "type": item.requirement_type,
                "details": item.details,
                "confirmation_status": item.confirmation_status,
            }
            for item in _all(session, OrganizationExternalRequirement, onboarding.id)
        ],
    }


def onboarding_summary(
    session: Session, organization: Organization, onboarding: OnboardingSession
) -> dict[str, object]:
    review = review_onboarding(session, onboarding)
    activities = _all(session, OrganizationActivity, onboarding.id)
    return {
        "organization": {
            "name": organization.name,
            "country": organization.country,
            "sector": organization.sector,
            "size_range": organization.size_range,
        },
        "activity": {"name": activities[0].name if activities else None},
        "candidate_counts": {
            "processes": len(_all(session, OrganizationProcess, onboarding.id)),
            "teams": len(_all(session, OrganizationTeam, onboarding.id)),
            "sites": len(_all(session, OrganizationSite, onboarding.id)),
            "systems": len(_all(session, OrganizationSystem, onboarding.id)),
            "data_categories": len(
                _all(session, OrganizationDataCategory, onboarding.id)
            ),
            "suppliers": len(_all(session, OrganizationSupplier, onboarding.id)),
        },
        "derived_context": review.derived_context,
        "unknown_items": review.unknown_items,
    }


def clone_onboarding(
    session: Session, source: OnboardingSession, user_id: UUID
) -> OnboardingSession:
    next_version = (
        session.scalar(
            select(func.coalesce(func.max(OnboardingSession.version), 0)).where(
                OnboardingSession.organization_id == source.organization_id
            )
        )
        + 1
    )
    new = OnboardingSession(
        organization_id=source.organization_id,
        version=next_version,
        schema_version=source.schema_version,
        status="draft",
        current_step=source.current_step,
        completion_percentage=source.completion_percentage,
        started_by_user_id=user_id,
    )
    session.add(new)
    session.flush()
    mappings = (
        (
            OrganizationActivity,
            ("name", "description", "nature_types", "is_primary"),
        ),
        (OrganizationProcess, ("process_type", "custom_name")),
        (OrganizationTeam, ("team_type", "custom_name")),
        (
            OrganizationProfile,
            (
                "work_mode",
                "multiple_sites_status",
                "regular_external_contractors_status",
                "hosting_models",
                "selected_cloud_providers",
                "highest_sensitivity_level",
                "system_categories",
                "systems_identification_status",
                "suppliers_identification_status",
            ),
        ),
        (OrganizationSite, ("name", "city", "country", "site_type")),
        (
            OrganizationSystem,
            (
                "name",
                "system_type",
                "supported_activity_or_process",
                "provider_or_host",
                "identification_status",
            ),
        ),
        (OrganizationDataCategory, ("category_type", "custom_name")),
        (
            OrganizationSupplier,
            (
                "name",
                "supplier_type",
                "related_service_or_system",
                "processes_or_hosts_data",
                "has_system_access",
                "criticality",
            ),
        ),
        (
            OrganizationExternalRequirement,
            ("requirement_type", "details", "confirmation_status"),
        ),
    )
    for model, fields in mappings:
        for item in _all(session, model, source.id):
            values = {field: getattr(item, field) for field in fields}
            session.add(
                model(
                    organization_id=source.organization_id,
                    onboarding_session_id=new.id,
                    **values,
                )
            )
    session.flush()
    return new
