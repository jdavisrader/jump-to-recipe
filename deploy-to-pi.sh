#!/bin/bash

# Jump to Recipe - Raspberry Pi Deployment Script
# This script sets up the Jump to Recipe app on Ubuntu Server

set -e  # Exit on any error

echo "🚀 Starting Jump to Recipe deployment on Raspberry Pi..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource repository for latest LTS)
print_status "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_success "Node.js already installed: $(node --version)"
fi

# Verify Node.js version (should be 18+ for Next.js 15)
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ required. Current version: $(node --version)"
    exit 1
fi

# Install PM2 for process management
print_status "Installing PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    print_success "PM2 already installed: $(pm2 --version)"
fi

# Install Git if not present
print_status "Checking Git installation..."
if ! command -v git &> /dev/null; then
    sudo apt install -y git
else
    print_success "Git already installed: $(git --version)"
fi

# Create application directory
APP_DIR="/home/$USER/jump-to-recipe"
print_status "Setting up application directory at $APP_DIR..."

if [ -d "$APP_DIR" ]; then
    print_warning "Directory $APP_DIR already exists. Backing up..."
    mv "$APP_DIR" "${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
fi

mkdir -p "$APP_DIR"

print_success "System dependencies installed successfully!"
print_status "Next steps:"
echo "1. Copy your project files to $APP_DIR"
echo "2. Run ./setup-app.sh to configure the application"
echo "3. Run ./setup-database.sh to set up the database"
echo "4. Run ./start-app.sh to start the application"