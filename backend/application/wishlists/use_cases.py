from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from backend.domain.users.entities import UserId
from backend.domain.wishlists.entities import (
    PublicShareToken,
    PublicWishlistShare,
    Wishlist,
    WishlistId,
    WishlistItem,
    WishlistItemId,
    WishlistVisibility,
)
from backend.domain.wishlists.repositories import UnitOfWork as WishlistsUnitOfWork


# Wishlist CRUD


@dataclass(slots=True)
class CreateWishlistCommand:
    owner_id: UserId
    name: str
    description: Optional[str] = None
    visibility: WishlistVisibility = WishlistVisibility.PRIVATE


@dataclass(slots=True)
class CreateWishlistResult:
    wishlist: Wishlist


class CreateWishlistUseCase:
    def __init__(self, uow: WishlistsUnitOfWork) -> None:
        self._uow = uow

    async def execute(self, cmd: CreateWishlistCommand) -> CreateWishlistResult:
        wishlist = Wishlist(
            id=WishlistId.new(),
            owner_id=cmd.owner_id,
            name=cmd.name,
            description=cmd.description,
            visibility=cmd.visibility,
        )

        async with self._uow as uow:
            await uow.wishlists.add(wishlist)
            await uow.commit()

        return CreateWishlistResult(wishlist=wishlist)


@dataclass(slots=True)
class UpdateWishlistCommand:
    wishlist_id: WishlistId
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[WishlistVisibility] = None


@dataclass(slots=True)
class UpdateWishlistResult:
    wishlist: Wishlist


class UpdateWishlistUseCase:
    def __init__(self, uow: WishlistsUnitOfWork) -> None:
        self._uow = uow

    async def execute(self, cmd: UpdateWishlistCommand) -> UpdateWishlistResult:
        async with self._uow as uow:
            wishlist = await uow.wishlists.get_by_id(cmd.wishlist_id)
            if wishlist is None:
                raise ValueError("Wishlist not found")

            if cmd.name is not None:
                wishlist.rename(cmd.name)
            if cmd.description is not None:
                wishlist.change_description(cmd.description)
            if cmd.visibility is not None:
                wishlist.set_visibility(cmd.visibility)

            await uow.wishlists.update(wishlist)
            await uow.commit()

        return UpdateWishlistResult(wishlist=wishlist)


@dataclass(slots=True)
class DeleteWishlistCommand:
    wishlist_id: WishlistId


class DeleteWishlistUseCase:
    def __init__(self, uow: WishlistsUnitOfWork) -> None:
        self._uow = uow

    async def execute(self, cmd: DeleteWishlistCommand) -> None:
        async with self._uow as uow:
            await uow.wishlists.delete(cmd.wishlist_id)
            await uow.commit()


@dataclass(slots=True)
class ListUserWishlistsQuery:
    owner_id: UserId


@dataclass(slots=True)
class ListUserWishlistsResult:
    wishlists: List[Wishlist]


class ListUserWishlistsUseCase:
    def __init__(self, uow: WishlistsUnitOfWork) -> None:
        self._uow = uow

    async def execute(self, query: ListUserWishlistsQuery) -> ListUserWishlistsResult:
        async with self._uow as uow:
            wishlists = await uow.wishlists.list_by_owner(query.owner_id)
        return ListUserWishlistsResult(wishlists=wishlists)


@dataclass(slots=True)
class GetWishlistQuery:
    wishlist_id: WishlistId
    owner_id: UserId


@dataclass(slots=True)
class GetWishlistResult:
    wishlist: Wishlist


class GetWishlistUseCase:
    def __init__(self, uow: WishlistsUnitOfWork) -> None:
        self._uow = uow

    async def execute(self, query: GetWishlistQuery) -> GetWishlistResult:
        async with self._uow as uow:
            wishlist = await uow.wishlists.get_by_id(query.wishlist_id)
            if wishlist is None or wishlist.owner_id != query.owner_id:
                raise ValueError("Wishlist not found")

        return GetWishlistResult(wishlist=wishlist)


# Wishlist items


@dataclass(slots=True)
class AddWishlistItemCommand:
    wishlist_id: WishlistId
    title: str
    description: Optional[str] = None
    link: Optional[str] = None
    priority: Optional[int] = None
    is_received: Optional[bool] = None
    received_note: Optional[str] = None


@dataclass(slots=True)
class AddWishlistItemResult:
    item: WishlistItem


class AddWishlistItemUseCase:
    def __init__(self, uow: WishlistsUnitOfWork) -> None:
        self._uow = uow

    async def execute(self, cmd: AddWishlistItemCommand) -> AddWishlistItemResult:
        async with self._uow as uow:
            wishlist = await uow.wishlists.get_by_id(cmd.wishlist_id)
            if wishlist is None:
                raise ValueError("Wishlist not found")

            item = WishlistItem(
                id=WishlistItemId.new(),
                wishlist_id=wishlist.id,
                title=cmd.title,
                description=cmd.description,
                link=cmd.link,
                priority=cmd.priority,
                is_received=cmd.is_received or False,
                received_note=cmd.received_note,
            )
            wishlist.add_item(item)

            await uow.items.add(item)
            await uow.wishlists.update(wishlist)
            await uow.commit()

        return AddWishlistItemResult(item=item)


