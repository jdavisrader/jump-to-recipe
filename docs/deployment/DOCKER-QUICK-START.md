# Docker Deployment - Quick Reference

## First Time Setup

```bash
# 1. Install Docker (if needed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Configure environment
cp .env.example .env
nano .env  # Set DB_PASSWORD, NEXTAUTH_SECRET, etc.

# 3. Deploy
./scripts/docker-deploy.sh
```

## Daily Commands

```bash
# View logs
docker compose logs -f app

# Restart app
docker compose restart app

# Check status
docker compose ps

# Stop everything
docker compose down

# Start everything
docker compose up -d
```

## Updates

```bash
# Quick update
./scripts/docker-update.sh

# Or manually
git pull
docker compose build app
docker compose up -d app
```

## Backups

```bash
# Create backup
./scripts/docker-backup.sh

# Restore backup
./scripts/docker-restore.sh 20260114_120000

# List backups
ls -lh backups/
```

## Troubleshooting

```bash
# Check logs
docker compose logs --tail=100 app

# Check database
docker compose exec db psql -U jumptorecipe jump_to_recipe

# Restart everything
docker compose restart

# Nuclear option (rebuilds everything)
docker compose down
docker compose build --no-cache
docker compose up -d
```

## URLs

- Application: http://localhost:3000
- Database: localhost:5432
- Drizzle Studio: Run `npm run db:studio` from host

## Environment Variables

Key variables in `.env`:
- `DB_PASSWORD` - Database password
- `NEXTAUTH_SECRET` - Auth secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your server URL
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth (optional)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - OAuth (optional)

## Production with SSL

```bash
# Start with Nginx
docker compose --profile production up -d

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Edit nginx.conf to enable HTTPS
nano nginx/nginx.conf  # Uncomment SSL server block

# Restart
docker compose restart nginx
```

## Resource Usage

Typical resource usage:
- Database: ~100-200MB RAM
- Application: ~200-500MB RAM
- Total disk: ~2-3GB (including images)

## Automated Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /home/$USER/jump-to-recipe && ./scripts/docker-backup.sh

# Weekly cleanup (keep 30 days)
0 3 * * 0 find /home/$USER/jump-to-recipe/backups -name "*.sql" -mtime +30 -delete
```
