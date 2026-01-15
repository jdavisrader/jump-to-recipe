#!/bin/bash

# Jump to Recipe - Docker Update Script
# Updates the application with new code

set -e

echo "🔄 Jump to Recipe - Update Application"
echo "======================================"

GREEN='\033[0;32m'
NC='\033[0m'

# Pull latest code (if using git)
if [ -d .git ]; then
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

# Run migrations
echo ""
echo "📊 Running database migrations..."
docker compose exec app npm run db:push

echo ""
echo -e "${GREEN}✅ Update complete!${NC}"
echo ""
echo "Check status with: docker compose ps"
echo "View logs with: docker compose logs -f app"