@dataclass(slots=True)
class UpdateWishlistItemCommand:
    item_id: WishlistItemId
    title: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None
    priority: Optional[int] = None
    is_received: Optional[bool] = None
    received_note: Optional[str] = None


@dataclass(slots=True)
class UpdateWishlistItemResult:
    item: WishlistItem


class UpdateWishlistItemUseCase:
    def __init__(self, uow: WishlistsUnitOfWork) -> None:
        self._uow = uow

    async def execute(self, cmd: UpdateWishlistItemCommand) -> UpdateWishlistItemResult:
        async with self._uow as uow:
            item = await uow.items.get_by_id(cmd.item_id)
            if item is None:
                raise ValueError("Item not found")

            wishlist = await uow.wishlists.get_by_id(item.wishlist_id)
            if wishlist is None:
                raise ValueError("Wishlist not found")

            item.update(
                title=cmd.title,
                description=cmd.description,
                link=cmd.link,
                priority=cmd.priority,
                is_received=cmd.is_received,
                received_note=cmd.received_note,
            )

            await uow.items.update(item)
            await uow.wishlists.update(wishlist)
            await uow.commit()

        return UpdateWishlistItemResult(item=item)


@dataclass(slots=True)
class DeleteWishlistItemCommand:
    item_id: WishlistItemId


class DeleteWishlistItemUseCase:
    def __init__(self, uow: WishlistsUnitOfWork) -> None:
        self._uow = uow

    async def execute(self, cmd: DeleteWishlistItemCommand) -> None:
        async with self._uow as uow:
            item = await uow.items.get_by_id(cmd.item_id)
            if item is None:
                return

            wishlist = await uow.wishlists.get_by_id(item.wishlist_id)
            if wishlist is not None:
                wishlist.remove_item(item.id)
                await uow.wishlists.update(wishlist)

            await uow.items.delete(item.id)
            await uow.commit()


# Public sharing / viewing / claiming


@dataclass(slots=True)
class CreatePublicShareCommand:
    wishlist_id: WishlistId
    token: str
    is_claimable: bool = False


@dataclass(slots=True)
class CreatePublicShareResult:
    share: PublicWishlistShare


class CreatePublicShareUseCase:
    def __init__(self, uow: WishlistsUnitOfWork) -> None:
        self._uow = uow

    async def execute(self, cmd: CreatePublicShareCommand) -> CreatePublicShareResult:
        async with self._uow as uow:
            wishlist = await uow.wishlists.get_by_id(cmd.wishlist_id)
            if wishlist is None:
                raise ValueError("Wishlist not found")

            existing = await uow.shares.get_by_wishlist_id(cmd.wishlist_id)
            if existing is not None:
                share = existing
                share.is_claimable = cmd.is_claimable
            else:
                share = PublicWishlistShare(
                    wishlist_id=cmd.wishlist_id,
                    token=PublicShareToken(cmd.token),
                    is_claimable=cmd.is_claimable,
                )
                await uow.shares.add(share)

            await uow.commit()

        return CreatePublicShareResult(share=share)


@dataclass(slots=True)
class GetPublicWishlistQuery:
    token: str


@dataclass(slots=True)
class GetPublicWishlistResult:
    wishlist: Optional[Wishlist]
    share: Optional[PublicWishlistShare]


class GetPublicWishlistUseCase:
    def __init__(self, uow: WishlistsUnitOfWork) -> None:
        self._uow = uow

    async def execute(self, query: GetPublicWishlistQuery) -> GetPublicWishlistResult:
        async with self._uow as uow:
            share = await uow.shares.get_by_token(PublicShareToken(query.token))
            if share is None or not share.is_active():
                return GetPublicWishlistResult(wishlist=None, share=None)

            wishlist = await uow.wishlists.get_by_id(share.wishlist_id)
        return GetPublicWishlistResult(wishlist=wishlist, share=share)


@dataclass(slots=True)
class ClaimWishlistCommand:
    token: str
    new_owner_id: UserId


@dataclass(slots=True)
class ClaimWishlistResult:
    wishlist: Optional[Wishlist]


class ClaimWishlistUseCase:
    def __init__(self, uow: WishlistsUnitOfWork) -> None:
        self._uow = uow

    async def execute(self, cmd: ClaimWishlistCommand) -> ClaimWishlistResult:
        async with self._uow as uow:
            share = await uow.shares.get_by_token(PublicShareToken(cmd.token))
            if share is None or not share.is_active() or not share.is_claimable:
                return ClaimWishlistResult(wishlist=None)

            original = await uow.wishlists.get_by_id(share.wishlist_id)
            if original is None:
                return ClaimWishlistResult(wishlist=None)

            cloned = Wishlist(
                id=WishlistId.new(),
                owner_id=cmd.new_owner_id,
                name=original.name,
                description=original.description,
                visibility=original.visibility,
            )

            # Items are cloned but without sharing identity
            for item in original.items:
                cloned_item = WishlistItem(
                    id=WishlistItemId.new(),
                    wishlist_id=cloned.id,
                    title=item.title,
                    description=item.description,
                    link=item.link,
                    priority=item.priority,
                )
                cloned.add_item(cloned_item)
                await uow.items.add(cloned_item)

            await uow.wishlists.add(cloned)
            await uow.commit()

        return ClaimWishlistResult(wishlist=cloned)
