from __future__ import annotations

import os
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse

from backend.application.auth.sso_use_cases import SsoIdentity, SsoLoginCommand, SsoLoginUseCase
from backend.application.common.interfaces import TokenService
from backend.infrastructure.repositories.users import SqlAlchemyUsersUnitOfWork
from backend.infrastructure.services.sso.google import GoogleOAuthClient
from backend.infrastructure.services.sso.state import OAuthStateService
from backend.presentation.dependencies import get_token_service, get_users_uow
from backend.presentation.rate_limiter import rate_limit


router = APIRouter(prefix="/api/auth/sso/google", tags=["auth"])


def _frontend_base_url() -> str:
    return os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")


def _frontend_callback_url() -> str:
    return f"{_frontend_base_url()}/sso/google/callback"


@router.get("/start")
async def start(
    _: None = Depends(rate_limit(action="auth:sso_google_start", limit=30, window_seconds=60 * 5)),
) -> RedirectResponse:
    state_service = OAuthStateService()
    oauth = GoogleOAuthClient()

    try:
        state = state_service.create_state(frontend_callback_url=_frontend_callback_url())
        params = oauth.build_authorize_params(state=state)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)) from e

    return RedirectResponse(url=f"{oauth.auth_url}?{urlencode(params)}", status_code=status.HTTP_302_FOUND)


@router.get("/callback")
async def callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    _: None = Depends(rate_limit(action="auth:sso_google_callback", limit=60, window_seconds=60 * 10)),
    uow: SqlAlchemyUsersUnitOfWork = Depends(get_users_uow),
    token_service: TokenService = Depends(get_token_service),
) -> RedirectResponse:
    if not state:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing OAuth state")

    state_service = OAuthStateService()
    try:
        decoded_state = state_service.decode_state(state)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state") from e

    frontend_cb = decoded_state.get("cb")
    if not isinstance(frontend_cb, str) or not frontend_cb.startswith(_frontend_base_url()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth callback")

    if error:
        return RedirectResponse(url=f"{frontend_cb}#error={error}", status_code=status.HTTP_302_FOUND)

    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing OAuth code")

    oauth = GoogleOAuthClient()
    try:
        userinfo = await oauth.fetch_userinfo(code=code)
    except Exception:
        return RedirectResponse(url=f"{frontend_cb}#error=oauth_userinfo_failed", status_code=status.HTTP_302_FOUND)

    use_case = SsoLoginUseCase(uow=uow, token_service=token_service)
    try:
        result = await use_case.execute(
            SsoLoginCommand(
                identity=SsoIdentity(
                    provider="google",
                    email=userinfo.email,
                    email_verified=userinfo.email_verified,
                    name=userinfo.name,
                    picture_url=userinfo.picture,
                )
            )
        )
    except ValueError as e:
        return RedirectResponse(url=f"{frontend_cb}#error={str(e).replace(' ', '_')}", status_code=status.HTTP_302_FOUND)

    fragment = urlencode({"access_token": result.token.access_token, "expires_at": result.token.expires_at.isoformat()})
    return RedirectResponse(url=f"{frontend_cb}#{fragment}", status_code=status.HTTP_302_FOUND)
