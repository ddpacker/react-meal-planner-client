import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../__mocks__/server';
import { AuthProvider } from '../../context/AuthContext';
import RegisterPage from '../../pages/RegisterPage';
import { createTestQueryClient } from '../utils';

const baseURL = 'http://localhost:8000';

const mockUser = {
  id: 2,
  email: 'new@example.com',
  created_at: '2024-01-02T00:00:00Z',
};

function renderRegisterPage(initialPath = '/register') {
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
                  <Route path="/register" element={<RegisterPage />} />
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

describe('RegisterPage', () => {
  it('registers, signs in, and navigates to /', async () => {
    useUnauthenticatedSessionHandlers();
    server.use(
      http.post(`${baseURL}/auth/register`, () => new HttpResponse(null, { status: 201 })),
      http.post(`${baseURL}/auth/login`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${baseURL}/users/me`, () => HttpResponse.json(mockUser)),
    );

    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secure-password');
    await user.type(screen.getByLabelText(/confirm password/i), 'secure-password');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  it('shows an error when the email is already registered', async () => {
    useUnauthenticatedSessionHandlers();
    server.use(
      http.post(`${baseURL}/auth/register`, () =>
        HttpResponse.json({ detail: 'Email already registered' }, { status: 409 }),
      ),
    );

    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/^email$/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secure-password');
    await user.type(screen.getByLabelText(/confirm password/i), 'secure-password');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      await screen.findByText('An account with this email already exists.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('shows a validation error when passwords do not match', async () => {
    useUnauthenticatedSessionHandlers();

    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secure-password');
    await user.type(screen.getByLabelText(/confirm password/i), 'different-password');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  it('links to the login page', () => {
    useUnauthenticatedSessionHandlers();
    renderRegisterPage();

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});
