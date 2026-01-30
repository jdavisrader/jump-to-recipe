#!/bin/bash

# Cleanup and Re-run Migration Script
# This script cleans up incorrectly placed images and re-runs the migration

set -e  # Exit on error

echo "🧹 Cleanup and Re-run Migration"
echo "================================"
echo ""

# Check we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from jump-to-recipe directory"
    exit 1
fi

echo "Step 1: Clear database..."
DATABASE_URL=postgresql://localhost:5432/kiroJumpToRecipe node -e "
const { Pool } = require('pg');
(async () => {
  const pool = new Pool({ connectionString: 'postgresql://localhost:5432/kiroJumpToRecipe' });
  await pool.query('DELETE FROM recipe_photos');
  await pool.query('DELETE FROM recipes');
  console.log('✓ Cleared recipes and photos from database');
  await pool.end();
})();
"

echo ""
echo "Step 2: Remove incorrectly placed images..."
if [ -d "public/recipes" ]; then
    rm -rf public/recipes/*
    echo "✓ Cleaned public/recipes/"
fi

if [ -d "public/recipe-photos" ]; then
    rm -rf public/recipe-photos/*
    echo "✓ Cleaned public/recipe-photos/"
fi

echo ""
echo "Step 3: Ensure correct directories exist..."
mkdir -p public/uploads/recipes
mkdir -p public/uploads/recipe-photos
echo "✓ Created public/uploads/recipes/"
echo "✓ Created public/uploads/recipe-photos/"

echo ""
echo "Step 4: Re-run migration..."
npm run migration:import

echo ""
echo "Step 5: Verify files..."
RECIPE_COUNT=$(ls -1 public/uploads/recipes/ 2>/dev/null | wc -l | tr -d ' ')
PHOTO_COUNT=$(ls -1 public/uploads/recipe-photos/ 2>/dev/null | wc -l | tr -d ' ')

echo "✓ Recipe images: $RECIPE_COUNT files"
echo "✓ Recipe photos: $PHOTO_COUNT files"

echo ""
echo "🎉 Migration complete!"
echo ""
echo "Next steps:"
echo "1. Run verification: DATABASE_URL=postgresql://localhost:5432/kiroJumpToRecipe node check-recipe-simple.js"
echo "2. Check in browser that images display"
