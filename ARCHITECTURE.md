# Architecture Documentation

## Overview

Cielo Clone is a full-stack crypto trading analytics platform built with a modern monorepo architecture. This document provides a comprehensive overview of the system design, technology choices, and development practices.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Next.js 14 (React App Router)                  │ │
│  │  - Server Components for SEO                           │ │
│  │  - Client Components for interactivity                 │ │
│  │  - React Query for data fetching                       │ │
│  │  - Zustand for local state                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WS
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Express.js REST API                       │ │
│  │  - RESTful endpoints                                   │ │
│  │  - WebSocket server (Socket.io)                        │ │
│  │  - Authentication middleware                            │ │
│  │  - Rate limiting & validation                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Wallet     │  │   Token      │  │   Alert      │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Blockchain  │  │   Price      │  │ Notification │      │
│  │   Indexer    │  │   Oracle     │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   PostgreSQL     │  │      Redis       │                │
│  │  - User data     │  │  - Price cache   │                │
│  │  - Wallets       │  │  - Sessions      │                │
│  │  - Alerts        │  │  - Rate limits   │                │
│  │  - Time-series   │  │  - Job queues    │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Helius     │  │   Alchemy    │  │   Privy      │      │
│  │  (Solana)    │  │    (EVM)     │  │   (Auth)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Telegram   │  │   Discord    │                        │
│  │     API      │  │   Webhooks   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend (`apps/frontend`)

| Technology | Purpose | Why? |
|------------|---------|------|
| **Next.js 14** | React framework | SSR, file-based routing, performance optimization |
| **TypeScript** | Type safety | Catch errors at compile-time, better DX |
| **TailwindCSS** | Styling | Utility-first, fast development, small bundle |
| **shadcn/ui** | Component library | Accessible, customizable, Radix UI primitives |
| **React Query** | Server state | Caching, invalidation, background updates |
| **Zustand** | Client state | Lightweight, simple API, no boilerplate |
| **Privy** | Web3 auth | Wallet connection, user management |
| **Wagmi** | EVM chains | Ethereum wallet interactions |
| **Solana Wallet Adapter** | Solana | Solana wallet support |
| **Socket.io Client** | Real-time | WebSocket connection to backend |

### Backend (`apps/backend`)

| Technology | Purpose | Why? |
|------------|---------|------|
| **Express.js** | API framework | Mature, flexible, extensive ecosystem |
| **TypeScript** | Type safety | Shared types with frontend |
| **Prisma** | ORM | Type-safe database queries, migrations |
| **PostgreSQL** | Primary database | ACID compliance, JSON support, scalability |
| **Redis** | Cache & queues | Fast in-memory storage, pub/sub |
| **Socket.io** | WebSocket | Real-time bidirectional communication |
| **Bull** | Job queues | Background processing, retry logic |
| **Privy SDK** | Auth verification | Verify wallet signatures |
| **Ethers.js/Viem** | EVM integration | Interact with Ethereum chains |
| **Solana Web3.js** | Solana integration | Read Solana blockchain data |

### Shared (`packages/shared`)

- **Types**: Shared TypeScript interfaces
- **Utils**: Common formatting and helper functions
- **Config**: Chain configurations, constants

### Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Monorepo** | Turborepo | Fast builds, caching, task orchestration |
| **Database** | PostgreSQL 15 | Relational data + time-series |
| **Cache** | Redis 7 | Session store, price cache, job queues |
| **Containerization** | Docker | Local development environment |
| **Version Control** | Git | Source control |

## Project Structure

```
cielo-clone/
├── apps/
│   ├── frontend/                 # Next.js Application
│   │   ├── app/                 # App Router (Next.js 14)
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── page.tsx         # Home page
│   │   │   ├── providers.tsx    # Context providers
│   │   │   └── globals.css      # Global styles
│   │   ├── components/          # React components
│   │   │   ├── ui/              # Reusable UI components
│   │   │   ├── layout/          # Layout components
│   │   │   └── features/        # Feature-specific components
│   │   ├── lib/                 # Utilities & clients
│   │   │   ├── api/             # API client
│   │   │   └── utils.ts         # Helper functions
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript types
│   │   ├── public/              # Static assets
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   └── tailwind.config.ts
│   │
│   └── backend/                 # Express API
│       ├── src/
│       │   ├── routes/          # API endpoints
│       │   ├── services/        # Business logic
│       │   ├── middleware/      # Express middleware
│       │   ├── jobs/            # Background jobs
│       │   ├── websockets/      # WebSocket handlers
│       │   ├── utils/           # Helper functions
│       │   ├── types/           # TypeScript types
│       │   └── index.ts         # Entry point
│       ├── prisma/
│       │   └── schema.prisma    # Database schema
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                  # Shared code
│       ├── types/               # Shared TypeScript types
│       │   └── chains.ts        # Chain configurations
│       ├── utils/               # Shared utilities
│       │   └── format.ts        # Formatting functions
│       ├── config/              # Shared configs
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml           # Local services (Postgres, Redis)
├── package.json                 # Root package.json (monorepo)
├── turbo.json                   # Turborepo configuration
├── .gitignore
├── .prettierrc                  # Code formatting
├── README.md                    # Project overview
├── SETUP.md                     # Setup instructions
└── ARCHITECTURE.md              # This file
```

