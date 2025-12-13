import axios from 'axios';
import type { TokenResponse, UserResponse } from '../../shared/types/api';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>('/api/auth/login', payload);
  return res.data;
}

export async function signUp(payload: SignUpPayload): Promise<UserResponse> {
  const res = await api.post<UserResponse>('/api/auth/signup', payload);
  return res.data;
}
