#!/bin/bash

# Jump to Recipe - Application Update Script
# This script updates the application with new code

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

print_status "Updating Jump to Recipe application..."

# Stop the application
print_status "Stopping application..."
pm2 stop jump-to-recipe 2>/dev/null || true

# Backup current version
BACKUP_DIR="${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
print_status "Creating backup at $BACKUP_DIR..."
cp -r "$APP_DIR" "$BACKUP_DIR"

# Update dependencies
print_status "Updating dependencies..."
npm ci --production=false

# Run database migrations (if any)
print_status "Running database migrations..."
npm run db:push

# Rebuild the application
print_status "Rebuilding application..."
npm run build

# Restart the application
print_status "Restarting application..."
pm2 start ecosystem.config.js

print_success "Application updated and restarted!"
print_status "Backup created at: $BACKUP_DIR"
print_status "Application is running at: http://localhost:3000"