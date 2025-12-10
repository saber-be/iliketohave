from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from backend.application.users.use_cases import (
    GetProfileQuery,
    GetProfileUseCase,
    UpsertProfileCommand,
    UpsertProfileUseCase,
)
from backend.domain.users.entities import UserId
from backend.infrastructure.repositories.users import SqlAlchemyUsersUnitOfWork
from backend.presentation.dependencies import get_current_user_id, get_users_uow
from backend.presentation.schemas import (
    UserProfileResponse,
    UserProfileUpdateRequest,
)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me/profile", response_model=UserProfileResponse)
async def get_my_profile(
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyUsersUnitOfWork = Depends(get_users_uow),
) -> UserProfileResponse:
    use_case = GetProfileUseCase(uow=uow)
    result = await use_case.execute(GetProfileQuery(user_id=current_user_id))
    if result.profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    profile = result.profile
    return UserProfileResponse(
        user_id=profile.user_id.value,
        name=profile.name,
        birthday=profile.birthday,
        photo_url=profile.photo_url,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.put("/me/profile", response_model=UserProfileResponse)
async def upsert_my_profile(
    payload: UserProfileUpdateRequest,
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyUsersUnitOfWork = Depends(get_users_uow),
) -> UserProfileResponse:
    use_case = UpsertProfileUseCase(uow=uow)
    result = await use_case.execute(
        UpsertProfileCommand(
            user_id=current_user_id,
            name=payload.name,
            birthday=payload.birthday,
            photo_url=payload.photo_url,
        )
    )
    profile = result.profile
    return UserProfileResponse(
        user_id=profile.user_id.value,
        name=profile.name,
        birthday=profile.birthday,
        photo_url=profile.photo_url,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )
