import { apiClient } from './client';
import type { UserRead } from '../../types/user';

export async function login(email: string, password: string): Promise<void> {
  await apiClient.post('/auth/login', { email, password });
}

export async function register(email: string, password: string): Promise<void> {
  await apiClient.post('/auth/register', { email, password });
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function refreshToken(): Promise<void> {
  await apiClient.post('/auth/refresh');
}

export async function getMe(): Promise<UserRead> {
  const { data } = await apiClient.get<UserRead>('/users/me');
  return data;
}
