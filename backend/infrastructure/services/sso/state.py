from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt


class OAuthStateService:
    def __init__(self, secret: str | None = None) -> None:
        self._secret = secret or os.getenv("SSO_STATE_SECRET") or os.getenv("JWT_SECRET", "change_me_in_production")

    def create_state(self, *, frontend_callback_url: str, expires_minutes: int = 10) -> str:
        now = datetime.now(timezone.utc)
        payload: dict[str, Any] = {
            "cb": frontend_callback_url,
            "nonce": secrets.token_urlsafe(32),
            "iat": now,
            "exp": now + timedelta(minutes=expires_minutes),
        }
        return jwt.encode(payload, self._secret, algorithm="HS256")

    def decode_state(self, state: str) -> dict[str, Any]:
        return jwt.decode(state, self._secret, algorithms=["HS256"])
