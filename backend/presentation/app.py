from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.application.common.interfaces import TokenService
from backend.domain.users.entities import UserId
from backend.infrastructure.db.models import Base
from backend.infrastructure.repositories.users import SqlAlchemyUsersUnitOfWork
from backend.infrastructure.repositories.wishlists import SqlAlchemyWishlistsUnitOfWork
from backend.infrastructure.services.security import BcryptPasswordHasher, JwtTokenService
from backend.presentation import routes_auth
from backend.presentation import routes_sso
from backend.presentation import routes_users
from backend.presentation import routes_wishlists
from backend.presentation import routes_public


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_app() -> FastAPI:
    database_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@db:5432/postgres")
    jwt_secret = os.getenv("JWT_SECRET", "CHANGE_ME")
    jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRES_MIN", "60"))

    engine = create_async_engine(database_url, echo=False, future=True)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    token_service: TokenService = JwtTokenService(
        secret_key=jwt_secret,
        algorithm=jwt_algorithm,
        access_token_expires_minutes=access_token_minutes,
    )

    app = FastAPI(
        title="ILikeToHave API",
        version="1.0.0",
        description="Backend API for iliketohave.com wishlist PWA",
    )

    allowed_origins_env = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000,like.chineshyar.com")
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    async def get_session() -> AsyncSession:
        async with session_factory() as session:
            yield session

    async def get_users_uow(session: Annotated[AsyncSession, Depends(get_session)]) -> SqlAlchemyUsersUnitOfWork:
        return SqlAlchemyUsersUnitOfWork(session=session)

    async def get_wishlists_uow(session: Annotated[AsyncSession, Depends(get_session)]) -> SqlAlchemyWishlistsUnitOfWork:
        return SqlAlchemyWishlistsUnitOfWork(session=session)

    def get_password_hasher() -> BcryptPasswordHasher:
        return BcryptPasswordHasher()

    def get_token_service() -> TokenService:
        return token_service

    async def get_current_user_id(
        token: Annotated[str, Depends(oauth2_scheme)],
    ) -> UserId:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, jwt_secret, algorithms=[jwt_algorithm])
            sub = payload.get("sub")
            if sub is None:
                raise credentials_exception
            # exp is verified by jwt.decode if present
        except jwt.PyJWTError:
            raise credentials_exception
        return UserId(value=UUID(sub))

    # Include routers, injecting dependencies via dependency_overrides where needed
    app.dependency_overrides[AsyncSession] = get_session
    app.dependency_overrides[SqlAlchemyUsersUnitOfWork] = get_users_uow
    app.dependency_overrides[SqlAlchemyWishlistsUnitOfWork] = get_wishlists_uow
    app.dependency_overrides[BcryptPasswordHasher] = get_password_hasher
    app.dependency_overrides[TokenService] = get_token_service
    app.dependency_overrides[UserId] = get_current_user_id

    app.include_router(routes_auth.router)
    app.include_router(routes_sso.router)
    app.include_router(routes_users.router)
    app.include_router(routes_wishlists.router)
    app.include_router(routes_public.router)

    return app


app = create_app()
