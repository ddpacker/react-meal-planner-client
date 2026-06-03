import { useQuery } from '@tanstack/react-query';
import { getMe } from '../lib/api/auth';
import { userKeys } from '../lib/queryKeys';

export function useGoogleCallbackSession() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: getMe,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
