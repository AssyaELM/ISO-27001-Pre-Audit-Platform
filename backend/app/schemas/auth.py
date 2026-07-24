from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.organization import OrganizationCreateRequest


def normalize_email(value: str) -> str:
    return value.strip().lower()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email_before_validation(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Name cannot be blank")
        return stripped


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email_before_validation(cls, value: str) -> str:
        return normalize_email(value)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterWithOrganizationRequest(RegisterRequest):
    organization: OrganizationCreateRequest


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=1)

    @field_validator("token")
    @classmethod
    def strip_token(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Token cannot be blank")
        return stripped


class ResendVerificationRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email_before_validation(cls, value: str) -> str:
        return normalize_email(value)


class PendingOrganizationResponse(BaseModel):
    id: UUID
    name: str
    country: str
    sector: str
    size_range: str
    status: str
    current_user_role: str
    membership_status: str


class PendingVerificationResponse(BaseModel):
    status: str = "pending_email_verification"
    message: str
    email_masked: str
    verification_expires_in: int
    organization: PendingOrganizationResponse | None = None
    next_step: str = "verify_email"
    email_delivery_status: str = "sent"


class VerifyEmailResponse(BaseModel):
    status: str = "verified"
    message: str = "Votre adresse e-mail a ete verifiee."
    next_step: str = "login"


class ResendVerificationResponse(BaseModel):
    message: str = (
        "Si un compte en attente correspond a cette adresse, "
        "un nouvel e-mail de verification sera envoye."
    )


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool
    is_verified: bool
    email_verified_at: datetime | None
    created_at: datetime
    updated_at: datetime
