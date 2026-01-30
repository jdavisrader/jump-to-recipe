# Image Migration Guide

This guide explains how recipe images are handled during the legacy migration process.

## Overview

The legacy system uses Rails Active Storage to manage file attachments. Recipe images are stored in two tables:
- `active_storage_attachments` - Links records to their file attachments
- `active_storage_blobs` - Contains file metadata and storage keys

## Image Types

Each recipe can have two types of images:

1. **Recipe Image** (`image` attachment)
   - The main display image for the recipe
   - Mapped to `imageUrl` field in the new system

2. **Original Recipe Photo** (`original_recipe_photo` attachment)
   - A photo of the original recipe source (e.g., recipe card, cookbook page)
   - Mapped to `originalRecipePhotoUrl` field in the new system

## Migration Process

### Phase 1: Extraction

The extraction phase now includes:
- `active_storage_attachments.json` - All Recipe attachments
- `active_storage_blobs.json` - Blob metadata (keys, filenames, content types)

### Phase 2: Transformation

During transformation, the system:
1. Joins attachments with blobs using `blob_id`
2. Filters for Recipe attachments only
3. Maps attachment names to appropriate fields:
   - `image` → `imageUrl`
   - `original_recipe_photo` → `originalRecipePhotoUrl`
4. Creates placeholder references: `[LEGACY_IMAGE:key:filename]`

### Phase 3: Image Reference Format

The transformed recipes contain image references in this format:
```
[LEGACY_IMAGE:blob_key:filename.jpg]
```

Example:
```
[LEGACY_IMAGE:abc123def456/recipe-photo.jpg:chocolate-cake.jpg]
```

This format allows you to:
- Identify which recipes have images
- Track the original blob key for file retrieval
- Preserve the original filename

## Next Steps: Actual File Migration

The current implementation creates **references** to the images but does not migrate the actual files. To complete the image migration, you have several options:

### Option 1: Manual File Transfer

1. Access the legacy server's Active Storage directory
2. Locate files using the blob keys from the references
3. Download and upload to your new storage system
4. Update the image URLs in the database

### Option 2: Automated File Migration Script

Create a script that:
1. Reads the transformed recipes
2. For each image reference:
   - Extracts the blob key
   - Downloads the file from legacy storage (via SSH/SFTP)
   - Uploads to new storage (S3, Cloudinary, etc.)
   - Updates the recipe with the new URL

### Option 3: On-Demand Migration

1. Import recipes with placeholder URLs
2. Create a background job that:
   - Detects placeholder image references
   - Fetches files from legacy storage
   - Uploads to new storage
   - Updates the database

### Option 4: Keep Legacy URLs

If the legacy server will remain accessible:
1. Parse the blob keys
2. Generate signed URLs to the legacy Active Storage endpoints
3. Use these URLs directly (temporary solution)

## Active Storage File Locations

Rails Active Storage typically stores files at:
```
storage/
  [first 2 chars of key]/
    [next 2 chars of key]/
      [full key]
```

Example for key `abc123def456`:
```
storage/ab/c1/abc123def456
```

## Implementation Example

Here's a skeleton for an automated file migration script:

```typescript
import { readFile } from 'fs/promises';
import { Client } from 'ssh2';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async function migrateRecipeImages(transformedRecipesPath: string) {
  const recipes = JSON.parse(await readFile(transformedRecipesPath, 'utf-8'));
  
  for (const recipe of recipes) {
    // Migrate main image
    if (recipe.imageUrl?.startsWith('[LEGACY_IMAGE:')) {
      const newUrl = await migrateImage(recipe.imageUrl);
      recipe.imageUrl = newUrl;
    }
    
    // Migrate original photo
    if (recipe.originalRecipePhotoUrl?.startsWith('[LEGACY_IMAGE:')) {
      const newUrl = await migrateImage(recipe.originalRecipePhotoUrl);
      recipe.originalRecipePhotoUrl = newUrl;
    }
  }
  
  // Save updated recipes or update database
}

async function migrateImage(reference: string): Promise<string> {
  // Parse reference: [LEGACY_IMAGE:key:filename]
  const match = reference.match(/\[LEGACY_IMAGE:([^:]+):([^\]]+)\]/);
  if (!match) return null;
  
  const [, blobKey, filename] = match;
  
  // 1. Download from legacy server via SSH/SFTP
  const fileBuffer = await downloadFromLegacy(blobKey);
  
  // 2. Upload to new storage
  const newUrl = await uploadToNewStorage(fileBuffer, filename);
  
  return newUrl;
}

async function downloadFromLegacy(blobKey: string): Promise<Buffer> {
  // Implement SSH/SFTP download
  // Use the blob key to locate the file in Active Storage
}

async function uploadToNewStorage(buffer: Buffer, filename: string): Promise<string> {
  // Upload to S3, Cloudinary, or your chosen storage
  // Return the public URL
}
```

## Statistics

After transformation, check the stats to see how many images were found:
- `imagesFound` - Number of main recipe images
- `originalPhotosFound` - Number of original recipe photos

## Troubleshooting

### Missing Blobs

If you see warnings like "Blob X not found for attachment Y":
- The attachment references a blob that doesn't exist
- This could be due to data inconsistency or deleted files
- These recipes will have `null` image URLs

### Active Storage Tables Not Found

If the extraction shows "Active Storage tables not found":
- The legacy database might not use Active Storage
- Images might be stored differently (direct URLs, different system)
- Check the legacy codebase for image handling

### File Access Issues

When implementing file migration:
- Ensure SSH/SFTP access to the legacy server's storage directory
- Check file permissions on the legacy server
- Verify the storage path matches Active Storage conventions

## Database Schema Updates

If your new database doesn't have an `originalRecipePhotoUrl` field, you'll need to add it:

```sql
ALTER TABLE recipes ADD COLUMN original_recipe_photo_url TEXT;
```

Or update your Drizzle schema:

```typescript
export const recipes = pgTable('recipes', {
  // ... other fields
  imageUrl: text('image_url'),
  originalRecipePhotoUrl: text('original_recipe_photo_url'),
});
```

## Security Considerations

When migrating files:
- Validate file types and sizes
- Scan for malware if accepting user-uploaded content
- Use signed URLs for temporary access
- Set appropriate CORS policies on new storage
- Consider image optimization/resizing during migration

## Cost Optimization

To reduce storage costs:
- Compress images during migration
- Generate multiple sizes (thumbnail, medium, full)
- Use modern formats (WebP, AVIF) where supported
- Remove duplicate images (same blob used multiple times)

## Rollback Plan

Before migrating files:
1. Backup the legacy storage directory
2. Keep the blob key references in the database
3. Document the migration mapping (old key → new URL)
4. Test with a small batch first

This allows you to re-run the migration if needed.
