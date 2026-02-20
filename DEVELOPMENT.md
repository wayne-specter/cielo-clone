# Development Guide

## 🛠️ Daily Development Workflow

### Starting Your Development Environment

```bash
# 1. Start Docker services (if not running)
docker-compose up -d

# 2. Start development servers (both frontend + backend)
npm run dev

# Frontend will be at: http://localhost:3000
# Backend will be at: http://localhost:4000
```

### Stopping Everything

```bash
# Stop dev servers: Ctrl+C in terminal

# Stop Docker services
docker-compose down
```

---

## 📁 Project Organization

### Where to Add Code

```
Frontend (Next.js):
├── app/                    # Pages (file-based routing)
│   ├── dashboard/          # /dashboard route
│   │   └── page.tsx
│   ├── portfolio/          # /portfolio route
│   │   └── page.tsx
│   └── layout.tsx          # Shared layout
│
├── components/
│   ├── ui/                 # Reusable UI (buttons, cards, etc)
│   ├── layout/             # Layout components (navbar, sidebar)
│   └── features/           # Feature-specific components
│       ├── trending/       # Trending tokens components
│       ├── portfolio/      # Portfolio components
│       └── wallet/         # Wallet components
│
├── hooks/                  # Custom React hooks
│   ├── useTokens.ts
│   ├── usePortfolio.ts
│   └── useWebSocket.ts
│
└── lib/
    ├── api/                # API client functions
    └── utils.ts            # Helper functions

Backend (Express):
├── src/
│   ├── routes/             # API endpoints
│   │   ├── auth.ts         # /api/v1/auth/*
│   │   ├── tokens.ts       # /api/v1/tokens/*
│   │   ├── wallets.ts      # /api/v1/wallets/*
│   │   └── alerts.ts       # /api/v1/alerts/*
│   │
│   ├── services/           # Business logic
│   │   ├── tokenService.ts
│   │   ├── walletService.ts
│   │   └── priceService.ts
│   │
│   ├── jobs/               # Background jobs
│   │   ├── priceUpdater.ts
│   │   └── alertChecker.ts
│   │
│   └── middleware/         # Express middleware
│       ├── auth.ts
│       ├── validation.ts
│       └── rateLimit.ts
```

---

## 🔄 Development Commands

### Frontend (Next.js)
```bash
cd apps/frontend

# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint code
npm run type-check       # TypeScript check
```

### Backend (Express)
```bash
cd apps/backend

# Development
npm run dev              # Start dev server (auto-reload)
npm run build            # Build TypeScript
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio (GUI)
npm run db:migrate       # Create migration
```

### Root (Monorepo)
```bash
# Run all apps together
npm run dev              # Start frontend + backend
npm run build            # Build all apps
npm run lint             # Lint all apps
npm run clean            # Clean build artifacts
```

---

## 🗄️ Database Management

### View Database in GUI
```bash
npm run db:studio
```
Opens at: http://localhost:5555

### Reset Database (⚠️ Deletes all data)
```bash
cd apps/backend
npx prisma migrate reset
```

### Add New Table/Field
1. Edit `apps/backend/prisma/schema.prisma`
2. Run: `npm run db:push`
3. Run: `npm run db:generate`

---

## 🧪 Testing APIs

### Health Check
```bash
curl http://localhost:4000/health
```

### Test Authenticated Endpoint
```bash
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Code Style

### Formatting
We use Prettier for consistent formatting:
```bash
npm run format
```

### TypeScript
- Always use types (no `any`)
- Export types from `types/index.ts`
- Use interfaces for objects

### Components
- Use functional components
- Extract complex logic to custom hooks
- Keep components small and focused

---

## 🐛 Debugging

### Frontend Debugging
- React DevTools (Chrome extension)
- Console logs: `console.log()`
- Network tab for API calls

### Backend Debugging
- Check terminal for logs
- Use `logger.debug()`, `logger.info()`, `logger.error()`
- Check Prisma Studio for database state

### Database Debugging
```bash
# Connect to PostgreSQL directly
docker exec -it cielo-postgres psql -U cielo -d cielo

# Common queries
\dt                 # List tables
\d users            # Describe table
SELECT * FROM users;
\q                  # Quit
```

### Redis Debugging
```bash
# Connect to Redis
docker exec -it cielo-redis redis-cli

# Common commands
KEYS *              # List all keys
GET key_name        # Get value
DEL key_name        # Delete key
FLUSHALL            # Clear everything
EXIT
```

---

## 🔥 Common Issues & Fixes

### "Port already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### "Cannot connect to database"
```bash
# Restart Docker
docker-compose down
docker-compose up -d

# Check if running
docker-compose ps
```

### "Module not found"
```bash
# Reinstall dependencies
npm install

# Clear cache
rm -rf node_modules
rm -rf .next
npm install
```

### "Prisma client not found"
```bash
cd apps/backend
npm run db:generate
```

---

## 🚀 Adding a New Feature

Example: Adding a new "Leaderboard" feature

### 1. Database (if needed)
```prisma
// apps/backend/prisma/schema.prisma
model Leaderboard {
  id        String   @id @default(cuid())
  address   String
  pnl       Float
  rank      Int
  createdAt DateTime @default(now())
}
```
```bash
npm run db:push
```

### 2. Backend API
```typescript
// apps/backend/src/routes/leaderboard.ts
import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  // Logic here
});

export default router;
```

### 3. Frontend Hook
```typescript
// apps/frontend/hooks/useLeaderboard.ts
import { useQuery } from '@tanstack/react-query';

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => fetch('/api/v1/leaderboard').then(r => r.json()),
  });
}
```

### 4. Frontend Component
```typescript
// apps/frontend/components/features/leaderboard/LeaderboardTable.tsx
'use client';

import { useLeaderboard } from '@/hooks/useLeaderboard';

export function LeaderboardTable() {
  const { data, isLoading } = useLeaderboard();

  return (
    <div>{/* Render table */}</div>
  );
}
```

### 5. Frontend Page
```typescript
// apps/frontend/app/leaderboard/page.tsx
import { LeaderboardTable } from '@/components/features/leaderboard/LeaderboardTable';

export default function LeaderboardPage() {
  return <LeaderboardTable />;
}
```

---

## 📚 Useful Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Privy Docs](https://docs.privy.io)

---

## 🎯 Best Practices

### 1. Commit Often
- Commit after each feature
- Write clear commit messages
- Use feature branches

### 2. Test Incrementally
- Test each feature before moving to next
- Use Postman/curl for API testing
- Check browser console for errors

### 3. Keep It Simple
- Don't over-engineer
- Follow existing patterns
- Ask before making big changes

### 4. Performance
- Use React Query for caching
- Index database queries
- Use Redis for frequently accessed data

---

**Happy coding! 🚀**
