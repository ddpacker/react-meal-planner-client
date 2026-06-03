import { apiClient, clearAccessToken, setAccessToken } from './client';
import type { UserRead } from '../../types/user';

export async function login(email: string, password: string): Promise<void> {
  const { data } = await apiClient.post<{ access_token?: string } | null>('/auth/login', { email, password });
  if (data?.access_token) {
    setAccessToken(data.access_token);
  }
}

export async function register(email: string, password: string): Promise<void> {
  await apiClient.post('/auth/register', { email, password });
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
  clearAccessToken();
}

export async function refreshToken(): Promise<void> {
  await apiClient.post('/auth/refresh');
}

export async function getMe(): Promise<UserRead> {
  const { data } = await apiClient.get<UserRead>('/users/me');
  return data;
}
