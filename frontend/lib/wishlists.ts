import { api } from './api';
import type {
  PublicWishlistResponse,
  UserProfileResponse,
  UserProfileUpdateRequest,
  WishlistItemResponse,
  WishlistResponse,
  WishlistItemCommentResponse,
} from '../../shared/types/api';
import { getToken } from './auth-storage';

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchProfile(): Promise<UserProfileResponse | null> {
  const res = await api.get<UserProfileResponse>('/api/users/me/profile', {
    headers: authHeaders(),
    validateStatus: (s) => s === 200 || s === 404,
  });
  if (res.status === 404) return null;
  return res.data;
}

export async function upsertProfile(payload: UserProfileUpdateRequest): Promise<UserProfileResponse> {
  const res = await api.put<UserProfileResponse>('/api/users/me/profile', payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function fetchMyWishlists(): Promise<WishlistResponse[]> {
  const res = await api.get<WishlistResponse[]>('/api/wishlists', {
    headers: authHeaders(),
  });
  return res.data;
}

export async function createWishlist(payload: {
  name: string;
  description?: string | null;
  visibility?: 'private' | 'public';
}): Promise<WishlistResponse> {
  const res = await api.post<WishlistResponse>('/api/wishlists', payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function fetchWishlist(id: string): Promise<WishlistResponse> {
  const res = await api.get<WishlistResponse>(`/api/wishlists/${id}`, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function addWishlistItem(wishlistId: string, payload: {
  title: string;
  description?: string | null;
  link?: string | null;
  priority?: number | null;
}): Promise<WishlistItemResponse> {
  const res = await api.post<WishlistItemResponse>(`/api/wishlists/${wishlistId}/items`, payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function updateWishlistItem(itemId: string, payload: {
  title: string;
  description?: string | null;
  link?: string | null;
  priority?: number | null;
  is_received?: boolean;
  received_note?: string | null;
}): Promise<WishlistItemResponse> {
  const res = await api.put<WishlistItemResponse>(`/api/wishlists/items/${itemId}`, payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function deleteWishlistItem(itemId: string): Promise<void> {
  await api.delete(`/api/wishlists/items/${itemId}`, {
    headers: authHeaders(),
  });
}

export async function fetchPublicWishlist(token: string): Promise<PublicWishlistResponse> {
  const res = await api.get<PublicWishlistResponse>(`/api/public/${token}`);
  return res.data;
}

export async function fetchPublicWishlistComments(token: string): Promise<WishlistItemCommentResponse[]> {
  const res = await api.get<WishlistItemCommentResponse[]>(`/api/public/${token}/comments`);
  return res.data;
}

export async function createPublicItemComment(itemId: string, payload: { content: string }): Promise<WishlistItemCommentResponse> {
  const res = await api.post<WishlistItemCommentResponse>(`/api/public/items/${itemId}/comments`, payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function createPublicCommentReply(commentId: string, payload: { content: string }): Promise<WishlistItemCommentResponse> {
  const res = await api.post<WishlistItemCommentResponse>(`/api/public/comments/${commentId}/replies`, payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function createShare(wishlistId: string, payload: { is_claimable: boolean }) {
  const res = await api.post(`/api/public/wishlists/${wishlistId}/share`, payload, {
    headers: authHeaders(),
  });
  return res.data;
}
