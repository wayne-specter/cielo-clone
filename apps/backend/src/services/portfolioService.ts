import axios from 'axios';
import { prisma } from '../index';
import { logger } from '../utils/logger';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_API = `https://api.helius.xyz/v0`;

// Start date for portfolio tracking (Jan 1, 2026)
const PORTFOLIO_START_DATE = new Date('2026-01-01T00:00:00Z');

// Known stablecoin addresses for price calculation
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// In-memory price cache to avoid repeated API calls during sync
// Key: tokenAddress, Value: { price: number, timestamp: number }
const priceCache = new Map<string, { price: number; timestamp: number }>();
const PRICE_CACHE_TTL = 60 * 1000; // 1 minute cache

// Historical price cache (date-based, longer TTL since historical prices don't change)
// Key: `${tokenAddress}:${date}`, Value: price
const historicalPriceCache = new Map<string, number>();

/**
 * Retry helper with exponential backoff for rate-limited APIs
 * TEMPORARY: Remove once we upgrade to paid API subscriptions
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error (429)
      const isRateLimit = error.response?.status === 429 || error.code === 'ETIMEDOUT';

      if (!isRateLimit || attempt === maxRetries - 1) {
        throw error; // Not a rate limit or last attempt, throw immediately
      }

      // Calculate delay with exponential backoff: 1s, 2s, 4s, 8s...
      const delay = initialDelay * Math.pow(2, attempt);
      logger.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  tokenTransfers?: Array<{
    mint: string;
    tokenAmount: number;
    fromUserAccount: string;
    toUserAccount: string;
  }>;
  nativeTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
}

export class PortfolioService {
  /**
   * Trigger portfolio sync for a wallet
   * This creates a WalletSync record and starts background processing
   */
  static async triggerWalletSync(userId: string, walletAddress: string, chain: string = 'solana') {
    try {
      logger.info('Triggering wallet sync', { userId, walletAddress, chain });

      // Ensure user exists (create public user if needed)
      if (userId === 'public') {
        await prisma.user.upsert({
          where: { id: 'public' },
          update: {},
          create: {
            id: 'public',
            walletAddress: '',
          },
        });
      }

      // Check if sync already exists
      let walletSync = await prisma.walletSync.findUnique({
        where: {
          userId_walletAddress_chain: {
            userId,
            walletAddress,
            chain,
          },
        },
      });

      if (walletSync) {
        // Check if sync is stale (processing for more than 2 minutes = likely stuck/killed)
        const isStale = walletSync.syncStatus === 'processing' &&
          walletSync.updatedAt &&
          (Date.now() - walletSync.updatedAt.getTime()) > 2 * 60 * 1000; // 2 minutes

        if (isStale) {
          logger.warn('Detected stale sync (processing >10min), restarting', {
            walletAddress,
            lastUpdate: walletSync.updatedAt
          });
          // Treat as failed and restart
          await prisma.dailyPortfolio.deleteMany({
            where: { userId, walletAddress, chain }
          });
          walletSync = await prisma.walletSync.update({
            where: { id: walletSync.id },
            data: {
              syncStatus: 'pending',
              errorMessage: 'Stale sync detected, restarting',
              lastSyncedBlock: null,
            },
          });
        }
        // If processing or pending (and not stale), return existing (avoid duplicate processing)
        else if (walletSync.syncStatus === 'processing' || walletSync.syncStatus === 'pending') {
          logger.info('Wallet sync already in progress', { walletAddress });
          return walletSync;
        }
        // If completed or failed, re-trigger sync (allows refresh with updated price logic)
        else if (walletSync.syncStatus === 'completed' || walletSync.syncStatus === 'failed') {
          logger.info('Re-triggering wallet sync', { walletAddress, previousStatus: walletSync.syncStatus });

          // Delete old daily portfolio data to avoid duplicates
          await prisma.dailyPortfolio.deleteMany({
            where: { userId, walletAddress, chain }
          });

          walletSync = await prisma.walletSync.update({
            where: { id: walletSync.id },
            data: {
              syncStatus: 'pending',
              errorMessage: null,
              lastSyncedBlock: null,
            },
          });
        }
      } else {
        // Create new sync record
        walletSync = await prisma.walletSync.create({
          data: {
            userId,
            walletAddress,
            chain,
            syncStatus: 'pending',
            startDate: PORTFOLIO_START_DATE,
          },
        });
      }

      // Start background processing (fire and forget)
      this.processWalletSync(walletSync.id).catch((error) => {
        logger.error('Background wallet sync failed', error);
      });

      return walletSync;
    } catch (error: any) {
      logger.error('Error triggering wallet sync', error);
      throw error;
    }
  }

  /**
   * Background job: Process wallet sync
   * Fetches transactions, calculates P&L, creates daily snapshots
   */
  private static async processWalletSync(syncId: string) {
    try {
      logger.info('Starting wallet sync processing', { syncId });

      // Update status to processing
      const walletSync = await prisma.walletSync.update({
        where: { id: syncId },
        data: { syncStatus: 'processing' },
      });

      const { userId, walletAddress, chain, startDate } = walletSync;

      // Step 1: Fetch all transactions from Helius
      logger.info('Fetching transactions from Helius', { walletAddress });
      const transactions = await this.fetchTransactionsFromHelius(walletAddress, startDate);

      logger.info(`Fetched ${transactions.length} transactions`, { walletAddress });

      // Step 2: Parse and save transactions
      await this.parseAndSaveTransactions(userId, walletAddress, chain, transactions);

      // Step 3: Calculate daily snapshots
      logger.info('Calculating daily portfolio snapshots', { walletAddress });
      await this.calculateDailySnapshots(userId, walletAddress, chain, startDate);

      // Step 4: Mark as completed
      await prisma.walletSync.update({
        where: { id: syncId },
        data: {
          syncStatus: 'completed',
          completedAt: new Date(),
        },
      });

      logger.info('Wallet sync completed successfully', { syncId, walletAddress });
    } catch (error: any) {
      logger.error('Wallet sync processing failed', error);

      // Mark as failed
      await prisma.walletSync.update({
        where: { id: syncId },
        data: {
          syncStatus: 'failed',
          errorMessage: error.message,
        },
      });
    }
  }

  /**
   * Fetch all transactions from Helius for a wallet
   */
  private static async fetchTransactionsFromHelius(
    walletAddress: string,
    startDate: Date
  ): Promise<HeliusTransaction[]> {
    const allTransactions: HeliusTransaction[] = [];
    let beforeSignature: string | undefined;
    const startTimestamp = Math.floor(startDate.getTime() / 1000);

    try {
      // Fetch transactions in batches with retry logic
      while (true) {
        const url = `${HELIUS_API}/addresses/${walletAddress}/transactions`;
        const params: any = {
          'api-key': HELIUS_API_KEY,
          limit: 100,
        };

        if (beforeSignature) {
          params.before = beforeSignature;
        }

        // Wrap in retry logic to handle rate limits
        const response = await retryWithBackoff(() => axios.get(url, { params }));
        const txs = response.data;

        if (!txs || txs.length === 0) {
          break;
        }

        // Filter transactions after start date
        const recentTxs = txs.filter((tx: HeliusTransaction) => tx.timestamp >= startTimestamp);

        allTransactions.push(...recentTxs);

        // If we got transactions before our start date, stop
        if (recentTxs.length < txs.length) {
          break;
        }

        // Continue with next batch
        beforeSignature = txs[txs.length - 1].signature;

        // Delay to avoid Helius rate limits (200ms between requests)
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      return allTransactions;
    } catch (error: any) {
      logger.error('Error fetching transactions from Helius', error);
      throw new Error('Failed to fetch transactions from Helius');
    }
  }

  /**
   * Extract prices from swap transaction
   * Builds unified swap legs from both tokenTransfers and nativeTransfers (SOL)
   * Example: Swap 1 SOL → 100 USDC means SOL price = $100
   */
  private static extractPricesFromSwap(
    tx: HeliusTransaction,
    walletAddress: string
  ): Map<string, number> {
    const prices = new Map<string, number>();

    if (tx.type !== 'SWAP') {
      return prices;
    }

    // Build unified swap legs from both token and native transfers
    interface SwapLeg { mint: string; amount: number; direction: 'sent' | 'received'; }
    const legs: SwapLeg[] = [];

    if (tx.tokenTransfers) {
      for (const t of tx.tokenTransfers) {
        if (t.fromUserAccount === walletAddress) {
          legs.push({ mint: t.mint, amount: t.tokenAmount, direction: 'sent' });
        } else if (t.toUserAccount === walletAddress) {
          legs.push({ mint: t.mint, amount: t.tokenAmount, direction: 'received' });
        }
      }
    }

    // Include native SOL transfers as swap legs
    if (tx.nativeTransfers) {
      for (const t of tx.nativeTransfers) {
        const solAmount = t.amount / 1e9; // lamports to SOL
        if (solAmount < 0.001) continue; // skip dust/fees
        if (t.fromUserAccount === walletAddress) {
          legs.push({ mint: SOL_MINT, amount: solAmount, direction: 'sent' });
        } else if (t.toUserAccount === walletAddress) {
          legs.push({ mint: SOL_MINT, amount: solAmount, direction: 'received' });
        }
      }
    }

    const sent = legs.filter(l => l.direction === 'sent');
    const received = legs.filter(l => l.direction === 'received');

    if (sent.length === 0 || received.length === 0) {
      return prices;
    }

    const tokenOut = sent[0]; // Token user sold
    const tokenIn = received[0]; // Token user bought

    // Stablecoin-based pricing
    const isStablecoinOut = tokenOut.mint === USDC_MINT || tokenOut.mint === USDT_MINT;
    const isStablecoinIn = tokenIn.mint === USDC_MINT || tokenIn.mint === USDT_MINT;

    if (isStablecoinOut) {
      prices.set(tokenIn.mint, tokenOut.amount / tokenIn.amount);
      prices.set(tokenOut.mint, 1);
    } else if (isStablecoinIn) {
      prices.set(tokenOut.mint, tokenIn.amount / tokenOut.amount);
      prices.set(tokenIn.mint, 1);
    }

    return prices;
  }

  /**
   * Parse transactions and save to database
   */
  private static async parseAndSaveTransactions(
    userId: string,
    walletAddress: string,
    chain: string,
    transactions: HeliusTransaction[]
  ) {
    for (const tx of transactions) {
      try {
        // Extract prices from swap if this is a swap transaction
        const swapPrices = this.extractPricesFromSwap(tx, walletAddress);

        // Parse token transfers
        if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
          for (const transfer of tx.tokenTransfers) {
            const isReceive = transfer.toUserAccount === walletAddress;
            const isSend = transfer.fromUserAccount === walletAddress;

            if (!isReceive && !isSend) continue;

            // Determine transaction type
            let type = tx.type === 'SWAP' ? (isSend ? 'sell' : 'buy') : 'transfer_in';
            if (isSend && !isReceive && tx.type !== 'SWAP') {
              type = 'transfer_out';
            }

            // Get token price at time of transaction
            // Priority: 1) Price from swap  2) Current price as fallback
            let priceUsd = swapPrices.get(transfer.mint) || 0;
            if (priceUsd === 0) {
              priceUsd = await this.getHistoricalPrice(transfer.mint, tx.timestamp);
            }

            const valueUsd = Math.abs(transfer.tokenAmount) * priceUsd;

            // Save transaction
            await prisma.portfolioTransaction.upsert({
              where: {
                txHash_tokenAddress: {
                  txHash: tx.signature,
                  tokenAddress: transfer.mint,
                },
              },
              create: {
                userId,
                walletAddress,
                chain,
                txHash: tx.signature,
                tokenAddress: transfer.mint,
                tokenSymbol: 'UNKNOWN', // Will be enriched later
                tokenName: 'Unknown Token',
                type,
                amount: isReceive ? transfer.tokenAmount : -transfer.tokenAmount,
                priceUsd,
                valueUsd,
                timestamp: new Date(tx.timestamp * 1000),
                blockNumber: 0, // Helius doesn't provide this in parsed data
              },
              update: {},
            });
          }
        }

        // Parse native SOL transfers
        if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
          for (const transfer of tx.nativeTransfers) {
            const isReceive = transfer.toUserAccount === walletAddress;
            const isSend = transfer.fromUserAccount === walletAddress;

            if (!isReceive && !isSend) continue;

            // Convert lamports to SOL
            const solAmount = transfer.amount / 1e9;

            // Skip dust amounts (fees, rent) -- less than 0.001 SOL
            if (solAmount < 0.001) continue;

            // Determine transaction type
            let type = tx.type === 'SWAP' ? (isSend ? 'sell' : 'buy') : 'transfer_in';
            if (isSend && !isReceive && tx.type !== 'SWAP') {
              type = 'transfer_out';
            }

            // Get SOL price at time of transaction
            let priceUsd = swapPrices.get(SOL_MINT) || 0;
            if (priceUsd === 0) {
              priceUsd = await this.getHistoricalPrice(SOL_MINT, tx.timestamp);
            }

            const valueUsd = solAmount * priceUsd;

            await prisma.portfolioTransaction.upsert({
              where: {
                txHash_tokenAddress: {
                  txHash: tx.signature,
                  tokenAddress: SOL_MINT,
                },
              },
              create: {
                userId,
                walletAddress,
                chain,
                txHash: tx.signature,
                tokenAddress: SOL_MINT,
                tokenSymbol: 'SOL',
                tokenName: 'Solana',
                type,
                amount: isReceive ? solAmount : -solAmount,
                priceUsd,
                valueUsd,
                timestamp: new Date(tx.timestamp * 1000),
                blockNumber: 0,
              },
              update: {},
            });
          }
        }
      } catch (error: any) {
        logger.error('Error parsing transaction', { txHash: tx.signature, error: error.message });
        // Continue with next transaction
      }
    }
  }

  /**
   * Calculate daily portfolio snapshots
   */
  private static async calculateDailySnapshots(
    userId: string,
    walletAddress: string,
    chain: string,
    _startDate: Date
  ) {
    // Get all transactions
    const transactions = await prisma.portfolioTransaction.findMany({
      where: {
        userId,
        walletAddress,
        chain,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (transactions.length === 0) {
      logger.info('No transactions found, skipping snapshot calculation');
      return;
    }

    // Group by day and calculate holdings
    const dailyHoldings = new Map<string, Map<string, number>>();
    const tokenInfo = new Map<string, { symbol: string; name: string }>();

    // Calculate cumulative holdings for each day (only days with transactions)
    for (const tx of transactions) {
      const dateKey = tx.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dailyHoldings.has(dateKey)) {
        // Copy previous day's holdings (look backwards through sorted keys)
        const sortedKeys = Array.from(dailyHoldings.keys()).sort();
        const lastKey = sortedKeys.length > 0 ? sortedKeys[sortedKeys.length - 1] : null;

        if (lastKey && dailyHoldings.has(lastKey)) {
          dailyHoldings.set(dateKey, new Map(dailyHoldings.get(lastKey)!));
        } else {
          dailyHoldings.set(dateKey, new Map());
        }
      }

      const dayHoldings = dailyHoldings.get(dateKey)!;
      const currentAmount = dayHoldings.get(tx.tokenAddress) || 0;
      dayHoldings.set(tx.tokenAddress, currentAmount + tx.amount);

      tokenInfo.set(tx.tokenAddress, {
        symbol: tx.tokenSymbol,
        name: tx.tokenName,
      });
    }

    // Gap-fill: ensure every date from first transaction to today has an entry
    const sortedDates = Array.from(dailyHoldings.keys()).sort();
    const firstDate = new Date(sortedDates[0] + 'T00:00:00Z');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const cursor = new Date(firstDate);
    let prevKey: string | null = null;

    while (cursor <= today) {
      const cursorKey = cursor.toISOString().split('T')[0];

      if (!dailyHoldings.has(cursorKey)) {
        // Carry forward previous day's holdings
        if (prevKey && dailyHoldings.has(prevKey)) {
          dailyHoldings.set(cursorKey, new Map(dailyHoldings.get(prevKey)!));
        } else {
          dailyHoldings.set(cursorKey, new Map());
        }
      }

      prevKey = cursorKey;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // Sort all date keys for sequential processing
    const allDates = Array.from(dailyHoldings.keys()).sort();

    // Create daily snapshots
    let previousTotalValue = 0;

    for (const dateKey of allDates) {
      const holdings = dailyHoldings.get(dateKey)!;
      const date = new Date(dateKey + 'T00:00:00Z');

      // Calculate total value for this day
      let totalValue = 0;
      const holdingsArray: any[] = [];

      // For today, use batch pricing for efficiency
      const todayKey = new Date().toISOString().split('T')[0];
      const isToday = dateKey === todayKey;
      let batchPrices: Map<string, number> | null = null;

      if (isToday) {
        const tokenAddrs = Array.from(holdings.keys()).filter(addr => (holdings.get(addr) || 0) !== 0);
        if (tokenAddrs.length > 0) {
          batchPrices = await this.batchGetCurrentPrices(tokenAddrs);
        }
      }

      for (const [tokenAddress, amount] of holdings.entries()) {
        if (amount === 0) continue; // Skip if fully sold

        const info = tokenInfo.get(tokenAddress);

        let price: number;
        if (batchPrices && batchPrices.has(tokenAddress)) {
          price = batchPrices.get(tokenAddress)!;
        } else {
          const endOfDayTimestamp = Math.floor(date.getTime() / 1000) + (24 * 60 * 60) - 1;
          price = await this.getHistoricalPrice(tokenAddress, endOfDayTimestamp);
        }

        const value = amount * price;
        totalValue += value;

        holdingsArray.push({
          tokenAddress,
          symbol: info?.symbol || 'UNKNOWN',
          name: info?.name || 'Unknown',
          amount,
          price,
          value,
        });
      }

      // Calculate net inflows for this day (only transfers, not swaps)
      const dayStart = new Date(dateKey + 'T00:00:00Z');
      const dayEnd = new Date(dateKey + 'T23:59:59.999Z');

      const dayTransfers = await prisma.portfolioTransaction.findMany({
        where: {
          userId,
          walletAddress,
          chain,
          timestamp: { gte: dayStart, lte: dayEnd },
          type: { in: ['transfer_in', 'transfer_out'] },
        },
      });

      let netInflows = 0;
      for (const t of dayTransfers) {
        if (t.type === 'transfer_in') {
          netInflows += t.valueUsd;
        } else if (t.type === 'transfer_out') {
          netInflows -= t.valueUsd;
        }
      }

      // Correct P&L: value change minus external flows
      const dailyPnL = (totalValue - previousTotalValue) - netInflows;
      const dailyPnLPercent = previousTotalValue > 0 ? (dailyPnL / previousTotalValue) * 100 : 0;

      // Save snapshot
      await prisma.dailyPortfolio.upsert({
        where: {
          userId_walletAddress_chain_date: {
            userId,
            walletAddress,
            chain,
            date,
          },
        },
        create: {
          userId,
          walletAddress,
          chain,
          date,
          totalValue,
          dailyPnL,
          dailyPnLPercent,
          holdings: holdingsArray,
        },
        update: {
          totalValue,
          dailyPnL,
          dailyPnLPercent,
          holdings: holdingsArray,
        },
      });

      previousTotalValue = totalValue;
    }

    logger.info('Daily snapshots calculated', {
      userId,
      walletAddress,
      days: allDates.length,
    });
  }

  /**
   * Get historical price for a token at a specific date
   * Priority: 1) Database  2) CoinGecko API  3) Current price fallback
   */
  private static async getHistoricalPrice(tokenAddress: string, timestamp: number): Promise<number> {
    const date = new Date(timestamp * 1000);
    date.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // Check in-memory cache first (fastest)
    const cacheKey = `${tokenAddress}:${dateStr}`;
    const cached = historicalPriceCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Check database for stored historical price
    const storedPrice = await prisma.tokenPrice.findUnique({
      where: {
        tokenAddress_chain_date: {
          tokenAddress,
          chain: 'solana',
          date,
        },
      },
    });

    if (storedPrice) {
      logger.debug('Using stored historical price from DB', {
        tokenAddress,
        date: dateStr,
        price: storedPrice.price,
        source: storedPrice.source,
      });
      historicalPriceCache.set(cacheKey, storedPrice.price);
      return storedPrice.price;
    }

    let price = 0;
    let source = 'unknown';

    // For SOL, fetch from CoinGecko and store in database
    if (tokenAddress === SOL_MINT) {
      try {
        // CoinGecko format: DD-MM-YYYY
        const dd = date.getDate().toString().padStart(2, '0');
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const yyyy = date.getFullYear();
        const coinGeckoDate = `${dd}-${mm}-${yyyy}`;

        // Add 3-second delay before calling CoinGecko to avoid rate limits
        // This is acceptable since we only call once per unique date and store in DB
        await new Promise(resolve => setTimeout(resolve, 3000));

        const response = await retryWithBackoff(
          () => axios.get(
            `https://api.coingecko.com/api/v3/coins/solana/history?date=${coinGeckoDate}`,
            {
              timeout: 5000,
              validateStatus: (status) => status === 200 || status === 429,
            }
          ),
          3, // max 3 retries
          2000 // start with 2s delay
        );

        if (response.status === 429) {
          logger.warn('CoinGecko rate limited after retries, using current price', { date: coinGeckoDate });
          price = await this.getCurrentPrice(tokenAddress);
          source = 'fallback_current';
        } else {
          const historicalPrice = response.data?.market_data?.current_price?.usd;
          if (historicalPrice && historicalPrice > 0) {
            price = historicalPrice;
            source = 'coingecko';
            logger.info('✅ Fetched historical price from CoinGecko', {
              date: coinGeckoDate,
              price,
            });
          }
        }
      } catch (error) {
        logger.debug('CoinGecko historical API failed, using current price', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        price = await this.getCurrentPrice(tokenAddress);
        source = 'fallback_current';
      }
    }

    // For other tokens, use current price (no free historical API available)
    if (price === 0) {
      price = await this.getCurrentPrice(tokenAddress);
      source = 'fallback_current';
    }

    // Store in database ONLY if from reliable source (not fallback)
    // Fallback prices are current prices masquerading as historical - don't store them!
    if (price > 0 && source !== 'fallback_current') {
      try {
        await prisma.tokenPrice.create({
          data: {
            tokenAddress,
            chain: 'solana',
            date,
            price,
            source,
          },
        });
        logger.info('✅ Stored historical price in DB', { tokenAddress, date: dateStr, price, source });
      } catch (error) {
        // Ignore duplicate errors (race condition if multiple syncs happening)
        logger.debug('Failed to store price in DB (likely duplicate)', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else if (source === 'fallback_current') {
      logger.warn('⚠️ Using current price as fallback - NOT storing in DB', {
        tokenAddress,
        date: dateStr,
        price
      });
    }

    // Cache in memory
    historicalPriceCache.set(cacheKey, price);

    return price;
  }

  /**
   * Get current price for a token with multiple fallback sources
   */
  private static async getCurrentPrice(tokenAddress: string): Promise<number> {
    try {
      // Check cache first
      const cached = priceCache.get(tokenAddress);
      if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
        return cached.price;
      }

      let price = 0;

      // For SOL, use reliable public APIs
      if (tokenAddress === SOL_MINT) {
        // 1. Try CoinGecko first (free, reliable)
        try {
          const coingeckoResponse = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
            { timeout: 3000 }
          );
          const solPrice = coingeckoResponse.data?.solana?.usd;
          if (solPrice && solPrice > 0) {
            price = solPrice;
            logger.debug('Got CoinGecko price for SOL', { price });
          }
        } catch (error) {
          logger.debug('CoinGecko API failed for SOL', { error: error instanceof Error ? error.message : 'Unknown error' });
        }

        // 2. Try Binance as fallback (free, reliable)
        if (price === 0) {
          try {
            const binanceResponse = await axios.get(
              'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT',
              { timeout: 3000 }
            );
            const binancePrice = parseFloat(binanceResponse.data?.price || '0');
            if (binancePrice > 0) {
              price = binancePrice;
              logger.debug('Got Binance price for SOL', { price });
            }
          } catch (error) {
            logger.warn('All price sources failed for SOL', { error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }
      }

      // For other SPL tokens, use Jupiter Price API V3
      if (price === 0 && tokenAddress !== SOL_MINT) {
        try {
          const response = await retryWithBackoff(
            () => axios.get(`https://api.jup.ag/price/v3/price?ids=${tokenAddress}`, { timeout: 5000 }),
            3,
            1000
          );
          const tokenData = response.data?.data?.[tokenAddress];
          if (tokenData?.price) {
            price = parseFloat(tokenData.price);
            logger.debug('Got Jupiter price for token', { tokenAddress, price });
          }
        } catch (error) {
          logger.debug('Jupiter API failed for token', {
            tokenAddress,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Cache the result (even if 0) to avoid retrying failed APIs
      priceCache.set(tokenAddress, { price, timestamp: Date.now() });

      return price;
    } catch (error) {
      logger.error('Failed to get current price', { tokenAddress, error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }

  /**
   * Batch fetch current prices for multiple tokens via Jupiter Price API V3.
   * Handles up to 50 tokens per request.
   */
  private static async batchGetCurrentPrices(tokenAddresses: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    // Get SOL price via existing method
    if (tokenAddresses.includes(SOL_MINT)) {
      const solPrice = await this.getCurrentPrice(SOL_MINT);
      result.set(SOL_MINT, solPrice);
    }

    // Batch non-SOL tokens via Jupiter
    const nonSolTokens = tokenAddresses.filter(addr => addr !== SOL_MINT);
    for (let i = 0; i < nonSolTokens.length; i += 50) {
      const batch = nonSolTokens.slice(i, i + 50);
      const ids = batch.join(',');

      try {
        const response = await retryWithBackoff(
          () => axios.get(`https://api.jup.ag/price/v3/price?ids=${ids}`, { timeout: 5000 }),
          3,
          1000
        );

        const data = response.data?.data;
        if (data) {
          for (const [mint, info] of Object.entries(data)) {
            const priceInfo = info as any;
            if (priceInfo?.price) {
              const price = parseFloat(priceInfo.price);
              result.set(mint, price);
              priceCache.set(mint, { price, timestamp: Date.now() });
            }
          }
        }
      } catch (error) {
        logger.warn('Jupiter batch price API failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          batchSize: batch.length,
        });
      }
    }

    return result;
  }

  /**
   * Get wallet sync status
   */
  static async getWalletSyncStatus(userId: string, walletAddress: string, chain: string = 'solana') {
    return await prisma.walletSync.findUnique({
      where: {
        userId_walletAddress_chain: {
          userId,
          walletAddress,
          chain,
        },
      },
    });
  }

  /**
   * Get daily portfolio data for a date range
   */
  static async getDailyPortfolio(
    userId: string,
    walletAddress: string,
    chain: string,
    startDate: Date,
    endDate: Date
  ) {
    return await prisma.dailyPortfolio.findMany({
      where: {
        userId,
        walletAddress,
        chain,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }
}
