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
from backend.domain.wishlists.entities import WishlistId, WishlistItemComment, WishlistItemCommentId, WishlistItemId
from backend.infrastructure.repositories.wishlists import SqlAlchemyWishlistsUnitOfWork
from backend.infrastructure.repositories.users import SqlAlchemyUsersUnitOfWork
from backend.presentation.dependencies import get_current_user_id, get_users_uow, get_wishlists_uow
from backend.presentation.schemas import (
    PublicShareCreateRequest,
    PublicShareResponse,
    PublicWishlistResponse,
    WishlistItemCommentCreateRequest,
    WishlistItemCommentResponse,
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
    users_uow: SqlAlchemyUsersUnitOfWork = Depends(get_users_uow),
) -> PublicWishlistResponse:
    use_case = GetPublicWishlistUseCase(uow=uow)
    result = await use_case.execute(GetPublicWishlistQuery(token=token))
    if result.wishlist is None or result.share is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Public wishlist not found")

    wishlist = result.wishlist

    # Try to resolve owner profile name for display; ignore errors and fall back to None
    owner_name: str | None = None
    try:
        async with users_uow as uuow:
            profile = await uuow.profiles.get_by_user_id(UserId(value=wishlist.owner_id.value))
            if profile is not None:
                owner_name = profile.name
    except Exception:
        owner_name = None

    return PublicWishlistResponse(
        wishlist=_wishlist_to_response(wishlist),
        share=PublicShareResponse(
            wishlist_id=result.share.wishlist_id.value,
            token=result.share.token.value,
            is_claimable=result.share.is_claimable,
            created_at=result.share.created_at,
            expires_at=result.share.expires_at,
        ),
        owner_name=owner_name,
    )


@router.get("/{token}/comments", response_model=list[WishlistItemCommentResponse])
async def list_public_wishlist_comments(
    token: str,
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow),
) -> list[WishlistItemCommentResponse]:
    use_case = GetPublicWishlistUseCase(uow=uow)
    result = await use_case.execute(GetPublicWishlistQuery(token=token))
    if result.wishlist is None or result.share is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Public wishlist not found")

    wishlist = result.wishlist
    item_ids = [item.id for item in wishlist.items]

    async with uow as wuow:
        comments = await wuow.comments.list_by_item_ids(item_ids)

    responses: list[WishlistItemCommentResponse] = []
    for c in comments:
        responses.append(
            WishlistItemCommentResponse(
                id=c.id.value,
                item_id=c.item_id.value,
                user_id=c.user_id.value,
                parent_id=c.parent_id.value if c.parent_id else None,
                content=c.content,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
        )
    return responses


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


@router.post("/items/{item_id}/comments", response_model=WishlistItemCommentResponse)
async def create_public_item_comment(
    item_id: str,
    payload: WishlistItemCommentCreateRequest,
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow),
) -> WishlistItemCommentResponse:
    async with uow as wuow:
        item = await wuow.items.get_by_id(WishlistItemId(value=item_id))
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

        share = await wuow.shares.get_by_wishlist_id(item.wishlist_id)
        if share is None or not share.is_active():  # type: ignore[attr-defined]
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Public wishlist not found")

        comment = WishlistItemComment(
            id=WishlistItemCommentId.new(),
            item_id=item.id,
            user_id=current_user_id,
            parent_id=None,
            content=payload.content,
        )
        await wuow.comments.add(comment)

    return WishlistItemCommentResponse(
        id=comment.id.value,
        item_id=comment.item_id.value,
        user_id=comment.user_id.value,
        parent_id=None,
        content=comment.content,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


@router.post("/comments/{comment_id}/replies", response_model=WishlistItemCommentResponse)
async def create_public_comment_reply(
    comment_id: str,
    payload: WishlistItemCommentCreateRequest,
    current_user_id: UserId = Depends(get_current_user_id),
    uow: SqlAlchemyWishlistsUnitOfWork = Depends(get_wishlists_uow),
) -> WishlistItemCommentResponse:
    async with uow as wuow:
        parent = await wuow.comments.get_by_id(WishlistItemCommentId(value=comment_id))
        if parent is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

        if parent.parent_id is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot reply to a reply")

        item = await wuow.items.get_by_id(parent.item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

        share = await wuow.shares.get_by_wishlist_id(item.wishlist_id)
        if share is None or not share.is_active():  # type: ignore[attr-defined]
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Public wishlist not found")

        reply = WishlistItemComment(
            id=WishlistItemCommentId.new(),
            item_id=parent.item_id,
            user_id=current_user_id,
            parent_id=parent.id,
            content=payload.content,
        )
        await wuow.comments.add(reply)

    return WishlistItemCommentResponse(
        id=reply.id.value,
        item_id=reply.item_id.value,
        user_id=reply.user_id.value,
        parent_id=reply.parent_id.value if reply.parent_id else None,
        content=reply.content,
        created_at=reply.created_at,
        updated_at=reply.updated_at,
    )
