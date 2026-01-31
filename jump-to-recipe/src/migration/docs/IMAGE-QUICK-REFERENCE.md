# Image Migration - Quick Reference

## What Changed

The migration now extracts and references recipe images from Active Storage.

## Image Fields

- `imageUrl` - Main recipe display image
- `originalRecipePhotoUrl` - Photo of original recipe source (card/cookbook)

## Image Reference Format

```
[LEGACY_IMAGE:storage_key:filename.jpg]
```

## Quick Commands

### Extract with images
```bash
npm run migration:extract
```

### Check extracted images
```bash
ls migration-data/raw/[timestamp]/active_storage_*.json
```

### Transform with images
```bash
npm run migration:transform
```

### Find recipes with images
```bash
grep -c "LEGACY_IMAGE" migration-data/transformed/[timestamp]/recipes-pass.json
```

### View image statistics
```bash
cat migration-data/transformed/[timestamp]/transformation-report.json | grep -A 2 "imagesFound"
```

## Active Storage Tables

The migration extracts from:
- `active_storage_attachments` - Links recipes to files
- `active_storage_blobs` - File metadata and storage keys

## What Happens

1. **Extraction** - Pulls attachment and blob data
2. **Transformation** - Creates placeholder references
3. **Import** - Saves references to database
4. **File Migration** - (Manual step) Download and upload actual files

## Important Notes

⚠️ **Files are NOT automatically migrated** - Only references are created
⚠️ **Placeholders need replacement** - Update URLs after file migration
✅ **Backward compatible** - Works even if Active Storage tables don't exist
✅ **Non-blocking** - Recipe import doesn't wait for file transfers

## Next Steps

See `IMAGE-MIGRATION-GUIDE.md` for:
- File migration strategies
- Implementation examples
- Security considerations
- Cost optimization tips

## Example Recipe Output

```json
{
  "id": "uuid-here",
  "title": "Chocolate Cake",
  "imageUrl": "[LEGACY_IMAGE:abc123/photo.jpg:cake.jpg]",
  "originalRecipePhotoUrl": "[LEGACY_IMAGE:def456/scan.jpg:recipe-card.jpg]",
  ...
}
```

## Troubleshooting

**No images found?**
- Check if Active Storage tables exist in legacy DB
- Verify attachments have `record_type = 'Recipe'`
- Check blob_id references are valid

**Missing blobs?**
- Attachment references non-existent blob
- Data inconsistency in legacy DB
- Recipe will have `null` image URL

**Tables not found?**
- Legacy system might not use Active Storage
- Migration continues without errors
- All recipes will have `null` image URLs
