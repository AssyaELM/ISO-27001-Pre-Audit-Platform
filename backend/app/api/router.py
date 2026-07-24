from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.onboarding import router as onboarding_router
from app.api.routes.organizations import router as organizations_router
from app.api.routes.scopes import router as scopes_router


api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(health_router, tags=["health"])
api_router.include_router(organizations_router)
api_router.include_router(onboarding_router)
api_router.include_router(scopes_router)
