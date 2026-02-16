#!/bin/bash

# Migration Script: Add Explicit Positions to Recipes
# 
# This script runs the position migration to add explicit position
# properties to all ingredients and instructions in the database.
#
# Usage:
#   ./scripts/migrate-positions.sh
#
# Or from the jump-to-recipe directory:
#   npm run migrate:positions

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Recipe Position Migration Script                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must be run from the jump-to-recipe directory"
  exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "❌ Error: .env file not found"
  echo "   Please create .env with DATABASE_URL configured"
  exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env; then
  echo "❌ Error: DATABASE_URL not found in .env"
  echo "   Please add DATABASE_URL to your .env file"
  exit 1
fi

echo "✓ Environment checks passed"
echo ""

# Confirm before running
read -p "This will add position properties to all recipes. Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Migration cancelled"
  exit 0
fi

echo ""
echo "Starting migration..."
echo ""

# Run the migration
npx tsx src/db/migrations/migrate-explicit-positions.ts

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              Migration Script Complete                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
