from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from backend.domain.wishlists.entities import WishlistVisibility


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserProfileResponse(BaseModel):
    user_id: UUID
    name: str
    birthday: Optional[date] = None
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class UserProfileUpdateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    birthday: Optional[date] = None
    photo_url: Optional[str] = None


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class WishlistItemRequest(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    link: Optional[str] = None
    priority: Optional[int] = Field(default=None, ge=1)
    is_received: Optional[bool] = None
    received_note: Optional[str] = None


class WishlistItemResponse(BaseModel):
    id: UUID
    wishlist_id: UUID
    title: str
    description: Optional[str] = None
    link: Optional[str] = None
    priority: Optional[int] = None
    is_received: bool = False
    received_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class WishlistCreateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    visibility: WishlistVisibility = WishlistVisibility.PRIVATE


class WishlistUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = None
    visibility: Optional[WishlistVisibility] = None


class WishlistResponse(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    description: Optional[str] = None
    visibility: WishlistVisibility
    items: list[WishlistItemResponse] = []
    created_at: datetime
    updated_at: datetime


class PublicShareCreateRequest(BaseModel):
    is_claimable: bool = False


class PublicShareResponse(BaseModel):
    wishlist_id: UUID
    token: str
    is_claimable: bool
    created_at: datetime
    expires_at: Optional[datetime] = None


class PublicWishlistResponse(BaseModel):
    wishlist: Optional[WishlistResponse]
    share: Optional[PublicShareResponse]
    owner_name: Optional[str] = None
