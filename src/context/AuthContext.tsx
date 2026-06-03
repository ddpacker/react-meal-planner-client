import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { login as apiLogin, logout as apiLogout } from '../lib/api/auth';
import { userKeys } from '../lib/queryKeys';
import { useMe } from '../hooks/useMe';
import type { UserRead } from '../types/user';

export type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserRead | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const meQuery = useMe();

  const login = useCallback(
    async (email: string, password: string) => {
      await apiLogin(email, password);
      await queryClient.refetchQueries({ queryKey: userKeys.me() });
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    queryClient.clear();
    navigate('/login');
  }, [queryClient, navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: meQuery.isSuccess,
      isLoading: meQuery.isPending,
      user: meQuery.data ?? null,
      login,
      logout,
    }),
    [meQuery.isSuccess, meQuery.isPending, meQuery.data, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
