# Image Download Implementation - Complete Guide

## Overview

The migration now **downloads all recipe images** from the legacy Active Storage system during the import phase and saves them to the local file system.

## ✅ What Was Implemented

### 1. Image Downloader Module (`import/image-downloader.ts`)

**Features:**
- Downloads images from legacy Rails Active Storage URLs
- Saves to local file system (`public/uploads/`)
- Retry logic with exponential backoff
- Timeout handling (30 seconds per image)
- Safe filename generation
- Progress logging

**Functions:**
- `downloadRecipeHeaderImage()` - Downloads main recipe image
- `downloadOriginalRecipePhotos()` - Downloads all original recipe photos
- `downloadRecipeImages()` - Orchestrates all downloads for a recipe

### 2. Enhanced Transformation

**Changes to `recipe-transformer.ts`:**
- Stores image metadata (blob keys and filenames) in `_imageMetadata` field
- Tracks header image and multiple original photos separately
- Images are downloaded during import, not transformation

**Data Structure:**
```typescript
_imageMetadata: {
  headerImage: { blobKey: string; filename: string } | null;
  originalPhotos: [
    { blobKey: string; filename: string },
    { blobKey: string; filename: string },
    ...
  ];
}
```

### 3. Enhanced Batch Importer

**Changes to `batch-importer.ts`:**
- Downloads images before sending recipe to API
- Handles download failures gracefully (imports recipe without images)
- Tracks image download statistics
- Logs recipes with failed image downloads
- Sends downloaded URLs to API

### 4. File Storage Structure

```
public/uploads/
├── recipes/           # Main recipe images (header)
│   ├── {uuid}-1-filename.jpg
│   ├── {uuid}-2-filename.jpg
│   └── ...
└── recipe-photos/     # Original recipe photos
    ├── {uuid}-1-1-filename.jpg
    ├── {uuid}-1-2-filename.jpg
    └── ...
```

### 5. URL Format

**Main Image:**
```
/uploads/recipes/{recipe-uuid}-{sanitized-filename}.jpg
```

**Original Photos:**
```
/uploads/recipe-photos/{recipe-uuid}-{index}-{sanitized-filename}.jpg
```

## 🔧 Configuration

### Environment Variable

Added to `.env.migration`:
```bash
# Base URL for legacy Active Storage images
LEGACY_IMAGE_BASE_URL=http://happeacook.com
```

### Download Settings

Configured in `batch-importer.ts`:
```typescript
{
  legacyBaseUrl: 'http://happeacook.com',
  outputDir: 'public',
  timeout: 30000,  // 30 seconds per image
  retries: 3,      // 3 retry attempts
}
```

## 📊 Statistics & Logging

### During Import

The importer tracks and displays:
```
📸 Image Download Statistics:
  Total images: 150
  Successful: 142
  Failed: 8

⚠️  Recipes with image download failures:
  - Chocolate Cake:
    • Header image failed: HTTP 404: Not Found
  - Apple Pie:
    • Original photo failed: Timeout after 30000ms
```

### Per Recipe

```
📸 Downloading images for: Chocolate Cake (uuid-123)
  Header image: chocolate-cake.jpg
  ✓ Saved: /uploads/recipes/uuid-123-chocolate-cake.jpg
  Original photos: 2 files
  ✓ Saved: /uploads/recipe-photos/uuid-123-1-recipe-card.jpg
  ✓ Saved: /uploads/recipe-photos/uuid-123-2-cookbook-page.jpg
```

## 🚀 How It Works

### Flow Diagram

```
Extraction Phase:
  Legacy DB → Extract attachments & blobs → JSON files

Transformation Phase:
  JSON files → Build image metadata → Store in _imageMetadata

Import Phase:
  For each recipe:
    1. Check if _imageMetadata exists
    2. Download header image (if exists)
    3. Download all original photos
    4. Generate local URLs
    5. Send recipe + URLs to API
    6. Log any failures
```

### Active Storage URL Construction

The downloader builds URLs like:
```
http://happeacook.com/rails/active_storage/blobs/redirect/{blob_key}/{filename}
```

This uses Rails' redirect endpoint which handles signed URLs automatically.

## 🎯 Error Handling

### Download Failures

**What happens:**
1. Image download is attempted with 3 retries
2. If all retries fail, error is logged
3. Recipe is imported WITHOUT the failed image
4. Recipe name and error are added to failure log

**Recipe is NOT skipped** - it's imported with whatever images succeeded.

### Failure Scenarios

| Scenario | Behavior |
|----------|----------|
| Header image fails | Recipe imported with `imageUrl: null` |
| Some original photos fail | Recipe imported with successful photos only |
| All images fail | Recipe imported with no images |
| Network timeout | Retry 3 times, then log and continue |
| 404 Not Found | Log error, don't retry, continue |

## 📝 API Payload

### Recipe with Images

```json
{
  "id": "uuid-123",
  "title": "Chocolate Cake",
  "imageUrl": "/uploads/recipes/uuid-123-chocolate-cake.jpg",
  "originalRecipePhotoUrls": [
    "/uploads/recipe-photos/uuid-123-1-recipe-card.jpg",
    "/uploads/recipe-photos/uuid-123-2-cookbook-page.jpg"
  ],
  ...
}
```

### Recipe without Images

```json
{
  "id": "uuid-456",
  "title": "Apple Pie",
  "imageUrl": null,
  "originalRecipePhotoUrls": [],
  ...
}
```

## 🧪 Testing

### 1. Test Extraction

