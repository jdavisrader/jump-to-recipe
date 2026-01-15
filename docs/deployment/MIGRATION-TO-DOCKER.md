# Migration from PM2 to Docker

If you're currently running Jump to Recipe with PM2 and want to migrate to Docker, follow this guide.

## Why Docker?

- **Easier management**: One-command deployment and updates
- **Isolation**: App and database in separate containers
- **Consistency**: Same environment everywhere
- **Portability**: Easy to move between servers
- **Backups**: Simple volume-based backups

## Prerequisites

- Docker and Docker Compose installed
- Current application running with PM2
- Database backup (we'll create one)

## Migration Steps

### 1. Backup Current Setup

```bash
# Backup database
pg_dump -h localhost -U your_user jump_to_recipe > backup_before_docker.sql

# Backup uploads (if using local storage)
tar czf uploads_backup.tar.gz /path/to/uploads

# Backup .env file
cp .env .env.backup
```

### 2. Stop Current Application

```bash
pm2 stop jump-to-recipe
pm2 delete jump-to-recipe
```

### 3. Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 4. Update Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Important changes for Docker:**
- `DATABASE_URL`: Change `localhost` to `db`
  - Before: `postgresql://user:pass@localhost:5432/jump_to_recipe`
  - After: `postgresql://user:pass@db:5432/jump_to_recipe`

### 5. Deploy with Docker

```bash
./scripts/docker-deploy.sh
```

### 6. Restore Your Data

```bash
# Restore database
docker compose exec -T db psql -U jumptorecipe jump_to_recipe < backup_before_docker.sql

# Restore uploads (if needed)
docker run --rm -v jump-to-recipe_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads_backup.tar.gz -C /data
```

### 7. Verify Everything Works

```bash
# Check containers
docker compose ps

# Check logs
docker compose logs -f app

# Test the application
curl http://localhost:3000/api/health
```

### 8. Clean Up Old Setup (Optional)

Once you've verified everything works:

```bash
# Remove PM2 startup script
pm2 unstartup

# Uninstall PM2 (optional)
npm uninstall -g pm2

# Remove old PostgreSQL (if not needed for other apps)
# sudo apt remove postgresql postgresql-contrib
```

## Differences from PM2 Setup

| Aspect | PM2 | Docker |
|--------|-----|--------|
| Start | `pm2 start` | `docker compose up -d` |
| Stop | `pm2 stop` | `docker compose down` |
| Logs | `pm2 logs` | `docker compose logs -f` |
| Restart | `pm2 restart` | `docker compose restart` |
| Status | `pm2 status` | `docker compose ps` |
| Update | `./update-app.sh` | `./docker-update.sh` |
| Database | System PostgreSQL | Containerized PostgreSQL |

## Rollback Plan

If something goes wrong:

```bash
# Stop Docker containers
docker compose down

# Restore old PostgreSQL
sudo systemctl start postgresql

# Restore PM2 application
pm2 start ecosystem.config.js
```

## Benefits You'll Notice

1. **Simpler updates**: Just run `./scripts/docker-update.sh`
2. **Isolated database**: No conflicts with system PostgreSQL
3. **Easy backups**: `./scripts/docker-backup.sh`
4. **Portable**: Move to any server with Docker
5. **Consistent**: Same environment in dev and production

## Troubleshooting

### Port conflicts
If port 3000 or 5432 is in use:
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :5432

# Stop the conflicting service
sudo systemctl stop postgresql  # If system PostgreSQL is running
```

### Database connection issues
```bash
# Check database container
docker compose logs db

# Verify DATABASE_URL uses 'db' not 'localhost'
docker compose exec app env | grep DATABASE_URL
```

### Permission issues
```bash
# Fix volume permissions
docker compose down
sudo chown -R $USER:$USER ./uploads
docker compose up -d
```

## Getting Help

- Check logs: `docker compose logs -f`
- Container status: `docker compose ps`
- Database access: `docker compose exec db psql -U jumptorecipe jump_to_recipe`
- Full documentation: `docs/deployment/README-DEPLOYMENT.md`
