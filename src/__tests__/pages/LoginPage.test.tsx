import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../__mocks__/server';
import { AuthProvider } from '../../context/AuthContext';
import LoginPage from '../../pages/LoginPage';
import { createTestQueryClient } from '../utils';

const baseURL = 'http://localhost:8000';

const mockUser = {
  id: 1,
  email: 'user@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

function renderLoginPage(initialPath = '/login') {
  const queryClient = createTestQueryClient();
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route
            path="*"
            element={
              <AuthProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/" element={<div>Home</div>} />
                </Routes>
              </AuthProvider>
            }
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

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

afterEach(() => {
  cleanup();
});

describe('LoginPage', () => {
  it('navigates to / after successful sign in', async () => {
    useUnauthenticatedSessionHandlers();
    server.use(
      http.post(`${baseURL}/auth/login`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${baseURL}/users/me`, () => HttpResponse.json(mockUser)),
    );

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correct-password');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  it('shows an error for invalid credentials', async () => {
    useUnauthenticatedSessionHandlers();
    server.use(
      http.post(`${baseURL}/auth/login`, () =>
        HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 }),
      ),
    );

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(
      await screen.findByText('Invalid email or password.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('redirects to Google sign-in', async () => {
    useUnauthenticatedSessionHandlers();
    const assignSpy = vi.mocked(window.location.assign);

    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: /sign in with google/i }));

    expect(assignSpy).toHaveBeenCalledWith(`${baseURL}/auth/google`);
  });

  it('links to the register page', () => {
    useUnauthenticatedSessionHandlers();
    renderLoginPage();

    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
