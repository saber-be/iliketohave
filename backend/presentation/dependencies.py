from __future__ import annotations

import os
from collections.abc import AsyncIterator
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.application.common.interfaces import TokenService
from backend.domain.users.entities import UserId
from backend.infrastructure.repositories.users import SqlAlchemyUsersUnitOfWork
from backend.infrastructure.repositories.wishlists import SqlAlchemyWishlistsUnitOfWork
from backend.infrastructure.services.security import JwtTokenService


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://iliketohave:iliketohave_password@db:5432/iliketohave",
)

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with session_factory() as session:
        yield session


async def get_users_uow(
    session: AsyncSession = Depends(get_session),
) -> SqlAlchemyUsersUnitOfWork:
    return SqlAlchemyUsersUnitOfWork(session=session)


async def get_wishlists_uow(
    session: AsyncSession = Depends(get_session),
) -> AsyncIterator[SqlAlchemyWishlistsUnitOfWork]:
    return SqlAlchemyWishlistsUnitOfWork(session=session)


def extract_user_id_from_token(token: str) -> UserId:
    try:
        payload = jwt.decode(token, _jwt_secret, algorithms=[_jwt_algorithm])
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = UserId(UUID(sub))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


async def get_current_user_id(
    token: str = Depends(oauth2_scheme),
) -> UserId:
    return extract_user_id_from_token(token)


_jwt_secret = os.getenv("JWT_SECRET", "change_me_in_production")
_jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
_access_token_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRES_MIN", "60"))

_token_service: TokenService = JwtTokenService(
    secret_key=_jwt_secret,
    algorithm=_jwt_algorithm,
    access_token_expires_minutes=_access_token_minutes,
)


def get_token_service() -> TokenService:
    return _token_service
