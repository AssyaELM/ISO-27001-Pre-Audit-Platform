import asyncio

from fastapi.routing import APIRoute

from app.main import app


def test_health_endpoint_returns_status() -> None:
    route = next(
        route
        for route in app.routes
        if isinstance(route, APIRoute) and route.path == "/api/v1/health"
    )

    assert "GET" in route.methods
    assert asyncio.run(route.endpoint()) == {
        "status": "ok",
        "service": "capiso-api",
    }
