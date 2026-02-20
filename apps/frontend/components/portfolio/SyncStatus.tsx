'use client';

interface SyncStatusProps {
  syncStatus: any;
  isLoading: boolean;
  walletAddress: string;
}

export function SyncStatus({ syncStatus, isLoading, walletAddress }: SyncStatusProps) {
  if (isLoading) {
    return (
      <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-gray-400">Checking sync status...</span>
        </div>
      </div>
    );
  }

  if (!syncStatus) {
    return (
      <div className="mb-8 bg-yellow-900/20 backdrop-blur-sm rounded-2xl border border-yellow-500/50 p-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <p className="text-yellow-400 font-medium">Portfolio Not Synced</p>
            <p className="text-gray-400 text-sm mt-1">
              Your wallet portfolio hasn't been synced yet. We'll start syncing automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { syncStatus: status, completedAt, errorMessage } = syncStatus;

  if (status === 'failed') {
    return (
      <div className="mb-8 bg-red-900/20 backdrop-blur-sm rounded-2xl border border-red-500/50 p-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">❌</span>
          <div>
            <p className="text-red-400 font-medium">Sync Failed</p>
            <p className="text-gray-400 text-sm mt-1">
              {errorMessage || 'An error occurred while syncing your portfolio'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending' || status === 'processing') {
    return (
      <div className="mb-8 bg-blue-900/20 backdrop-blur-sm rounded-2xl border border-blue-500/50 p-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mr-3"></div>
          <div className="flex-1">
            <p className="text-blue-400 font-medium">
              {status === 'pending' ? 'Sync Queued' : 'Syncing Portfolio...'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Fetching transactions and calculating P&L from Jan 1, 2026. This may take a few minutes.
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="mb-8 bg-green-900/20 backdrop-blur-sm rounded-2xl border border-green-500/50 p-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">✅</span>
          <div>
            <p className="text-green-400 font-medium">Portfolio Synced</p>
            <p className="text-gray-400 text-sm mt-1">
              Last synced: {new Date(completedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
