'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';
import { usePortfolioSync } from '@/hooks/usePortfolioSync';
import { useDailyPortfolio } from '@/hooks/useDailyPortfolio';
import { PortfolioCalendar } from '@/components/portfolio/PortfolioCalendar';
import { PortfolioStats } from '@/components/portfolio/PortfolioStats';
import { SyncStatus } from '@/components/portfolio/SyncStatus';
import { Search } from 'lucide-react';
import apiClient from '@/lib/api/client';

export default function PortfolioPage() {
  const { authenticated, user } = usePrivy();
  const connectedWalletAddress = user?.wallet?.address;

  const [addressInput, setAddressInput] = useState('');
  const [analyzedAddress, setAnalyzedAddress] = useState(connectedWalletAddress || '');

  const [dateRange, setDateRange] = useState({
    start: new Date('2026-01-01'),
    end: new Date(),
  });

  // Use analyzed address or connected wallet
  const activeAddress = analyzedAddress || connectedWalletAddress;

  // Get sync status
  const { data: syncStatus, isLoading: syncLoading } = usePortfolioSync(activeAddress);

  // Get daily portfolio data (with auto-refresh during sync)
  const { data: dailyData, isLoading: dataLoading } = useDailyPortfolio(
    activeAddress,
    dateRange.start,
    dateRange.end,
    syncStatus?.status?.syncStatus
  );

  const handleAnalyzeWallet = async () => {
    if (addressInput.trim()) {
      const address = addressInput.trim();
      setAnalyzedAddress(address);

      // Trigger portfolio sync for this address
      try {
        await apiClient.post('/api/v1/portfolio/sync', {
          walletAddress: address,
          chain: 'solana',
        });
      } catch (error) {
        console.error('Failed to trigger sync:', error);
      }
    }
  };

  const handleUseConnectedWallet = () => {
    if (connectedWalletAddress) {
      setAnalyzedAddress(connectedWalletAddress);
      setAddressInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            📊 Portfolio Tracker
          </h1>
          <p className="text-gray-400">
            Track any Solana wallet's performance and P&L across time
          </p>
        </div>

        {/* Wallet Address Input */}
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeWallet()}
                placeholder="Enter Solana wallet address to analyze..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAnalyzeWallet}
              disabled={!addressInput.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Analyze
            </button>
            {authenticated && connectedWalletAddress && (
              <button
                onClick={handleUseConnectedWallet}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                My Wallet
              </button>
            )}
          </div>
          {activeAddress && (
            <div className="mt-4 text-sm text-gray-400">
              Analyzing: <span className="text-white font-mono">{activeAddress}</span>
            </div>
          )}
        </div>

        {/* Sync Status */}
        {activeAddress && (
          <SyncStatus
            syncStatus={syncStatus?.status}
            isLoading={syncLoading}
            walletAddress={activeAddress}
          />
        )}

        {/* Portfolio Stats - Show partial data even during sync */}
        {activeAddress && dailyData?.data && dailyData.data.length > 0 && (
          <>
            {/* Show info banner if still syncing */}
            {syncStatus?.status?.syncStatus === 'processing' && (
              <div className="mb-6 bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  📊 Showing partial data while sync is in progress. Data will update automatically as more transactions are processed.
                </p>
              </div>
            )}

            <PortfolioStats dailyData={dailyData.data} />

            {/* Date Range Selector */}
            <div className="mb-6 flex gap-4 items-center">
              <button
                onClick={() =>
                  setDateRange({
                    start: new Date(new Date().setDate(new Date().getDate() - 7)),
                    end: new Date(),
                  })
                }
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Last 7 Days
              </button>
              <button
                onClick={() =>
                  setDateRange({
                    start: new Date(new Date().setDate(new Date().getDate() - 30)),
                    end: new Date(),
                  })
                }
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Last 30 Days
              </button>
              <button
                onClick={() =>
                  setDateRange({
                    start: new Date('2026-01-01'),
                    end: new Date(),
                  })
                }
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                All Time
              </button>
            </div>

            {/* Calendar View */}
            <PortfolioCalendar dailyData={dailyData.data} isLoading={dataLoading} />
          </>
        )}

        {/* Empty State */}
        {!activeAddress && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">Enter a Solana wallet address to get started</p>
            <p className="text-gray-500 text-sm">
              {authenticated
                ? 'Use the search bar above to analyze any wallet, or click "My Wallet" to view your portfolio'
                : 'Use the search bar above to analyze any Solana wallet address'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
