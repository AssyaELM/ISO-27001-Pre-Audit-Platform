import uuid

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import delete, select, text
from sqlalchemy.exc import SQLAlchemyError

from app.api.dependencies.organizations import (
    OrganizationAccess,
    require_organization_member,
)
from app.api.routes.onboarding import (
    get_onboarding_catalog,
    put_onboarding_step_1,
    put_onboarding_step_2,
    put_onboarding_step_3,
    revise_onboarding,
    start_onboarding,
    submit_onboarding,
    validate_onboarding,
)
from app.api.routes.scopes import (
    create_scope_from_onboarding,
    revise_scope,
    submit_scope,
    validate_scope,
)
from app.core.security import get_password_hash
from app.db.session import SessionLocal, engine
from app.main import app
from app.models.onboarding import (
    OnboardingSession,
    OrganizationExternalRequirement,
    OrganizationProcess,
    OrganizationSystem,
)
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.scope import IsmsScope, ScopeClarification, ScopeElement
from app.models.user import User
from app.schemas.onboarding import (
    ActivityInput,
    ExternalRequirementInput,
    OnboardingStep1Input,
    OnboardingStep2Input,
    OnboardingStep3Input,
    SupplierInput,
    SystemInput,
    TypedCustomInput,
)
from app.schemas.scope import ScopeCreateFromOnboardingRequest
from app.services.onboarding import review_onboarding
from app.services.scope import (
    get_scope,
    get_scope_element,
    review_scope,
    update_scope_element,
)
from app.core.security import create_access_token


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
    org_ids = select(Organization.id).where(Organization.slug.like("flow-test-%"))
    user_ids = select(User.id).where(User.email.like("flow-test-%@example.com"))
    scope_ids = select(IsmsScope.id).where(IsmsScope.organization_id.in_(org_ids))
    session.execute(
        delete(ScopeClarification).where(ScopeClarification.scope_id.in_(scope_ids))
    )
    session.execute(delete(ScopeElement).where(ScopeElement.scope_id.in_(scope_ids)))
    session.execute(delete(IsmsScope).where(IsmsScope.organization_id.in_(org_ids)))
    session.execute(
        delete(OnboardingSession).where(OnboardingSession.organization_id.in_(org_ids))
    )
    session.execute(
        delete(OrganizationMember).where(OrganizationMember.organization_id.in_(org_ids))
    )
    session.execute(delete(Organization).where(Organization.id.in_(org_ids)))
    session.execute(delete(User).where(User.id.in_(user_ids)))
    session.commit()


def _access(session, suffix: str, role: str = "administrateur_entreprise"):
    user = User(
        email=f"flow-test-{suffix}@example.com",
        first_name="Flow",
        last_name=suffix,
        password_hash=get_password_hash("CorrectHorse42!"),
        is_verified=True,
    )
    organization = Organization(
        name=f"Flow Test {suffix}",
        slug=f"flow-test-{suffix}",
        country="MA",
        sector="software_saas",
        size_range="11_50",
        status="active",
        language="fr",
        timezone="Africa/Casablanca",
    )
    session.add_all([user, organization])
    session.flush()
    membership = OrganizationMember(
        organization_id=organization.id,
        user_id=user.id,
        role=role,
        status="active",
    )
    session.add(membership)
    session.commit()
    return OrganizationAccess(organization, membership, user)


def _step_1() -> OnboardingStep1Input:
    return OnboardingStep1Input(
        activity=ActivityInput(
            name="Plateforme SaaS documentaire",
            description="Développement, hébergement et support de la plateforme.",
            nature_types=[
                "web_application_saas",
                "software_development",
                "hosting_operations",
            ],
        ),
        processes=[
            TypedCustomInput(type="main_product_or_service"),
            TypedCustomInput(type="software_development"),
            TypedCustomInput(type="customer_support"),
        ],
    )


