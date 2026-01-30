# Image Download - Quick Summary

## ✅ What's Done

The migration now **automatically downloads all recipe images** during the import phase.

## 🎯 Key Features

1. **Downloads during import** - No separate step needed
2. **Handles multiple photos** - Main image + all original recipe photos
3. **Graceful failure** - Imports recipe even if images fail
4. **Local storage** - Saves to `public/uploads/`
5. **Detailed logging** - Shows which recipes had image failures

## 📁 File Structure

```
public/uploads/
├── recipes/           # Main recipe images
└── recipe-photos/     # Original recipe photos (multiple per recipe)
```

## 🔧 Configuration

Add to `.env.migration`:
```bash
LEGACY_IMAGE_BASE_URL=http://happeacook.com
```

## 🚀 Usage

Just run the migration as normal:
```bash
npm run migration:extract
npm run migration:transform
npm run migration:import
```

Images are downloaded automatically during import!

## 📊 Output

### Console Output
```
📸 Downloading images for: Chocolate Cake (uuid-123)
  Header image: chocolate-cake.jpg
  ✓ Saved: /uploads/recipes/uuid-123-chocolate-cake.jpg
  Original photos: 2 files
  ✓ Saved: /uploads/recipe-photos/uuid-123-1-recipe-card.jpg
  ✓ Saved: /uploads/recipe-photos/uuid-123-2-cookbook-page.jpg

📸 Image Download Statistics:
  Total images: 150
  Successful: 142
  Failed: 8

⚠️  Recipes with image download failures:
  - Apple Pie:
    • Header image failed: HTTP 404: Not Found
```

### Database Result
```json
{
  "title": "Chocolate Cake",
  "imageUrl": "/uploads/recipes/uuid-123-chocolate-cake.jpg",
  "originalRecipePhotoUrls": [
    "/uploads/recipe-photos/uuid-123-1-recipe-card.jpg",
    "/uploads/recipe-photos/uuid-123-2-cookbook-page.jpg"
  ]
}
```

## ⚠️ Important Notes

1. **Recipes are NOT skipped** if images fail - they're imported without images
2. **Download adds time** - Expect import to take longer
3. **Network required** - Must be able to reach legacy server
4. **Disk space** - Ensure enough space for all images

## 🔍 Troubleshooting

**Images not downloading?**
- Check `LEGACY_IMAGE_BASE_URL` is set
- Verify legacy server is accessible
- Check console for error messages

**All downloads failing?**
- Test URL manually: `curl http://happeacook.com/rails/active_storage/blobs/redirect/{key}/{filename}`
- Verify network connectivity
- Check legacy server is running

## 📚 Documentation

- **Full Guide:** `IMAGE-DOWNLOAD-IMPLEMENTATION.md`
- **Configuration:** `.env.migration`
- **Code:** `src/migration/import/image-downloader.ts`

## 🎉 That's It!

No manual steps needed. Just run the migration and images are downloaded automatically!
