'use client';

import { useState } from 'react';
import { useTrendingTokens } from '@/hooks/useTrendingTokens';
import { formatNumber, formatPrice, formatPercentage } from '@/lib/utils/format';

interface TrendingTokensTableProps {
  chain: string;
  timePeriod: string;
}

type SortField = 'volume' | 'priceChange' | 'liquidity' | 'marketCap';
type SortOrder = 'asc' | 'desc';

export function TrendingTokensTable({ chain, timePeriod }: TrendingTokensTableProps) {
  const { data, isLoading, error } = useTrendingTokens(chain);
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortedTokens = () => {
    if (!data?.tokens) return [];

    return [...data.tokens].sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      switch (sortField) {
        case 'volume':
          aValue = a.volume?.h24 || 0;
          bValue = b.volume?.h24 || 0;
          break;
        case 'priceChange':
          aValue = a.priceChange?.h24 || 0;
          bValue = b.priceChange?.h24 || 0;
          break;
        case 'liquidity':
          aValue = a.liquidity?.usd || 0;
          bValue = b.liquidity?.usd || 0;
          break;
        case 'marketCap':
          aValue = a.marketCap || 0;
          bValue = b.marketCap || 0;
          break;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  const sortedTokens = getSortedTokens();

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading trending tokens...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 backdrop-blur-sm rounded-2xl border border-red-500/50 p-8">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load trending tokens</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!sortedTokens.length) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
        <p className="text-center text-gray-400">No trending tokens found</p>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-600 ml-1">⇅</span>;
    }
    return sortOrder === 'asc' ? (
      <span className="text-blue-400 ml-1">↑</span>
    ) : (
      <span className="text-blue-400 ml-1">↓</span>
    );
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50 border-b border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Token
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('priceChange')}
              >
                24h Change <SortIcon field="priceChange" />
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('volume')}
              >
                24h Volume <SortIcon field="volume" />
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('liquidity')}
              >
                Liquidity <SortIcon field="liquidity" />
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                DEX
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {sortedTokens.map((token, index) => {
              const priceChange = token.priceChange?.h24 || 0;
              const isPositive = priceChange >= 0;

              return (
                <tr
                  key={token.pairAddress}
                  className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                  onClick={() => window.open(token.url, '_blank')}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {token.info?.imageUrl ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={token.info.imageUrl}
                            alt={token.baseToken?.symbol || 'Token'}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {token.baseToken?.symbol?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {token.baseToken?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {token.baseToken?.symbol || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-white">
                    ${formatPrice(token.priceUsd)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span
                      className={`${
                        isPositive ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {formatPercentage(priceChange)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                    ${formatNumber(token.volume?.h24 || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                    ${formatNumber(token.liquidity?.usd || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/50 text-blue-300">
                      {token.dexId?.toUpperCase() || 'DEX'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-900/50 px-6 py-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">
          Showing {sortedTokens.length} trending tokens on {chain}
        </p>
      </div>
    </div>
  );
}