def _step_2() -> OnboardingStep2Input:
    return OnboardingStep2Input(
        teams=[
            TypedCustomInput(type="software_development"),
            TypedCustomInput(type="infrastructure_devops"),
            TypedCustomInput(type="customer_support"),
        ],
        work_mode="hybrid",
        multiple_sites_status="yes",
        sites=[
            {
                "name": "Siège",
                "city": "Casablanca",
                "country": "MA",
                "site_type": "headquarters",
            }
        ],
        regular_external_contractors_status="yes",
        system_categories=["source_code_repository", "cloud_infrastructure"],
        systems=[
            SystemInput(
                name="GitHub",
                system_type="source_code_repository",
                supported_activity_or_process="software_development",
                provider_or_host="GitHub",
                identification_status="identified",
            ),
            SystemInput(
                name=None,
                system_type="cloud_infrastructure",
                supported_activity_or_process="main_product_or_service",
                identification_status="to_determine",
            ),
        ],
        hosting_models=["public_cloud", "unknown"],
        selected_cloud_providers=["unknown"],
    )


def _step_3() -> OnboardingStep3Input:
    return OnboardingStep3Input(
        data_categories=[
            TypedCustomInput(type="customer_data"),
            TypedCustomInput(type="source_code"),
        ],
        highest_sensitivity_level="confidential",
        suppliers_identification_status="identified",
        suppliers=[
            SupplierInput(
                name="GitHub",
                supplier_type="software_development",
                related_service_or_system="GitHub",
                processes_or_hosts_data="yes",
                has_system_access="yes",
                criticality="high",
            )
        ],
        external_requirements=[
            ExternalRequirementInput(requirement_type="data_protection_gdpr")
        ],
    )


def test_catalog_is_versioned_and_contains_eight_required_plus_one_optional(
    db_session,
) -> None:
    access = _access(db_session, "catalog")
    catalog = get_onboarding_catalog(access.user)
    questions = [
        question
        for step in catalog["steps"]
        for question in step["questions"]
    ]

    assert catalog["schema_version"] == "1.0"
    assert len(catalog["steps"]) == 3
    assert len(questions) == 9
    assert sum(question["required"] for question in questions) == 8


def test_input_validation_refuses_blank_activity_and_unjustified_exclusion() -> None:
    with pytest.raises(ValidationError):
        ActivityInput(name=" ", nature_types=["software_development"])

    from app.schemas.scope import ScopeElementPatchRequest

    with pytest.raises(ValidationError):
        ScopeElementPatchRequest(user_decision="exclude", justification=" ")


