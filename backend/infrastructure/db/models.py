from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID as UUID_TYPE, uuid4

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .session import Base
from backend.domain.wishlists.entities import WishlistVisibility


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[UUID_TYPE] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    profile: Mapped["UserProfileModel"] = relationship(back_populates="user", uselist=False)
    wishlists: Mapped[list["WishlistModel"]] = relationship(back_populates="owner")


class UserProfileModel(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[UUID_TYPE] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    birthday: Mapped[date | None] = mapped_column(Date, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    user: Mapped[UserModel] = relationship(back_populates="profile")


class WishlistModel(Base):
    __tablename__ = "wishlists"

    id: Mapped[UUID_TYPE] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    owner_id: Mapped[UUID_TYPE] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    visibility: Mapped[WishlistVisibility] = mapped_column(
        Enum(WishlistVisibility, name="wishlist_visibility"), nullable=False, default=WishlistVisibility.PRIVATE
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    owner: Mapped[UserModel] = relationship(back_populates="wishlists")
    items: Mapped[list["WishlistItemModel"]] = relationship(back_populates="wishlist", cascade="all, delete-orphan")
    share: Mapped[Optional["PublicWishlistShareModel"]] = relationship(
        back_populates="wishlist", uselist=False, cascade="all, delete-orphan"
    )


class WishlistItemModel(Base):
    __tablename__ = "wishlist_items"

    id: Mapped[UUID_TYPE] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    wishlist_id: Mapped[UUID_TYPE] = mapped_column(UUID(as_uuid=True), ForeignKey("wishlists.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    link: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    priority: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_received: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    received_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    wishlist: Mapped[WishlistModel] = relationship(back_populates="items")


class PublicWishlistShareModel(Base):
    __tablename__ = "public_wishlist_shares"

    wishlist_id: Mapped[UUID_TYPE] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wishlists.id"), primary_key=True
    )
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    is_claimable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    wishlist: Mapped[WishlistModel] = relationship(back_populates="share")
