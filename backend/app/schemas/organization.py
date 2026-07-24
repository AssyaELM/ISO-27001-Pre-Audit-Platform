from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class OrganizationCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=120)
    sector: str | None = Field(default=None, max_length=120)
    size_range: str | None = Field(default=None, max_length=80)
    country: str | None = Field(default=None, max_length=120)
    language: str = Field(default="fr", min_length=2, max_length=20)
    timezone: str = Field(default="Africa/Casablanca", min_length=1, max_length=80)
    description: str | None = None

    @field_validator("name", "slug", "sector", "size_range", "country", "language", "timezone")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        return stripped


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    sector: str | None
    size_range: str | None
    country: str | None
    language: str
    timezone: str
    description: str | None
    created_at: datetime
    updated_at: datetime
