from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ActivityInput(StrictModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=300)
    nature_types: list[str] = Field(default_factory=list)


class TypedCustomInput(StrictModel):
    type: str = Field(min_length=1, max_length=100)
    custom_name: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def require_custom_name_for_other(self):
        if self.type == "other" and not self.custom_name:
            raise ValueError("custom_name is required when type is other")
        return self


class OnboardingStep1Input(StrictModel):
    activity: ActivityInput
    processes: list[TypedCustomInput] = Field(default_factory=list)


class SiteInput(StrictModel):
    name: str = Field(min_length=1, max_length=255)
    city: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    site_type: Literal[
        "headquarters",
        "office",
        "technical_site",
        "datacenter",
        "shared_workspace",
        "other",
    ]


class SystemInput(StrictModel):
    name: str | None = Field(default=None, max_length=255)
    system_type: str = Field(min_length=1, max_length=80)
    supported_activity_or_process: str | None = Field(default=None, max_length=255)
    provider_or_host: str | None = Field(default=None, max_length=255)
    identification_status: Literal["identified", "to_determine"]

    @model_validator(mode="after")
    def identified_system_has_name(self):
        if self.identification_status == "identified" and not self.name:
            raise ValueError("name is required for an identified system")
        return self


class OnboardingStep2Input(StrictModel):
    teams: list[TypedCustomInput] = Field(default_factory=list)
    work_mode: Literal["onsite", "hybrid", "mainly_remote", "fully_remote"]
    multiple_sites_status: Literal["yes", "no", "unknown"]
    sites: list[SiteInput] = Field(default_factory=list)
    regular_external_contractors_status: Literal["yes", "no", "unknown"]
    system_categories: list[str] = Field(default_factory=list)
    systems: list[SystemInput] = Field(default_factory=list, max_length=5)
    hosting_models: list[str] = Field(default_factory=list)
    selected_cloud_providers: list[str] = Field(default_factory=list)


class SupplierInput(StrictModel):
    name: str = Field(min_length=1, max_length=255)
    supplier_type: str = Field(min_length=1, max_length=80)
    related_service_or_system: str | None = Field(default=None, max_length=255)
    processes_or_hosts_data: Literal["yes", "no", "unknown"]
    has_system_access: Literal["yes", "no", "unknown"]
    criticality: Literal["low", "medium", "high", "to_determine"]


class ExternalRequirementInput(StrictModel):
    requirement_type: str = Field(min_length=1, max_length=100)
    details: str | None = None
    confirmation_status: Literal[
        "declared_to_confirm", "confirmed", "not_applicable"
    ] = "declared_to_confirm"


class OnboardingStep3Input(StrictModel):
    data_categories: list[TypedCustomInput] = Field(default_factory=list)
    highest_sensitivity_level: Literal[
        "public", "internal", "confidential", "highly_confidential", "unknown"
    ]
    suppliers_identification_status: Literal[
        "identified", "none_identified", "unknown"
    ]
    suppliers: list[SupplierInput] = Field(default_factory=list)
    external_requirements: list[ExternalRequirementInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def identified_suppliers_are_listed(self):
        if self.suppliers_identification_status == "identified" and not self.suppliers:
            raise ValueError("suppliers are required when status is identified")
        if self.suppliers_identification_status != "identified" and self.suppliers:
            raise ValueError("suppliers require status identified")
        return self


class OnboardingSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    version: int
    schema_version: str
    status: str
    current_step: int
    completion_percentage: int
    started_by_user_id: UUID
    submitted_at: datetime | None
    validated_by_user_id: UUID | None
    validated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class OnboardingReviewResponse(BaseModel):
    completion_percentage: int
    blocking_errors: list[str]
    warnings: list[str]
    unknown_items: list[str]
    derived_context: list[str]


class OnboardingDetailResponse(BaseModel):
    organization: dict[str, str | None]
    session: OnboardingSessionResponse
    answers: dict[str, object]
    warnings: list[str]
    indicators: dict[str, object]


class OnboardingValidatedResponse(BaseModel):
    session: OnboardingSessionResponse
    summary: dict[str, object]
    suggested_future_evidence_categories: list[str]
