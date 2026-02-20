import axios from 'axios';
import { logger } from '../utils/logger';

// DexScreener API (free, no auth required)
const DEXSCREENER_API = 'https://api.dexscreener.com/latest';

export interface TrendingTokenData {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
}

export class TokenService {
  /**
   * Get trending tokens from DexScreener using search with generic queries
   * Since DexScreener doesn't have a direct trending endpoint, we search broadly
   * and filter by volume to get trending tokens
   * @param chain - Chain to filter by (optional)
   * @param limit - Number of results (default 50)
   */
  static async getTrendingTokens(
    chain: string = 'solana',
    limit: number = 50
  ): Promise<TrendingTokenData[]> {
    try {
      logger.info('Fetching trending tokens', { chain, limit });

      // Search queries to get diverse token results
      const searchQueries = ['', 'dog', 'cat', 'pepe', 'moon', 'trump', 'ai', 'meme'];
      const allPairs: any[] = [];

      // Make multiple searches to get a good variety of tokens
      for (const query of searchQueries) {
        try {
          const response = await axios.get(`${DEXSCREENER_API}/dex/search`, {
            params: { q: query || chain },
            timeout: 10000,
          });

          if (response.data?.pairs) {
            allPairs.push(...response.data.pairs);
          }
        } catch (err) {
          logger.warn(`Search failed for query: ${query}`);
        }
      }

      logger.info(`Fetched ${allPairs.length} total pairs`);

      // Remove duplicates by pairAddress
      const uniquePairs = allPairs.reduce((acc: any[], pair: any) => {
        if (!acc.find((p) => p.pairAddress === pair.pairAddress)) {
          acc.push(pair);
        }
        return acc;
      }, []);

      // Filter and sort by volume
      const tokens = uniquePairs
        .filter((pair: any) => {
          // Filter out invalid pairs and ensure it's not the native token
          const isNativeToken =
            (chain === 'solana' && pair.baseToken?.symbol === 'SOL') ||
            (chain === 'ethereum' && pair.baseToken?.symbol === 'ETH') ||
            (chain === 'base' && pair.baseToken?.symbol === 'ETH');

          return (
            !isNativeToken && // Exclude native chain tokens
            pair.chainId === chain && // Ensure correct chain
            pair.volume?.h24 > 5000 && // Min $5000 volume for quality
            pair.liquidity?.usd > 2000 && // Min $2000 liquidity
            pair.priceUsd &&
            parseFloat(pair.priceUsd) > 0 &&
            pair.baseToken?.symbol && // Has symbol
            pair.baseToken?.name // Has name
          );
        })
        .sort((a: any, b: any) => {
          // Sort by 24h volume (highest first)
          return (b.volume?.h24 || 0) - (a.volume?.h24 || 0);
        })
        .slice(0, limit);

      logger.info(`Found ${tokens.length} trending tokens on ${chain}`);

      return tokens;
    } catch (error: any) {
      logger.error('Error fetching trending tokens', error);
      throw new Error('Failed to fetch trending tokens');
    }
  }

  /**
   * Get token details by address
   * @param chain - Chain name
   * @param address - Token address
   */
  static async getTokenByAddress(
    chain: string,
    address: string
  ): Promise<TrendingTokenData | null> {
    try {
      logger.info('Fetching token by address', { chain, address });

      const response = await axios.get(
        `${DEXSCREENER_API}/dex/tokens/${address}`,
        {
          timeout: 10000,
        }
      );

      if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
        logger.warn('Token not found', { address });
        return null;
      }

      // Return the most liquid pair
      const pairs = response.data.pairs.sort(
        (a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      );

      return pairs[0];
    } catch (error: any) {
      logger.error('Error fetching token', error);
      return null;
    }
  }

  /**
   * Search tokens by query
   * @param query - Search query
   * @param limit - Number of results
   */
  static async searchTokens(query: string, limit: number = 20): Promise<TrendingTokenData[]> {
    try {
      logger.info('Searching tokens', { query, limit });

      const response = await axios.get(`${DEXSCREENER_API}/dex/search`, {
        params: {
          q: query,
        },
        timeout: 10000,
      });

      if (!response.data || !response.data.pairs) {
        return [];
      }

      return response.data.pairs.slice(0, limit);
    } catch (error: any) {
      logger.error('Error searching tokens', error);
      return [];
    }
  }
}
