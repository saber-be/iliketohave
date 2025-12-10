from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from backend.application.wishlists.use_cases import (
    ClaimWishlistCommand,
    ClaimWishlistUseCase,
    CreatePublicShareCommand,
    CreatePublicShareUseCase,
    GetPublicWishlistQuery,
    GetPublicWishlistUseCase,
)
from backend.domain.users.entities import UserId
from backend.domain.wishlists.entities import WishlistId
from backend.infrastructure.repositories.wishlists import SqlAlchemyWishlistsUnitOfWork
from backend.presentation.dependencies import get_current_user_id,get_wishlists_uow
from backend.presentation.schemas import (
    PublicShareCreateRequest,
    PublicShareResponse,
    PublicWishlistResponse,
    WishlistResponse,
)

router = APIRouter(prefix="/api/public", tags=["public"])


def _wishlist_to_response(wishlist) -> WishlistResponse:
    from backend.presentation.routes_wishlists import _wishlist_to_response as base_conv

    return base_conv(wishlist)


@router.post("/wishlists/{wishlist_id}/share", response_model=PublicShareResponse)
async def create_or_update_share(
    wishlist_id: str,
    payload: PublicShareCreateRequest,
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow),
) -> PublicShareResponse:
    # Token is just the wishlist_id here for simplicity; could be random in infra
    use_case = CreatePublicShareUseCase(uow=uow)
    result = await use_case.execute(
        CreatePublicShareCommand(
            wishlist_id=WishlistId(value=wishlist_id),
            token=wishlist_id,
            is_claimable=payload.is_claimable,
        )
    )
    share = result.share
    return PublicShareResponse(
        wishlist_id=share.wishlist_id.value,
        token=share.token.value,
        is_claimable=share.is_claimable,
        created_at=share.created_at,
        expires_at=share.expires_at,
    )


@router.get("/{token}", response_model=PublicWishlistResponse)
async def get_public_wishlist(
    token: str,
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow),
) -> PublicWishlistResponse:
    use_case = GetPublicWishlistUseCase(uow=uow)
    result = await use_case.execute(GetPublicWishlistQuery(token=token))
    if result.wishlist is None or result.share is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Public wishlist not found")

    return PublicWishlistResponse(
        wishlist=_wishlist_to_response(result.wishlist),
        share=PublicShareResponse(
            wishlist_id=result.share.wishlist_id.value,
            token=result.share.token.value,
            is_claimable=result.share.is_claimable,
            created_at=result.share.created_at,
            expires_at=result.share.expires_at,
        ),
    )


@router.post("/{token}/claim", response_model=WishlistResponse)
async def claim_wishlist(
    token: str,
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow),
) -> WishlistResponse:
    use_case = ClaimWishlistUseCase(uow=uow)
    result = await use_case.execute(
        ClaimWishlistCommand(
            token=token,
            new_owner_id=current_user_id,
        )
    )
    if result.wishlist is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot claim this wishlist")
    return _wishlist_to_response(result.wishlist)
