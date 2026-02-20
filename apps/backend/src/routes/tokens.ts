import { Router } from 'express';
import { TokenService } from '../services/tokenService';
import { ApiResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';
import { optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/tokens/trending
 * Get trending tokens
 */
router.get('/trending', optionalAuthMiddleware, async (req, res) => {
  try {
    const chain = (req.query.chain as string) || 'solana';
    const limit = parseInt(req.query.limit as string) || 50;

    const tokens = await TokenService.getTrendingTokens(chain, limit);

    return ApiResponseHandler.success(res, {
      tokens,
      count: tokens.length,
      chain,
    });
  } catch (error: any) {
    logger.error('Get trending tokens error', error);
    return ApiResponseHandler.error(res, 'Failed to fetch trending tokens', 500);
  }
});

/**
 * GET /api/v1/tokens/:address
 * Get token details by address
 */
router.get('/:address', optionalAuthMiddleware, async (req, res) => {
  try {
    const { address } = req.params;
    const chain = (req.query.chain as string) || 'solana';

    const token = await TokenService.getTokenByAddress(chain, address);

    if (!token) {
      return ApiResponseHandler.error(res, 'Token not found', 404);
    }

    return ApiResponseHandler.success(res, { token });
  } catch (error: any) {
    logger.error('Get token error', error);
    return ApiResponseHandler.error(res, 'Failed to fetch token', 500);
  }
});

/**
 * GET /api/v1/tokens/search
 * Search tokens
 */
router.get('/search/query', optionalAuthMiddleware, async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query) {
      return ApiResponseHandler.error(res, 'Query parameter is required', 400);
    }

    const tokens = await TokenService.searchTokens(query, limit);

    return ApiResponseHandler.success(res, {
      tokens,
      count: tokens.length,
      query,
    });
  } catch (error: any) {
    logger.error('Search tokens error', error);
    return ApiResponseHandler.error(res, 'Failed to search tokens', 500);
  }
});

export default router;
