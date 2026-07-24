from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ScopeCreateFromOnboardingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    onboarding_session_id: UUID
    name: str = Field(default="Périmètre SMSI initial", min_length=1, max_length=255)


class ScopePatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)


class ScopeElementPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    user_decision: Literal["include", "exclude", "to_determine"]
    justification: str | None = None

    @model_validator(mode="after")
    def exclusion_requires_justification(self):
        if self.user_decision == "exclude" and not self.justification:
            raise ValueError("A non-empty justification is required to exclude an element")
        return self


class ScopeClarificationPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    assigned_to_user_id: UUID | None = None
    due_date: date | None = None
    status: Literal["todo", "in_progress", "resolved", "cancelled"] | None = None
    resolution_comment: str | None = None

    @model_validator(mode="after")
    def resolution_requires_comment(self):
        if self.status == "resolved" and not self.resolution_comment:
            raise ValueError("resolution_comment is required when resolving a clarification")
        return self


class ScopeElementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    scope_id: UUID
    source_onboarding_session_id: UUID
    source_type: str
    source_id: UUID
    element_type: str
    element_name_snapshot: str
    capiso_suggestion: str
    suggestion_reason: str
    user_decision: str
    justification: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class ScopeClarificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    scope_id: UUID
    scope_element_id: UUID
    title: str
    description: str
    assigned_to_user_id: UUID | None
    due_date: date | None
    status: str
    resolution_comment: str | None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ScopeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    version: int
    name: str
    description: str
    status: str
    based_on_onboarding_session_id: UUID
    owner_user_id: UUID
    validated_by_user_id: UUID | None
    validated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ScopeDetailResponse(ScopeResponse):
    elements: list[ScopeElementResponse]
    clarifications: list[ScopeClarificationResponse]


class ScopeReviewResponse(BaseModel):
    blocking_errors: list[str]
    warnings: list[str]
    counts: dict[str, int]
    open_clarifications: list[ScopeClarificationResponse]
    dependency_issues: list[str]
