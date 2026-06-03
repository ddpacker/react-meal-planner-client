import { http, HttpResponse } from 'msw';
import type { UserRead } from '../types/user';
import { server } from './server';

export const API_BASE_URL = 'http://localhost:8000';

export const mockUser: UserRead = {
  id: 1,
  email: 'user@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

export function applyUnauthenticatedSessionHandlers(): void {
  server.use(
    http.get(`${API_BASE_URL}/users/me`, () =>
      HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
    ),
    http.post(`${API_BASE_URL}/auth/refresh`, () =>
      HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
    ),
  );
}

export function applyAuthenticatedSessionHandlers(
  user: UserRead = mockUser,
): void {
  server.use(
    http.get(`${API_BASE_URL}/users/me`, () => HttpResponse.json(user)),
  );
}

export function applyLoginSuccessHandlers(user: UserRead = mockUser): void {
  server.use(
    http.post(`${API_BASE_URL}/auth/login`, () =>
      HttpResponse.json({ access_token: 'test-access-token', token_type: 'bearer' }),
    ),
    http.get(`${API_BASE_URL}/users/me`, () => HttpResponse.json(user)),
  );
}

export function applyLoginFailureHandlers(): void {
  server.use(
    http.post(`${API_BASE_URL}/auth/login`, () =>
      HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 }),
    ),
  );
}

export function applyRegisterSuccessHandlers(user: UserRead): void {
  server.use(
    http.post(`${API_BASE_URL}/auth/register`, () => new HttpResponse(null, { status: 201 })),
    http.post(`${API_BASE_URL}/auth/login`, () =>
      HttpResponse.json({ access_token: 'test-access-token', token_type: 'bearer' }),
    ),
    http.get(`${API_BASE_URL}/users/me`, () => HttpResponse.json(user)),
  );
}

export function applyRegisterConflictHandlers(): void {
  server.use(
    http.post(`${API_BASE_URL}/auth/register`, () =>
      HttpResponse.json({ detail: 'Email already registered' }, { status: 409 }),
    ),
  );
}

export function applyRefreshSuccessHandlers(): void {
  server.use(
    http.post(`${API_BASE_URL}/auth/refresh`, () => HttpResponse.json(null, { status: 200 })),
  );
}

export function applyRefreshFailureHandlers(): void {
  server.use(
    http.post(`${API_BASE_URL}/auth/refresh`, () =>
      HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
    ),
  );
}