def test_onboarding_and_scope_full_versioned_workflow(db_session) -> None:
    admin = _access(db_session, "admin")
    outsider = _access(db_session, "outsider")
    onboarding = start_onboarding(
        admin.organization.id, admin, db_session
    )
    resumed = start_onboarding(admin.organization.id, admin, db_session)
    assert resumed.id == onboarding.id
    assert onboarding.version == 1

    put_onboarding_step_1(admin.organization.id, _step_1(), admin, db_session)
    put_onboarding_step_1(admin.organization.id, _step_1(), admin, db_session)
    assert len(
        list(
            db_session.scalars(
                select(OrganizationProcess).where(
                    OrganizationProcess.onboarding_session_id == onboarding.id
                )
            )
        )
    ) == 3
    put_onboarding_step_2(admin.organization.id, _step_2(), admin, db_session)
    unknown_system = db_session.scalar(
        select(OrganizationSystem).where(
            OrganizationSystem.onboarding_session_id == onboarding.id,
            OrganizationSystem.identification_status == "to_determine",
        )
    )
    assert unknown_system is not None
    assert unknown_system.name.startswith("Système principal non identifié")
    assert "AWS" not in unknown_system.name
    put_onboarding_step_3(admin.organization.id, _step_3(), admin, db_session)

    requirement = db_session.scalar(
        select(OrganizationExternalRequirement).where(
            OrganizationExternalRequirement.onboarding_session_id == onboarding.id
        )
    )
    assert requirement.confirmation_status == "declared_to_confirm"
    review = review_onboarding(db_session, onboarding)
    assert review.blocking_errors == []
    assert review.completion_percentage == 100
    assert "cloud_used" in review.derived_context
    assert "remote_work_used" in review.derived_context
    assert review.unknown_items

    submitted = submit_onboarding(admin.organization.id, admin, db_session)
    assert submitted.status == "pending_review"
    validated_response = validate_onboarding(
        admin.organization.id, admin, db_session
    )
    validated = validated_response.session
    assert validated.status == "validated"
    assert validated.validated_by_user_id == admin.user.id
    assert validated.validated_at is not None
    old_answers = validated_response.summary

    revised_onboarding = revise_onboarding(
        admin.organization.id, admin, db_session
    )
    assert revised_onboarding.version == 2
    assert revised_onboarding.status == "draft"
    persisted_validated = db_session.get(OnboardingSession, validated.id)
    assert persisted_validated.status == "validated"
    assert validated_response.summary == old_answers

    scope = create_scope_from_onboarding(
        admin.organization.id,
        ScopeCreateFromOnboardingRequest(
            onboarding_session_id=validated.id,
            name="Périmètre SMSI initial",
        ),
        admin,
        db_session,
    )
    elements = list(
        db_session.scalars(
            select(ScopeElement).where(ScopeElement.scope_id == scope.id)
        )
    )
    assert scope.version == 1
    assert scope.status == "draft"
    assert "Plateforme SaaS documentaire" in scope.description
    assert elements
    assert all(item.user_decision == "to_determine" for item in elements)
    assert not any(item.source_type == "external_requirement" for item in elements)
    assert not any(item.capiso_suggestion == "exclude" for item in elements)
    assert any(
        item.element_type == "activity"
        and item.capiso_suggestion == "include_recommended"
        for item in elements
    )
    assert any(
        item.element_type == "system"
        and item.capiso_suggestion == "insufficient_information"
        for item in elements
    )
    assert any(
        item.element_type == "supplier"
        and item.capiso_suggestion == "include_recommended"
        for item in elements
    )

    for element in elements:
        update_scope_element(db_session, scope, element, "include", None)
    for clarification in db_session.scalars(
        select(ScopeClarification).where(ScopeClarification.scope_id == scope.id)
    ):
        clarification.status = "resolved"
        clarification.resolution_comment = "Inclusion confirmée par l’administrateur."
    db_session.commit()

    scope_review = review_scope(db_session, scope)
    assert scope_review.blocking_errors == []
    submitted_scope = submit_scope(
        admin.organization.id, scope.id, admin, db_session
    )
    assert submitted_scope.status == "pending_review"
    validated_scope = validate_scope(
        admin.organization.id, scope.id, admin, db_session
    )
    assert validated_scope.status == "validated"
    assert validated_scope.validated_by_user_id == admin.user.id

    first_element = elements[0]
    with pytest.raises(HTTPException) as immutable:
        update_scope_element(
            db_session, validated_scope, first_element, "exclude", "Nouveau choix"
        )
    assert immutable.value.status_code == 409

    revised_scope = revise_scope(
        admin.organization.id, scope.id, admin, db_session
    )
    assert revised_scope.version == 2
    assert revised_scope.status == "draft"
    assert revised_scope.based_on_onboarding_session_id == validated.id
    db_session.refresh(validated_scope)
    assert validated_scope.status == "validated"

    with pytest.raises(HTTPException) as hidden_scope:
        get_scope(db_session, outsider.organization.id, scope.id)
    assert hidden_scope.value.status_code == 404
    with pytest.raises(HTTPException) as hidden_org:
        require_organization_member(
            admin.organization.id, outsider.user, db_session
        )
    assert hidden_org.value.status_code == 404


def test_scope_review_blocks_missing_boundaries_and_exclusion_without_reason(
    db_session,
) -> None:
    admin = _access(db_session, "review")
    onboarding = start_onboarding(admin.organization.id, admin, db_session)
    put_onboarding_step_1(admin.organization.id, _step_1(), admin, db_session)
    put_onboarding_step_2(admin.organization.id, _step_2(), admin, db_session)
    put_onboarding_step_3(admin.organization.id, _step_3(), admin, db_session)
    submit_onboarding(admin.organization.id, admin, db_session)
    validate_onboarding(admin.organization.id, admin, db_session)
    scope = create_scope_from_onboarding(
        admin.organization.id,
        ScopeCreateFromOnboardingRequest(onboarding_session_id=onboarding.id),
        admin,
        db_session,
    )

    review = review_scope(db_session, scope)
    assert any("activité principale" in item for item in review.blocking_errors)
    assert any("équipe" in item for item in review.blocking_errors)
    assert any("catégorie d’information" in item for item in review.blocking_errors)
    assert review.open_clarifications

    element = get_scope_element(
        db_session,
        scope,
        db_session.scalar(
            select(ScopeElement.id).where(ScopeElement.scope_id == scope.id)
        ),
    )
    with pytest.raises(HTTPException) as exc_info:
        update_scope_element(db_session, scope, element, "exclude", " ")
    assert exc_info.value.status_code == 422


