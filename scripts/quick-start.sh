#!/bin/bash
set -e

echo "🚀 Quick Start - Jump to Recipe"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  echo "📝 Please create .env file from .env.example:"
  echo "   cp .env.example .env"
  echo "   nano .env  # Edit with your values"
  exit 1
fi

# Check if node_modules exists in jump-to-recipe
if [ ! -d "jump-to-recipe/node_modules" ]; then
  echo "📦 Installing dependencies..."
  cd jump-to-recipe
  npm install
  cd ..
fi

# Start database
echo "🗄️  Starting database..."
docker-compose up -d db

# Wait for database
echo "⏳ Waiting for database (10 seconds)..."
sleep 10

# Run migrations
echo "🔄 Running migrations..."
cd jump-to-recipe
npm run db:push || {
  echo "⚠️  Migration failed. Database might not be ready yet."
  echo "   Waiting 10 more seconds..."
  sleep 10
  npm run db:push
}
cd ..

# Build and start app
echo "🏗️  Building and starting application..."
docker-compose up -d app

echo ""
echo "✅ Done! Application starting..."
echo ""
echo "🌐 Access the app at: http://localhost:3000"
echo "📊 Check status: docker-compose ps"
echo "📝 View logs: docker-compose logs -f app"
echo ""
