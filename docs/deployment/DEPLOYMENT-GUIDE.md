# Jump to Recipe - Deployment Guide

## Quick Command Reference

```bash
# Pull latest code from master
git pull origin master

# Quick start (automated setup)
./scripts/quick-start.sh

# Manual database start
docker-compose up -d db

# Run database migrations (from local machine)
cd jump-to-recipe && npm run db:push && cd ..

# Seed database with sample data
cd jump-to-recipe && npm run db:seed && cd ..

# Build and start application
docker-compose build app && docker-compose up -d app

# View application logs
docker-compose logs -f app

# View all container logs
docker-compose logs -f

# Check container status
docker-compose ps

# Restart application only
docker-compose restart app

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Open Drizzle Studio (database GUI)
cd jump-to-recipe && npm run db:studio

# Create external network (first time only)
docker network create frontend
```

---

## Initial Setup

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ installed locally (for migrations)
- Git access to the repository
- OAuth credentials (Google, GitHub)

### First Time Deployment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jump-to-recipe-project
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Edit environment variables**
   ```bash
   nano .env
   ```
   
   Required variables:
   - `DB_USER` - Database username (default: jumptorecipe)
   - `DB_PASSWORD` - Strong database password
   - `DB_NAME` - Database name (default: jump_to_recipe)
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your app URL (e.g., http://localhost:3000)
   - `GOOGLE_ID` - From Google Cloud Console
   - `GOOGLE_SECRET` - From Google Cloud Console
   - `GITHUB_ID` - From GitHub Developer Settings (optional)
   - `GITHUB_SECRET` - From GitHub Developer Settings (optional)

4. **Create Docker network**
   ```bash
   docker network create frontend
   ```

5. **Install local dependencies**
   ```bash
   cd jump-to-recipe
   npm install
   cd ..
   ```

6. **Run quick start script**
   ```bash
   ./scripts/quick-start.sh
   ```

The application will be available at http://localhost:3000

---

## Updating Deployment

### Standard Update Process

1. **Pull latest code**
   ```bash
   git pull origin master
   ```

2. **Install any new dependencies**
   ```bash
   cd jump-to-recipe
   npm install
   cd ..
   ```

3. **Stop the application** (keep database running)
   ```bash
   docker-compose stop app
   ```

4. **Run database migrations**
   ```bash
   cd jump-to-recipe
   npm run db:push
   cd ..
   ```

5. **Rebuild and restart application**
   ```bash
   docker-compose build app
   docker-compose up -d app
   ```

6. **Verify deployment**
   ```bash
   docker-compose logs -f app
   ```
   
   Look for: "Ready on http://0.0.0.0:3000"

---

## Manual Deployment Steps

If you prefer step-by-step control:

### 1. Start Database

```bash
docker-compose up -d db
```

Wait for database to be ready (check with `docker-compose ps`).

### 2. Run Migrations

**Important:** Migrations MUST run from your local machine, not inside Docker.

```bash
cd jump-to-recipe
npm run db:push
cd ..
```

Why local? The production Docker image excludes dev dependencies like `drizzle-kit` for security and smaller image size.

### 3. Seed Database (Optional)

```bash
cd jump-to-recipe
npm run db:seed
cd ..
```

### 4. Build Application

```bash
docker-compose build app
```

This creates an optimized production image with:
- Multi-stage build for minimal size
- Only production dependencies
- Pre-built Next.js application

### 5. Start Application

```bash
docker-compose up -d app
```

### 6. Verify Health

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f app

# Test health endpoint
curl http://localhost:3000/api/health
```

---

## Development Mode

For local development with hot reload:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This:
- Mounts your local code into the container
- Runs `npm run dev` with Turbopack
- Enables hot module replacement
- Exposes port 3000

---

## Troubleshooting

### Database Connection Issues

**Symptom:** App can't connect to database

**Solution:**
```bash
# Check database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Wait longer before migrations
sleep 15
cd jump-to-recipe && npm run db:push && cd ..
```

### Migration Failures

**Symptom:** `drizzle-kit push` fails

**Solutions:**
1. Ensure database is fully started (wait 10-15 seconds)
2. Check DATABASE_URL in jump-to-recipe/.env
3. Verify database credentials match .env file
4. Check database logs: `docker-compose logs db`

### Port Already in Use

**Symptom:** Error binding to port 3000 or 5432

**Solution:**
```bash
# Find process using port
lsof -i :3000
lsof -i :5432

# Stop existing containers
docker-compose down

# Start again
docker-compose up -d
```

### Build Failures

**Symptom:** Docker build fails

**Solutions:**
1. Check all environment variables are set in .env
2. Ensure jump-to-recipe/node_modules exists locally
3. Clear Docker cache: `docker-compose build --no-cache app`
4. Check Docker logs: `docker-compose logs app`

### Application Won't Start

**Symptom:** Container exits immediately

**Solution:**
```bash
# View detailed logs
docker-compose logs app

# Check for missing environment variables
docker-compose config

# Verify build completed
docker images | grep jump-to-recipe

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache app
docker-compose up -d
```

### Reset Everything

**WARNING:** This deletes all data including uploaded files and database records.

```bash
# Stop all containers
docker-compose down

# Remove volumes (deletes data)
docker-compose down -v

# Remove images
docker rmi $(docker images -q jump-to-recipe*)

# Start fresh
./scripts/quick-start.sh
```

---

## Production Deployment

### Environment Considerations

1. **Use strong secrets**
   - Generate new NEXTAUTH_SECRET: `openssl rand -base64 32`
   - Use complex database passwords
   - Never commit .env files

2. **Set correct URLs**
   - Update NEXTAUTH_URL to your domain
   - Configure OAuth redirect URIs in Google/GitHub

3. **Enable HTTPS**
   - Use reverse proxy (nginx, Caddy, Traefik)
   - Configure SSL certificates
   - Update NEXTAUTH_URL to https://

4. **Persistent volumes**
   - Backup postgres_data volume regularly
   - Backup uploads volume for user files
   - Consider external storage (S3, Cloudinary)

### CI/CD Pipeline Example

```yaml
# Example GitHub Actions workflow
name: Deploy

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd jump-to-recipe
          npm ci
      
      - name: Run migrations
        run: |
          cd jump-to-recipe
          npm run db:push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Build Docker image
        run: docker-compose build app
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
          GOOGLE_ID: ${{ secrets.GOOGLE_ID }}
          GOOGLE_SECRET: ${{ secrets.GOOGLE_SECRET }}
      
      - name: Deploy
        run: docker-compose up -d app
```

---

## Monitoring & Maintenance

### View Logs

```bash
# Follow all logs
docker-compose logs -f

# Follow app logs only
docker-compose logs -f app

# Follow database logs
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 app
```

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Volume sizes
docker volume ls
```

### Database Management

```bash
# Open Drizzle Studio (web GUI)
cd jump-to-recipe
npm run db:studio
# Opens at http://localhost:4983

# Connect with psql
docker-compose exec db psql -U jumptorecipe -d jump_to_recipe

# Backup database
docker-compose exec db pg_dump -U jumptorecipe jump_to_recipe > backup.sql

# Restore database
docker-compose exec -T db psql -U jumptorecipe jump_to_recipe < backup.sql
```

### Cleanup

```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune

# Remove unused volumes (careful!)
docker volume prune

# Full cleanup (keeps volumes)
docker system prune
```

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  Local Machine                          │
│  ├─ Source code                         │
│  ├─ node_modules (with drizzle-kit)    │
│  └─ npm run db:push ──────────┐        │
└────────────────────────────────│────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────┐
│  Docker Environment                     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  db (PostgreSQL 16)             │   │
│  │  - Port: 5432                   │   │
│  │  - Volume: postgres_data        │   │
│  │  - Health checks enabled        │   │
│  └─────────────────────────────────┘   │
│                  │                      │
│                  │ DATABASE_URL         │
│                  ▼                      │
│  ┌─────────────────────────────────┐   │
│  │  app (Next.js 15)               │   │
│  │  - Port: 3000                   │   │
│  │  - Volume: uploads              │   │
│  │  - Production build             │   │
│  │  - No dev dependencies          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Network: frontend                      │
└─────────────────────────────────────────┘
```

### Key Design Decisions

1. **Migrations run locally** - Dev dependencies not in production image
2. **Multi-stage build** - Smaller, more secure production images
3. **Health checks** - Automatic restart on failures
4. **Persistent volumes** - Data survives container restarts
5. **External network** - Allows future nginx/reverse proxy integration

---

## Useful Tips

### Quick Restart After Code Changes

```bash
docker-compose restart app
```

### Rebuild After Dependency Changes

```bash
cd jump-to-recipe
npm install
cd ..
docker-compose build app
docker-compose up -d app
```

### Check Environment Variables

```bash
# View resolved configuration
docker-compose config

# Check specific service
docker-compose config app
```

### Access Container Shell

```bash
# App container
docker-compose exec app sh

# Database container
docker-compose exec db sh
```

### Test Database Connection

```bash
cd jump-to-recipe
npm run migration:test-connection
```

### View Build Output

```bash
docker-compose build --progress=plain app
```

---

## Getting Help

- Check logs first: `docker-compose logs -f`
- Verify environment: `docker-compose config`
- Check container health: `docker-compose ps`
- Review error documentation in `/docs/errors/`
- Ensure both local and Docker environments are compatible

For persistent issues, capture logs and environment details:

```bash
docker-compose logs > deployment-logs.txt
docker-compose config > deployment-config.txt
docker-compose ps > deployment-status.txt
```
