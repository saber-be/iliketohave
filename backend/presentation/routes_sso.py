from __future__ import annotations

from fastapi import APIRouter

from backend.presentation.sso.google import router as google_router


router = APIRouter(prefix="/api/auth/sso", tags=["auth"])

# Provider routers
router.include_router(google_router)
