import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '../lib/api/user';
import { userKeys } from '../lib/queryKeys';

export function useGoogleCallbackSession() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: fetchMe,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