## Data Flow

### 1. User Authentication Flow

```
User connects wallet
    ↓
Privy authenticates
    ↓
Frontend gets auth token
    ↓
Token sent with API requests
    ↓
Backend verifies with Privy SDK
    ↓
User session created
```

### 2. Real-time Price Updates Flow

```
Background job fetches prices
    ↓
Saves to Redis cache
    ↓
Emits WebSocket event
    ↓
Connected clients receive update
    ↓
Frontend updates UI
```

### 3. Wallet Tracking Flow

```
User adds wallet address
    ↓
Backend validates & saves to DB
    ↓
Indexer service monitors wallet
    ↓
New transaction detected
    ↓
WebSocket notification sent
    ↓
Alert triggered (if configured)
```

## Database Schema

### Core Tables

1. **users**: User accounts and wallet addresses
2. **tracked_wallets**: Wallets being monitored
3. **tokens**: Token metadata cache
4. **price_history**: Time-series price data
5. **alerts**: User-configured alerts
6. **transactions**: Historical transaction data
7. **api_keys**: API keys for premium users

### Relationships

```
User (1) ──→ (N) TrackedWallet
User (1) ──→ (N) Alert
User (1) ──→ (N) ApiKey
```

## API Design

### RESTful Endpoints

```
Auth:
  POST   /api/v1/auth/login
  POST   /api/v1/auth/logout
  GET    /api/v1/auth/me

Tokens:
  GET    /api/v1/tokens/trending
  GET    /api/v1/tokens/:address
  GET    /api/v1/tokens/search

Wallets:
  GET    /api/v1/wallets
  POST   /api/v1/wallets
  DELETE /api/v1/wallets/:id
  GET    /api/v1/wallets/:address/portfolio

Alerts:
  GET    /api/v1/alerts
  POST   /api/v1/alerts
  PUT    /api/v1/alerts/:id
  DELETE /api/v1/alerts/:id

Portfolio:
  GET    /api/v1/portfolio
  GET    /api/v1/portfolio/pnl
```

### WebSocket Events

```
Client → Server:
  - subscribe_prices
  - subscribe_wallet
  - unsubscribe

Server → Client:
  - price_update
  - wallet_activity
  - alert_triggered
  - new_transaction
```

## Security Considerations

### Authentication
- Wallet-based authentication via Privy
- JWT tokens for API requests
- Signature verification on backend

### API Protection
- Rate limiting (Redis)
- Helmet.js security headers
- CORS configuration
- Input validation (Zod)

### Data Protection
- Environment variables for secrets
- No private keys stored
- Non-custodial architecture
- Encrypted WebSocket connections (wss://)

## Performance Optimization

### Frontend
- Server-side rendering (Next.js)
- Static generation where possible
- Image optimization (Next.js Image)
- Code splitting
- React Query caching

### Backend
- Redis caching for prices
- Connection pooling (Prisma)
- WebSocket for real-time (vs polling)
- Background jobs for heavy processing
- Database indexing

### Database
- Indexed frequently-queried fields
- Time-series optimizations
- Pagination for large datasets
- Query result caching

## Scalability Plan

### Horizontal Scaling

**Frontend**: Deploy to Vercel Edge Network
- Automatic CDN
- Global distribution
- Serverless functions

**Backend**: Multiple instances behind load balancer
- Stateless API design
- Session stored in Redis
- WebSocket sticky sessions

**Database**: Read replicas
- Primary for writes
- Replicas for reads
- Connection pooling

### Vertical Scaling

- Increase container resources
- Optimize queries
- Add database indexes
- Upgrade Redis memory

## Deployment Strategy

### Environments

1. **Development**: Local Docker setup
2. **Staging**: Preview deployments
3. **Production**: Multi-region deployment

### CI/CD Pipeline

```
Git Push
    ↓
GitHub Actions
    ↓
Run tests & type-check
    ↓
Build apps
    ↓
Deploy to staging
    ↓
Manual approval
    ↓
Deploy to production
```

### Monitoring

- Error tracking: Sentry
- Logging: Structured logs
- Metrics: Response times, error rates
- Uptime: Health checks

## Development Workflow

### Feature Development

1. Create feature branch
2. Implement incrementally
3. Test locally
4. Create pull request
5. Code review
6. Merge to main
7. Deploy

### Testing Strategy

- Unit tests for utilities
- Integration tests for APIs
- E2E tests for critical flows
- Manual testing for UI/UX

## Future Enhancements

### Phase 3 (Post-MVP)
- Wallet leaderboards
- Advanced analytics
- Trading integration
- Mobile app (React Native)

### Phase 4 (Scale)
- Multi-user collaboration
- API marketplace
- Premium features
- Advanced charting

## Support & Maintenance

### Regular Tasks
- Dependency updates
- Security patches
- Database backups
- Performance monitoring
- Log analysis

### Incident Response
1. Alert triggered
2. Investigate logs
3. Identify root cause
4. Deploy hotfix
5. Post-mortem analysis

---

**Last Updated**: 2024-02-14
**Version**: 1.0.0
