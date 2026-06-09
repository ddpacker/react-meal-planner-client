import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { API_BASE_URL, mockUser } from '../../../__mocks__/authHandlers';
import { server } from '../../../__mocks__/server';
import {
  deleteMe,
  fetchMe,
  fetchPreferences,
  updateMe,
  updatePreferences,
} from '../../../lib/api/user';

describe('user API', () => {
  it('fetchMe returns the current user', async () => {
    server.use(
      http.get(`${API_BASE_URL}/users/me`, () => HttpResponse.json(mockUser)),
    );

    const user = await fetchMe();
    expect(user).toEqual(mockUser);
  });

  it('updateMe patches /users/me with the request body', async () => {
    let body: unknown;
    const updatedUser = { ...mockUser, email: 'new@example.com' };
    server.use(
      http.patch(`${API_BASE_URL}/users/me`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(updatedUser);
      }),
    );

    const user = await updateMe({
      email: 'new@example.com',
      current_password: 'secret',
    });
    expect(body).toEqual({ email: 'new@example.com', current_password: 'secret' });
    expect(user).toEqual(updatedUser);
  });

  it('deleteMe sends password in DELETE body', async () => {
    let body: unknown;
    server.use(
      http.delete(`${API_BASE_URL}/users/me`, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await deleteMe('secret');
    expect(body).toEqual({ password: 'secret' });
  });

  it('fetchPreferences returns unit_system', async () => {
    server.use(
      http.get(`${API_BASE_URL}/users/me/preferences`, () =>
        HttpResponse.json({ unit_system: 'metric' }),
      ),
    );

    const preferences = await fetchPreferences();
    expect(preferences).toEqual({ unit_system: 'metric' });
  });

  it('updatePreferences patches /users/me/preferences', async () => {
    let body: unknown;
    server.use(
      http.patch(`${API_BASE_URL}/users/me/preferences`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ unit_system: 'imperial' });
      }),
    );

    const preferences = await updatePreferences({ unit_system: 'imperial' });
    expect(body).toEqual({ unit_system: 'imperial' });
    expect(preferences).toEqual({ unit_system: 'imperial' });
  });
});
