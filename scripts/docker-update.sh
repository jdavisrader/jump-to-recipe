#!/bin/bash

# Jump to Recipe - Docker Update Script
# Updates the application with new code

set -e

echo "🔄 Jump to Recipe - Update Application"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker first"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Pull latest code (if using git)
if [ -d .git ]; then
    echo ""
    echo "📥 Pulling latest code..."
    git pull
fi

# Rebuild and restart containers
echo ""
echo "🔨 Rebuilding application..."
docker compose build app

echo ""
echo "🔄 Restarting application..."
docker compose up -d app

# Wait for application to be ready
echo ""
echo "⏳ Waiting for application to be ready..."
sleep 3

# Run migrations
echo ""
echo "📊 Running database migrations..."
docker compose exec app npm run db:push

echo ""
echo -e "${GREEN}✅ Update complete!${NC}"
echo ""
echo "Application is running at:"
echo "  - http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f app     # View application logs"
echo "  docker compose ps              # Check container status"
echo "  docker compose restart app     # Restart application"
echo ""
