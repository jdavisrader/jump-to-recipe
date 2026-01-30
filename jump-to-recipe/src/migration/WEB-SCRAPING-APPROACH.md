# Web Scraping Approach for Image Migration

## Overview

The image migration uses **web scraping** to download recipe images from the legacy website. This is more reliable than trying to construct Active Storage URLs.

## How It Works

### 1. Scrape Recipe Page

For each recipe, the migration:
1. Visits `http://happeacook.com/recipes/{legacyRecipeId}`
2. Parses the HTML using Cheerio
3. Extracts image URLs
4. Downloads and saves images locally

### 2. Find Recipe Image

**Target:** Element with class `recipe-pictures`

```html
<div class="recipe-pictures">
  <img src="/path/to/image.jpg" />
</div>
```

**Extraction:**
```typescript
$('.recipe-pictures img').first().attr('src')
```

### 3. Find Original Recipe Photos

**Target:** Div with text "Original Recipe Photos", followed by div containing `<a><img></a>` tags

```html
<div>Original Recipe Photos</div>
<div>
  <a href="..."><img src="/path/to/photo1.jpg" /></a>
  <a href="..."><img src="/path/to/photo2.jpg" /></a>
</div>
```

**Extraction:**
```typescript
// Find div with text "Original Recipe Photos"
$('div').each((_, element) => {
  if ($(element).text().trim() === 'Original Recipe Photos') {
    // Get next sibling div
    const nextDiv = $(element).next('div');
    // Find all images in links
    nextDiv.find('a img').each((_, img) => {
      const src = $(img).attr('src');
      // Download image
    });
  }
});
```

## Download Process

### Per Recipe Flow

```
1. Scrape page: http://happeacook.com/recipes/{id}
2. Extract recipe image URL
3. Extract original photo URLs (multiple)
4. Download each image with retry logic
5. Save to public/uploads/
6. Generate public URLs
7. Send URLs to API with recipe data
```

### File Storage

```
public/uploads/
├── recipes/
│   └── {uuid}-{filename}.jpg          # Main recipe image
└── recipe-photos/
    ├── {uuid}-1-{filename}.jpg        # Original photo 1
    ├── {uuid}-2-{filename}.jpg        # Original photo 2
    └── ...
```

### URL Generation

**Recipe Image:**
```
/uploads/recipes/{recipe-uuid}-{sanitized-filename}.jpg
```

**Original Photos:**
```
/uploads/recipe-photos/{recipe-uuid}-{index}-{sanitized-filename}.jpg
```

## Error Handling

### Scraping Failures

| Scenario | Behavior |
|----------|----------|
| Page not found (404) | Log error, import recipe without images |
| Network timeout | Retry 3 times, then log and continue |
| HTML structure changed | Log error, import recipe without images |
| No images found | Import recipe with null imageUrl |

### Download Failures

| Scenario | Behavior |
|----------|----------|
| Image URL 404 | Log error, skip that image |
| Image download timeout | Retry 3 times, then skip |
| Some photos fail | Import recipe with successful photos only |
| All images fail | Import recipe with no images |

**Important:** Recipe is NEVER skipped - it's always imported with whatever images succeeded.

## Configuration

### Environment Variable

```bash
# .env.migration
LEGACY_IMAGE_BASE_URL=http://happeacook.com
```

### Download Settings

```typescript
{
  legacyBaseUrl: 'http://happeacook.com',
  outputDir: 'public',
  timeout: 30000,  // 30 seconds per request
  retries: 3,      // 3 retry attempts
}
```

## Logging

### Per Recipe

```
📸 Downloading images for: Chocolate Cake (Legacy ID: 123)
  Scraping: http://happeacook.com/recipes/123
  Recipe image found
  Downloading: http://happeacook.com/path/to/image.jpg
  ✓ Saved: /uploads/recipes/uuid-123-image.jpg
  Original photos found: 2
  Downloading: http://happeacook.com/path/to/photo1.jpg
  ✓ Saved: /uploads/recipe-photos/uuid-123-1-photo1.jpg
  Downloading: http://happeacook.com/path/to/photo2.jpg
  ✓ Saved: /uploads/recipe-photos/uuid-123-2-photo2.jpg
```

### Summary

