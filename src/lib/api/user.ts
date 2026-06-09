import { apiClient } from './client';
import type {
  UserPreferencesRead,
  UserPreferencesUpdate,
  UserRead,
  UserUpdate,
} from '../../types/user';

export async function fetchMe(): Promise<UserRead> {
  const { data } = await apiClient.get<UserRead>('/users/me');
  return data;
}

export async function updateMe(body: UserUpdate): Promise<UserRead> {
  const { data } = await apiClient.patch<UserRead>('/users/me', body);
  return data;
}

export async function deleteMe(password: string): Promise<void> {
  await apiClient.delete('/users/me', { data: { password } });
}

export async function fetchPreferences(): Promise<UserPreferencesRead> {
  const { data } = await apiClient.get<UserPreferencesRead>('/users/me/preferences');
  return data;
}

export async function updatePreferences(
  body: UserPreferencesUpdate,
): Promise<UserPreferencesRead> {
  const { data } = await apiClient.patch<UserPreferencesRead>(
    '/users/me/preferences',
    body,
  );
  return data;
}
