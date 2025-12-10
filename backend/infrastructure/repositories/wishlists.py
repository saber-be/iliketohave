from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
from backend.domain.wishlists.repositories import (
    PublicWishlistShareRepository,
    UnitOfWork as WishlistsUnitOfWork,
    WishlistItemRepository,
    WishlistRepository,
)
from backend.infrastructure.db.models import (
    PublicWishlistShareModel,
    WishlistItemModel,
    WishlistModel,
)


def _wishlist_from_model(model: WishlistModel, items: Optional[list[WishlistItemModel]] = None) -> Wishlist:
    wishlist = Wishlist(
        id=WishlistId(value=model.id),
        owner_id=UserId(value=model.owner_id),
        name=model.name,
        description=model.description,
        visibility=model.visibility,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )

    if items is not None:
        wishlist.items = [
            WishlistItem(
                id=WishlistItemId(value=i.id),
                wishlist_id=WishlistId(value=i.wishlist_id),
                title=i.title,
                description=i.description,
                link=i.link,
                priority=i.priority,
                is_received=i.is_received,
                received_note=i.received_note,
                created_at=i.created_at,
                updated_at=i.updated_at,
            )
            for i in items
        ]
    return wishlist


def _wishlist_to_model(wishlist: Wishlist, model: Optional[WishlistModel] = None) -> WishlistModel:
    if model is None:
        model = WishlistModel(id=wishlist.id.value)
    model.owner_id = wishlist.owner_id.value
    model.name = wishlist.name
    model.description = wishlist.description
    model.visibility = wishlist.visibility
    model.created_at = wishlist.created_at
    model.updated_at = wishlist.updated_at
    return model


