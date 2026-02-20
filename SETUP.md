# Cielo Clone - Setup Guide

Complete guide to set up and run the Cielo Clone project locally.

## Prerequisites

Make sure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

## Step 1: Clone & Install Dependencies

```bash
# Navigate to the project directory
cd cielo-clone

# Install all dependencies (root + apps + packages)
npm install
```

This will install dependencies for:
- Root monorepo
- Frontend app (Next.js)
- Backend app (Express)
- Shared packages

## Step 2: Start Docker Services

Start PostgreSQL and Redis using Docker Compose:

```bash
# Start in detached mode
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs (optional)
docker-compose logs -f
```

You should see:
- PostgreSQL running on `localhost:5432`
- Redis running on `localhost:6379`

## Step 3: Configure Environment Variables

### Backend Configuration

```bash
# Copy example env file
cp apps/backend/.env.example apps/backend/.env

# Edit the .env file
nano apps/backend/.env
```

**Required variables:**
```env
DATABASE_URL=postgresql://cielo:cielo_password@localhost:5432/cielo
REDIS_URL=redis://localhost:6379
PORT=4000
CLIENT_URL=http://localhost:3000
JWT_SECRET=your_super_secret_key_here
```

**For wallet authentication (get from Privy):**
1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Create a new app
3. Copy your App ID and Secret
4. Add to `.env`:
```env
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
```

**For blockchain data (optional for MVP):**
- Helius (Solana): [Get API Key](https://www.helius.dev/)
- Alchemy (EVM chains): [Get API Key](https://www.alchemy.com/)

### Frontend Configuration

```bash
# Copy example env file
cp apps/frontend/.env.example apps/frontend/.env.local

# Edit the .env.local file
nano apps/frontend/.env.local
```

**Required variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

## Step 4: Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Optional: Open Prisma Studio to view database
npm run db:studio
```

Prisma Studio will open at `http://localhost:5555`

## Step 5: Start Development Servers

```bash
# Start all services (frontend + backend)
npm run dev
```

This starts:
- ✅ **Frontend**: http://localhost:3000
- ✅ **Backend API**: http://localhost:4000
- ✅ **WebSocket**: ws://localhost:4000

### Or run individually:

```bash
# Terminal 1 - Backend only
cd apps/backend
npm run dev

# Terminal 2 - Frontend only
cd apps/frontend
npm run dev
```

## Step 6: Verify Installation

### Check Backend Health

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-02-14T10:00:00.000Z"
}
```

### Check Frontend

Open browser: http://localhost:3000

You should see the landing page.

### Check Database

```bash
# Connect to PostgreSQL
docker exec -it cielo-postgres psql -U cielo -d cielo

# List tables
\dt

# Exit
\q
```

## Troubleshooting

### Port Already in Use

If ports 3000, 4000, 5432, or 6379 are already in use:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change ports in env files
```

### Docker Issues

```bash
# Stop all containers
docker-compose down

# Remove volumes and restart
docker-compose down -v
docker-compose up -d
```

### Database Connection Error

1. Make sure PostgreSQL is running: `docker-compose ps`
2. Check `DATABASE_URL` in `apps/backend/.env`
3. Verify credentials match `docker-compose.yml`

### Prisma Issues

```bash
# Reset database (⚠️ DELETES ALL DATA)
cd apps/backend
npx prisma migrate reset

# Regenerate Prisma client
npm run db:generate
```

## Next Steps

Now that your environment is set up, you can:

1. ✅ **Test Authentication** - Implement Privy wallet connection
2. ✅ **Build Features** - Start with trending tokens table
3. ✅ **Add Data** - Integrate blockchain APIs
4. ✅ **Test APIs** - Use Postman or curl

## Useful Commands

```bash
# Development
npm run dev              # Start all apps
npm run build            # Build all apps
npm run lint             # Lint all code
npm run format           # Format code

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio

# Docker
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose logs -f   # View logs

# Cleanup
npm run clean            # Remove build artifacts
docker-compose down -v   # Remove volumes
```

## Environment Structure

```
cielo-clone/
├── apps/
│   ├── frontend/        # Next.js app (port 3000)
│   └── backend/         # Express API (port 4000)
├── packages/
│   └── shared/          # Shared utilities
├── docker-compose.yml   # Local services
└── package.json         # Monorepo config
```

## Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify env variables are set correctly
3. Ensure all services are running
4. Check Node.js version: `node --version`

---

**Ready to build!** 🚀

Start with Feature 1: Wallet Authentication (Privy)
