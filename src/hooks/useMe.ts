import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '../lib/api/user';
import { userKeys } from '../lib/queryKeys';

export function useMe() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: fetchMe,
    retry: false,
  });
}
