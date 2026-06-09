import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { logout as apiLogout } from '../lib/api/auth';
import {
  deleteMe,
  fetchMe,
  fetchPreferences,
  updateMe,
  updatePreferences,
} from '../lib/api/user';
import { userKeys } from '../lib/queryKeys';
import type { UserPreferencesUpdate, UserUpdate } from '../types/user';

export function useMe() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: fetchMe,
    retry: false,
  });
}

export function usePreferences({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: userKeys.preferences(),
    queryFn: fetchPreferences,
    enabled,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UserUpdate) => updateMe(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UserPreferencesUpdate) => updatePreferences(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.preferences() });
    },
  });
}

export function useDeleteMe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMe,
    onSuccess: async () => {
      await apiLogout();
      queryClient.clear();
      navigate('/login');
    },
  });
}
