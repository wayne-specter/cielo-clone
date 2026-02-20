import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

export interface DailyPortfolioData {
  id: string;
  userId: string;
  walletAddress: string;
  chain: string;
  date: string;
  totalValue: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  holdings: Array<{
    tokenAddress: string;
    symbol: string;
    name: string;
    amount: number;
    price: number;
    value: number;
  }>;
  createdAt: string;
}

interface DailyPortfolioResponse {
  success: boolean;
  data: {
    data: DailyPortfolioData[];
    count: number;
    startDate: string;
    endDate: string;
  };
}

export function useDailyPortfolio(
  walletAddress?: string,
  startDate?: Date,
  endDate?: Date,
  syncStatus?: 'pending' | 'processing' | 'completed' | 'failed'
) {
  return useQuery({
    queryKey: ['daily-portfolio', walletAddress, startDate, endDate],
    queryFn: async () => {
      if (!walletAddress) return null;

      const response = await apiClient.get<DailyPortfolioResponse>(
        '/api/v1/portfolio/daily',
        {
          params: {
            walletAddress,
            chain: 'solana',
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
          },
        }
      );
      return response.data.data;
    },
    enabled: !!walletAddress,
    staleTime: 60000, // 1 minute
    refetchInterval: () => {
      // Poll every 3 seconds while sync is processing to show incremental updates
      if (syncStatus === 'pending' || syncStatus === 'processing') {
        return 3000;
      }
      return false; // Stop polling once completed or failed
    },
  });
}
