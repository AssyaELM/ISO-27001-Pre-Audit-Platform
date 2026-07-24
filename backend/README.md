# CapISO Backend

FastAPI backend foundation for CapISO.

This backend foundation exposes the health endpoint and configures the PostgreSQL persistence foundation with SQLAlchemy 2.x and Alembic.

The initial identity tables exist for users, organizations, organization memberships, and e-mail verification tokens. ISO, frontend, and AI features are intentionally not implemented yet.

## Dependencies

- FastAPI
- Uvicorn
- SQLAlchemy 2.x
- psycopg 3
- pydantic-settings
- Alembic
- pwdlib with Argon2
- PyJWT
- email-validator
- Pytest

## Install

```bash
uv sync
```

## Configuration

Copy the root `.env.example` to `.env` for local development and adjust only development values.

```bash
DATABASE_URL=postgresql+psycopg://capiso:change-me@localhost:5433/capiso
DATABASE_ECHO=false
FRONTEND_URL=http://localhost:5173
EMAIL_FROM=no-reply@capiso.local
EMAIL_VERIFICATION_EXPIRE_HOURS=24
EMAIL_RESEND_COOLDOWN_SECONDS=60
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_USE_TLS=true
```

Never commit a real `.env` file.

## PostgreSQL

From the repository root:

```bash
docker compose up -d postgres
```

The compose file starts only PostgreSQL for local development.
It exposes PostgreSQL on `127.0.0.1:5433` to avoid conflicts with another local PostgreSQL using `5432`.

## Run

```bash
uv run uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`.

## Health Check

```bash
curl http://127.0.0.1:8000/api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "capiso-api"
}
```

## Authentication

The authentication endpoints are:

```text
POST /api/v1/auth/register
POST /api/v1/auth/register-with-organization
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/login
GET /api/v1/auth/me
```

Emails are normalized before storage with `email.strip().lower()`.
Plain-text passwords must never be stored, returned in API responses, or written to logs.

`is_active` and `is_verified` are intentionally separate:

- `is_active` says whether the account is allowed or suspended.
- `is_verified` says whether the e-mail address has been confirmed.

A newly registered user can therefore be `is_active=true` and `is_verified=false`.
No normal access token is returned until the e-mail address is verified.

### First admin signup

`POST /api/v1/auth/register-with-organization` creates, in one database transaction:

- the user account;
- the organization;
- the creator membership with role `administrateur_entreprise`;
- an e-mail verification token stored only as a SHA-256 hash.

The organization starts with `status=pending_activation`, and the membership starts with `status=pending`.
After the database commit, CapISO sends a verification e-mail using `FRONTEND_URL`:

```text
http://localhost:5173/verify-email?token=<raw-token>
```

Example request:

```json
{
  "first_name": "Sara",
  "last_name": "Amrani",
  "email": "sara@atlascloud.ma",
  "password": "MotDePasseLongEtUnique123!",
  "organization": {
    "name": "Atlas Cloud Solutions",
    "country": "MA",
    "sector": "software_saas",
    "size_range": "11_50"
  }
}
```

Example pending response:

```json
{
  "status": "pending_email_verification",
  "message": "Votre compte a ete cree. Verifiez votre adresse e-mail pour l'activer.",
  "email_masked": "s***@atlascloud.ma",
  "verification_expires_in": 86400,
  "organization": {
    "id": "uuid",
    "name": "Atlas Cloud Solutions",
    "country": "MA",
    "sector": "software_saas",
    "size_range": "11_50",
    "status": "pending_activation",
    "current_user_role": "administrateur_entreprise",
    "membership_status": "pending"
  },
  "next_step": "verify_email",
  "email_delivery_status": "sent"
}
```

`POST /api/v1/auth/register` remains available for account-only registration. It creates no organization, creates a verification token, sends the verification e-mail, and returns the same pending status without an access token.

### E-mail verification

The frontend will read the raw token from the verification URL and submit:

```json
{
  "token": "raw-token-from-email"
}
```

to `POST /api/v1/auth/verify-email`.

For a valid token, CapISO marks the user as verified, stores `email_verified_at`, activates only the organization and membership linked to that token, marks the token as used, invalidates other active tokens for the same user, and returns:

```json
{
  "status": "verified",
  "message": "Votre adresse e-mail a ete verifiee.",
  "next_step": "login"
}
```

The user must then sign in through `POST /api/v1/auth/login`.

### Resend verification

`POST /api/v1/auth/resend-verification` accepts:

```json
{
  "email": "sara@atlascloud.ma"
}
```

The response is always generic so the endpoint does not expose whether an account exists:

```json
{
  "message": "Si un compte en attente correspond a cette adresse, un nouvel e-mail de verification sera envoye."
}
```

For an unverified account, old active tokens are invalidated and a new token is generated unless the 60-second resend cooldown is still active.

### Login behavior

Unknown e-mail or wrong password returns `401 Unauthorized` with the same generic message.
If the password is correct but the e-mail address is not verified, login returns `403 Forbidden` with code `email_verification_required`.
Only active and verified users receive the normal JWT access token.

## Organizations

The initial organization endpoints are:

```text
POST /api/v1/organizations
GET /api/v1/organizations
GET /api/v1/organizations/{organization_id}
```

Creating an organization also creates the creator's `organization_members` row with the `administrateur_entreprise` role. Both writes are committed in a single transaction. If either write fails, the transaction is rolled back.

For an already verified user, `POST /api/v1/organizations` requires `name`, `country`, `sector`, and `size_range`. The new organization and membership are created directly as active. No new verification e-mail is sent.

The domain concepts stay separate:

- User account: name, e-mail, password hash, active status, verified status.
- Organization: company/workspace name, country, sector, size range, activation status.
- Organization membership: link between a user and an organization, with role and membership status.

## Test

```bash
uv run pytest
```

Some health endpoint tests start a local Uvicorn process and require local socket access.

## Alembic

Alembic is configured with the first identity migration.

Useful commands from `backend/`:

```bash
uv run alembic current
uv run alembic check
uv run alembic revision --autogenerate -m "message"
uv run alembic upgrade head
```
