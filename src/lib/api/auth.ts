import { apiClient, clearAccessToken } from './client';
import { setAccessToken } from './accessToken';
import { usesBearerTokenAuth } from './authMode';

type TokenResponse = {
  access_token?: string;
};

function storeTokenFromResponse(data: TokenResponse | null | undefined): void {
  if (!usesBearerTokenAuth()) {
    return;
  }
  if (data?.access_token) {
    setAccessToken(data.access_token);
  }
}

export async function login(email: string, password: string): Promise<void> {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', { email, password });
  storeTokenFromResponse(data);
}

export async function register(email: string, password: string): Promise<void> {
  const { data } = await apiClient.post<TokenResponse>('/auth/register', { email, password });
  storeTokenFromResponse(data);
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
  clearAccessToken();
}

export async function refreshToken(): Promise<void> {
  const { data } = await apiClient.post<TokenResponse>('/auth/refresh');
  storeTokenFromResponse(data);
}
