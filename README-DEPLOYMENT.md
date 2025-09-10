# Jump to Recipe - Raspberry Pi Deployment Guide

This guide will help you deploy the Jump to Recipe application to your Raspberry Pi running Ubuntu Server.

## Prerequisites

- Raspberry Pi with Ubuntu Server installed
- PostgreSQL installed and running
- SSH access to your Raspberry Pi
- Your project files ready to transfer

## Quick Start

1. **Transfer files to your Raspberry Pi**
2. **Run the deployment scripts in order**
3. **Configure your environment**
4. **Start the application**

## Detailed Steps

### 1. System Setup

First, run the system setup script to install all required dependencies:

```bash
chmod +x deploy-to-pi.sh
./deploy-to-pi.sh
```

This script will:
- Update system packages
- Install Node.js (LTS version)
- Install PM2 process manager
- Install Git
- Create application directory at `/home/$USER/jump-to-recipe`

### 2. Transfer Your Project Files

Copy your project files to the Raspberry Pi. You can use one of these methods:

**Option A: Using SCP**
```bash
# From your local machine
scp -r ./jump-to-recipe/ user@raspberry-pi-ip:/home/user/
```

**Option B: Using Git**
```bash
# On the Raspberry Pi
cd /home/$USER
git clone <your-repository-url> jump-to-recipe
```

**Option C: Using rsync**
```bash
# From your local machine
rsync -avz --exclude node_modules ./jump-to-recipe/ user@raspberry-pi-ip:/home/user/jump-to-recipe/
```

### 3. Application Setup

Run the application setup script:

```bash
chmod +x setup-app.sh
./setup-app.sh
```

This script will:
- Install Node.js dependencies
- Create environment configuration
- Build the application
- Create PM2 configuration
- Set up systemd service for auto-start

### 4. Database Setup

Run the database setup script:

```bash
chmod +x setup-database.sh
./setup-database.sh
```

This script will:
- Create the database if it doesn't exist
- Set up database user and permissions
- Run database migrations
- Optionally seed with sample data

### 5. Start the Application

Start the application:

```bash
chmod +x start-app.sh
./start-app.sh
```

The application will be available at:
- Local: `http://localhost:3000`
- Network: `http://your-pi-ip:3000`

## Environment Configuration

Edit the `.env` file in your application directory to configure:

```bash
# Database connection
DATABASE_URL="postgres://username:password@localhost:5432/jump_to_recipe"

# Environment
NODE_ENV="production"

# File storage (set to false for local storage)
USE_S3=false

# AWS S3 (only if USE_S3=true)
AWS_ACCESS_KEY_ID="your_key"
AWS_SECRET_ACCESS_KEY="your_secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket"
```

## Management Scripts

### Start/Stop Application
```bash
./start-app.sh    # Start the application
./stop-app.sh     # Stop the application
```

### Update Application
```bash
./update-app.sh   # Update with new code and restart
```

### PM2 Commands
```bash
pm2 status                    # Check application status
pm2 logs jump-to-recipe      # View logs
pm2 restart jump-to-recipe   # Restart application
pm2 monit                    # Monitor resources
```

## Firewall Configuration

If you have a firewall enabled, allow port 3000:

```bash
sudo ufw allow 3000
```

## Auto-Start on Boot

The setup script creates a systemd service that will automatically start the application on boot:

```bash
sudo systemctl status jump-to-recipe    # Check service status
sudo systemctl start jump-to-recipe     # Start service
sudo systemctl stop jump-to-recipe      # Stop service
```

## Troubleshooting

### Check Application Logs
```bash
pm2 logs jump-to-recipe
# or
tail -f /home/$USER/jump-to-recipe/logs/combined.log
```

### Check Database Connection
```bash
cd /home/$USER/jump-to-recipe
npm run db:studio  # Opens Drizzle Studio on port 4983
```

### Check System Resources
```bash
pm2 monit          # PM2 monitoring
htop               # System resources
df -h              # Disk usage
```

### Common Issues

1. **Port 3000 already in use**
   - Change the PORT in ecosystem.config.js
   - Or kill the process using port 3000

2. **Database connection failed**
   - Check PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify DATABASE_URL in .env file
   - Check database user permissions

3. **Build failed**
   - Check Node.js version: `node --version` (should be 18+)
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

4. **Permission errors**
   - Ensure proper file permissions: `chmod +x *.sh`
   - Check directory ownership: `chown -R $USER:$USER /home/$USER/jump-to-recipe`

## Performance Optimization

For better performance on Raspberry Pi:

1. **Increase swap space** (if you have limited RAM):
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

2. **Optimize PM2 settings** in ecosystem.config.js:
   - Reduce max_memory_restart for Pi's limited RAM
   - Set instances to 1 for single-core optimization

3. **Use local file storage** instead of S3 to reduce network overhead

## Security Considerations

1. **Change default ports** if exposing to internet
2. **Set up SSL/TLS** with Let's Encrypt for HTTPS
3. **Configure firewall** to only allow necessary ports
4. **Regular updates** of system packages and dependencies
5. **Use strong database passwords**

## Backup Strategy

Regular backups are created automatically during updates. Manual backup:

```bash
# Backup application
cp -r /home/$USER/jump-to-recipe /home/$USER/jump-to-recipe_backup_$(date +%Y%m%d)

# Backup database
pg_dump -h localhost -U your_user jump_to_recipe > backup_$(date +%Y%m%d).sql
```

## Support

If you encounter issues:
1. Check the logs first
2. Verify all prerequisites are met
3. Ensure proper file permissions
4. Check system resources (RAM, disk space)