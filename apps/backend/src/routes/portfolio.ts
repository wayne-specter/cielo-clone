import { Router } from 'express';
import { PortfolioService } from '../services/portfolioService';
import { ApiResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';
import { optionalAuthMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Constant for public/unauthenticated wallet analyses
const PUBLIC_USER_ID = 'public';

/**
 * POST /api/v1/portfolio/sync
 * Trigger portfolio sync for any wallet (public or authenticated)
 */
router.post('/sync', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || PUBLIC_USER_ID;
    const { walletAddress, chain = 'solana' } = req.body;

    if (!walletAddress) {
      return ApiResponseHandler.error(res, 'Wallet address is required', 400);
    }

    const walletSync = await PortfolioService.triggerWalletSync(userId, walletAddress, chain);

    return ApiResponseHandler.success(
      res,
      {
        sync: walletSync,
      },
      'Portfolio sync triggered'
    );
  } catch (error: any) {
    logger.error('Portfolio sync error', error);
    return ApiResponseHandler.error(res, 'Failed to trigger portfolio sync', 500);
  }
});

/**
 * GET /api/v1/portfolio/sync/status
 * Get portfolio sync status (public or authenticated)
 */
router.get('/sync/status', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || PUBLIC_USER_ID;
    const walletAddress = req.query.walletAddress as string;
    const chain = (req.query.chain as string) || 'solana';

    if (!walletAddress) {
      return ApiResponseHandler.error(res, 'Wallet address is required', 400);
    }

    const status = await PortfolioService.getWalletSyncStatus(userId, walletAddress, chain);

    if (!status) {
      return ApiResponseHandler.error(res, 'No sync found for this wallet', 404);
    }

    return ApiResponseHandler.success(res, { status });
  } catch (error: any) {
    logger.error('Get sync status error', error);
    return ApiResponseHandler.error(res, 'Failed to get sync status', 500);
  }
});

/**
 * GET /api/v1/portfolio/daily
 * Get daily portfolio snapshots (public or authenticated)
 */
router.get('/daily', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || PUBLIC_USER_ID;
    const walletAddress = req.query.walletAddress as string;
    const chain = (req.query.chain as string) || 'solana';
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date('2026-01-01');
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    if (!walletAddress) {
      return ApiResponseHandler.error(res, 'Wallet address is required', 400);
    }

    const dailyData = await PortfolioService.getDailyPortfolio(
      userId,
      walletAddress,
      chain,
      startDate,
      endDate
    );

    return ApiResponseHandler.success(res, {
      data: dailyData,
      count: dailyData.length,
      startDate,
      endDate,
    });
  } catch (error: any) {
    logger.error('Get daily portfolio error', error);
    return ApiResponseHandler.error(res, 'Failed to fetch daily portfolio', 500);
  }
});

export default router;
