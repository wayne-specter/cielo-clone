import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { logger } from '@/lib/utils';

export function useAuth() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();

  useEffect(() => {
    async function syncWithBackend() {
      if (!ready || !authenticated || !user) {
        return;
      }

      try {
        // Get Privy access token
        const token = await getAccessToken();

        if (!token) {
          console.error('No access token available');
          return;
        }

        // Save token to localStorage
        localStorage.setItem('auth_token', token);

        // Sync with backend (create/update user in database)
        const response = await apiClient.post('/api/v1/auth/login', {
          token,
        });

        console.log('✅ User synced with backend:', response.data);
      } catch (error: any) {
        console.error('❌ Failed to sync with backend:', error.response?.data || error.message);
      }
    }

    syncWithBackend();
  }, [ready, authenticated, user, getAccessToken]);

  return {
    ready,
    authenticated,
    user,
  };
}
