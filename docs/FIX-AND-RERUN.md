# Quick Fix & Re-run Guide

## Problem
Images were saved to database but not downloaded to disk.

## Root Cause
Migration used `process.cwd()` which gave wrong directory path.

## Fix Applied ✅
Changed to use `__dirname` for reliable path resolution.

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

### Step 2: Re-run Import
```bash
cd jump-to-recipe
npm run migration:import
```

### Step 3: Watch for New Logging
You should see:
```
[BatchImporter] Image download config:
  outputDir: /full/path/to/jump-to-recipe/public
  Checking directories:
    recipes dir exists: true
    photos dir exists: true

📸 Downloading images for: Recipe Name
  [saveImageToLocal] Saved 12345 bytes to: ...
  ✓ Saved: /uploads/recipes/...
```

### Step 4: Verify Files
```bash
ls -la public/uploads/recipes/
ls -la public/uploads/recipe-photos/
```

Should see actual image files!

### Step 5: Test in Browser
Visit a recipe page - images should display!

## Quick Verification
```bash
DATABASE_URL=postgresql://localhost:5432/kiroJumpToRecipe node check-recipe-simple.js
```

Should show `Exists: true` for all images.

## That's It!
The fix ensures images download to the correct location every time.
