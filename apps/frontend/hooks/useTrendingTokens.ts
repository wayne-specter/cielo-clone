import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

interface TrendingTokensResponse {
  success: boolean;
  data: {
    tokens: any[];
    count: number;
    chain: string;
  };
}

export function useTrendingTokens(chain: string = 'solana', limit: number = 50) {
  return useQuery({
    queryKey: ['trending-tokens', chain, limit],
    queryFn: async () => {
      const response = await apiClient.get<TrendingTokensResponse>(
        '/api/v1/tokens/trending',
        {
          params: { chain, limit },
        }
      );
      return response.data.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds
  });
}
