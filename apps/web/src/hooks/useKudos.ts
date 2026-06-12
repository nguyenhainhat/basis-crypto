import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../config/api';
import { API_ENDPOINTS } from '../config/endpoints';
import { kudosKeys } from './queryKeys';
import { KudosLog } from '../types';

export function useUserKudos(walletAddress?: string) {
  return useQuery<KudosLog[]>({
    queryKey: walletAddress ? kudosKeys.received(walletAddress.toLowerCase()) : kudosKeys.all,
    queryFn: async () => {
      if (!walletAddress) throw new Error('No wallet address provided');
      return apiFetch(API_ENDPOINTS.KUDOS.RECEIVED(walletAddress.toLowerCase()));
    },
    enabled: !!walletAddress,
    retry: false,
  });
}

export function useSendKudos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ receiverAddress, message }: { receiverAddress: string; message: string }) => {
      return apiFetch(API_ENDPOINTS.KUDOS.SEND, {
        method: 'POST',
        body: JSON.stringify({ receiverAddress, message }),
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate all kudos queries to update timelines instantly
      queryClient.invalidateQueries({ queryKey: kudosKeys.all });
    },
  });
}
