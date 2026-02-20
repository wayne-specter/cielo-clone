import { Request } from 'express';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Chain types
export enum Chain {
  SOLANA = 'solana',
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  BSC = 'bsc',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
}

// Token types
export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
  chain: Chain;
}

// Price data
export interface PriceData {
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
}

// WebSocket event types
export enum WsEventType {
  PRICE_UPDATE = 'price_update',
  WALLET_ACTIVITY = 'wallet_activity',
  ALERT_TRIGGERED = 'alert_triggered',
  NEW_TRANSACTION = 'new_transaction',
}

export interface WsMessage {
  type: WsEventType;
  data: any;
  timestamp: number;
}
