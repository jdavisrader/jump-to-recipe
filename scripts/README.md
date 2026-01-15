# Jump to Recipe - Deployment Scripts

This directory contains scripts for deploying Jump to Recipe using Docker or traditional PM2 deployment.

## Docker Scripts (Recommended)

### `docker-deploy.sh`
Complete Docker deployment script:
- Checks Docker installation
- Builds Docker images
- Starts all containers (database + app)
- Runs database migrations
- Sets up health checks

**Usage:**
```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

### `docker-update.sh`
Updates the application with new code:
- Pulls latest code (if using git)
- Rebuilds application container
- Restarts application
- Runs database migrations

**Usage:**
```bash
./docker-update.sh
```

### `docker-backup.sh`
Creates backups of database and uploads:
- Exports PostgreSQL database to SQL file
- Archives uploads volume
- Saves to `./backups/` directory with timestamp

**Usage:**
```bash
./docker-backup.sh
```

### `docker-restore.sh`
Restores from backup:
- Restores database from SQL backup
- Restores uploads from archive
- Requires backup timestamp

**Usage:**
```bash
./docker-restore.sh 20260114_120000
```

## Legacy PM2 Scripts

These scripts are for traditional deployment without Docker (Raspberry Pi setup):

- `deploy-to-pi.sh` - System setup (Node.js, PM2, Git)
- `setup-app.sh` - Application setup
- `setup-database.sh` - Database setup
- `start-app.sh` - Start with PM2
- `stop-app.sh` - Stop PM2 process
- `update-app.sh` - Update and restart

## Quick Start

### Docker Deployment (Recommended)
```bash
# First time
cp .env.example .env
nano .env  # Configure your settings
./scripts/docker-deploy.sh

# Updates
./scripts/docker-update.sh

# Backups
./scripts/docker-backup.sh
```

### PM2 Deployment (Legacy)
```bash
# First time
./scripts/deploy-to-pi.sh
./scripts/setup-app.sh
./scripts/setup-database.sh
./scripts/start-app.sh

# Updates
./scripts/update-app.sh
```

## Environment Variables

Configure `.env` before deployment:
- `DB_PASSWORD` - Database password
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your server URL
- OAuth credentials (optional)

## Troubleshooting

### Docker Issues
```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f app

# Restart containers
docker compose restart

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### PM2 Issues
```bash
# Check status
pm2 status

# View logs
pm2 logs jump-to-recipe

# Restart
pm2 restart jump-to-recipe
```

## Documentation

See full deployment guides:
- `docs/deployment/README-DEPLOYMENT.md` - Complete Docker guide
- `docs/deployment/DOCKER-QUICK-START.md` - Quick reference
