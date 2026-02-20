'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { truncateAddress } from '@/lib/utils';
import { Wallet } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [showChainAlert, setShowChainAlert] = useState(false);

  const walletAddress = user?.wallet?.address;
  const walletChainType = user?.wallet?.chainType; // 'ethereum' or 'solana'

  const handleConnect = () => {
    setShowChainAlert(true);
    setTimeout(() => {
      login();
    }, 100);
  };

  return (
    <>
      {/* Chain Alert */}
      {showChainAlert && !authenticated && (
        <div className="bg-purple-900/90 text-white px-4 py-3 text-center text-sm">
          <p>
            <strong>Important:</strong> Please select <strong>Solana</strong> network in your Phantom wallet before connecting.
            {' '}
            <button
              onClick={() => setShowChainAlert(false)}
              className="underline ml-2"
            >
              Dismiss
            </button>
          </p>
        </div>
      )}

      <nav className="border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="font-bold text-xl">Cielo Clone</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                Dashboard
              </Link>
              <Link
                href="/trending"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                Trending
              </Link>
              <Link
                href="/portfolio"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                Portfolio
              </Link>
              <Link
                href="/alerts"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                Alerts
              </Link>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-4">
              {!ready ? (
                <Button disabled variant="outline" size="sm">
                  Loading...
                </Button>
              ) : !authenticated ? (
                <Button onClick={handleConnect} size="sm">
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  {/* Chain indicator */}
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    walletChainType === 'solana'
                      ? 'bg-purple-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {walletChainType === 'solana' ? '◎ SOL' : 'Ξ ETH'}
                  </div>
                  <div className="px-3 py-2 bg-secondary rounded-md">
                    <p className="text-sm font-mono">
                      {walletAddress ? truncateAddress(walletAddress) : 'Connected'}
                    </p>
                  </div>
                  <Button onClick={logout} variant="outline" size="sm">
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
