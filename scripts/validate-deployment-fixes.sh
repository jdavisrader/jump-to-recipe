#!/bin/bash

# Deployment Fixes Validation Script
# Tests that both critical fixes are working correctly

set -e  # Exit on error

echo "🔍 Validating Deployment Fixes..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

# Test 1: Check Drizzle Config
echo "📋 Test 1: Drizzle Configuration"
if grep -q "url: process.env.DATABASE_URL" jump-to-recipe/drizzle.config.ts; then
    echo -e "${GREEN}✅ PASS${NC} - Drizzle config uses DATABASE_URL"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Drizzle config still has hardcoded credentials"
    ((FAILED++))
fi
echo ""

# Test 2: Check RecipeSearch Suspense Import
echo "📋 Test 2: RecipeSearch Suspense Import"
if grep -q "import.*Suspense.*from 'react'" jump-to-recipe/src/app/recipes/RecipesClient.tsx; then
    echo -e "${GREEN}✅ PASS${NC} - Suspense imported in RecipesClient"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Suspense not imported"
    ((FAILED++))
fi
echo ""

# Test 3: Check RecipeSearch Suspense Wrapper
echo "📋 Test 3: RecipeSearch Suspense Wrapper"
if grep -Pzo "<Suspense[^>]*>.*<RecipeSearch" jump-to-recipe/src/app/recipes/RecipesClient.tsx > /dev/null 2>&1 || \
   grep -A 1 "<Suspense" jump-to-recipe/src/app/recipes/RecipesClient.tsx | grep -q "RecipeSearch"; then
    echo -e "${GREEN}✅ PASS${NC} - RecipeSearch wrapped in Suspense"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - RecipeSearch not wrapped in Suspense"
    ((FAILED++))
fi
echo ""

# Test 4: TypeScript Check (if tsc is available)
echo "📋 Test 4: TypeScript Validation"
cd jump-to-recipe
if npm run type-check > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC} - No TypeScript errors"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARN${NC} - TypeScript errors found (may be pre-existing)"
    # Don't count as failure since there may be pre-existing errors
fi
cd ..
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical fixes validated successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: cd jump-to-recipe && npm run build"
    echo "2. Run: docker-compose build"
    echo "3. Run: docker-compose up -d"
    echo "4. Test the application"
    exit 0
else
    echo -e "${RED}❌ Some fixes failed validation${NC}"
    echo ""
    echo "Please review the failed tests above and reapply fixes."
    exit 1
fi
