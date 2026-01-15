# Jump to Recipe - Docker Deployment Guide

This guide will help you deploy the Jump to Recipe application using Docker and Docker Compose on Ubuntu Server.

## Prerequisites

- Ubuntu Server (20.04 or later)
- Docker and Docker Compose installed
- SSH access to your server
- At least 2GB RAM and 10GB disk space

## Quick Start

```bash
# 1. Install Docker and Docker Compose (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Clone or transfer your project
git clone <your-repo> jump-to-recipe
cd jump-to-recipe

# 3. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 4. Deploy
chmod +x scripts/docker-deploy.sh
./scripts/docker-deploy.sh
```

Your app will be running at `http://localhost:3000`

## Detailed Steps

### 1. Install Docker and Docker Compose

If Docker isn't installed yet:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 2. Transfer Your Project Files

**Option A: Using Git**
```bash
git clone <your-repository-url> jump-to-recipe
cd jump-to-recipe
```

**Option B: Using rsync**
```bash
# From your local machine
rsync -avz --exclude node_modules --exclude .git ./jump-to-recipe/ user@server-ip:/home/user/jump-to-recipe/
```

**Option C: Using SCP**
```bash
# From your local machine
scp -r ./jump-to-recipe/ user@server-ip:/home/user/
```

### 3. Configure Environment

Create your `.env` file from the example:

```bash
cp .env.example .env
nano .env
```

**Important settings to configure:**
- `DB_PASSWORD`: Set a strong database password
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your server's URL (e.g., `http://your-server-ip:3000`)
- OAuth credentials (if using Google/GitHub login)

### 4. Deploy the Application

Run the deployment script:

```bash
chmod +x scripts/docker-deploy.sh
./scripts/docker-deploy.sh
```

This will:
- Build Docker images
- Start PostgreSQL database
- Start Next.js application
- Run database migrations
- Set up health checks

The application will be available at:
- Local: `http://localhost:3000`
- Network: `http://your-server-ip:3000`

## Docker Architecture

The deployment uses three containers:

1. **PostgreSQL Database** (`db`)
   - Persistent data storage
   - Automatic health checks
   - Port 5432 exposed for direct access

2. **Next.js Application** (`app`)
   - Multi-stage build for optimization
   - Automatic restarts on failure
   - Port 3000 exposed

3. **Nginx Reverse Proxy** (`nginx`) - Optional
   - SSL/TLS termination
   - Rate limiting
   - Only starts with `--profile production`

## Management Commands

### Basic Operations
```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f app      # Application logs
docker compose logs -f db       # Database logs
docker compose logs -f          # All logs

# Restart services
docker compose restart app      # Restart app only
docker compose restart          # Restart all

# Stop everything
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v
```

### Update Application
```bash
# Pull latest code and update
./scripts/docker-update.sh

# Or manually:
git pull
docker compose build app
docker compose up -d app
docker compose exec app npm run db:push
```

### Backup and Restore
```bash
# Create backup
./scripts/docker-backup.sh

# Restore from backup
./scripts/docker-restore.sh 20260114_120000

# List available backups
ls -lh backups/
```

## Production Setup with Nginx and SSL

To enable the Nginx reverse proxy with SSL:

### 1. Start with Nginx
```bash
docker compose --profile production up -d
```

### 2. Set up SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
sudo chown -R $USER:$USER nginx/ssl

# Update nginx.conf to enable HTTPS (uncomment the SSL server block)
nano nginx/nginx.conf

# Restart nginx
docker compose restart nginx
```

### 3. Auto-renew SSL certificates

```bash
# Add to crontab
sudo crontab -e

# Add this line:
0 0 * * * certbot renew --quiet && docker compose restart nginx
```

## Firewall Configuration

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Or just allow port 3000 if not using Nginx
sudo ufw allow 3000

# Check status
sudo ufw status
```

## Auto-Start on Boot

Docker containers are configured with `restart: unless-stopped`, so they'll automatically start on system boot. No additional configuration needed!

## Troubleshooting

