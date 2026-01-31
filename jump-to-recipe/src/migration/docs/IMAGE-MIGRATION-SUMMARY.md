# Image Migration Enhancement - Summary

## What Was Done

The migration script has been enhanced to extract and reference recipe images from the legacy Rails Active Storage system.

## Changes Made

### 1. Type Definitions (`types/extraction.ts`)
- Added `LegacyActiveStorageAttachment` interface
- Added `LegacyActiveStorageBlob` interface
- Updated `ExportMetadata` to include attachment and blob counts

### 2. Extraction (`extract/table-extractors.ts`)
- Added `extractActiveStorageAttachments()` function
- Added `extractActiveStorageBlobs()` function
- Updated `extractAllTables()` to include new tables
- Gracefully handles missing tables (for older databases)

### 3. Metadata Generation (`extract/metadata-generator.ts`)
- Updated to save `active_storage_attachments.json`
- Updated to save `active_storage_blobs.json`
- Includes checksums for new files
- Updated record counts in metadata

### 4. Recipe Transformation (`transform/recipe-transformer.ts`)
- Added `RecipeImages` interface
- Added `originalRecipePhotoUrl` field to `TransformedRecipe`
- Added `imagesFound` and `originalPhotosFound` to stats
- Created `buildImagesByRecipeMap()` helper function
- Maps Active Storage attachments to recipe image fields
- Creates placeholder references: `[LEGACY_IMAGE:key:filename]`

### 5. Transform Script (`transform/transform-recipes.ts`)
- Loads Active Storage data files (optional)
- Passes attachment and blob data to transformer
- Handles missing Active Storage files gracefully

### 6. Batch Importer (`import/batch-importer.ts`)
- Updated payload to include `originalRecipePhotoUrl`
- Sends both image fields to the API

### 7. Documentation
- Created `IMAGE-MIGRATION-GUIDE.md` with detailed instructions
- Explains the migration approach and next steps
- Provides implementation examples for actual file migration

## How It Works

### Extraction Phase
```
Legacy Database
├── active_storage_attachments (name, record_type, record_id, blob_id)
└── active_storage_blobs (id, key, filename, content_type)
                ↓
        Extraction Script
                ↓
Output: active_storage_attachments.json + active_storage_blobs.json
```

### Transformation Phase
```
Attachments + Blobs
        ↓
Join on blob_id
        ↓
Filter for Recipe attachments
        ↓
Map by attachment name:
  - 'image' → imageUrl
  - 'original_recipe_photo' → originalRecipePhotoUrl
        ↓
Create placeholder: [LEGACY_IMAGE:key:filename]
```

### Import Phase
```
Transformed Recipe
├── imageUrl: "[LEGACY_IMAGE:abc123:photo.jpg]"
└── originalRecipePhotoUrl: "[LEGACY_IMAGE:def456:scan.jpg]"
                ↓
        API Import
                ↓
Database with image references
```

## Image Reference Format

Images are stored as placeholder references:
```
[LEGACY_IMAGE:blob_storage_key:original_filename.jpg]
```

Example:
```json
{
  "title": "Chocolate Cake",
  "imageUrl": "[LEGACY_IMAGE:abc123def456/recipe.jpg:chocolate-cake.jpg]",
  "originalRecipePhotoUrl": "[LEGACY_IMAGE:xyz789/scan.jpg:grandmas-recipe.jpg]"
}
```

## What This Enables

✅ **Tracks which recipes have images** - Easy to identify recipes with/without images
✅ **Preserves blob keys** - Can retrieve files from legacy storage later
✅ **Preserves filenames** - Original filenames are maintained
✅ **Non-blocking migration** - Recipes can be imported without waiting for file transfers
✅ **Flexible file migration** - Multiple options for actual file migration (see guide)

## Statistics Tracking

The transformation now reports:
- `imagesFound` - Count of main recipe images
- `originalPhotosFound` - Count of original recipe photos

Example output:
```
=== Transformation Complete ===
Total: 150
Successful: 150
Failed: 0
Images found: 87
Original photos found: 23
```

## Next Steps

The current implementation creates **references** to images but does not migrate the actual files. To complete the migration:

### Option 1: Manual Migration
1. Review `IMAGE-MIGRATION-GUIDE.md`
2. Access legacy server storage
3. Download files using blob keys
4. Upload to new storage
5. Update database URLs

### Option 2: Automated Script
Create a post-migration script that:
1. Reads recipes with placeholder references
2. Downloads files from legacy server (SSH/SFTP)
3. Uploads to new storage (S3, Cloudinary, etc.)
4. Updates database with real URLs

### Option 3: On-Demand
1. Import with placeholders
2. Create background job to migrate files
3. Update URLs as files are migrated

## Testing

To test the enhancement:

1. **Run extraction** (with Active Storage tables):
```bash
npm run migration:extract
```

2. **Check extracted data**:
```bash
cat migration-data/raw/[timestamp]/active_storage_attachments.json
cat migration-data/raw/[timestamp]/active_storage_blobs.json
```

3. **Run transformation**:
```bash
npm run migration:transform
```

4. **Check transformed recipes**:
```bash
# Look for imageUrl and originalRecipePhotoUrl fields
cat migration-data/transformed/[timestamp]/recipes-pass.json | grep "LEGACY_IMAGE"
```

5. **Check statistics**:
```bash
cat migration-data/transformed/[timestamp]/transformation-report.json
# Look for imagesFound and originalPhotosFound
```

## Backward Compatibility

The enhancement is fully backward compatible:
- If Active Storage tables don't exist, extraction continues without errors
- If no attachments are found, recipes have `null` image URLs
- Existing migration scripts continue to work
- No breaking changes to the API

## Database Schema

If your new database doesn't have `originalRecipePhotoUrl`, add it:

```sql
ALTER TABLE recipes ADD COLUMN original_recipe_photo_url TEXT;
```

Or update your Drizzle/Prisma schema accordingly.

## Files Modified

1. `src/migration/types/extraction.ts`
2. `src/migration/extract/table-extractors.ts`
3. `src/migration/extract/extract-legacy-data.ts`
4. `src/migration/extract/metadata-generator.ts`
5. `src/migration/transform/recipe-transformer.ts`
6. `src/migration/transform/transform-recipes.ts`
7. `src/migration/import/batch-importer.ts`

## Files Created

1. `src/migration/IMAGE-MIGRATION-GUIDE.md` - Detailed implementation guide
2. `src/migration/IMAGE-MIGRATION-SUMMARY.md` - This file

## Support

For questions or issues:
1. Review `IMAGE-MIGRATION-GUIDE.md` for detailed instructions
2. Check transformation statistics for image counts
3. Inspect the placeholder references in transformed recipes
4. Verify Active Storage tables exist in legacy database
