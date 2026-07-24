# CapISO Backend

FastAPI backend foundation for CapISO.

This backend foundation exposes the health endpoint and configures the PostgreSQL persistence foundation with SQLAlchemy 2.x and Alembic.

No business tables exist yet. User, organization, authentication, ISO, and AI features are intentionally not implemented in this step.

## Dependencies

- FastAPI
- Uvicorn
- SQLAlchemy 2.x
- psycopg 3
- pydantic-settings
- Alembic
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

## Test

```bash
uv run pytest
```

Some health endpoint tests start a local Uvicorn process and require local socket access.

## Alembic

Alembic is configured, but no business migration exists yet.

Useful commands from `backend/`:

```bash
uv run alembic current
uv run alembic check
uv run alembic revision --autogenerate -m "message"
uv run alembic upgrade head
```

Do not create an empty revision. The first business migration will be created when the initial User, Organization, and OrganizationMember models are added.
