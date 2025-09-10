#!/bin/bash

# Jump to Recipe - Application Setup Script
# This script configures the application after files are copied

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Set application directory
APP_DIR="/home/$USER/jump-to-recipe"

# Check if we're in the right directory
if [ ! -f "$APP_DIR/package.json" ]; then
    print_error "package.json not found in $APP_DIR"
    print_error "Please ensure your project files are copied to $APP_DIR first"
    exit 1
fi

cd "$APP_DIR"

print_status "Setting up Jump to Recipe application..."

# Install dependencies
print_status "Installing Node.js dependencies..."
npm ci --production=false

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating environment configuration..."
    cp .env.example .env
    
    print_warning "Please edit .env file with your configuration:"
    echo "  - DATABASE_URL: Your PostgreSQL connection string"
    echo "  - NODE_ENV: Set to 'production'"
    echo "  - AWS credentials (if using S3 for file storage)"
    
    # Prompt for database URL
    read -p "Enter your PostgreSQL database URL (postgres://user:password@localhost:5432/dbname): " DB_URL
    if [ ! -z "$DB_URL" ]; then
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$DB_URL\"|" .env
    fi
    
    # Set production environment
    sed -i "s|NODE_ENV=.*|NODE_ENV=\"production\"|" .env
    
    # Set local file storage by default
    sed -i "s|USE_S3=.*|USE_S3=false|" .env
else
    print_success "Environment file already exists"
fi

# Create uploads directory for local file storage
print_status "Creating uploads directory..."
mkdir -p public/uploads
chmod 755 public/uploads

# Build the application
print_status "Building the application..."
npm run build

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'jump-to-recipe',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Create systemd service for auto-start on boot
print_status "Creating systemd service for auto-start..."
sudo tee /etc/systemd/system/jump-to-recipe.service > /dev/null << EOF
[Unit]
Description=Jump to Recipe App
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pm2 start ecosystem.config.js --no-daemon
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl daemon-reload
sudo systemctl enable jump-to-recipe.service

print_success "Application setup completed!"
print_status "Next steps:"
echo "1. Edit .env file with your specific configuration"
echo "2. Run ./setup-database.sh to initialize the database"
echo "3. Run ./start-app.sh to start the application"