### Check Container Status
```bash
docker compose ps                    # Container status
docker compose logs -f app          # Application logs
docker compose logs -f db           # Database logs
docker stats                        # Resource usage
```

### Access Database Directly
```bash
# Connect to PostgreSQL
docker compose exec db psql -U jumptorecipe jump_to_recipe

# Run Drizzle Studio (from host)
cd jump-to-recipe
npm run db:studio
```

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   sudo lsof -i :3000
   
   # Change port in docker-compose.yml
   # ports:
   #   - "3001:3000"  # Use 3001 instead
   ```

2. **Database connection failed**
   ```bash
   # Check database is healthy
   docker compose ps
   
   # Check database logs
   docker compose logs db
   
   # Verify DATABASE_URL in .env matches docker-compose.yml
   ```

3. **Build failed**
   ```bash
   # Clear Docker cache and rebuild
   docker compose build --no-cache app
   
   # Check Docker disk space
   docker system df
   
   # Clean up unused images
   docker system prune -a
   ```

4. **Container keeps restarting**
   ```bash
   # Check logs for errors
   docker compose logs --tail=100 app
   
   # Check health status
   docker inspect jump-to-recipe-app | grep -A 10 Health
   ```

5. **Permission errors with volumes**
   ```bash
   # Fix volume permissions
   docker compose down
   sudo chown -R $USER:$USER ./uploads
   docker compose up -d
   ```

## Performance Optimization

### Resource Limits

Add resource limits to `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          memory: 512M
```

### Docker Optimization

```bash
# Enable Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Use Docker layer caching
docker compose build --build-arg BUILDKIT_INLINE_CACHE=1
```

### Database Tuning

For better PostgreSQL performance, create `postgres.conf`:

```bash
# Adjust based on your server RAM
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
```

Mount it in docker-compose.yml:
```yaml
db:
  volumes:
    - ./postgres.conf:/etc/postgresql/postgresql.conf
```

## Security Considerations

1. **Change default ports** if exposing to internet
2. **Set up SSL/TLS** with Let's Encrypt for HTTPS
3. **Configure firewall** to only allow necessary ports
4. **Regular updates** of system packages and dependencies
5. **Use strong database passwords**

## Backup Strategy

### Automated Backups

Set up a cron job for regular backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /home/$USER/jump-to-recipe && ./scripts/docker-backup.sh

# Add weekly cleanup (keep last 30 days)
0 3 * * 0 find /home/$USER/jump-to-recipe/backups -name "*.sql" -mtime +30 -delete
```

### Manual Backup

```bash
# Create backup
./scripts/docker-backup.sh

# Backups are saved to ./backups/ directory
```

### Restore from Backup

```bash
# List available backups
ls -lh backups/

# Restore specific backup
./scripts/docker-restore.sh 20260114_120000
```

### Off-site Backup

```bash
# Sync backups to remote server
rsync -avz backups/ user@backup-server:/backups/jump-to-recipe/

# Or use cloud storage (example with AWS S3)
aws s3 sync backups/ s3://your-bucket/jump-to-recipe-backups/
```

## Monitoring

### Basic Monitoring

```bash
# Real-time container stats
docker stats

# Check container health
docker compose ps

# View resource usage
docker system df
```

### Advanced Monitoring (Optional)

For production, consider adding monitoring tools:

- **Portainer**: Web UI for Docker management
- **Prometheus + Grafana**: Metrics and dashboards
- **Uptime Kuma**: Uptime monitoring

## Useful Docker Commands

```bash
# View all containers (including stopped)
docker ps -a

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# View Docker disk usage
docker system df

# Clean up everything (⚠️ careful!)
docker system prune -a --volumes

# Execute command in running container
docker compose exec app sh

# View container environment variables
docker compose exec app env
```

## Support

If you encounter issues:
1. Check container logs: `docker compose logs -f`
2. Verify `.env` configuration
3. Check container health: `docker compose ps`
4. Review system resources: `docker stats`
5. Check Docker disk space: `docker system df`