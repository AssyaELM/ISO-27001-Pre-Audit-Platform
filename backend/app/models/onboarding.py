from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OnboardingSession(Base):
    __tablename__ = "onboarding_sessions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'pending_review', 'validated', 'archived')",
            name="ck_onboarding_sessions_status",
        ),
        CheckConstraint(
            "current_step BETWEEN 1 AND 3",
            name="ck_onboarding_sessions_current_step",
        ),
        CheckConstraint(
            "completion_percentage BETWEEN 0 AND 100",
            name="ck_onboarding_sessions_completion_percentage",
        ),
        UniqueConstraint(
            "organization_id",
            "version",
            name="uq_onboarding_sessions_org_version",
        ),
        Index(
            "uq_onboarding_sessions_active_org",
            "organization_id",
            unique=True,
            postgresql_where=text("status IN ('draft', 'pending_review')"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    schema_version: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="draft")
    current_step: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    completion_percentage: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    started_by_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    validated_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True
    )
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    activities: Mapped[list[OrganizationActivity]] = relationship(
        back_populates="onboarding_session", cascade="all, delete-orphan"
    )
    processes: Mapped[list[OrganizationProcess]] = relationship(
        back_populates="onboarding_session", cascade="all, delete-orphan"
    )
    teams: Mapped[list[OrganizationTeam]] = relationship(
        back_populates="onboarding_session", cascade="all, delete-orphan"
    )
    profile: Mapped[OrganizationProfile | None] = relationship(
        back_populates="onboarding_session",
        cascade="all, delete-orphan",
        uselist=False,
    )
    sites: Mapped[list[OrganizationSite]] = relationship(
        back_populates="onboarding_session", cascade="all, delete-orphan"
    )
    systems: Mapped[list[OrganizationSystem]] = relationship(
        back_populates="onboarding_session", cascade="all, delete-orphan"
    )
    data_categories: Mapped[list[OrganizationDataCategory]] = relationship(
        back_populates="onboarding_session", cascade="all, delete-orphan"
    )
    suppliers: Mapped[list[OrganizationSupplier]] = relationship(
        back_populates="onboarding_session", cascade="all, delete-orphan"
    )
    external_requirements: Mapped[list[OrganizationExternalRequirement]] = relationship(
        back_populates="onboarding_session", cascade="all, delete-orphan"
    )