def test_authenticated_http_api_completes_onboarding_and_scope_workflow(
    db_session,
) -> None:
    admin = _access(db_session, "http")
    headers = {
        "Authorization": f"Bearer {create_access_token(str(admin.user.id))}"
    }
    base = f"/api/v1/organizations/{admin.organization.id}"

    with TestClient(app) as client:
        catalog = client.get("/api/v1/onboarding/catalog", headers=headers)
        assert catalog.status_code == 200
        assert catalog.json()["schema_version"] == "1.0"

        started = client.post(f"{base}/onboarding", headers=headers)
        assert started.status_code == 201
        onboarding_id = started.json()["id"]

        step_1 = client.put(
            f"{base}/onboarding/steps/1",
            headers=headers,
            json=_step_1().model_dump(mode="json"),
        )
        step_2 = client.put(
            f"{base}/onboarding/steps/2",
            headers=headers,
            json=_step_2().model_dump(mode="json"),
        )
        step_3 = client.put(
            f"{base}/onboarding/steps/3",
            headers=headers,
            json=_step_3().model_dump(mode="json"),
        )
        assert [step_1.status_code, step_2.status_code, step_3.status_code] == [
            200,
            200,
            200,
        ]

        reviewed = client.post(f"{base}/onboarding/review", headers=headers)
        assert reviewed.status_code == 200
        assert reviewed.json()["blocking_errors"] == []

        submitted = client.post(f"{base}/onboarding/submit", headers=headers)
        validated = client.post(f"{base}/onboarding/validate", headers=headers)
        assert submitted.status_code == 200
        assert validated.status_code == 200
        assert validated.json()["session"]["status"] == "validated"

        generated = client.post(
            f"{base}/scopes/from-onboarding",
            headers=headers,
            json={
                "onboarding_session_id": onboarding_id,
                "name": "Périmètre HTTP",
            },
        )
        assert generated.status_code == 201
        scope = generated.json()
        scope_id = scope["id"]
        assert scope["status"] == "draft"
        assert scope["elements"]

        for element in scope["elements"]:
            response = client.patch(
                f"{base}/scopes/{scope_id}/elements/{element['id']}",
                headers=headers,
                json={"user_decision": "include", "justification": None},
            )
            assert response.status_code == 200

        clarifications = client.get(
            f"{base}/scopes/{scope_id}/clarifications", headers=headers
        )
        assert clarifications.status_code == 200
        for clarification in clarifications.json():
            response = client.patch(
                f"{base}/scopes/{scope_id}/clarifications/{clarification['id']}",
                headers=headers,
                json={
                    "status": "resolved",
                    "resolution_comment": "Inclusion confirmée pendant le test HTTP.",
                },
            )
            assert response.status_code == 200

        scope_review = client.post(
            f"{base}/scopes/{scope_id}/review", headers=headers
        )
        assert scope_review.status_code == 200
        assert scope_review.json()["blocking_errors"] == []

        scope_submit = client.post(
            f"{base}/scopes/{scope_id}/submit", headers=headers
        )
        scope_validate = client.post(
            f"{base}/scopes/{scope_id}/validate", headers=headers
        )
        assert scope_submit.status_code == 200
        assert scope_validate.status_code == 200
        assert scope_validate.json()["status"] == "validated"

        immutable = client.patch(
            f"{base}/scopes/{scope_id}",
            headers=headers,
            json={"name": "Modification interdite"},
        )
        revised = client.post(
            f"{base}/scopes/{scope_id}/revise", headers=headers
        )
        assert immutable.status_code == 409
        assert revised.status_code == 201
        assert revised.json()["version"] == 2
