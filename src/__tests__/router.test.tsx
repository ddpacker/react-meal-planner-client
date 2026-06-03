import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../__mocks__/server';
import { createAppRoutes } from '../router';
import { createTestQueryClient } from './utils';

const baseURL = 'http://localhost:8000';

function renderApp(path: string) {
  const queryClient = createTestQueryClient();
  const memoryRouter = createMemoryRouter(createAppRoutes(), { initialEntries: [path] });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={memoryRouter} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
});

function useUnauthenticatedSessionHandlers() {
  server.use(
    http.get(`${baseURL}/users/me`, () =>
      HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
    ),
    http.post(`${baseURL}/auth/refresh`, () =>
      HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
    ),
  );
}

describe('router', () => {
  it('renders the login page at /login', async () => {
    useUnauthenticatedSessionHandlers();
    renderApp('/login');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated users from / to /login', async () => {
    useUnauthenticatedSessionHandlers();
    renderApp('/');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('renders meal plans when /users/me succeeds', async () => {
    server.use(
      http.get(`${baseURL}/users/me`, () =>
        HttpResponse.json({
          id: 1,
          email: 'user@example.com',
          created_at: '2024-01-01T00:00:00Z',
        }),
      ),
    );

    renderApp('/');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /meal plans/i })).toBeInTheDocument();
    });
  });
});
