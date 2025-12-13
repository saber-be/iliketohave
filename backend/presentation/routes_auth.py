from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from backend.application.auth.use_cases import (
    LoginCommand,
    LoginUseCase,
    SignUpCommand,
    SignUpUseCase,
)
from backend.application.common.interfaces import PasswordHasher, TokenService
from backend.domain.users.entities import UserId
from backend.infrastructure.repositories.users import SqlAlchemyUsersUnitOfWork
from backend.infrastructure.services.security import BcryptPasswordHasher
from backend.presentation.dependencies import get_users_uow, get_token_service
from backend.presentation.rate_limiter import rate_limit
from backend.presentation.schemas import (
    LoginRequest,
    SignUpRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_to_response(user) -> UserResponse:
    return UserResponse(
        id=user.id.value,
        email=user.email,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    payload: SignUpRequest,
    _: None = Depends(rate_limit(action="auth:signup", limit=5, window_seconds=60 * 10)),
    uow: SqlAlchemyUsersUnitOfWork = Depends(get_users_uow),
    password_hasher: PasswordHasher = Depends(BcryptPasswordHasher),
) -> UserResponse:
    use_case = SignUpUseCase(uow=uow, password_hasher=password_hasher)
    try:
        result = await use_case.execute(SignUpCommand(email=payload.email, password=payload.password))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    return _user_to_response(result.user)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    _: None = Depends(rate_limit(action="auth:login", limit=10, window_seconds=60 * 5)),
    uow: SqlAlchemyUsersUnitOfWork = Depends(get_users_uow),
    password_hasher: PasswordHasher = Depends(BcryptPasswordHasher),
    token_service: TokenService = Depends(get_token_service),
) -> TokenResponse:
    use_case = LoginUseCase(uow=uow, password_hasher=password_hasher, token_service=token_service)
    try:
        result = await use_case.execute(LoginCommand(email=payload.email, password=payload.password))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credentials") from e

    return TokenResponse(
        access_token=result.token.access_token,
        expires_at=result.token.expires_at,
    )
