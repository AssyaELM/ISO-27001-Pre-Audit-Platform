import hashlib
import re
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token, get_password_hash
from app.core.security import verify_password
from app.db.session import get_session
from app.models.email_verification_token import EmailVerificationToken
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    PendingOrganizationResponse,
    PendingVerificationResponse,
    RegisterRequest,
    RegisterWithOrganizationRequest,
    ResendVerificationRequest,
    ResendVerificationResponse,
    TokenResponse,
    UserResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.services.email import EmailDeliveryError, EmailService, get_email_service


router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)

ADMIN_ROLE = "administrateur_entreprise"
ORG_STATUS_PENDING = "pending_activation"
ORG_STATUS_ACTIVE = "active"
MEMBERSHIP_STATUS_PENDING = "pending"
MEMBERSHIP_STATUS_ACTIVE = "active"
PENDING_MESSAGE = "Votre compte a ete cree. Verifiez votre adresse e-mail pour l'activer."
EMAIL_SEND_FAILED_MESSAGE = (
    "Votre compte a ete cree, mais l'e-mail de verification n'a pas pu etre envoye. "
    "Vous pourrez demander un nouvel envoi."
)


def _get_user_by_email(session: Session, email: str) -> User | None:
    return session.scalar(select(User).where(User.email == email))


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    masked_local = "*" if len(local) <= 1 else f"{local[0]}{'*' * (len(local) - 1)}"
    return f"{masked_local}@{domain}"


def _token_hash(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def _build_verification_url(raw_token: str) -> str:
    return f"{settings.frontend_url.rstrip('/')}/verify-email?token={raw_token}"


def _create_verification_token(
    session: Session,
    user: User,
    now: datetime,
    organization: Organization | None = None,
    membership: OrganizationMember | None = None,
) -> tuple[EmailVerificationToken, str]:
    raw_token = secrets.token_urlsafe(32)
    token = EmailVerificationToken(
        user_id=user.id,
        organization_id=organization.id if organization is not None else None,
        membership_id=membership.id if membership is not None else None,
        token_hash=_token_hash(raw_token),
        expires_at=now + timedelta(hours=settings.email_verification_expire_hours),
    )
    session.add(token)
    session.flush()
    return token, raw_token


def _invalidate_active_tokens(session: Session, user_id: UUID, now: datetime) -> None:
    session.execute(
        update(EmailVerificationToken)
        .where(
            EmailVerificationToken.user_id == user_id,
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.invalidated_at.is_(None),
        )
        .values(invalidated_at=now)
    )


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    if not slug:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Organization slug cannot be blank",
        )
    return slug


async def _send_verification_email(
    email_service: EmailService,
    user: User,
    raw_token: str,
    expires_at: datetime,
    organization_name: str | None = None,
) -> bool:
    try:
        await email_service.send_verification_email(
            recipient=user.email,
            verification_url=_build_verification_url(raw_token),
            expires_at=expires_at,
            first_name=user.first_name,
            organization_name=organization_name,
        )
    except EmailDeliveryError:
        return False
    return True


