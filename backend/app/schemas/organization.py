from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


SECTOR_VALUES = {
    "software_saas",
    "it_services",
    "consulting_professional_services",
    "finance_fintech",
    "healthcare",
    "education",
    "ecommerce_retail",
    "industry_manufacturing",
    "logistics_transport",
    "public_nonprofit",
    "other",
}

SIZE_RANGE_VALUES = {"1_10", "11_50", "51_250", "251_500", "500_plus"}


class OrganizationCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=120)
    sector: str = Field(max_length=120)
    size_range: str = Field(max_length=80)
    country: str = Field(min_length=2, max_length=2)
    language: str = Field(default="fr", min_length=2, max_length=20)
    timezone: str = Field(default="Africa/Casablanca", min_length=1, max_length=80)
    description: str | None = None

    @field_validator("slug", "description", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        return stripped

    @field_validator("language", "timezone", mode="before")
    @classmethod
    def require_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Value cannot be blank")
        return stripped

    @field_validator("name", mode="before")
    @classmethod
    def require_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Organization name cannot be blank")
        return stripped

    @field_validator("country", mode="before")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        normalized = value.strip().upper()
        if len(normalized) != 2 or not normalized.isalpha():
            raise ValueError("Country must be an ISO alpha-2 code")
        return normalized

    @field_validator("sector", mode="before")
    @classmethod
    def validate_sector(cls, value: str) -> str:
        normalized = value.strip()
        if normalized not in SECTOR_VALUES:
            raise ValueError("Unsupported organization sector")
        return normalized

    @field_validator("size_range", mode="before")
    @classmethod
    def validate_size_range(cls, value: str) -> str:
        normalized = value.strip()
        if normalized not in SIZE_RANGE_VALUES:
            raise ValueError("Unsupported organization size range")
        return normalized


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    sector: str | None
    size_range: str | None
    country: str | None
    status: str
    language: str
    timezone: str
    description: str | None
    created_at: datetime
    updated_at: datetime
