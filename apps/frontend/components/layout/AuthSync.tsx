'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useRef } from 'react';
import apiClient from '@/lib/api/client';

/**
 * This component syncs Privy authentication with our backend
 * It automatically calls /api/v1/auth/login when a user connects their wallet
 */
export function AuthSync() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const syncInProgress = useRef(false);
  const hasSynced = useRef(false);

  useEffect(() => {
    async function syncWithBackend() {
      // Only sync once when user is authenticated
      if (!ready || !authenticated || !user) {
        return;
      }

      // Prevent duplicate requests
      if (syncInProgress.current || hasSynced.current) {
        return;
      }

      syncInProgress.current = true;

      try {
        console.log('🔄 Syncing user with backend...');

        // Get Privy access token
        const token = await getAccessToken();

        if (!token) {
          console.error('❌ No access token available');
          syncInProgress.current = false;
          return;
        }

        // Save token to localStorage
        localStorage.setItem('auth_token', token);

        // Sync with backend (create/update user in database)
        const response = await apiClient.post('/api/v1/auth/login', {
          token,
        });

        console.log('✅ User synced with backend:', response.data);
        hasSynced.current = true;
      } catch (error: any) {
        console.error(
          '❌ Failed to sync with backend:',
          error.response?.data || error.message
        );
      } finally {
        syncInProgress.current = false;
      }
    }

    syncWithBackend();
  }, [ready, authenticated, user, getAccessToken]);

  // Reset synced state when user logs out
  useEffect(() => {
    if (!authenticated) {
      hasSynced.current = false;
      localStorage.removeItem('auth_token');
    }
  }, [authenticated]);

  // This component doesn't render anything
  return null;
}
