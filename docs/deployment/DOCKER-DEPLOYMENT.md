# Docker Deployment Guide

## Quick Start

```bash
# 1. Create environment file
cp .env.example .env
nano .env  # Edit with your values

# 2. Run quick start script
./scripts/quick-start.sh
```

That's it! The app will be available at http://localhost:3000

## Manual Deployment

If you prefer to run commands manually:

### Step 1: Setup Environment

```bash
# Create .env file
cp .env.example .env

# Edit with your values
nano .env
```

Required variables:
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `GOOGLE_ID` - From Google Cloud Console
- `GOOGLE_SECRET` - From Google Cloud Console

### Step 2: Install Dependencies (Local)

```bash
cd jump-to-recipe
npm install
cd ..
```

### Step 3: Start Database

```bash
docker-compose up -d db
```

### Step 4: Run Migrations

**Important:** Migrations must be run from your local machine (not inside Docker) because `drizzle-kit` is a dev dependency.

```bash
cd jump-to-recipe
npm run db:push
cd ..
```

### Step 5: Seed Database (Optional)

```bash
cd jump-to-recipe
npm run db:seed
cd ..
```

### Step 6: Build and Start Application

```bash
docker-compose build app
docker-compose up -d app
```

## Why Migrations Run Locally

The Docker image is built with `npm ci --production` which excludes dev dependencies like `drizzle-kit`. This is intentional for:

1. **Smaller image size** - Production images don't need dev tools
2. **Security** - Fewer dependencies = smaller attack surface
3. **Best practice** - Migrations should be run as a separate deployment step

## Troubleshooting

### Database not ready

If migrations fail, wait longer for the database:

```bash
sleep 10
cd jump-to-recipe
npm run db:push
```

### Port already in use

```bash
# Stop existing containers
docker-compose down

# Start again
./scripts/quick-start.sh
```

### Reset everything

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Start fresh
./scripts/quick-start.sh
```

## Production Deployment

For production, use a CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
steps:
  - name: Install dependencies
    run: npm ci
    working-directory: ./jump-to-recipe
    
  - name: Run migrations
    run: npm run db:push
    working-directory: ./jump-to-recipe
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
  - name: Build Docker image
    run: docker-compose build app
    
  - name: Deploy
    run: docker-compose up -d app
```

## Commands Reference

```bash
# View logs
docker-compose logs -f app

# Check status
docker-compose ps

# Restart app
docker-compose restart app

# Stop everything
docker-compose down

# Stop and remove volumes (deletes data!)
docker-compose down -v

# Run migrations
cd jump-to-recipe && npm run db:push

# Seed database
cd jump-to-recipe && npm run db:seed

# Open Drizzle Studio (database GUI)
cd jump-to-recipe && npm run db:studio
```

## Architecture

```
┌─────────────────────────────────────────┐
│  Local Machine                          │
│  ├─ node_modules (with drizzle-kit)    │
│  └─ npm run db:push ──────────┐        │
└────────────────────────────────│────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────┐
│  Docker Containers                      │
│  ├─ db (PostgreSQL)                     │
│  │  └─ Receives migrations              │
│  └─ app (Next.js)                       │
│     └─ Production build (no dev deps)   │
└─────────────────────────────────────────┘
```
