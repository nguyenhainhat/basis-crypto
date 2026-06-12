import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../config/api';
import { API_ENDPOINTS } from '../config/endpoints';
import { userKeys } from './queryKeys';
import { UserProfile } from '../types';

export function useUserProfile(walletAddress?: string) {
  return useQuery<UserProfile>({
    queryKey: walletAddress ? userKeys.profile(walletAddress.toLowerCase()) : userKeys.all,
    queryFn: async () => {
      if (!walletAddress) throw new Error('No wallet address provided');
      return apiFetch(API_ENDPOINTS.USERS.PROFILE(walletAddress.toLowerCase()));
    },
    enabled: !!walletAddress,
    retry: false,
  });
}
