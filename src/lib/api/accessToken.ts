import { usesBearerTokenAuth } from './authMode';

const STORAGE_KEY = 'meal_planner_access_token';

let _accessToken: string | null = null;

function canUseSessionStorage(): boolean {
  return usesBearerTokenAuth() && import.meta.env.MODE !== 'test';
}

function readStoredToken(): string | null {
  if (!canUseSessionStorage()) {
    return null;
  }
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (!usesBearerTokenAuth()) {
    return null;
  }
  return _accessToken;
}

export function setAccessToken(token: string): void {
  if (!usesBearerTokenAuth()) {
    return;
  }
  _accessToken = token;
  if (canUseSessionStorage()) {
    sessionStorage.setItem(STORAGE_KEY, token);
  }
}

export function clearAccessToken(): void {
  _accessToken = null;
  if (canUseSessionStorage()) {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

/** Restore a previously stored access token (bearer dev mode only). */
export function restoreAccessToken(): void {
  if (!usesBearerTokenAuth()) {
    return;
  }
  const stored = readStoredToken();
  if (stored) {
    _accessToken = stored;
  }
}

restoreAccessToken();
