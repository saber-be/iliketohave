from __future__ import annotations

import os
from dataclasses import dataclass

import httpx


_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"


@dataclass(slots=True)
class GoogleUserInfo:
    email: str
    email_verified: bool
    name: str | None = None
    picture: str | None = None


class GoogleOAuthClient:
    def __init__(
        self,
        client_id: str | None = None,
        client_secret: str | None = None,
        redirect_uri: str | None = None,
    ) -> None:
        self._client_id = client_id or os.getenv("GOOGLE_OAUTH_CLIENT_ID")
        self._client_secret = client_secret or os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")
        self._redirect_uri = redirect_uri or os.getenv(
            "GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:8000/api/auth/sso/google/callback"
        )

    @property
    def auth_url(self) -> str:
        return _GOOGLE_AUTH_URL

    @property
    def redirect_uri(self) -> str:
        return self._redirect_uri

    def _require_client_id(self) -> str:
        if not self._client_id:
            raise ValueError("Google OAuth is not configured")
        return self._client_id

    def _require_client_secret(self) -> str:
        if not self._client_secret:
            raise ValueError("Google OAuth is not configured")
        return self._client_secret

    def build_authorize_params(self, *, state: str) -> dict[str, str]:
        return {
            "client_id": self._require_client_id(),
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "online",
            "prompt": "select_account",
            "state": state,
        }

    async def fetch_userinfo(self, *, code: str) -> GoogleUserInfo:
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_res = await client.post(
                _GOOGLE_TOKEN_URL,
                data={
                    "client_id": self._require_client_id(),
                    "client_secret": self._require_client_secret(),
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            token_res.raise_for_status()
            token_json = token_res.json()
            access_token = token_json.get("access_token")
            if not access_token:
                raise ValueError("Missing access_token")

            userinfo_res = await client.get(_GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
            userinfo_res.raise_for_status()
            userinfo = userinfo_res.json()

        email = userinfo.get("email")
        email_verified = userinfo.get("email_verified")
        name = userinfo.get("name")
        picture = userinfo.get("picture")

        if not isinstance(email, str) or not email:
            raise ValueError("Missing email")

        return GoogleUserInfo(
            email=email,
            email_verified=email_verified is True,
            name=name if isinstance(name, str) else None,
            picture=picture if isinstance(picture, str) else None,
        )
