import { Router } from 'express';
import { PrivyClient } from '@privy-io/server-auth';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';
import { ApiResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';
import { PortfolioService } from '../services/portfolioService';

const router = Router();

// Initialize Privy client
const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

/**
 * POST /api/v1/auth/login
 * Verify Privy token and create/update user
 */
router.post('/login', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return ApiResponseHandler.error(res, 'Token is required', 400);
    }

    // Verify token with Privy
    const verifiedClaims = await privy.verifyAuthToken(token);
    const userId = verifiedClaims.userId;

    // Get user data from Privy
    const privyUser = await privy.getUser(userId);

    if (!privyUser) {
      return ApiResponseHandler.error(res, 'User not found in Privy', 404);
    }

    const walletAddress = privyUser.wallet?.address || '';

    // Find or create user in database
    let user = await prisma.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          id: userId,
          walletAddress,
        },
      });

      logger.info('New user registered', { userId, walletAddress });

      // Trigger portfolio sync for new user
      if (walletAddress) {
        PortfolioService.triggerWalletSync(userId, walletAddress, 'solana').catch((error) => {
          logger.error('Failed to trigger portfolio sync for new user', error);
        });
      }
    } else {
      // Update wallet address if changed
      if (user.walletAddress !== walletAddress) {
        user = await prisma.user.update({
          where: { id: userId },
          data: { walletAddress },
        });

        logger.info('User wallet updated', { userId, walletAddress });
      }
    }

    // Get wallet sync status
    let walletSyncStatus = null;
    if (walletAddress) {
      walletSyncStatus = await PortfolioService.getWalletSyncStatus(userId, walletAddress, 'solana');
    }

    return ApiResponseHandler.success(
      res,
      {
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          createdAt: user.createdAt,
        },
        portfolioSync: walletSyncStatus,
      },
      'Login successful',
      200
    );
  } catch (error: any) {
    logger.error('Login error', error);
    return ApiResponseHandler.error(
      res,
      error.message || 'Login failed',
      500
    );
  }
});

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return ApiResponseHandler.error(res, 'User not found', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return ApiResponseHandler.error(res, 'User not found', 404);
    }

    return ApiResponseHandler.success(res, { user });
  } catch (error: any) {
    logger.error('Get user error', error);
    return ApiResponseHandler.error(res, 'Failed to get user data', 500);
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user (client-side handles token deletion)
 */
router.post('/logout', authMiddleware, async (req: AuthRequest, res) => {
  try {
    return ApiResponseHandler.success(res, null, 'Logout successful');
  } catch (error: any) {
    logger.error('Logout error', error);
    return ApiResponseHandler.error(res, 'Logout failed', 500);
  }
});

export default router;
