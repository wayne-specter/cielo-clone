'use client';

import { DailyPortfolioData } from '@/hooks/useDailyPortfolio';
import { formatNumber } from '@/lib/utils/format';

interface PortfolioStatsProps {
  dailyData: DailyPortfolioData[];
}

export function PortfolioStats({ dailyData }: PortfolioStatsProps) {
  if (!dailyData || dailyData.length === 0) {
    return null;
  }

  // Get latest day's data
  const latest = dailyData[dailyData.length - 1];
  const first = dailyData[0];

  // Calculate total P&L by summing corrected daily P&L values
  const totalPnL = dailyData.reduce((sum, day) => sum + day.dailyPnL, 0);
  const totalPnLPercent = first.totalValue > 0 ? (totalPnL / first.totalValue) * 100 : 0;

  // Calculate average daily P&L
  const avgDailyPnL = dailyData.reduce((sum, day) => sum + day.dailyPnL, 0) / dailyData.length;

  // Count profitable days
  const profitableDays = dailyData.filter((day) => day.dailyPnL > 0).length;
  const winRate = (profitableDays / dailyData.length) * 100;

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Current Value */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <p className="text-gray-400 text-sm mb-1">Current Portfolio Value</p>
        <p className="text-3xl font-bold text-white">${formatNumber(latest.totalValue)}</p>
      </div>

      {/* Total P&L */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <p className="text-gray-400 text-sm mb-1">Total P&L</p>
        <p
          className={`text-3xl font-bold ${
            totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {totalPnL >= 0 ? '+' : ''}${formatNumber(totalPnL)}
        </p>
        <p
          className={`text-sm ${
            totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {totalPnLPercent >= 0 ? '+' : ''}
          {totalPnLPercent.toFixed(2)}%
        </p>
      </div>

      {/* Avg Daily P&L */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <p className="text-gray-400 text-sm mb-1">Avg Daily P&L</p>
        <p
          className={`text-3xl font-bold ${
            avgDailyPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {avgDailyPnL >= 0 ? '+' : ''}${formatNumber(avgDailyPnL)}
        </p>
      </div>

      {/* Win Rate */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <p className="text-gray-400 text-sm mb-1">Win Rate</p>
        <p className="text-3xl font-bold text-white">{winRate.toFixed(1)}%</p>
        <p className="text-sm text-gray-400">
          {profitableDays}/{dailyData.length} days
        </p>
      </div>
    </div>
  );
}
