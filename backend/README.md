# CapISO Backend

FastAPI backend foundation for CapISO.

This first backend step only exposes a health endpoint and the extensible API structure. It does not configure PostgreSQL, Alembic, authentication, ISO business modules, or AI features.

## Install

```bash
uv sync
```

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

