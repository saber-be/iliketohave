from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4

from backend.domain.users.entities import UserId


@dataclass(frozen=True, slots=True)
class WishlistId:
    value: UUID

    @staticmethod
    def new() -> "WishlistId":
        return WishlistId(value=uuid4())


@dataclass(frozen=True, slots=True)
class WishlistItemId:
    value: UUID

    @staticmethod
    def new() -> "WishlistItemId":
        return WishlistItemId(value=uuid4())


@dataclass(frozen=True, slots=True)
class WishlistItemCommentId:
    value: UUID

    @staticmethod
    def new() -> "WishlistItemCommentId":
        return WishlistItemCommentId(value=uuid4())


class WishlistVisibility(str, Enum):
    PRIVATE = "private"
    PUBLIC = "public"


@dataclass(slots=True)
class WishlistItem:
    id: WishlistItemId
    wishlist_id: WishlistId
    title: str
    description: Optional[str] = None
    link: Optional[str] = None
    priority: Optional[int] = None
    is_received: bool = False
    received_note: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def update(
        self,
        title: Optional[str] = None,
        description: Optional[str] = None,
        link: Optional[str] = None,
        priority: Optional[int] = None,
        is_received: Optional[bool] = None,
        received_note: Optional[str] = None,
    ) -> None:
        changed = False

        if title is not None and title != self.title:
            if not title.strip():
                raise ValueError("Title cannot be empty")
            self.title = title
            changed = True

        if description is not None and description != self.description:
            self.description = description
            changed = True

        if link is not None and link != self.link:
            self.link = link
            changed = True

        if priority is not None and priority != self.priority:
            if priority < 1:
                raise ValueError("Priority must be positive")
            self.priority = priority
            changed = True

        if is_received is not None and is_received != self.is_received:
            self.is_received = is_received
            changed = True

        if received_note is not None and received_note != self.received_note:
            self.received_note = received_note
            changed = True

        if changed:
            self.updated_at = datetime.utcnow()


@dataclass(slots=True)
class WishlistItemComment:
    id: WishlistItemCommentId
    item_id: WishlistItemId
    user_id: UserId
    parent_id: Optional[WishlistItemCommentId] = None
    content: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def update_content(self, content: str) -> None:
        if not content.strip():
            raise ValueError("Content cannot be empty")
        if content == self.content:
            return
        self.content = content
        self.updated_at = datetime.utcnow()


@dataclass(slots=True)
class Wishlist:
    id: WishlistId
    owner_id: UserId
    name: str
    description: Optional[str] = None
    visibility: WishlistVisibility = WishlistVisibility.PRIVATE
    items: List[WishlistItem] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def rename(self, name: str) -> None:
        if not name.strip():
            raise ValueError("Name cannot be empty")
        if name == self.name:
            return
        self.name = name
        self.updated_at = datetime.utcnow()

    def change_description(self, description: Optional[str]) -> None:
        if description == self.description:
            return
        self.description = description
        self.updated_at = datetime.utcnow()

    def set_visibility(self, visibility: WishlistVisibility) -> None:
        if visibility == self.visibility:
            return
        self.visibility = visibility
        self.updated_at = datetime.utcnow()

    def add_item(self, item: WishlistItem) -> None:
        self.items.append(item)
        self.updated_at = datetime.utcnow()

    def remove_item(self, item_id: WishlistItemId) -> None:
        before = len(self.items)
        self.items = [i for i in self.items if i.id != item_id]
        if len(self.items) != before:
            self.updated_at = datetime.utcnow()

    def get_item(self, item_id: WishlistItemId) -> Optional[WishlistItem]:
        for item in self.items:
            if item.id == item_id:
                return item
        return None


@dataclass(frozen=True, slots=True)
class PublicShareToken:
    value: str


@dataclass(slots=True)
class PublicWishlistShare:
    wishlist_id: WishlistId
    token: PublicShareToken
    is_claimable: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

    def is_active(self, now: Optional[datetime] = None) -> bool:
        now = now or datetime.utcnow()
        if self.expires_at is not None and now > self.expires_at:
            return False
        return True
