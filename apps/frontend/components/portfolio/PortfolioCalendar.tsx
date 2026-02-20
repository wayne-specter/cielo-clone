'use client';

import { useState } from 'react';
import { DailyPortfolioData } from '@/hooks/useDailyPortfolio';
import { formatNumber, formatPercentage } from '@/lib/utils/format';

interface PortfolioCalendarProps {
  dailyData: DailyPortfolioData[];
  isLoading: boolean;
}

export function PortfolioCalendar({ dailyData, isLoading }: PortfolioCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<DailyPortfolioData | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading portfolio data...</span>
        </div>
      </div>
    );
  }

  if (!dailyData || dailyData.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
        <p className="text-center text-gray-400">No portfolio data available</p>
      </div>
    );
  }

  // Create a map of date -> data for quick lookup
  const dataByDate = new Map<string, DailyPortfolioData>();
  dailyData.forEach((day) => {
    const dateKey = new Date(day.date).toISOString().split('T')[0];
    dataByDate.set(dateKey, day);
  });

  // Get calendar days for current month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // Generate calendar grid
  const calendarDays: (Date | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add all days in month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const getDayData = (date: Date | null): DailyPortfolioData | undefined => {
    if (!date) return undefined;
    const dateKey = date.toISOString().split('T')[0];
    return dataByDate.get(dateKey);
  };

  const getDayColor = (dayData: DailyPortfolioData | undefined): string => {
    if (!dayData) return 'bg-gray-800';

    const pnl = dayData.dailyPnL;
    if (pnl > 1000) return 'bg-green-600';
    if (pnl > 100) return 'bg-green-500';
    if (pnl > 0) return 'bg-green-400/50';
    if (pnl === 0) return 'bg-gray-700';
    if (pnl > -100) return 'bg-red-400/50';
    if (pnl > -1000) return 'bg-red-500';
    return 'bg-red-600';
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(new Date(year, month - 1))}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
        >
          ← Previous
        </button>
        <h2 className="text-2xl font-bold text-white">
          {monthNames[month]} {year}
        </h2>
        <button
          onClick={() => setCurrentMonth(new Date(year, month + 1))}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          disabled={year === new Date().getFullYear() && month === new Date().getMonth()}
        >
          Next →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-gray-400 text-sm font-medium py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          const dayData = getDayData(date);
          const isToday =
            date &&
            date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`
                aspect-square p-2 rounded-lg cursor-pointer transition-all
                ${getDayColor(dayData)}
                ${isToday ? 'ring-2 ring-blue-400' : ''}
                ${date ? 'hover:opacity-80' : ''}
              `}
              onClick={() => dayData && setSelectedDay(dayData)}
            >
              {date && (
                <div className="h-full flex flex-col items-center justify-center">
                  <span className="text-white font-medium text-sm">{date.getDate()}</span>
                  {dayData && (
                    <span
                      className={`text-xs font-bold mt-1 ${
                        dayData.dailyPnL >= 0 ? 'text-green-200' : 'text-red-200'
                      }`}
                    >
                      {dayData.dailyPnL >= 0 ? '+' : ''}$
                      {Math.abs(dayData.dailyPnL).toFixed(0)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-sm text-gray-400 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded"></div>
          <span>+$1000</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>+$100</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-700 rounded"></div>
          <span>~$0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>-$100</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span>-$1000</span>
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              {new Date(selectedDay.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm">Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                ${formatNumber(selectedDay.totalValue)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Daily P&L</p>
              <p
                className={`text-2xl font-bold ${
                  selectedDay.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {selectedDay.dailyPnL >= 0 ? '+' : ''}${formatNumber(selectedDay.dailyPnL)}
              </p>
              <p
                className={`text-sm ${
                  selectedDay.dailyPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {selectedDay.dailyPnLPercent >= 0 ? '+' : ''}
                {formatPercentage(selectedDay.dailyPnLPercent)}
              </p>
            </div>
          </div>

          {/* Holdings */}
          <div>
            <p className="text-gray-400 text-sm mb-3">Holdings ({selectedDay.holdings.length})</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedDay.holdings.map((holding, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
                >
                  <div>
                    <p className="text-white font-medium">{holding.symbol}</p>
                    <p className="text-gray-400 text-sm">
                      {holding.amount.toLocaleString()} tokens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${formatNumber(holding.value)}</p>
                    <p className="text-gray-400 text-sm">${holding.price.toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
