import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../__mocks__/server';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { createTestQueryClient } from '../utils';

const baseURL = 'http://localhost:8000';

const mockUser = {
  id: 1,
  email: 'user@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

function AuthProbe() {
  const { isAuthenticated, isLoading, user } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
    </div>
  );
}

function LocationProbe() {
  const { pathname } = useLocation();
  return <span data-testid="pathname">{pathname}</span>;
}

function renderAuthProvider(initialEntries = ['/login']) {
  const queryClient = createTestQueryClient();
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route
            path="*"
            element={
              <AuthProvider>
                <AuthProbe />
                <LocationProbe />
              </AuthProvider>
            }
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('AuthProvider', () => {
  it('sets isLoading then isAuthenticated when /users/me succeeds', async () => {
    server.use(http.get(`${baseURL}/users/me`, () => HttpResponse.json(mockUser)));

    renderAuthProvider(['/']);

    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('email')).toHaveTextContent('user@example.com');
  });

  it('treats /users/me failure as unauthenticated', async () => {
    server.use(
      http.get(`${baseURL}/users/me`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
      ),
      http.post(`${baseURL}/auth/refresh`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
      ),
    );

    renderAuthProvider(['/login']);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('email')).toHaveTextContent('none');
  });

  it('login refetches /users/me and exposes the user', async () => {
    let meCalls = 0;
    server.use(
      http.get(`${baseURL}/users/me`, () => {
        meCalls += 1;
        if (meCalls === 1) {
          return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
        }
        return HttpResponse.json(mockUser);
      }),
      http.post(`${baseURL}/auth/refresh`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
      ),
      http.post(`${baseURL}/auth/login`, () => new HttpResponse(null, { status: 204 })),
    );

    function LoginTrigger() {
      const { login, isAuthenticated, user } = useAuth();
      return (
        <div>
          <button type="button" onClick={() => login('user@example.com', 'secret')}>
            Log in
          </button>
          <span data-testid="authenticated">{String(isAuthenticated)}</span>
          <span data-testid="email">{user?.email ?? 'none'}</span>
        </div>
      );
    }

    const queryClient = createTestQueryClient();
    render(
      <MemoryRouter initialEntries={['/login']}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LoginTrigger />
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });

    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('email')).toHaveTextContent('user@example.com');
    });
  });

  it('logout clears session and navigates to /login', async () => {
    server.use(
      http.get(`${baseURL}/users/me`, () => HttpResponse.json(mockUser)),
      http.post(`${baseURL}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
    );

    function LogoutTrigger() {
      const { logout } = useAuth();
      return (
        <button type="button" onClick={() => logout()}>
          Log out
        </button>
      );
    }

    const queryClient = createTestQueryClient();
    const clearSpy = vi.spyOn(queryClient, 'clear');

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route
              path="*"
              element={
                <AuthProvider>
                  <LogoutTrigger />
                  <LocationProbe />
                </AuthProvider>
              }
            />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/profile');
    });

    await userEvent.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/login');
    });
    expect(clearSpy).toHaveBeenCalled();
  });
});

describe('useAuth', () => {
  it('throws outside AuthProvider', () => {
    function Orphan() {
      useAuth();
      return null;
    }

    expect(() =>
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <Orphan />
        </QueryClientProvider>,
      ),
    ).toThrow('useAuth must be used within AuthProvider');
  });
});
