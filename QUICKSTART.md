# 🚀 Quick Start Guide

Follow these steps in order:

## ✅ Checklist

### Step 1: Install Docker (5 minutes)
- [ ] Download: https://www.docker.com/products/docker-desktop/
- [ ] Install Docker Desktop
- [ ] Open Docker Desktop
- [ ] Wait for whale icon in menu bar
- [ ] Verify: Run `docker --version` in terminal

### Step 2: Start Database Services (1 minute)
```bash
cd cielo-clone
docker-compose up -d
```

Check if running:
```bash
docker-compose ps
```

You should see:
- ✅ cielo-postgres (port 5432)
- ✅ cielo-redis (port 6379)

### Step 3: Get Privy Credentials (3 minutes)
- [ ] Go to https://dashboard.privy.io/
- [ ] Sign up (free)
- [ ] Create new app
- [ ] Copy **App ID**
- [ ] Copy **App Secret**

### Step 4: Add Privy Credentials
Edit these files:

**File: `apps/backend/.env`**
```env
PRIVY_APP_ID=your_app_id_here
PRIVY_APP_SECRET=your_app_secret_here
```

**File: `apps/frontend/.env.local`**
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_app_id_here
```

### Step 5: Set Up Database (1 minute)
```bash
npm run db:generate
npm run db:push
```

### Step 6: Start Development Servers (1 minute)
```bash
npm run dev
```

This starts:
- 🎨 Frontend: http://localhost:3000
- ⚡ Backend: http://localhost:4000

### Step 7: Verify Everything Works
- [ ] Open http://localhost:3000 (should see landing page)
- [ ] Open http://localhost:4000/health (should see `{"status":"ok"}`)

---

## 🎯 Total Setup Time: ~10-15 minutes

## 🆘 Troubleshooting

**Docker won't start?**
```bash
# Check if Docker Desktop is running
docker ps
```

**Port already in use?**
```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9
```

**Database connection error?**
```bash
# Restart Docker containers
docker-compose down
docker-compose up -d
```

---

## 📍 What's Next?

Once setup is complete, we'll build:
1. ✅ Wallet authentication
2. ✅ Trending tokens table
3. ✅ Portfolio tracker
4. ✅ Real-time updates

Let me know when setup is done!
