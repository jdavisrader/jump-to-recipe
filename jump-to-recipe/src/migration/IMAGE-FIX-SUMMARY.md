# Image Download Fix - Summary

## Problem Identified

✅ **Root Cause Found:** Images were not being downloaded because the migration was using `process.cwd()` to determine the output directory, which depends on where the command is run from.

**What happened:**
- Database correctly stored paths like `/uploads/recipes/{uuid}-{filename}.jpg`
- But actual files were never saved to disk
- This happened because `process.cwd()` returned the wrong directory

## Solution Implemented

### Changed Path Resolution

**Before (❌ Wrong):**
```typescript
outputDir: path.join(process.cwd(), 'public')
// If run from parent dir: /Users/you/project/public (wrong!)
// If run from jump-to-recipe: /Users/you/project/jump-to-recipe/public (correct)
```

**After (✅ Fixed):**
```typescript
const projectRoot = path.resolve(__dirname, '../../..');
const publicDir = path.join(projectRoot, 'public');
// Always resolves to: /Users/you/project/jump-to-recipe/public
```

### Added Diagnostic Logging

The migration now shows:
```
[BatchImporter] Image download config:
  legacyBaseUrl: http://happeacook.com
  outputDir: /full/path/to/jump-to-recipe/public
  __dirname: /full/path/to/src/migration/import
  projectRoot: /full/path/to/jump-to-recipe
  cwd: /wherever/you/ran/from
  Checking directories:
    recipes dir exists: true
    photos dir exists: true
```

### Added File Save Logging

Each image save now logs:
```
[saveImageToLocal] Saved 12345 bytes to: /full/path/to/public/uploads/recipes/...
```

## How to Fix Your Database

Since the previous migration saved the paths to the database but didn't download the files, you have two options:

### Option 1: Re-run Full Migration (Recommended)

1. **Clear the database:**
   ```sql
   DELETE FROM recipe_photos;
   DELETE FROM recipes;
   DELETE FROM users WHERE email LIKE '%@%';
   ```

2. **Re-run migration:**
   ```bash
   cd jump-to-recipe
   npm run migration:extract   # If needed
   npm run migration:transform # If needed
   npm run migration:import
   ```

3. **Verify files downloaded:**
   ```bash
   ls -la public/uploads/recipes/
   ls -la public/uploads/recipe-photos/
   ```

### Option 2: Download Images for Existing Recipes

Create a script to download images for recipes that already exist in the database:

```typescript
// download-missing-images.ts
import { db } from '@/db';
import { recipes, recipePhotos } from '@/db/schema';
import { downloadRecipeImages } from './src/migration/import/image-downloader';

async function downloadMissingImages() {
  const allRecipes = await db.select().from(recipes);
  
  for (const recipe of allRecipes) {
    // Extract legacy ID from somewhere (you'd need to store this)
    const legacyId = recipe.legacyId; // If you have this field
    
    if (legacyId) {
      await downloadRecipeImages(
        recipe.id,
        recipe.title,
        legacyId,
        imageConfig,
        stats
      );
    }
  }
}
```

## Verification Steps

After re-running the migration:

### 1. Check Console Output

Look for:
```
[BatchImporter] Image download config:
  outputDir: /correct/path/to/jump-to-recipe/public
  Checking directories:
    recipes dir exists: true
    photos dir exists: true

📸 Downloading images for: Recipe Name (Legacy ID: 1)
  Scraping: http://happeacook.com/recipes/1
  Recipe image found
  Downloading: http://...
  [saveImageToLocal] Saved 12345 bytes to: /path/to/public/uploads/recipes/...
  ✓ Saved: /uploads/recipes/...
```

### 2. Check Files Exist

```bash
ls -la public/uploads/recipes/ | wc -l
ls -la public/uploads/recipe-photos/ | wc -l
```

Should show actual files, not just `.gitkeep`.

### 3. Verify Database Matches Files

```bash
DATABASE_URL=postgresql://localhost:5432/kiroJumpToRecipe node check-recipe-simple.js
```

Should show:
```
=== File System Check ===
Main image path: public/uploads/recipes/...
Exists: true  ✅

Photo 1 path: public/uploads/recipe-photos/...
Exists: true  ✅
```

### 4. Check in Browser

Visit a recipe page - images should display!

## Prevention

To prevent this in the future:

1. ✅ **Fixed:** Now uses `__dirname` instead of `process.cwd()`
2. ✅ **Added:** Directory existence checks
3. ✅ **Added:** Detailed logging of paths
4. ✅ **Added:** File save confirmation with byte count

## Files Modified

1. `src/migration/import/batch-importer.ts`
   - Changed path resolution to use `__dirname`
   - Added directory verification
   - Added detailed logging

2. `src/migration/import/image-downloader.ts`
   - Added file save logging with byte count
   - Added error logging

## Next Steps

1. **Re-run the migration** from the `jump-to-recipe/` directory
2. **Watch the console** for the new diagnostic output
3. **Verify files** are actually being saved
4. **Check in browser** that images display

The fix ensures images will be downloaded to the correct location regardless of where the migration command is run from!
