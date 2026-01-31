# Directory Fix - Images Saved to Wrong Location

## Problem Identified ✅

Images were being saved to the **wrong directory**:

**Wrong (Before):**
- `public/recipes/` ❌
- `public/recipe-photos/` ❌

**Correct (After):**
- `public/uploads/recipes/` ✅
- `public/uploads/recipe-photos/` ✅

## Root Cause

The image downloader was missing `'uploads'` in the absolute path:

```typescript
// Before (wrong)
const absolutePath = path.join(config.outputDir, outputSubdir, safeFilename);
// Result: /path/to/public/recipes/file.jpg ❌

// After (fixed)
const absolutePath = path.join(config.outputDir, 'uploads', outputSubdir, safeFilename);
// Result: /path/to/public/uploads/recipes/file.jpg ✅
```

## What This Caused

1. **Database had correct paths:** `/uploads/recipes/...`
2. **Files saved to wrong location:** `public/recipes/...`
3. **Result:** Images didn't display because paths didn't match

## Fix Applied ✅

Updated `src/migration/import/image-downloader.ts`:
- Added `'uploads'` to the absolute path construction
- Now matches the existing recipe upload convention

## Cleanup Required

You now have duplicate files in the wrong locations:

```bash
# Wrong locations (need to delete)
public/recipes/          # ~65 files
public/recipe-photos/    # ~27 files

# Correct locations (will be created on re-run)
public/uploads/recipes/
public/uploads/recipe-photos/
```

### Cleanup Commands

```bash
cd jump-to-recipe

# Remove incorrectly placed files
rm -rf public/recipes/*
rm -rf public/recipe-photos/*

# Keep the directories (they might be needed for other purposes)
# Or remove them entirely if they shouldn't exist:
# rmdir public/recipes
# rmdir public/recipe-photos
```

## Re-run Migration

### Step 1: Clear Database
```bash
cd jump-to-recipe
DATABASE_URL=postgresql://localhost:5432/kiroJumpToRecipe node -e "
const { Pool } = require('pg');
(async () => {
  const pool = new Pool({ connectionString: 'postgresql://localhost:5432/kiroJumpToRecipe' });
  await pool.query('DELETE FROM recipe_photos');
  await pool.query('DELETE FROM recipes');
  console.log('✓ Cleared recipes and photos');
  await pool.end();
})();
"
```

### Step 2: Clean Up Wrong Directories
```bash
rm -rf public/recipes/*
rm -rf public/recipe-photos/*
```

### Step 3: Re-run Import
```bash
npm run migration:import
```

### Step 4: Verify Correct Location
```bash
# Should have files
ls -la public/uploads/recipes/
ls -la public/uploads/recipe-photos/

# Should be empty (or removed)
ls -la public/recipes/ 2>/dev/null || echo "Directory doesn't exist (good!)"
ls -la public/recipe-photos/ 2>/dev/null || echo "Directory doesn't exist (good!)"
```

## Verification

After re-running, check:

1. **Files in correct location:**
   ```bash
   ls -la public/uploads/recipes/ | wc -l
   ls -la public/uploads/recipe-photos/ | wc -l
   ```

2. **Database paths match files:**
   ```bash
   DATABASE_URL=postgresql://localhost:5432/kiroJumpToRecipe node check-recipe-simple.js
   ```
   
   Should show:
   ```
   Main image path: public/uploads/recipes/...
   Exists: true ✅
   
   Photo 1 path: public/uploads/recipe-photos/...
   Exists: true ✅
   ```

3. **Images display in browser:**
   - Visit any recipe page
   - Images should load correctly

## Summary

- ✅ **Fixed:** Added `'uploads'` to path construction
- ✅ **Matches:** Now follows same convention as normal recipe uploads
- ✅ **Ready:** Re-run migration to download to correct location

The fix ensures images are saved to `public/uploads/recipes/` and `public/uploads/recipe-photos/` matching the existing application convention!
