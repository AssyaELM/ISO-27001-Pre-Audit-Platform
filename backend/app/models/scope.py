from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
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
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class IsmsScope(Base):
    __tablename__ = "isms_scopes"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'pending_review', 'validated', 'archived')",
            name="ck_isms_scopes_status",
        ),
        UniqueConstraint("organization_id", "version", name="uq_isms_scopes_org_version"),
        Index(
            "uq_isms_scopes_active_org",
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
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="draft")
    based_on_onboarding_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("onboarding_sessions.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
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

    elements: Mapped[list[ScopeElement]] = relationship(
        back_populates="scope", cascade="all, delete-orphan"
    )
    clarifications: Mapped[list[ScopeClarification]] = relationship(
        back_populates="scope", cascade="all, delete-orphan"
    )


class ScopeElement(Base):
    __tablename__ = "scope_elements"
    __table_args__ = (
        CheckConstraint(
            "source_type IN ('activity', 'process', 'team', 'site', 'system', "
            "'data_category', 'supplier', 'hosting')",
            name="ck_scope_elements_source_type",
        ),
        CheckConstraint(
            "element_type IN ('activity', 'process', 'team', 'site', 'system', "
            "'data_category', 'supplier', 'hosting')",
            name="ck_scope_elements_element_type",
        ),
        CheckConstraint(
            "capiso_suggestion IN ('include_recommended', 'review_required', "
            "'insufficient_information', 'link_not_identified')",
            name="ck_scope_elements_suggestion",
        ),
        CheckConstraint(
            "user_decision IN ('include', 'exclude', 'to_determine')",
            name="ck_scope_elements_decision",
        ),
        CheckConstraint(
            "status IN ('pending', 'validated', 'needs_clarification')",
            name="ck_scope_elements_status",
        ),
        UniqueConstraint(
            "scope_id", "source_type", "source_id", name="uq_scope_elements_scope_source"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    scope_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("isms_scopes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_onboarding_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("onboarding_sessions.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    source_type: Mapped[str] = mapped_column(String(40), nullable=False)
    source_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    element_type: Mapped[str] = mapped_column(String(40), nullable=False)
    element_name_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    capiso_suggestion: Mapped[str] = mapped_column(String(40), nullable=False)
    suggestion_reason: Mapped[str] = mapped_column(Text, nullable=False)
    user_decision: Mapped[str] = mapped_column(
        String(30), nullable=False, default="to_determine"
    )
    justification: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    scope: Mapped[IsmsScope] = relationship(back_populates="elements")
    clarifications: Mapped[list[ScopeClarification]] = relationship(
        back_populates="scope_element", cascade="all, delete-orphan"
    )


class ScopeClarification(Base):
    __tablename__ = "scope_clarifications"
    __table_args__ = (
        CheckConstraint(
            "status IN ('todo', 'in_progress', 'resolved', 'cancelled')",
            name="ck_scope_clarifications_status",
        ),
        Index(
            "uq_scope_clarifications_open_element",
            "scope_element_id",
            unique=True,
            postgresql_where=text("status IN ('todo', 'in_progress')"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    scope_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("isms_scopes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scope_element_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("scope_elements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    assigned_to_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    due_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="todo")
    resolution_comment: Mapped[str | None] = mapped_column(Text)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    scope: Mapped[IsmsScope] = relationship(back_populates="clarifications")
    scope_element: Mapped[ScopeElement] = relationship(back_populates="clarifications")
