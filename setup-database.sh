#!/bin/bash

# Jump to Recipe - Database Setup Script
# This script creates and initializes the PostgreSQL database

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
    print_error "Please run setup-app.sh first"
    exit 1
fi

cd "$APP_DIR"

# Load environment variables
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please run setup-app.sh first"
    exit 1
fi

source .env

# Check if PostgreSQL is running
print_status "Checking PostgreSQL connection..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    print_error "PostgreSQL is not running or not accessible"
    print_error "Please ensure PostgreSQL is installed and running:"
    echo "  sudo systemctl start postgresql"
    echo "  sudo systemctl enable postgresql"
    exit 1
fi

# Extract database details from DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not set in .env file"
    exit 1
fi

# Parse DATABASE_URL (format: postgres://user:password@host:port/database)
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

print_status "Database configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"

# Create database if it doesn't exist
print_status "Creating database '$DB_NAME' if it doesn't exist..."

# Check if database exists
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" != "1" ]; then
    print_status "Creating database '$DB_NAME'..."
    sudo -u postgres createdb "$DB_NAME"
    print_success "Database '$DB_NAME' created"
else
    print_success "Database '$DB_NAME' already exists"
fi

# Create user if it doesn't exist
print_status "Setting up database user '$DB_USER'..."
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'")

if [ "$USER_EXISTS" != "1" ]; then
    print_status "Creating user '$DB_USER'..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
    print_success "User '$DB_USER' created"
else
    print_status "User '$DB_USER' already exists, updating password..."
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
fi

# Grant privileges
print_status "Granting privileges to user '$DB_USER'..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

# Test connection
print_status "Testing database connection..."
if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Failed to connect to database"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
npm run db:push

# Seed the database (optional)
read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database..."
    npm run db:seed
    print_success "Database seeded with sample data"
fi

print_success "Database setup completed!"
print_status "Database is ready for the application"