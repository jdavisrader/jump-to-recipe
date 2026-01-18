#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Step 1: Start database
echo "📦 Starting database..."
docker-compose up -d db

# Step 2: Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Step 3: Run migrations from local (has dev dependencies)
echo "🔄 Running database migrations..."
cd jump-to-recipe
npm run db:push
cd ..

# Step 4: Seed database (optional)
read -p "Do you want to seed the database with demo data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🌱 Seeding database..."
  cd jump-to-recipe
  npm run db:seed
  cd ..
fi

# Step 5: Build and start application
echo "🏗️  Building application..."
docker-compose build app

echo "🚀 Starting application..."
docker-compose up -d app

# Step 6: Show status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Application should be available at:"
echo "   http://localhost:3000"
echo ""
echo "📝 View logs with:"
echo "   docker-compose logs -f app"
