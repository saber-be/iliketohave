export type UUID = string;

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_at: string; // ISO datetime
}

export interface UserResponse {
  id: UUID;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfileResponse {
  user_id: UUID;
  name: string;
  birthday?: string | null;
  photo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdateRequest {
  name: string;
  birthday?: string | null;
  photo_url?: string | null;
}

export type WishlistVisibility = 'private' | 'public';

export interface WishlistItemResponse {
  id: UUID;
  wishlist_id: UUID;
  title: string;
  description?: string | null;
  link?: string | null;
  priority?: number | null;
  is_received?: boolean;
  received_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WishlistResponse {
  id: UUID;
  owner_id: UUID;
  name: string;
  description?: string | null;
  visibility: WishlistVisibility;
  items: WishlistItemResponse[];
  created_at: string;
  updated_at: string;
}

export interface PublicShareResponse {
  wishlist_id: UUID;
  token: string;
  is_claimable: boolean;
  created_at: string;
  expires_at?: string | null;
}

export interface PublicWishlistResponse {
  wishlist: WishlistResponse | null;
  share: PublicShareResponse | null;
  owner_name?: string | null;
}
