import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__mocks__/server';
import { apiClient } from '../../../lib/api/client';

const baseURL = 'http://localhost:8000';

describe('apiClient 401 interceptor', () => {
  let refreshCallCount = 0;
  let assignSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    refreshCallCount = 0;
    assignSpy = vi.fn();
    vi.stubGlobal('location', {
      pathname: '/recipes',
      assign: assignSpy,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retries the original request after a successful refresh', async () => {
    let resourceCalls = 0;

    server.use(
      http.get(`${baseURL}/users/me`, () => {
        resourceCalls += 1;
        if (resourceCalls === 1) {
          return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
        }
        return HttpResponse.json({ id: 1, email: 'a@b.com' });
      }),
      http.post(`${baseURL}/auth/refresh`, () => HttpResponse.json(null, { status: 200 })),
    );

    const { data } = await apiClient.get('/users/me');
    expect(data).toEqual({ id: 1, email: 'a@b.com' });
    expect(resourceCalls).toBe(2);
  });

  it('sends only one refresh when concurrent requests receive 401', async () => {
    const callCounts = { me: 0, recipes: 0, refresh: 0 };

    server.use(
      http.get(`${baseURL}/users/me`, () => {
        callCounts.me += 1;
        if (callCounts.me === 1) {
          return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
        }
        return HttpResponse.json({ id: 1 });
      }),
      http.get(`${baseURL}/recipes`, () => {
        callCounts.recipes += 1;
        if (callCounts.recipes === 1) {
          return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
        }
        return HttpResponse.json([]);
      }),
      http.post(`${baseURL}/auth/refresh`, () => {
        callCounts.refresh += 1;
        return HttpResponse.json(null, { status: 200 });
      }),
    );

    const [me, recipes] = await Promise.all([
      apiClient.get('/users/me'),
      apiClient.get('/recipes'),
    ]);

    expect(me.data).toEqual({ id: 1 });
    expect(recipes.data).toEqual([]);
    expect(callCounts.refresh).toBe(1);
    expect(callCounts.me).toBe(2);
    expect(callCounts.recipes).toBe(2);
  });

  it('redirects to /login and rejects when refresh fails', async () => {
    server.use(
      http.get(`${baseURL}/users/me`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
      ),
      http.post(`${baseURL}/auth/refresh`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
      ),
    );

    await expect(apiClient.get('/users/me')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(assignSpy).toHaveBeenCalledWith('/login');
  });

  it('does not attempt refresh for auth endpoints', async () => {
    server.use(
      http.post(`${baseURL}/auth/login`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
      ),
      http.post(`${baseURL}/auth/refresh`, () => {
        refreshCallCount += 1;
        return HttpResponse.json(null, { status: 200 });
      }),
    );

    await expect(
      apiClient.post('/auth/login', { email: 'a@b.com', password: 'wrong' }),
    ).rejects.toMatchObject({ response: { status: 401 } });
    expect(refreshCallCount).toBe(0);
    expect(assignSpy).not.toHaveBeenCalled();
  });
});
