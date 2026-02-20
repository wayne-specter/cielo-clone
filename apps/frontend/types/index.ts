// User & Auth Types
export interface User {
  id: string;
  walletAddress: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Token Types
export interface Token {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
  chain: string;
}

// Trending Token Types
export interface TrendingToken {
  token: Token;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  liquidity: number;
  txCount24h: number;
  mindshare: number;
}

// Portfolio Types
export interface TokenBalance {
  token: Token;
  balance: number;
  balanceUsd: number;
  price: number;
  priceChange24h: number;
}

export interface Portfolio {
  totalValue: number;
  totalChange24h: number;
  totalChangePercent24h: number;
  tokens: TokenBalance[];
}

// Wallet Tracking Types
export interface TrackedWallet {
  id: string;
  address: string;
  label?: string;
  chain: string;
  addedAt: Date;
}

// Alert Types
export interface Alert {
  id: string;
  userId: string;
  type: 'price' | 'wallet' | 'token';
  condition: string;
  value: number;
  target: string;
  enabled: boolean;
  createdAt: Date;
}

// Transaction Types
export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: number;
  token?: Token;
  timestamp: Date;
  chain: string;
  type: 'send' | 'receive' | 'swap' | 'stake';
}

// WebSocket Message Types
export interface WsMessage {
  type: 'price_update' | 'wallet_activity' | 'alert';
  data: any;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
