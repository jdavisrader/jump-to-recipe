#!/bin/bash

# Jump to Recipe - Application Start Script
# This script starts the application using PM2

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
    print_error "Application not found in $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please run setup-app.sh first"
    exit 1
fi

# Check if build exists
if [ ! -d ".next" ]; then
    print_error "Application not built. Running build..."
    npm run build
fi

# Stop existing PM2 processes
print_status "Stopping existing processes..."
pm2 stop jump-to-recipe 2>/dev/null || true
pm2 delete jump-to-recipe 2>/dev/null || true

# Start the application
print_status "Starting Jump to Recipe application..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Show status
print_status "Application status:"
pm2 status

# Show logs
print_status "Recent logs:"
pm2 logs jump-to-recipe --lines 10

print_success "Jump to Recipe is now running!"
print_status "Access your application at: http://localhost:3000"
print_status "Or from other devices at: http://$(hostname -I | awk '{print $1}'):3000"

echo ""
print_status "Useful commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs jump-to-recipe - View application logs"
echo "  pm2 restart jump-to-recipe - Restart the application"
echo "  pm2 stop jump-to-recipe - Stop the application"
echo "  pm2 monit              - Monitor resources"