#!/bin/bash

# Jump to Recipe - Application Stop Script
# This script stops the application

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

print_status "Stopping Jump to Recipe application..."

# Stop PM2 process
if pm2 list | grep -q "jump-to-recipe"; then
    pm2 stop jump-to-recipe
    print_success "Application stopped"
else
    print_warning "Application is not running"
fi

# Show status
pm2 status

print_success "Jump to Recipe has been stopped"