```
📸 Image Download Statistics:
  Total images: 150
  Successful: 142
  Failed: 8

⚠️  Recipes with image download failures:
  - Apple Pie:
    • Scraping failed: HTTP 404: Not Found
  - Banana Bread:
    • Recipe image failed: Timeout after 30000ms
```

## Advantages of Web Scraping

✅ **No Active Storage complexity** - Don't need to understand Rails' signed URLs
✅ **Works with any image source** - Not tied to Active Storage
✅ **Resilient** - Can adapt to different HTML structures
✅ **Simple** - Just parse HTML and download images
✅ **Reliable** - Uses the same URLs users see in browser

## Disadvantages

⚠️ **Slower** - Must fetch and parse HTML for each recipe
⚠️ **Fragile** - Breaks if HTML structure changes
⚠️ **Network dependent** - Requires legacy site to be accessible
⚠️ **No metadata** - Can't get original filenames or content types from Active Storage

## Testing

### Test Single Recipe

```bash
# Visit in browser
open http://happeacook.com/recipes/1

# Check for images
# - Look for class="recipe-pictures"
# - Look for "Original Recipe Photos" text
```

### Test Scraping

```typescript
// In Node.js REPL or test script
import * as cheerio from 'cheerio';

const html = await fetch('http://happeacook.com/recipes/1').then(r => r.text());
const $ = cheerio.load(html);

// Test recipe image
console.log($('.recipe-pictures img').first().attr('src'));

// Test original photos
$('div').each((_, el) => {
  if ($(el).text().trim() === 'Original Recipe Photos') {
    $(el).next('div').find('a img').each((_, img) => {
      console.log($(img).attr('src'));
    });
  }
});
```

### Test Full Migration

```bash
# Dry run
MIGRATION_DRY_RUN=true npm run migration:import

# Real run (small batch)
MIGRATION_BATCH_SIZE=5 npm run migration:import
```

## Troubleshooting

### No Images Found

**Check:**
1. Visit recipe page in browser
2. Inspect HTML structure
3. Verify class names match
4. Check if "Original Recipe Photos" text exists

**Debug:**
```typescript
// Add logging to scraper
console.log('HTML:', html.substring(0, 500));
console.log('Recipe image element:', $('.recipe-pictures').html());
```

### Wrong Images Downloaded

**Check:**
1. Verify selector is correct
2. Check if multiple images match selector
3. Inspect actual HTML structure

**Fix:**
- Update selectors in `image-downloader.ts`
- Add more specific selectors

### Scraping Fails for All Recipes

**Check:**
1. Legacy site is accessible: `curl http://happeacook.com`
2. Recipe pages exist: `curl http://happeacook.com/recipes/1`
3. Network connectivity
4. Firewall/proxy settings

## Future Enhancements

### 1. Caching

Cache scraped HTML to avoid re-fetching:
```typescript
const cache = new Map<number, string>();
if (cache.has(recipeId)) {
  html = cache.get(recipeId);
} else {
  html = await fetch(...);
  cache.set(recipeId, html);
}
```

### 2. Parallel Scraping

Scrape multiple recipes in parallel:
```typescript
const results = await Promise.all(
  recipes.map(r => scrapeRecipeImages(r.legacyId))
);
```

### 3. Fallback to Active Storage

If scraping fails, try Active Storage URLs:
```typescript
if (!scrapedImages.recipeImage && recipe._imageMetadata) {
  // Try Active Storage URL
}
```

### 4. HTML Structure Detection

Detect and adapt to different HTML structures:
```typescript
// Try multiple selectors
const selectors = [
  '.recipe-pictures img',
  '.recipe-image img',
  'img.recipe-photo'
];
```

## Related Files

- `src/migration/import/image-downloader.ts` - Scraping and download logic
- `src/migration/import/batch-importer.ts` - Import orchestration
- `.env.migration` - Configuration

## Summary

The web scraping approach:
- ✅ Scrapes recipe pages to find images
- ✅ Downloads recipe image and all original photos
- ✅ Saves to local file system
- ✅ Handles failures gracefully
- ✅ Logs detailed statistics
- ✅ Imports recipes even if images fail

**No Active Storage complexity needed!** Just parse HTML and download images.
