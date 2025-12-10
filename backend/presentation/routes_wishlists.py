from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from backend.application.wishlists.use_cases import (
    AddWishlistItemCommand,
    AddWishlistItemUseCase,
    CreateWishlistCommand,
    CreateWishlistUseCase,
    DeleteWishlistCommand,
    DeleteWishlistItemCommand,
    DeleteWishlistItemUseCase,
    DeleteWishlistUseCase,
    ListUserWishlistsQuery,
    ListUserWishlistsUseCase,
    UpdateWishlistCommand,
    UpdateWishlistItemCommand,
    UpdateWishlistItemUseCase,
    UpdateWishlistUseCase,
)
from backend.domain.users.entities import UserId
from backend.domain.wishlists.entities import WishlistId, WishlistItemId
from backend.infrastructure.repositories.wishlists import SqlAlchemyWishlistsUnitOfWork
from backend.presentation.dependencies import  get_current_user_id,get_wishlists_uow
from backend.presentation.schemas import (
    WishlistCreateRequest,
    WishlistItemRequest,
    WishlistItemResponse,
    WishlistResponse,
    WishlistUpdateRequest,
)

router = APIRouter(prefix="/api/wishlists", tags=["wishlists"])


def _wishlist_to_response(wishlist) -> WishlistResponse:
    return WishlistResponse(
        id=wishlist.id.value,
        owner_id=wishlist.owner_id.value,
        name=wishlist.name,
        description=wishlist.description,
        visibility=wishlist.visibility,
        items=[
            WishlistItemResponse(
                id=item.id.value,
                wishlist_id=item.wishlist_id.value,
                title=item.title,
                description=item.description,
                link=item.link,
                priority=item.priority,
                created_at=item.created_at,
                updated_at=item.updated_at,
            )
            for item in wishlist.items
        ],
        created_at=wishlist.created_at,
        updated_at=wishlist.updated_at,
    )


@router.post("", response_model=WishlistResponse, status_code=status.HTTP_201_CREATED)
async def create_wishlist(
    payload: WishlistCreateRequest,
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow)
) -> WishlistResponse:
    use_case = CreateWishlistUseCase(uow=uow)
    result = await use_case.execute(
        CreateWishlistCommand(
            owner_id=current_user_id,
            name=payload.name,
            description=payload.description,
            visibility=payload.visibility,
        )
    )
    return _wishlist_to_response(result.wishlist)


@router.get("", response_model=list[WishlistResponse])
async def list_my_wishlists(
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow)
) -> list[WishlistResponse]:
    use_case = ListUserWishlistsUseCase(uow=uow)
    result = await use_case.execute(ListUserWishlistsQuery(owner_id=current_user_id))
    return [_wishlist_to_response(w) for w in result.wishlists]


@router.put("/{wishlist_id}", response_model=WishlistResponse)
async def update_wishlist(
    wishlist_id: UUID,
    payload: WishlistUpdateRequest,
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow)
) -> WishlistResponse:
    use_case = UpdateWishlistUseCase(uow=uow)
    wid = WishlistId(value=wishlist_id)
    try:
        result = await use_case.execute(
            UpdateWishlistCommand(
                wishlist_id=wid,
                name=payload.name,
                description=payload.description,
                visibility=payload.visibility,
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    return _wishlist_to_response(result.wishlist)


@router.delete("/{wishlist_id}", status_code=status.HTTP_200_OK)
async def delete_wishlist(
    wishlist_id: UUID,
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow)
) -> None:
    use_case = DeleteWishlistUseCase(uow=uow)
    await use_case.execute(DeleteWishlistCommand(wishlist_id=WishlistId(value=wishlist_id)))


@router.post("/{wishlist_id}/items", response_model=WishlistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_item(
    wishlist_id: UUID,
    payload: WishlistItemRequest,
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow)
) -> WishlistItemResponse:
    use_case = AddWishlistItemUseCase(uow=uow)
    try:
        result = await use_case.execute(
            AddWishlistItemCommand(
                wishlist_id=WishlistId(value=wishlist_id),
                title=payload.title,
                description=payload.description,
                link=payload.link,
                priority=payload.priority,
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e

    item = result.item
    return WishlistItemResponse(
        id=item.id.value,
        wishlist_id=item.wishlist_id.value,
        title=item.title,
        description=item.description,
        link=item.link,
        priority=item.priority,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.put("/items/{item_id}", response_model=WishlistItemResponse)
async def update_item(
    item_id: UUID,
    payload: WishlistItemRequest,
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow)
) -> WishlistItemResponse:
    use_case = UpdateWishlistItemUseCase(uow=uow)
    try:
        result = await use_case.execute(
            UpdateWishlistItemCommand(
                item_id=WishlistItemId(value=item_id),
                title=payload.title,
                description=payload.description,
                link=payload.link,
                priority=payload.priority,
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e

    item = result.item
    return WishlistItemResponse(
        id=item.id.value,
        wishlist_id=item.wishlist_id.value,
        title=item.title,
        description=item.description,
        link=item.link,
        priority=item.priority,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.delete("/items/{item_id}", status_code=status.HTTP_200_OK)
async def delete_item(
    item_id: UUID,
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow)
) -> None:
    use_case = DeleteWishlistItemUseCase(uow=uow)
    await use_case.execute(DeleteWishlistItemCommand(item_id=WishlistItemId(value=item_id)))
