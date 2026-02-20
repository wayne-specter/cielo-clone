import { Request, Response, NextFunction } from 'express';
import { PrivyClient } from '@privy-io/server-auth';
import { AuthRequest } from '../types';
import { prisma } from '../index';
import { logger } from '../utils/logger';

// Initialize Privy client
const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided',
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    try {
      // Verify token with Privy
      const verifiedClaims = await privy.verifyAuthToken(token);

      // Get user ID from claims
      const userId = verifiedClaims.userId;

      // Find or create user in database
      let user = await prisma.user.findFirst({
        where: { id: userId },
      });

      if (!user) {
        // Get user data from Privy
        const privyUser = await privy.getUser(userId);
        const walletAddress = privyUser.wallet?.address || '';

        // Create new user
        user = await prisma.user.create({
          data: {
            id: userId,
            walletAddress,
          },
        });

        logger.info('New user created', { userId, walletAddress });
      }

      // Attach user to request
      req.user = {
        id: user.id,
        walletAddress: user.walletAddress,
      };

      return next();
    } catch (error) {
      logger.error('Token verification failed', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  } catch (error) {
    logger.error('Auth middleware error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// Optional middleware - doesn't fail if not authenticated
export async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const verifiedClaims = await privy.verifyAuthToken(token);
      const userId = verifiedClaims.userId;

      const user = await prisma.user.findFirst({
        where: { id: userId },
      });

      if (user) {
        req.user = {
          id: user.id,
          walletAddress: user.walletAddress,
        };
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional auth failed', error);
    }

    next();
  } catch (error) {
    next();
  }
}
