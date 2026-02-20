import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

interface SyncStatus {
  id: string;
  userId: string;
  walletAddress: string;
  chain: string;
  syncStatus: 'pending' | 'processing' | 'completed' | 'failed';
  lastSyncedBlock: number | null;
  startDate: string;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SyncStatusResponse {
  success: boolean;
  data: {
    status: SyncStatus;
  };
}

export function usePortfolioSync(walletAddress?: string) {
  return useQuery({
    queryKey: ['portfolio-sync', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;

      const response = await apiClient.get<SyncStatusResponse>(
        '/api/v1/portfolio/sync/status',
        {
          params: { walletAddress, chain: 'solana' },
        }
      );
      return response.data.data;
    },
    enabled: !!walletAddress,
    refetchInterval: (data) => {
      // Keep refetching if still processing
      const status = data?.status?.syncStatus;
      if (status === 'pending' || status === 'processing') {
        return 3000; // Poll every 3 seconds
      }
      return false; // Stop polling once completed or failed
    },
  });
}
