from __future__ import annotations

import secrets
from dataclasses import dataclass
from typing import Optional

from backend.application.common.interfaces import AuthToken, TokenService
from backend.domain.users.entities import User, UserId, UserProfile
from backend.domain.users.repositories import UnitOfWork as UsersUnitOfWork
from backend.infrastructure.services.security import BcryptPasswordHasher


@dataclass(slots=True)
class SsoIdentity:
    provider: str
    email: str
    email_verified: bool
    name: Optional[str] = None
    picture_url: Optional[str] = None


@dataclass(slots=True)
class SsoLoginCommand:
    identity: SsoIdentity


@dataclass(slots=True)
class SsoLoginResult:
    user: User
    token: AuthToken


class SsoLoginUseCase:
    def __init__(self, uow: UsersUnitOfWork, token_service: TokenService) -> None:
        self._uow = uow
        self._token_service = token_service

    async def execute(self, cmd: SsoLoginCommand) -> SsoLoginResult:
        identity = cmd.identity
        if not identity.email:
            raise ValueError("Missing email")
        if identity.email_verified is not True:
            raise ValueError("Email not verified")

        password_hasher = BcryptPasswordHasher()

        async with self._uow as uow:
            user = await uow.users.get_by_email(identity.email)
            if user is None:
                user = User(
                    id=UserId.new(),
                    email=identity.email,
                    password_hash=password_hasher.hash(secrets.token_urlsafe(32)),
                )
                await uow.users.add(user)

            profile = await uow.profiles.get_by_user_id(user.id)
            first_name: Optional[str] = None
            last_name: Optional[str] = None
            if identity.name:
                parts = [p for p in identity.name.split(" ") if p]
                if parts:
                    first_name = parts[0]
                    last_name = " ".join(parts[1:]) if len(parts) > 1 else None

            if profile is None:
                profile = UserProfile(
                    user_id=user.id,
                    username=(identity.email.split("@")[0] if "@" in identity.email else identity.email) or None,
                    first_name=first_name,
                    last_name=last_name,
                    photo_url=identity.picture_url,
                )
                await uow.profiles.add(profile)
            else:
                profile.update_profile(first_name=first_name, last_name=last_name, photo_url=identity.picture_url)
                await uow.profiles.update(profile)

            await uow.commit()

        token = self._token_service.create_access_token(user.id)
        return SsoLoginResult(user=user, token=token)
