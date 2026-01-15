#!/bin/bash

# Jump to Recipe - Docker Deployment Script
# This script deploys the application using Docker Compose

set -e

echo "🚀 Jump to Recipe - Docker Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/engine/install/ubuntu/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please edit .env file with your configuration before continuing${NC}"
    echo "Press Enter when ready..."
    read
fi

# Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."
docker compose down

# Build and start containers
echo ""
echo "🔨 Building Docker images..."
docker compose build --no-cache

echo ""
echo "🚀 Starting containers..."
docker compose up -d

# Wait for database to be ready
echo ""
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run database migrations
echo ""
echo "📊 Running database migrations..."
docker compose exec app npm run db:push

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Application is running at:"
echo "  - http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f app     # View application logs"
echo "  docker compose logs -f db      # View database logs"
echo "  docker compose ps              # Check container status"
echo "  docker compose down            # Stop all containers"
echo "  docker compose restart app     # Restart application"
echo ""
