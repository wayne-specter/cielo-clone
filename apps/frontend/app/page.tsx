'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { TrendingUp, Wallet, Bell, BarChart3 } from 'lucide-react';

export default function Home() {
  const { ready, authenticated, login } = usePrivy();

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Crypto Trading Analytics
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Track wallets, analyze trends, and monitor your crypto portfolio in real-time across 30+ blockchains.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {!ready ? (
              <Button size="lg" disabled>
                Loading...
              </Button>
            ) : !authenticated ? (
              <>
                <Button size="lg" onClick={login}>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </Button>
                <Link href="/trending">
                  <Button size="lg" variant="outline">
                    View Trending
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard">
                  <Button size="lg">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/trending">
                  <Button size="lg" variant="outline">
                    View Trending
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition">
            <TrendingUp className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Trending Tokens</h3>
            <p className="text-muted-foreground">
              Discover emerging tokens with real-time trending data and mindshare metrics.
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition">
            <Wallet className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Wallet Tracking</h3>
            <p className="text-muted-foreground">
              Follow top traders and monitor wallet activities across multiple chains.
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition">
            <BarChart3 className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Portfolio Analytics</h3>
            <p className="text-muted-foreground">
              Track your portfolio performance with advanced PnL calculations.
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition">
            <Bell className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Alerts</h3>
            <p className="text-muted-foreground">
              Get instant notifications via Telegram for price changes and wallet movements.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary mb-2">30+</p>
              <p className="text-muted-foreground">Blockchains Supported</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">Real-time</p>
              <p className="text-muted-foreground">Price Updates</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">Non-custodial</p>
              <p className="text-muted-foreground">Your Keys, Your Crypto</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
