import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../__mocks__/server';
import { AuthProvider } from '../../context/AuthContext';
import GoogleCallbackPage from '../../pages/GoogleCallbackPage';
import { createTestQueryClient } from '../utils';

const baseURL = 'http://localhost:8000';

const mockUser = {
  id: 1,
  email: 'google@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

function renderGoogleCallbackPage() {
  const queryClient = createTestQueryClient();
  return render(
    <MemoryRouter initialEntries={['/auth/google/callback']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route
            path="*"
            element={
              <AuthProvider>
                <Routes>
                  <Route
                    path="/auth/google/callback"
                    element={<GoogleCallbackPage />}
                  />
                  <Route path="/" element={<div>Home</div>} />
                  <Route path="/login" element={<div>Login</div>} />
                </Routes>
              </AuthProvider>
            }
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe('GoogleCallbackPage', () => {
  it('navigates to / when /users/me succeeds', async () => {
    server.use(http.get(`${baseURL}/users/me`, () => HttpResponse.json(mockUser)));

    renderGoogleCallbackPage();

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  it('shows an error when /users/me fails', async () => {
    server.use(
      http.get(`${baseURL}/users/me`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
      ),
      http.post(`${baseURL}/auth/refresh`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
      ),
    );

    renderGoogleCallbackPage();

    expect(
      await screen.findByText(/google sign-in failed/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });
});
