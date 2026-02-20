'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! View your portfolio and trading analytics.
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Wallet Address</span>
              <span className="font-mono text-sm">{user?.wallet?.address}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Chain</span>
              <span className="text-sm">{user?.wallet?.chainType || 'Ethereum'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Status</span>
              <span className="text-sm text-green-600 font-medium">● Connected</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Portfolio Value
            </h3>
            <p className="text-3xl font-bold">$0.00</p>
            <p className="text-sm text-muted-foreground mt-1">+0.00% (24h)</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Tracked Wallets
            </h3>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-muted-foreground mt-1">No wallets tracked</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Alerts</h3>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-muted-foreground mt-1">No alerts configured</p>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-muted rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">More Features Coming Soon</h3>
          <p className="text-muted-foreground mb-6">
            We're building trending tokens, portfolio tracking, and real-time alerts!
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline">View Trending Tokens</Button>
            <Button variant="outline">Set Up Alerts</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
