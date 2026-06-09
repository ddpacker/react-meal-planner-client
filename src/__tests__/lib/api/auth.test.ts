import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { API_BASE_URL, mockUser } from '../../../__mocks__/authHandlers';
import { server } from '../../../__mocks__/server';
import { login, logout, refreshToken, register } from '../../../lib/api/auth';
import { fetchMe } from '../../../lib/api/user';
import { setAccessToken } from '../../../lib/api/client';

describe('auth API', () => {
  it('login posts email and password', async () => {
    let body: unknown;
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await login('user@example.com', 'secret');
    expect(body).toEqual({ email: 'user@example.com', password: 'secret' });
  });

  it('login stores access_token from response', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () =>
        HttpResponse.json({ access_token: 'my-token', token_type: 'bearer' }),
      ),
    );

    await login('user@example.com', 'secret');

    let authHeader: string | null = null;
    server.use(
      http.get(`${API_BASE_URL}/users/me`, ({ request }) => {
        authHeader = request.headers.get('Authorization');
        return HttpResponse.json(mockUser);
      }),
    );
    await fetchMe();
    expect(authHeader).toBe('Bearer my-token');
  });

  it('logout clears the stored access token', async () => {
    setAccessToken('some-token');
    server.use(
      http.post(`${API_BASE_URL}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
    );

    await logout();

    let authHeader: string | null = null;
    server.use(
      http.get(`${API_BASE_URL}/users/me`, ({ request }) => {
        authHeader = request.headers.get('Authorization');
        return HttpResponse.json(mockUser);
      }),
    );
    await fetchMe();
    expect(authHeader).toBeNull();
  });

  it('register posts email and password', async () => {
    let body: unknown;
    server.use(
      http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 201 });
      }),
    );

    await register('new@example.com', 'secret');
    expect(body).toEqual({ email: 'new@example.com', password: 'secret' });
  });

  it('register stores access_token from response', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/register`, () =>
        HttpResponse.json({ access_token: 'register-token', token_type: 'bearer' }, { status: 201 }),
      ),
    );

    await register('new@example.com', 'secret');

    let authHeader: string | null = null;
    server.use(
      http.get(`${API_BASE_URL}/users/me`, ({ request }) => {
        authHeader = request.headers.get('Authorization');
        return HttpResponse.json(mockUser);
      }),
    );
    await fetchMe();
    expect(authHeader).toBe('Bearer register-token');
  });

  it('logout posts to /auth/logout', async () => {
    let called = false;
    server.use(
      http.post(`${API_BASE_URL}/auth/logout`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await logout();
    expect(called).toBe(true);
  });

  it('refreshToken stores access_token from response', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/refresh`, () =>
        HttpResponse.json({ access_token: 'refreshed-token', token_type: 'bearer' }),
      ),
    );

    await refreshToken();

    let authHeader: string | null = null;
    server.use(
      http.get(`${API_BASE_URL}/users/me`, ({ request }) => {
        authHeader = request.headers.get('Authorization');
        return HttpResponse.json(mockUser);
      }),
    );
    await fetchMe();
    expect(authHeader).toBe('Bearer refreshed-token');
  });
});