def _pending_response(
    user: User,
    token: EmailVerificationToken,
    email_sent: bool,
    organization: Organization | None = None,
    membership: OrganizationMember | None = None,
) -> PendingVerificationResponse:
    organization_response = None
    if organization is not None and membership is not None:
        organization_response = PendingOrganizationResponse(
            id=organization.id,
            name=organization.name,
            country=organization.country or "",
            sector=organization.sector or "",
            size_range=organization.size_range or "",
            status=organization.status,
            current_user_role=membership.role,
            membership_status=membership.status,
        )

    return PendingVerificationResponse(
        message=PENDING_MESSAGE if email_sent else EMAIL_SEND_FAILED_MESSAGE,
        email_masked=_mask_email(user.email),
        verification_expires_in=settings.email_verification_expire_hours * 3600,
        organization=organization_response,
        email_delivery_status="sent" if email_sent else "failed",
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(str(payload["sub"]))
    except (KeyError, ValueError, jwt.PyJWTError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from exc

    user = session.get(User, user_id)
    if user is None or not user.is_active or not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    return user


@router.post(
    "/register",
    response_model=PendingVerificationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    session: Session = Depends(get_session),
    email_service: EmailService = Depends(get_email_service),
) -> PendingVerificationResponse:
    email = str(payload.email)
    now = _utc_now()

    try:
        if _get_user_by_email(session, email) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        user = User(
            email=email,
            first_name=payload.first_name,
            last_name=payload.last_name,
            password_hash=get_password_hash(payload.password),
            is_active=True,
            is_verified=False,
        )
        session.add(user)
        session.flush()
        token, raw_token = _create_verification_token(session, user, now)
        session.commit()
    except HTTPException:
        session.rollback()
        raise
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from exc
    except Exception:
        session.rollback()
        raise

    email_sent = await _send_verification_email(email_service, user, raw_token, token.expires_at)
    return _pending_response(user, token, email_sent)


@router.post(
    "/register-with-organization",
    response_model=PendingVerificationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_with_organization(
    payload: RegisterWithOrganizationRequest,
    session: Session = Depends(get_session),
    email_service: EmailService = Depends(get_email_service),
) -> PendingVerificationResponse:
    email = str(payload.email)
    now = _utc_now()

    try:
        if _get_user_by_email(session, email) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        user = User(
            email=email,
            first_name=payload.first_name,
            last_name=payload.last_name,
            password_hash=get_password_hash(payload.password),
            is_active=True,
            is_verified=False,
        )
        session.add(user)
        session.flush()

        organization = Organization(
            name=payload.organization.name,
            slug=_slugify(payload.organization.slug or payload.organization.name),
            sector=payload.organization.sector,
            size_range=payload.organization.size_range,
            country=payload.organization.country,
            language=payload.organization.language,
            timezone=payload.organization.timezone,
            description=payload.organization.description,
            status=ORG_STATUS_PENDING,
        )
        session.add(organization)
        session.flush()

        membership = OrganizationMember(
            organization_id=organization.id,
            user_id=user.id,
            role=ADMIN_ROLE,
            status=MEMBERSHIP_STATUS_PENDING,
        )
        session.add(membership)
        session.flush()

        token, raw_token = _create_verification_token(session, user, now, organization, membership)
        session.commit()
    except HTTPException:
        session.rollback()
        raise
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered or organization slug already exists",
        ) from exc
    except Exception:
        session.rollback()
        raise

    email_sent = await _send_verification_email(
        email_service,
        user,
        raw_token,
        token.expires_at,
        organization.name,
    )
    return _pending_response(user, token, email_sent, organization, membership)


@router.post("/verify-email", response_model=VerifyEmailResponse)
def verify_email(
    payload: VerifyEmailRequest,
    session: Session = Depends(get_session),
) -> VerifyEmailResponse:
    now = _utc_now()
    token = session.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == _token_hash(payload.token)
        )
    )
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le lien de verification est invalide.",
        )
    if token.used_at is not None or token.invalidated_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce lien de verification n'est plus valide.",
        )
    if token.expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce lien de verification a expire. Demandez un nouvel e-mail.",
        )

    try:
        user = session.get(User, token.user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le lien de verification est invalide.",
            )

        user.is_verified = True
        user.email_verified_at = now
        token.used_at = now

        if token.organization_id is not None:
            organization = session.get(Organization, token.organization_id)
            membership = (
                session.get(OrganizationMember, token.membership_id)
                if token.membership_id is not None
                else None
            )
            if organization is None or membership is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Le lien de verification est invalide.",
                )
            organization.status = ORG_STATUS_ACTIVE
            membership.status = MEMBERSHIP_STATUS_ACTIVE

        session.execute(
            update(EmailVerificationToken)
            .where(
                EmailVerificationToken.user_id == user.id,
                EmailVerificationToken.id != token.id,
                EmailVerificationToken.used_at.is_(None),
                EmailVerificationToken.invalidated_at.is_(None),
            )
            .values(invalidated_at=now)
        )
        session.commit()
    except HTTPException:
        session.rollback()
        raise
    except Exception:
        session.rollback()
        raise

    return VerifyEmailResponse()


@router.post("/resend-verification", response_model=ResendVerificationResponse)
async def resend_verification(
    payload: ResendVerificationRequest,
    session: Session = Depends(get_session),
    email_service: EmailService = Depends(get_email_service),
) -> ResendVerificationResponse:
    generic_response = ResendVerificationResponse()
    user = _get_user_by_email(session, str(payload.email))
    if user is None or user.is_verified:
        return generic_response

    now = _utc_now()
    latest_active_token = session.scalar(
        select(EmailVerificationToken)
        .where(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.invalidated_at.is_(None),
        )
        .order_by(EmailVerificationToken.created_at.desc())
    )
    if latest_active_token is not None:
        cooldown_until = latest_active_token.created_at + timedelta(
            seconds=settings.email_resend_cooldown_seconds
        )
        if cooldown_until > now:
            return generic_response

    organization = (
        session.get(Organization, latest_active_token.organization_id)
        if latest_active_token is not None and latest_active_token.organization_id is not None
        else None
    )
    membership = (
        session.get(OrganizationMember, latest_active_token.membership_id)
        if latest_active_token is not None and latest_active_token.membership_id is not None
        else None
    )

    try:
        _invalidate_active_tokens(session, user.id, now)
        token, raw_token = _create_verification_token(session, user, now, organization, membership)
        session.commit()
    except Exception:
        session.rollback()
        raise

    await _send_verification_email(
        email_service,
        user,
        raw_token,
        token.expires_at,
        organization.name if organization is not None else None,
    )
    return generic_response


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)) -> TokenResponse:
    user = _get_user_by_email(session, str(payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Adresse e-mail ou mot de passe incorrect.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "email_verification_required",
                "detail": "Verifiez votre adresse e-mail avant de vous connecter.",
            },
        )

    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