def _item_from_model(model: WishlistItemModel) -> WishlistItem:
    return WishlistItem(
        id=WishlistItemId(value=model.id),
        wishlist_id=WishlistId(value=model.wishlist_id),
        title=model.title,
        description=model.description,
        link=model.link,
        priority=model.priority,
        is_received=model.is_received,
        received_note=model.received_note,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def _item_to_model(item: WishlistItem, model: Optional[WishlistItemModel] = None) -> WishlistItemModel:
    if model is None:
        model = WishlistItemModel(id=item.id.value, wishlist_id=item.wishlist_id.value)
    model.title = item.title
    model.description = item.description
    model.link = item.link
    model.priority = item.priority
    model.is_received = item.is_received
    model.received_note = item.received_note
    model.created_at = item.created_at
    model.updated_at = item.updated_at
    return model


def _share_from_model(model: PublicWishlistShareModel) -> PublicWishlistShare:
    return PublicWishlistShare(
        wishlist_id=WishlistId(value=model.wishlist_id),
        token=PublicShareToken(model.token),
        is_claimable=model.is_claimable,
        created_at=model.created_at,
        expires_at=model.expires_at,
    )


def _share_to_model(share: PublicWishlistShare, model: Optional[PublicWishlistShareModel] = None) -> PublicWishlistShareModel:
    if model is None:
        model = PublicWishlistShareModel(wishlist_id=share.wishlist_id.value)
    model.token = share.token.value
    model.is_claimable = share.is_claimable
    model.created_at = share.created_at
    model.expires_at = share.expires_at
    return model


class SqlAlchemyWishlistRepository(WishlistRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, wishlist_id: WishlistId) -> Optional[Wishlist]:
        stmt = select(WishlistModel).where(WishlistModel.id == wishlist_id.value)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return None
        # Load items for aggregate
        items_stmt = select(WishlistItemModel).where(WishlistItemModel.wishlist_id == model.id)
        items_result = await self._session.execute(items_stmt)
        items = list(items_result.scalars().all())
        return _wishlist_from_model(model, items)

    async def list_by_owner(self, owner_id: UserId) -> List[Wishlist]:
        stmt = select(WishlistModel).where(WishlistModel.owner_id == owner_id.value)
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        wishlists: list[Wishlist] = []
        for model in models:
            items_stmt = select(WishlistItemModel).where(WishlistItemModel.wishlist_id == model.id)
            items_result = await self._session.execute(items_stmt)
            items = list(items_result.scalars().all())
            wishlists.append(_wishlist_from_model(model, items))
        return wishlists

    async def add(self, wishlist: Wishlist) -> None:
        model = _wishlist_to_model(wishlist)
        self._session.add(model)

    async def update(self, wishlist: Wishlist) -> None:
        stmt = select(WishlistModel).where(WishlistModel.id == wishlist.id.value)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            model = WishlistModel(id=wishlist.id.value)
            self._session.add(model)
        _wishlist_to_model(wishlist, model)

    async def delete(self, wishlist_id: WishlistId) -> None:
        stmt = select(WishlistModel).where(WishlistModel.id == wishlist_id.value)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is not None:
            await self._session.delete(model)


class SqlAlchemyWishlistItemRepository(WishlistItemRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, item_id: WishlistItemId) -> Optional[WishlistItem]:
        stmt = select(WishlistItemModel).where(WishlistItemModel.id == item_id.value)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return _item_from_model(model) if model else None

    async def list_by_wishlist(self, wishlist_id: WishlistId) -> List[WishlistItem]:
        stmt = select(WishlistItemModel).where(WishlistItemModel.wishlist_id == wishlist_id.value)
        result = await self._session.execute(stmt)
        return [
            _item_from_model(model)
            for model in result.scalars().all()
        ]

    async def add(self, item: WishlistItem) -> None:
        model = _item_to_model(item)
        self._session.add(model)

    async def update(self, item: WishlistItem) -> None:
        stmt = select(WishlistItemModel).where(WishlistItemModel.id == item.id.value)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            model = WishlistItemModel(id=item.id.value, wishlist_id=item.wishlist_id.value)
            self._session.add(model)
        _item_to_model(item, model)

    async def delete(self, item_id: WishlistItemId) -> None:
        stmt = select(WishlistItemModel).where(WishlistItemModel.id == item_id.value)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is not None:
            await self._session.delete(model)


class SqlAlchemyPublicWishlistShareRepository(PublicWishlistShareRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_token(self, token: PublicShareToken) -> Optional[PublicWishlistShare]:
        stmt = select(PublicWishlistShareModel).where(PublicWishlistShareModel.token == token.value)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return _share_from_model(model) if model else None

    async def get_by_wishlist_id(self, wishlist_id: WishlistId) -> Optional[PublicWishlistShare]:
        stmt = select(PublicWishlistShareModel).where(PublicWishlistShareModel.wishlist_id == wishlist_id.value)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return _share_from_model(model) if model else None

    async def add(self, share: PublicWishlistShare) -> None:
        model = _share_to_model(share)
        self._session.add(model)

    async def update(self, share: PublicWishlistShare) -> None:
        stmt = select(PublicWishlistShareModel).where(
            PublicWishlistShareModel.wishlist_id == share.wishlist_id.value
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            model = PublicWishlistShareModel(wishlist_id=share.wishlist_id.value)
            self._session.add(model)
        _share_to_model(share, model)

    async def delete(self, wishlist_id: WishlistId) -> None:
        stmt = select(PublicWishlistShareModel).where(PublicWishlistShareModel.wishlist_id == wishlist_id.value)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is not None:
            await self._session.delete(model)


class SqlAlchemyWishlistsUnitOfWork(WishlistsUnitOfWork):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self.wishlists = SqlAlchemyWishlistRepository(session)
        self.items = SqlAlchemyWishlistItemRepository(session)
        self.shares = SqlAlchemyPublicWishlistShareRepository(session)

    async def __aenter__(self) -> "SqlAlchemyWishlistsUnitOfWork":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        if exc is not None:
            await self.rollback()
        else:
            await self.commit()

    async def commit(self) -> None:
        await self._session.commit()

    async def rollback(self) -> None:
        await self._session.rollback()
