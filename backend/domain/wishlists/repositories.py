from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Optional, Protocol

from .entities import (
    PublicShareToken,
    PublicWishlistShare,
    Wishlist,
    WishlistId,
    WishlistItem,
    WishlistItemComment,
    WishlistItemCommentId,
    WishlistItemId,
)
from backend.domain.users.entities import UserId


class WishlistRepository(Protocol):
    async def get_by_id(self, wishlist_id: WishlistId) -> Optional[Wishlist]:
        ...

    async def list_by_owner(self, owner_id: UserId) -> List[Wishlist]:
        ...

    async def add(self, wishlist: Wishlist) -> None:
        ...

    async def update(self, wishlist: Wishlist) -> None:
        ...

    async def delete(self, wishlist_id: WishlistId) -> None:
        ...


class WishlistItemRepository(Protocol):
    async def get_by_id(self, item_id: WishlistItemId) -> Optional[WishlistItem]:
        ...

    async def list_by_wishlist(self, wishlist_id: WishlistId) -> List[WishlistItem]:
        ...

    async def add(self, item: WishlistItem) -> None:
        ...

    async def update(self, item: WishlistItem) -> None:
        ...

    async def delete(self, item_id: WishlistItemId) -> None:
        ...


class WishlistItemCommentRepository(Protocol):
    async def get_by_id(self, comment_id: WishlistItemCommentId) -> Optional[WishlistItemComment]:
        ...

    async def list_by_item_ids(self, item_ids: List[WishlistItemId]) -> List[WishlistItemComment]:
        ...

    async def add(self, comment: WishlistItemComment) -> None:
        ...

    async def delete(self, comment_id: WishlistItemCommentId) -> None:
        ...


class PublicWishlistShareRepository(Protocol):
    async def get_by_token(self, token: PublicShareToken) -> Optional[PublicWishlistShare]:
        ...

    async def get_by_wishlist_id(self, wishlist_id: WishlistId) -> Optional[PublicWishlistShare]:
        ...

    async def add(self, share: PublicWishlistShare) -> None:
        ...

    async def update(self, share: PublicWishlistShare) -> None:
        ...

    async def delete(self, wishlist_id: WishlistId) -> None:
        ...


class UnitOfWork(ABC):
    wishlists: WishlistRepository
    items: WishlistItemRepository
    shares: PublicWishlistShareRepository
    comments: WishlistItemCommentRepository

    @abstractmethod
    async def __aenter__(self) -> "UnitOfWork":
        ...

    @abstractmethod
    async def __aexit__(self, exc_type, exc, tb) -> None:
        ...

    @abstractmethod
    async def commit(self) -> None:
        ...

    @abstractmethod
    async def rollback(self) -> None:
        ...
