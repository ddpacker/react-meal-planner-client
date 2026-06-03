import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import {
  applyAuthenticatedSessionHandlers,
  applyUnauthenticatedSessionHandlers,
  mockUser,
} from '../__mocks__/authHandlers';
import { createAppRoutes } from '../router';
import { createTestQueryClient } from './utils';

function renderApp(path: string) {
  const queryClient = createTestQueryClient();
  const router = createMemoryRouter(createAppRoutes(), { initialEntries: [path] });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe('router', () => {
  it('renders the login page at /login', async () => {
    applyUnauthenticatedSessionHandlers();
    renderApp('/login');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated users from / to /login', async () => {
    applyUnauthenticatedSessionHandlers();
    renderApp('/');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('renders meal plans when /users/me succeeds', async () => {
    applyAuthenticatedSessionHandlers(mockUser);
    renderApp('/');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /meal plans/i })).toBeInTheDocument();
    });
  });
});
