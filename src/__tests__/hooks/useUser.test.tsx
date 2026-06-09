import type { ReactNode } from 'react';
import { renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { API_BASE_URL, mockUser } from '../../__mocks__/authHandlers';
import { server } from '../../__mocks__/server';
import { createTestQueryClient } from '../utils';
import { userKeys } from '../../lib/queryKeys';
import {
  useDeleteMe,
  useMe,
  usePreferences,
  useUpdateMe,
  useUpdatePreferences,
} from '../../hooks/useUser';

function PathProbe() {
  const { pathname } = useLocation();
  return <div data-testid="pathname">{pathname}</div>;
}

function createHookWrapper(queryClient: QueryClient, initialEntries = ['/profile']) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <PathProbe />
                  {children}
                </>
              }
            />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    );
  };
}

describe('useUser', () => {
  it('useMe fetches the current user', async () => {
    server.use(
      http.get(`${API_BASE_URL}/users/me`, () => HttpResponse.json(mockUser)),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useMe(), {
      wrapper: createHookWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUser);
  });

  it('usePreferences fetches unit_system', async () => {
    server.use(
      http.get(`${API_BASE_URL}/users/me/preferences`, () =>
        HttpResponse.json({ unit_system: 'metric' }),
      ),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => usePreferences(), {
      wrapper: createHookWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ unit_system: 'metric' });
  });

  it('useUpdateMe invalidates me() on success', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/users/me`, () =>
        HttpResponse.json({ ...mockUser, email: 'new@example.com' }),
      ),
    );

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateMe(), {
      wrapper: createHookWrapper(queryClient),
    });

    await result.current.mutateAsync({
      email: 'new@example.com',
      current_password: 'secret',
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: userKeys.me() });
  });

  it('useUpdatePreferences invalidates preferences() on success', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/users/me/preferences`, () =>
        HttpResponse.json({ unit_system: 'imperial' }),
      ),
    );

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdatePreferences(), {
      wrapper: createHookWrapper(queryClient),
    });

    await result.current.mutateAsync({ unit_system: 'imperial' });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: userKeys.preferences() });
  });

  it('useDeleteMe logs out and navigates to /login on success', async () => {
    let logoutCalled = false;
    server.use(
      http.delete(`${API_BASE_URL}/users/me`, () => new HttpResponse(null, { status: 204 })),
      http.post(`${API_BASE_URL}/auth/logout`, () => {
        logoutCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(userKeys.me(), mockUser);
    const { result } = renderHook(() => useDeleteMe(), {
      wrapper: createHookWrapper(queryClient),
    });

    await result.current.mutateAsync('secret');

    expect(logoutCalled).toBe(true);
    expect(queryClient.getQueryData(userKeys.me())).toBeUndefined();
    await waitFor(() =>
      expect(screen.getByTestId('pathname')).toHaveTextContent('/login'),
    );
  });
});
