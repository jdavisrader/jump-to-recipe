# Final Image Implementation - Complete Guide

## ✅ Implementation Complete

The migration now **fully downloads and attributes all recipe images** during the import phase.

## 🎯 What Was Implemented

### 1. Web Scraping (`image-downloader.ts`)
- Scrapes recipe pages: `http://happeacook.com/recipes/{legacyId}`
- Finds main recipe image: `.recipe-pictures img`
- Finds original photos: "Original Recipe Photos" → next div → `a img`
- Downloads all images with retry logic
- Saves to `public/uploads/`

### 2. Database Attribution (`api/migration/recipes/route.ts`)
- **Main image** → Saved to `recipes.imageUrl`
- **Original photos** → Saved to `recipe_photos` table with:
  - `recipeId` - Links to recipe
  - `filePath` - URL path to image
  - `fileName` - Extracted from URL
  - `position` - Order index (0, 1, 2, ...)
  - `fileSize` - Set to 0 (unknown during migration)
  - `mimeType` - Set to 'image/jpeg' (assumed)

### 3. Complete Flow

```
For each recipe:
  1. Scrape http://happeacook.com/recipes/{legacyId}
  2. Extract image URLs from HTML
  3. Download main recipe image
  4. Download all original photos
  5. Save files to public/uploads/
  6. Send to API:
     - imageUrl: "/uploads/recipes/{uuid}-{filename}.jpg"
     - originalRecipePhotoUrls: [
         "/uploads/recipe-photos/{uuid}-1-{filename}.jpg",
         "/uploads/recipe-photos/{uuid}-2-{filename}.jpg",
         ...
       ]
  7. API saves:
     - imageUrl → recipes table
     - originalRecipePhotoUrls → recipe_photos table (one row per photo)
```

## 📊 Database Structure

### Recipes Table
```sql
recipes
├── id (uuid)
├── title
├── imageUrl (text) ← Main recipe image
└── ... other fields
```

### Recipe Photos Table
```sql
recipe_photos
├── id (uuid)
├── recipeId (uuid) ← Foreign key to recipes
├── filePath (text) ← URL path to image
├── fileName (varchar)
├── fileSize (integer) ← 0 for migration
├── mimeType (varchar) ← 'image/jpeg' for migration
├── position (integer) ← Order: 0, 1, 2, ...
└── timestamps
```

## 📁 File Storage

```
public/uploads/
├── recipes/
│   ├── {uuid}-chocolate-cake.jpg       ← Main image
│   ├── {uuid}-apple-pie.jpg
│   └── ...
└── recipe-photos/
    ├── {uuid}-1-recipe-card.jpg        ← Original photo 1
    ├── {uuid}-2-cookbook-page.jpg      ← Original photo 2
    └── ...
```

## 🔍 Example

### Recipe with Images

**Scraped from:** `http://happeacook.com/recipes/123`

**Downloaded:**
- Main image: `public/uploads/recipes/abc-123-chocolate-cake.jpg`
- Original photo 1: `public/uploads/recipe-photos/abc-123-1-recipe-card.jpg`
- Original photo 2: `public/uploads/recipe-photos/abc-123-2-cookbook.jpg`

**Database:**

`recipes` table:
```json
{
  "id": "abc-123",
  "title": "Chocolate Cake",
  "imageUrl": "/uploads/recipes/abc-123-chocolate-cake.jpg"
}
```

`recipe_photos` table:
```json
[
  {
    "id": "photo-1",
    "recipeId": "abc-123",
    "filePath": "/uploads/recipe-photos/abc-123-1-recipe-card.jpg",
    "fileName": "abc-123-1-recipe-card.jpg",
    "position": 0
  },
  {
    "id": "photo-2",
    "recipeId": "abc-123",
    "filePath": "/uploads/recipe-photos/abc-123-2-cookbook.jpg",
    "fileName": "abc-123-2-cookbook.jpg",
    "position": 1
  }
]
```

## 📝 Logging Output

```
📸 Downloading images for: Chocolate Cake (Legacy ID: 123)
  Scraping: http://happeacook.com/recipes/123
  Recipe image found
  Downloading: http://happeacook.com/path/to/cake.jpg
  ✓ Saved: /uploads/recipes/abc-123-cake.jpg
  Original photos found: 2
  Downloading: http://happeacook.com/path/to/card.jpg
  ✓ Saved: /uploads/recipe-photos/abc-123-1-card.jpg
  Downloading: http://happeacook.com/path/to/book.jpg
  ✓ Saved: /uploads/recipe-photos/abc-123-2-book.jpg

[Migration API] Received recipe:
  id: abc-123
  title: Chocolate Cake
  imageUrl: /uploads/recipes/abc-123-cake.jpg
  originalRecipePhotoUrls: 2

[Migration API] Recipe inserted successfully: abc-123
[Migration API] Inserting original recipe photos: 2
[Migration API] Original recipe photos inserted successfully

📸 Image Download Statistics:
  Total images: 150
  Successful: 145
  Failed: 5
```

## ✅ Verification

### Check Main Image
```sql
SELECT id, title, "imageUrl" 
FROM recipes 
WHERE "imageUrl" IS NOT NULL;
```

### Check Original Photos
```sql
SELECT r.title, rp."filePath", rp.position
FROM recipes r
JOIN recipe_photos rp ON r.id = rp."recipeId"
ORDER BY r.title, rp.position;
```

### Check Files on Disk
```bash
ls -la public/uploads/recipes/
ls -la public/uploads/recipe-photos/
```

## 🎯 Key Features

✅ **Complete Attribution** - All images linked to recipes
✅ **Multiple Photos** - Supports unlimited original photos per recipe
✅ **Ordered** - Original photos maintain order (position field)
✅ **Cascading Delete** - Photos deleted when recipe deleted
✅ **Graceful Failures** - Recipe imported even if images fail
✅ **Detailed Logging** - Shows exactly what happened

## 🚀 Usage

Just run the migration:
```bash
npm run migration:extract
npm run migration:transform
npm run migration:import
```

Images are:
1. Scraped from legacy site
2. Downloaded to local storage
3. Attributed to recipes in database

All automatic!

## 🔧 Configuration

Already set in `.env.migration`:
```bash
LEGACY_IMAGE_BASE_URL=http://happeacook.com
```

## ⚠️ Important Notes

1. **Main image** goes to `recipes.imageUrl`
2. **Original photos** go to `recipe_photos` table
3. **Position matters** - Photos are ordered 0, 1, 2, ...
4. **Cascade delete** - Deleting recipe deletes photos
5. **File size unknown** - Set to 0 during migration
6. **MIME type assumed** - Set to 'image/jpeg'

## 📚 Related Files

- `src/migration/import/image-downloader.ts` - Scraping & download
- `src/app/api/migration/recipes/route.ts` - Database insertion
- `src/db/schema/recipes.ts` - Recipes table schema
- `src/db/schema/recipe-photos.ts` - Recipe photos table schema

## 🎉 Summary

The migration now:
- ✅ Scrapes recipe pages for images
- ✅ Downloads main image and all original photos
- ✅ Saves to local file system
- ✅ Attributes main image to recipes table
- ✅ Attributes original photos to recipe_photos table
- ✅ Maintains photo order with position field
- ✅ Handles failures gracefully
- ✅ Logs detailed statistics

**Everything is fully attributed and ready to use!** 🚀
