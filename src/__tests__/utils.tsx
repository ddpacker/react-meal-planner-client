import type { ReactElement } from 'react';
import { render, type RenderOptions as RTLRenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import {
  AuthContext,
  type AuthContextValue,
} from '../context/AuthContext';
import { AppThemeProvider } from '../lib/theme/AppThemeProvider';
import type { UserRead } from '../types/user';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

const mockUser: UserRead = {
  id: 1,
  email: 'user@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

type RenderWithProvidersOptions = {
  authState?: Partial<AuthContextValue> & {
    isAuthenticated: boolean;
    isLoading?: boolean;
  };
  initialEntries?: string[];
} & Omit<RTLRenderOptions, 'wrapper'>;

export function renderWithProviders(
  ui: ReactElement,
  {
    authState = { isAuthenticated: true, isLoading: false },
    initialEntries,
    ...renderOptions
  }: RenderWithProvidersOptions = {},
) {
  const queryClient = createTestQueryClient();

  const authValue: AuthContextValue = {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading ?? false,
    user: authState.isAuthenticated
      ? (authState.user ?? mockUser)
      : (authState.user ?? null),
    unitSystem: authState.unitSystem ?? 'metric',
    login: authState.login ?? (async () => {}),
    logout: authState.logout ?? (async () => {}),
  };

  return render(ui, {
    ...renderOptions,
    wrapper: ({ children }) => (
      <AppThemeProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={authValue}>
              {children}
            </AuthContext.Provider>
          </QueryClientProvider>
        </MemoryRouter>
      </AppThemeProvider>
    ),
  });
}
