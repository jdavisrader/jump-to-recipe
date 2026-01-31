# Image Download Issue - Diagnosis & Fix

## Problem

Images are being saved to the database with correct paths, but the actual image files are not being downloaded to disk.

**Example:**
- Database has: `/uploads/recipes/72fb2ef4-c0fb-4f22-a283-3cb6b7f449a0-Aebleskiver-Recipe-1.jpg`
- File system: ❌ File does not exist

## Root Cause

The most likely causes are:

### 1. Working Directory Issue
The migration might be running from the wrong directory. The code uses:
```typescript
outputDir: path.join(process.cwd(), 'public')
```

If `process.cwd()` is `/Users/you/project` instead of `/Users/you/project/jump-to-recipe`, files would be saved to the wrong location.

### 2. Silent Download Failures
The image download might be failing but not throwing errors that stop the import.

## Solution

### Step 1: Add Debug Logging (DONE)

Added logging to show:
- Current working directory
- Output directory path
- File save confirmation with byte count

### Step 2: Run Test Import

1. **Set batch size to 1** in `.env.migration`:
   ```bash
   MIGRATION_BATCH_SIZE=1
   ```

2. **Run from the correct directory**:
   ```bash
   cd jump-to-recipe
   npm run migration:import
   ```

3. **Check the console output** for:
   ```
   [BatchImporter] Image download config:
     legacyBaseUrl: http://happeacook.com
     outputDir: /full/path/to/jump-to-recipe/public
     cwd: /full/path/to/jump-to-recipe
   
   📸 Downloading images for: Recipe Name (Legacy ID: 1)
     Scraping: http://happeacook.com/recipes/1
     Recipe image found
     Downloading: http://...
     [saveImageToLocal] Saved 12345 bytes to: /full/path/...
     ✓ Saved: /uploads/recipes/...
   ```

4. **Verify the file exists**:
   ```bash
   ls -la public/uploads/recipes/
   ```

### Step 3: Fix Working Directory

If the `cwd` is wrong, the migration needs to be run from `jump-to-recipe/` directory, not the parent.

**Wrong:**
```bash
cd /Users/you/project
npm run migration:import  # ❌ Wrong directory!
```

**Correct:**
```bash
cd /Users/you/project/jump-to-recipe
npm run migration:import  # ✅ Correct!
```

### Step 4: Alternative Fix - Use Absolute Path

If you need to run from parent directory, change the batch importer to use an absolute path:

```typescript
// In batch-importer.ts
this.imageConfig = {
  legacyBaseUrl: process.env.LEGACY_IMAGE_BASE_URL || 'http://happeacook.com',
  outputDir: path.join(__dirname, '../../../public'), // Relative to this file
  timeout: 30000,
  retries: 3,
};
```

## Verification

After fixing, verify:

1. **Check console shows file saves**:
   ```
   [saveImageToLocal] Saved 12345 bytes to: /path/to/public/uploads/recipes/...
   ```

2. **Check files exist**:
   ```bash
   ls -la public/uploads/recipes/
   ls -la public/uploads/recipe-photos/
   ```

3. **Check database matches files**:
   ```bash
   node check-recipe-simple.js
   ```

4. **Check in browser**:
   - Visit recipe page
   - Images should display

## Quick Test Script

Run this to check a specific recipe:

```bash
DATABASE_URL=postgresql://localhost:5432/kiroJumpToRecipe node check-recipe-simple.js
```

This will show:
- What's in the database
- Whether files exist on disk
- Exact paths being used

## Next Steps

1. Run test import with batch size 1
2. Check console output for working directory
3. Verify files are being saved
4. If files still missing, check permissions on `public/uploads/` directories
5. Re-run full migration from correct directory

## Prevention

To prevent this in future:

1. Always run migration from `jump-to-recipe/` directory
2. Add a check in the migration script to verify `public/` directory exists
3. Add file existence verification after download
4. Log full absolute paths during download
