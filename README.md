# Cielo Clone - Crypto Trading Analytics Platform

A full-stack crypto trading analytics platform inspired by Cielo Finance. Track wallets, analyze trends, monitor portfolios, and get real-time alerts across 30+ blockchains.

## 🏗️ Architecture

This is a monorepo using **Turborepo** containing:

- **apps/frontend** - Next.js 14 (App Router) + TypeScript + TailwindCSS
- **apps/backend** - Express.js + TypeScript + Prisma + PostgreSQL
- **packages/shared** - Shared types, utilities, and configurations

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: React Query + Zustand
- **Web3**: Privy (Auth), Wagmi (EVM), Solana Wallet Adapter
- **Real-time**: Socket.io Client

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis (Upstash)
- **Real-time**: Socket.io Server
- **Background Jobs**: Bull/BullMQ
- **Authentication**: Privy SDK

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway / Render
- **Database**: Supabase / Neon
- **Cache**: Upstash Redis
- **Blockchain Data**: Helius (Solana), Alchemy (EVM)

## 📦 Features

### MVP Phase 1
- ✅ Wallet authentication (Privy)
- ✅ Trending tokens table
- ✅ Basic portfolio tracker
- ✅ Wallet tracking & watchlists

### MVP Phase 2
- ✅ Real-time WebSocket updates
- ✅ Multi-chain support (EVM + Solana)
- ✅ Alert system (Telegram)
- ✅ PnL calculations

### Future Enhancements
- Wallet leaderboards
- Trading integration
- Premium subscription tiers
- Mobile app (React Native)
- API access

## 🛠️ Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (or use Supabase)
- Redis (or use Upstash free tier)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd cielo-clone
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env` files in both apps:

```bash
# apps/frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# apps/backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/cielo
REDIS_URL=redis://localhost:6379
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
HELIUS_API_KEY=your_helius_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
```

4. **Set up database**
```bash
npm run db:generate
npm run db:push
```

5. **Run development servers**
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## 📁 Project Structure

```
cielo-clone/
├── apps/
│   ├── frontend/          # Next.js application
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities & clients
│   │   └── public/        # Static assets
│   │
│   └── backend/           # Express API
│       ├── src/
│       │   ├── routes/    # API endpoints
│       │   ├── services/  # Business logic
│       │   ├── jobs/      # Background workers
│       │   ├── websockets/# Real-time handlers
│       │   └── middleware/# Express middleware
│       └── prisma/        # Database schema
│
├── packages/
│   └── shared/            # Shared code
│       ├── types/         # TypeScript types
│       ├── utils/         # Utility functions
│       └── config/        # Shared configs
│
├── package.json           # Root package.json
├── turbo.json             # Turborepo config
└── README.md              # This file
```

## 🧪 Available Scripts

```bash
# Development
npm run dev              # Start all apps in dev mode
npm run build            # Build all apps
npm run start            # Start production servers
npm run lint             # Lint all apps
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio

# Cleanup
npm run clean            # Clean all build artifacts
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Set root directory to `apps/frontend`
3. Add environment variables
4. Deploy

### Backend (Railway/Render)
1. Create new service
2. Set root directory to `apps/backend`
3. Add environment variables (DATABASE_URL, REDIS_URL, etc.)
4. Add build command: `npm install && npm run build`
5. Add start command: `npm run start`
6. Deploy

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Privy Documentation](https://docs.privy.io)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

- Inspired by [Cielo Finance](https://cielo.finance)
- Built with modern web3 technologies