```bash
npm run migration:extract
```

Check for Active Storage files:
```bash
ls migration-data/raw/[timestamp]/active_storage_*.json
```

### 2. Test Transformation

```bash
npm run migration:transform
```

Check for image metadata:
```bash
cat migration-data/transformed/[timestamp]/recipes-pass.json | grep "_imageMetadata"
```

### 3. Test Import (Dry Run)

```bash
# Set in .env.migration
MIGRATION_DRY_RUN=true

npm run migration:import
```

### 4. Test Import (Real)

```bash
# Set in .env.migration
MIGRATION_DRY_RUN=false
LEGACY_IMAGE_BASE_URL=http://happeacook.com

npm run migration:import
```

Check downloaded images:
```bash
ls public/uploads/recipes/
ls public/uploads/recipe-photos/
```

## 🔍 Troubleshooting

### Images Not Downloading

**Check:**
1. `LEGACY_IMAGE_BASE_URL` is set correctly in `.env.migration`
2. Legacy server is accessible from your machine
3. Active Storage files were extracted (check JSON files)
4. Network connectivity to legacy server

**Test URL manually:**
```bash
curl -I http://happeacook.com/rails/active_storage/blobs/redirect/{blob_key}/{filename}
```

### All Downloads Failing

**Possible causes:**
1. Legacy server is down
2. Active Storage endpoint changed
3. Authentication required
4. CORS issues (shouldn't affect server-side downloads)

**Solution:**
- Verify legacy server is accessible
- Check Active Storage configuration on legacy server
- Try accessing an image URL in browser

### Timeout Errors

**Increase timeout:**
```typescript
// In batch-importer.ts
this.imageConfig = {
  timeout: 60000, // 60 seconds
  retries: 5,
};
```

### Permission Errors

**Ensure directories exist and are writable:**
```bash
mkdir -p public/uploads/recipes
mkdir -p public/uploads/recipe-photos
chmod 755 public/uploads/recipes
chmod 755 public/uploads/recipe-photos
```

### Filename Conflicts

The system generates unique filenames using:
- Recipe UUID
- Index number (for multiple photos)
- Sanitized original filename

Conflicts are extremely unlikely but would overwrite existing files.

## 📈 Performance

### Download Speed

- **Per image:** ~1-5 seconds (depends on size and network)
- **Per recipe:** ~5-30 seconds (depends on number of images)
- **Total time:** Adds significant time to import phase

### Optimization Tips

1. **Increase batch size** if network is fast:
   ```bash
   MIGRATION_BATCH_SIZE=100
   ```

2. **Reduce delay between batches**:
   ```bash
   MIGRATION_BATCH_DELAY=50
   ```

3. **Run on server** close to legacy server (lower latency)

4. **Parallel downloads** (future enhancement):
   - Download images in parallel per recipe
   - Would require code changes

## 🔐 Security Considerations

### Downloaded Files

- Stored in `public/` directory (publicly accessible)
- No authentication required to view
- Consider moving to private storage if needed

### Legacy Server Access

- Uses HTTP (not HTTPS) by default
- No authentication on Active Storage endpoints
- Images are publicly accessible on legacy server

### File Validation

Currently NO validation of:
- File types (trusts content_type from DB)
- File sizes
- Malicious content

**Recommendation:** Add validation if accepting user-uploaded content.

## 🎨 Image Processing (Future Enhancement)

Currently images are stored as-is. Future enhancements could include:

1. **Resize/Optimize:**
   ```typescript
   import sharp from 'sharp';
   
   const optimized = await sharp(buffer)
     .resize(1200, 1200, { fit: 'inside' })
     .jpeg({ quality: 85 })
     .toBuffer();
   ```

2. **Generate Thumbnails:**
   ```typescript
   const thumbnail = await sharp(buffer)
     .resize(300, 300, { fit: 'cover' })
     .toBuffer();
   ```

3. **Convert Formats:**
   ```typescript
   const webp = await sharp(buffer)
     .webp({ quality: 80 })
     .toBuffer();
   ```

## 📋 Checklist

Before running migration:

- [ ] Set `LEGACY_IMAGE_BASE_URL` in `.env.migration`
- [ ] Verify legacy server is accessible
- [ ] Ensure `public/uploads/` directories exist
- [ ] Test with dry-run first
- [ ] Check disk space (images can be large)
- [ ] Review timeout settings if slow network

After migration:

- [ ] Check image download statistics
- [ ] Review failure log for recipes with missing images
- [ ] Verify images are accessible in browser
- [ ] Check file sizes are reasonable
- [ ] Consider backing up downloaded images

## 🆘 Support

If you encounter issues:

1. Check the failure log for specific errors
2. Test image URLs manually in browser
3. Verify Active Storage configuration
4. Check network connectivity
5. Review console output for detailed errors

## 📚 Related Files

- `src/migration/import/image-downloader.ts` - Download logic
- `src/migration/import/batch-importer.ts` - Import orchestration
- `src/migration/transform/recipe-transformer.ts` - Image metadata
- `.env.migration` - Configuration
- `public/uploads/` - Downloaded images

## 🎉 Summary

The migration now:
- ✅ Extracts Active Storage data
- ✅ Downloads all recipe images during import
- ✅ Saves to local file system
- ✅ Handles multiple original photos per recipe
- ✅ Gracefully handles download failures
- ✅ Logs detailed statistics
- ✅ Imports recipes even if images fail

**No manual file migration needed!** Everything is automated during the import phase.
