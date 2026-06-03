import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import {
  API_BASE_URL,
  applyLoginFailureHandlers,
  applyLoginSuccessHandlers,
  applyRefreshFailureHandlers,
  applyRefreshSuccessHandlers,
  applyRegisterConflictHandlers,
  applyRegisterSuccessHandlers,
  applyUnauthenticatedSessionHandlers,
  mockUser,
} from '../__mocks__/authHandlers';
import { server } from '../__mocks__/server';
import { RequireAuth } from '../components/RequireAuth';
import { apiClient } from '../lib/api/client';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import { renderAuthApp } from './auth/renderAuthApp';
import { locationAssign } from './locationMock';
import { renderWithProviders } from './utils';

function ProtectedContent() {
  return <div>Protected content</div>;
}

function LoginStub() {
  return <div>Login page</div>;
}

function renderRequireAuth(
  authState: { isAuthenticated: boolean; isLoading?: boolean },
  initialEntries = ['/'],
) {
  return renderWithProviders(
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<ProtectedContent />} />
      </Route>
      <Route path="/login" element={<LoginStub />} />
    </Routes>,
    { authState, initialEntries },
  );
}

describe('auth flow', () => {
  afterEach(() => {
    cleanup();
  });

  describe('LoginPage', () => {
    it('navigates to / after valid credentials', async () => {
      applyUnauthenticatedSessionHandlers();
      applyLoginSuccessHandlers();

      const user = userEvent.setup();
      renderAuthApp({
        pagePath: '/login',
        page: <LoginPage />,
        initialPath: '/login',
      });

      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.type(screen.getByLabelText(/password/i), 'correct-password');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });
    });

    it('shows an error for invalid credentials', async () => {
      applyUnauthenticatedSessionHandlers();
      applyLoginFailureHandlers();

      const user = userEvent.setup();
      renderAuthApp({
        pagePath: '/login',
        page: <LoginPage />,
        initialPath: '/login',
      });

      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrong-password');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      expect(
        await screen.findByText('Invalid email or password.'),
      ).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });
  });

  describe('RegisterPage', () => {
    const newUser = {
      id: 2,
      email: 'new@example.com',
      created_at: '2024-01-02T00:00:00Z',
    };

    it('navigates to / after valid registration', async () => {
      applyUnauthenticatedSessionHandlers();
      applyRegisterSuccessHandlers(newUser);

      const user = userEvent.setup();
      renderAuthApp({
        pagePath: '/register',
        page: <RegisterPage />,
        initialPath: '/register',
      });

      await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'secure-password');
      await user.type(screen.getByLabelText(/confirm password/i), 'secure-password');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });
    });

    it('shows an error for duplicate email', async () => {
      applyUnauthenticatedSessionHandlers();
      applyRegisterConflictHandlers();

      const user = userEvent.setup();
      renderAuthApp({
        pagePath: '/register',
        page: <RegisterPage />,
        initialPath: '/register',
      });

      await user.type(screen.getByLabelText(/^email$/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'secure-password');
      await user.type(screen.getByLabelText(/confirm password/i), 'secure-password');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(
        await screen.findByText('An account with this email already exists.'),
      ).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });
  });

  describe('RequireAuth', () => {
    it('renders a spinner while isLoading', () => {
      renderRequireAuth({ isAuthenticated: false, isLoading: true });

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
      expect(screen.queryByText('Login page')).not.toBeInTheDocument();
    });

    it('redirects to /login when not authenticated', () => {
      renderRequireAuth({ isAuthenticated: false, isLoading: false });

      expect(screen.getByText('Login page')).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('renders children when authenticated', () => {
      renderRequireAuth({ isAuthenticated: true, isLoading: false });

      expect(screen.getByText('Protected content')).toBeInTheDocument();
      expect(screen.queryByText('Login page')).not.toBeInTheDocument();
    });
  });

  describe('apiClient 401 interceptor', () => {
    beforeEach(() => {
      window.location.pathname = '/recipes';
      locationAssign.mockClear();
    });

    it('sends only one refresh for concurrent 401 responses', async () => {
      const callCounts = { me: 0, recipes: 0, refresh: 0 };

      server.use(
        http.get(`${API_BASE_URL}/users/me`, () => {
          callCounts.me += 1;
          if (callCounts.me === 1) {
            return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
          }
          return HttpResponse.json({ id: 1 });
        }),
        http.get(`${API_BASE_URL}/recipes`, () => {
          callCounts.recipes += 1;
          if (callCounts.recipes === 1) {
            return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
          }
          return HttpResponse.json([]);
        }),
        http.post(`${API_BASE_URL}/auth/refresh`, () => {
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
    });

    it('redirects to /login when refresh fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/users/me`, () =>
          HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
        ),
      );
      applyRefreshFailureHandlers();

      await expect(apiClient.get('/users/me')).rejects.toMatchObject({
        response: { status: 401 },
      });
      expect(locationAssign).toHaveBeenCalledWith('/login');
    });

    it('retries after a successful refresh', async () => {
      let resourceCalls = 0;

      server.use(
        http.get(`${API_BASE_URL}/users/me`, () => {
          resourceCalls += 1;
          if (resourceCalls === 1) {
            return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
          }
          return HttpResponse.json(mockUser);
        }),
      );
      applyRefreshSuccessHandlers();

      const { data } = await apiClient.get('/users/me');
      expect(data).toEqual(mockUser);
      expect(resourceCalls).toBe(2);
    });

    it('does not refresh auth endpoints', async () => {
      let refreshCalls = 0;

      server.use(
        http.post(`${API_BASE_URL}/auth/login`, () =>
          HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
        ),
        http.post(`${API_BASE_URL}/auth/refresh`, () => {
          refreshCalls += 1;
          return HttpResponse.json(null, { status: 200 });
        }),
      );

      await expect(
        apiClient.post('/auth/login', { email: 'a@b.com', password: 'wrong' }),
      ).rejects.toMatchObject({ response: { status: 401 } });
      expect(refreshCalls).toBe(0);
      expect(locationAssign).not.toHaveBeenCalled();
    });
  });
});
