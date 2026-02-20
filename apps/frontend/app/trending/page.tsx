'use client';

import { useState } from 'react';
import { TrendingTokensTable } from '@/components/trending/TrendingTokensTable';

type TimePeriod = '1h' | '6h' | '24h';

export default function TrendingPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('24h');
  const [chain, setChain] = useState<string>('solana');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🔥 Trending Tokens
          </h1>
          <p className="text-gray-400">
            Discover the hottest tokens across multiple chains
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Time Period Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setTimePeriod('1h')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timePeriod === '1h'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              1H
            </button>
            <button
              onClick={() => setTimePeriod('6h')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timePeriod === '6h'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              6H
            </button>
            <button
              onClick={() => setTimePeriod('24h')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timePeriod === '24h'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              24H
            </button>
          </div>

          {/* Chain Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setChain('solana')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                chain === 'solana'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Solana
            </button>
            <button
              onClick={() => setChain('ethereum')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                chain === 'ethereum'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Ethereum
            </button>
            <button
              onClick={() => setChain('base')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                chain === 'base'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Base
            </button>
          </div>
        </div>

        {/* Trending Tokens Table */}
        <TrendingTokensTable chain={chain} timePeriod={timePeriod} />
      </div>
    </div>
  );
}