class OrganizationActivity(Base):
    __tablename__ = "organization_activities"
    __table_args__ = (
        UniqueConstraint(
            "onboarding_session_id", "name", name="uq_organization_activities_session_name"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    onboarding_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("onboarding_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(300))
    nature_types: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    is_primary: Mapped[bool] = mapped_column(nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    onboarding_session: Mapped[OnboardingSession] = relationship(back_populates="activities")


class OrganizationProcess(Base):
    __tablename__ = "organization_processes"
    __table_args__ = (
        UniqueConstraint(
            "onboarding_session_id",
            "process_type",
            "custom_name",
            name="uq_organization_processes_session_value",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    onboarding_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("onboarding_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    process_type: Mapped[str] = mapped_column(String(80), nullable=False)
    custom_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    onboarding_session: Mapped[OnboardingSession] = relationship(back_populates="processes")


class OrganizationTeam(Base):
    __tablename__ = "organization_teams"
    __table_args__ = (
        UniqueConstraint(
            "onboarding_session_id",
            "team_type",
            "custom_name",
            name="uq_organization_teams_session_value",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    onboarding_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("onboarding_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    team_type: Mapped[str] = mapped_column(String(80), nullable=False)
    custom_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    onboarding_session: Mapped[OnboardingSession] = relationship(back_populates="teams")


class OrganizationProfile(Base):
    __tablename__ = "organization_profiles"
    __table_args__ = (
        CheckConstraint(
            "work_mode IS NULL OR work_mode IN ('onsite', 'hybrid', 'mainly_remote', 'fully_remote')",
            name="ck_organization_profiles_work_mode",
        ),
        CheckConstraint(
            "multiple_sites_status IS NULL OR multiple_sites_status IN ('yes', 'no', 'unknown')",
            name="ck_organization_profiles_multiple_sites",
        ),
        CheckConstraint(
            "regular_external_contractors_status IS NULL OR "
            "regular_external_contractors_status IN ('yes', 'no', 'unknown')",
            name="ck_organization_profiles_contractors",
        ),
        CheckConstraint(
            "suppliers_identification_status IS NULL OR "
            "suppliers_identification_status IN ('identified', 'none_identified', 'unknown')",
            name="ck_organization_profiles_suppliers_status",
        ),
        UniqueConstraint("onboarding_session_id", name="uq_organization_profiles_session"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    onboarding_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("onboarding_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    work_mode: Mapped[str | None] = mapped_column(String(30))
    multiple_sites_status: Mapped[str | None] = mapped_column(String(20))
    regular_external_contractors_status: Mapped[str | None] = mapped_column(String(20))
    hosting_models: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    selected_cloud_providers: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list
    )
    highest_sensitivity_level: Mapped[str | None] = mapped_column(String(30))
    system_categories: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    systems_identification_status: Mapped[str | None] = mapped_column(String(40))
    suppliers_identification_status: Mapped[str | None] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    onboarding_session: Mapped[OnboardingSession] = relationship(back_populates="profile")


class OrganizationSite(Base):
    __tablename__ = "organization_sites"
    __table_args__ = (
        UniqueConstraint(
            "onboarding_session_id",
            "name",
            "city",
            "country",
            name="uq_organization_sites_session_location",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    onboarding_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("onboarding_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str | None] = mapped_column(String(120))
    country: Mapped[str | None] = mapped_column(String(120))
    site_type: Mapped[str] = mapped_column(String(40), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    onboarding_session: Mapped[OnboardingSession] = relationship(back_populates="sites")


class OrganizationSystem(Base):
    __tablename__ = "organization_systems"
    __table_args__ = (
        CheckConstraint(
            "identification_status IN ('identified', 'to_determine')",
            name="ck_organization_systems_identification_status",
        ),
        UniqueConstraint(
            "onboarding_session_id",
            "name",
            "system_type",
            name="uq_organization_systems_session_name_type",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    onboarding_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("onboarding_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    system_type: Mapped[str] = mapped_column(String(80), nullable=False)
    supported_activity_or_process: Mapped[str | None] = mapped_column(String(255))
    provider_or_host: Mapped[str | None] = mapped_column(String(255))
    identification_status: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    onboarding_session: Mapped[OnboardingSession] = relationship(back_populates="systems")


class OrganizationDataCategory(Base):
    __tablename__ = "organization_data_categories"
    __table_args__ = (
        UniqueConstraint(
            "onboarding_session_id",
            "category_type",
            "custom_name",
            name="uq_organization_data_categories_session_value",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    onboarding_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("onboarding_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_type: Mapped[str] = mapped_column(String(80), nullable=False)
    custom_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    onboarding_session: Mapped[OnboardingSession] = relationship(
        back_populates="data_categories"
    )


class OrganizationSupplier(Base):
    __tablename__ = "organization_suppliers"
    __table_args__ = (
        CheckConstraint(
            "processes_or_hosts_data IN ('yes', 'no', 'unknown')",
            name="ck_organization_suppliers_processes_data",
        ),
        CheckConstraint(
            "has_system_access IN ('yes', 'no', 'unknown')",
            name="ck_organization_suppliers_system_access",
        ),
        CheckConstraint(
            "criticality IN ('low', 'medium', 'high', 'to_determine')",
            name="ck_organization_suppliers_criticality",
        ),
        UniqueConstraint(
            "onboarding_session_id", "name", name="uq_organization_suppliers_session_name"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    onboarding_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("onboarding_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    supplier_type: Mapped[str] = mapped_column(String(80), nullable=False)
    related_service_or_system: Mapped[str | None] = mapped_column(String(255))
    processes_or_hosts_data: Mapped[str] = mapped_column(String(20), nullable=False)
    has_system_access: Mapped[str] = mapped_column(String(20), nullable=False)
    criticality: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    onboarding_session: Mapped[OnboardingSession] = relationship(back_populates="suppliers")


class OrganizationExternalRequirement(Base):
    __tablename__ = "organization_external_requirements"
    __table_args__ = (
        CheckConstraint(
            "confirmation_status IN ('declared_to_confirm', 'confirmed', 'not_applicable')",
            name="ck_organization_external_requirements_status",
        ),
        UniqueConstraint(
            "onboarding_session_id",
            "requirement_type",
            "details",
            name="uq_organization_external_requirements_session_value",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    onboarding_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("onboarding_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requirement_type: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str | None] = mapped_column(Text)
    confirmation_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="declared_to_confirm"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    onboarding_session: Mapped[OnboardingSession] = relationship(
        back_populates="external_requirements"
    )
