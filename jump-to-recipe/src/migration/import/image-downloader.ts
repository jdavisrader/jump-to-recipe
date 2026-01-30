/**
 * Image Downloader via Web Scraping
 * 
 * Scrapes recipe pages from the legacy website to find and download images.
 * This is more reliable than trying to construct Active Storage URLs.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as cheerio from 'cheerio';

// ============================================================================
// Types
// ============================================================================

export interface ImageDownloadResult {
  success: boolean;
  localPath?: string;
  publicUrl?: string;
  error?: string;
}

export interface ImageDownloadConfig {
  legacyBaseUrl: string; // e.g., 'http://happeacook.com'
  outputDir: string; // e.g., 'public/uploads'
  timeout: number; // Download timeout in ms
  retries: number; // Number of retry attempts
}

export interface ScrapedImages {
  recipeImage: string | null;
  originalPhotos: string[];
}

// ============================================================================
// Web Scraping Functions
// ============================================================================

/**
 * Scrape recipe page to find images
 * 
 * Structure:
 * - Recipe image: element with class "recipe-pictures"
 * - Original photos: div with text "Original Recipe Photos", 
 *   followed by div containing <a><img></a> tags
 */
export async function scrapeRecipeImages(
  baseUrl: string,
  recipeId: number,
  timeout: number
): Promise<ScrapedImages> {
  const url = `${baseUrl.replace(/\/$/, '')}/recipes/${recipeId}`;
  
  try {
    // Fetch the page
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Jump-to-Recipe-Migration/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Parse HTML with Cheerio
    const $ = cheerio.load(html);

    const result: ScrapedImages = {
      recipeImage: null,
      originalPhotos: [],
    };

    // Find recipe image (class="recipe-pictures")
    const recipePictureImg = $('.recipe-pictures img').first();
    if (recipePictureImg.length > 0) {
      const src = recipePictureImg.attr('src');
      if (src) {
        result.recipeImage = makeAbsoluteUrl(baseUrl, src);
      }
    }

    // Find "Original Recipe Photos" section
    // Look for a div containing the text "Original Recipe Photos"
    // The structure is: <div>Original Recipe Photos</div><div><a><img></a>...</div>
    $('div').each((_: number, element: any) => {
      const $element = $(element);
      const text = $element.text().trim();
      
      // Check if this div contains ONLY "Original Recipe Photos" text
      if (text === 'Original Recipe Photos') {
        // Get the parent container
        const $parent = $element.parent();
        
        // Find all sibling divs that contain <a><img> tags
        $parent.find('div').each((_idx: number, siblingDiv: any) => {
          const $sibling = $(siblingDiv);
          // Skip the header div itself
          if ($sibling.text().trim() === 'Original Recipe Photos') {
            return;
          }
          
          // Find all <a><img></a> tags in this sibling
          $sibling.find('a img').each((_imgIdx: number, img: any) => {
            const src = $(img).attr('src');
            if (src) {
              result.originalPhotos.push(makeAbsoluteUrl(baseUrl, src));
            }
          });
        });
        
        return false; // break after finding the section
      }
    });

    return result;

  } catch (error) {
    throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert relative URL to absolute URL
 */
function makeAbsoluteUrl(baseUrl: string, url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBase}${cleanUrl}`;
}

// ============================================================================
// Image Downloader
// ============================================================================

/**
 * Download image from URL with retry logic
 */
export async function downloadImage(
  url: string,
  config: ImageDownloadConfig
): Promise<Buffer> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Jump-to-Recipe-Migration/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < config.retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`  Retry ${attempt}/${config.retries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Download failed');
}

/**
 * Save image buffer to local file system
 */
export async function saveImageToLocal(
  buffer: Buffer,
  outputPath: string
): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(outputPath, buffer);
    
    console.log(`    [saveImageToLocal] Saved ${buffer.length} bytes to: ${outputPath}`);
  } catch (error) {
    console.error(`    [saveImageToLocal] ERROR saving to ${outputPath}:`, error);
    throw error;
  }
}

/**
 * Generate safe filename
 */
export function generateSafeFilename(
  recipeId: string,
  originalFilename: string,
  index?: number
): string {
  // Extract extension
  const ext = path.extname(originalFilename);
  const basename = path.basename(originalFilename, ext);
  
  // Sanitize filename
  const safeName = basename
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  
  // Build filename
  const indexSuffix = index !== undefined ? `-${index}` : '';
  return `${recipeId}${indexSuffix}-${safeName}${ext}`;
}

// ============================================================================
// Main Download Function
// ============================================================================

/**
 * Download and save a single image from URL
 */
export async function downloadAndSaveImage(
  imageUrl: string,
  recipeUuid: string,
  outputSubdir: 'recipes' | 'recipe-photos',
  config: ImageDownloadConfig,
  index?: number
): Promise<ImageDownloadResult> {
  try {
    console.log(`  Downloading: ${imageUrl}`);

    // Download image
    const buffer = await downloadImage(imageUrl, config);

    // Extract filename from URL
    const urlPath = new URL(imageUrl).pathname;
    const originalFilename = path.basename(urlPath);

    // Generate safe filename
    const safeFilename = generateSafeFilename(recipeUuid, originalFilename, index);
    
    // Build paths - files go in public/uploads/{recipes|recipe-photos}/
    const relativePath = path.join('uploads', outputSubdir, safeFilename);
    const absolutePath = path.join(config.outputDir, 'uploads', outputSubdir, safeFilename);
    const publicUrl = `/${relativePath.replace(/\\/g, '/')}`;

    // Save to disk
    await saveImageToLocal(buffer, absolutePath);

    console.log(`  ✓ Saved: ${publicUrl}`);

    return {
      success: true,
      localPath: absolutePath,
      publicUrl,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed: ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================================================
// Batch Download with Progress
// ============================================================================

export interface BatchDownloadStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
}

/**
 * Download all images for a recipe by scraping the recipe page
 */
export async function downloadRecipeImages(
  recipeUuid: string,
  recipeTitle: string,
  legacyRecipeId: number,
  config: ImageDownloadConfig,
  stats: BatchDownloadStats
): Promise<{
  imageUrl: string | null;
  originalRecipePhotoUrls: string[];
  errors: string[];
}> {
  const errors: string[] = [];
  let imageUrl: string | null = null;
  const originalRecipePhotoUrls: string[] = [];

  console.log(`\n📸 Downloading images for: ${recipeTitle} (Legacy ID: ${legacyRecipeId})`);

  try {
    // Scrape the recipe page to find images
    console.log(`  Scraping: ${config.legacyBaseUrl}/recipes/${legacyRecipeId}`);
    const scrapedImages = await scrapeRecipeImages(
      config.legacyBaseUrl,
      legacyRecipeId,
      config.timeout
    );

    // Download recipe image
    if (scrapedImages.recipeImage) {
      console.log(`  Recipe image found`);
      const result = await downloadAndSaveImage(
        scrapedImages.recipeImage,
        recipeUuid,
        'recipes',
        config
      );

      stats.total++;
      if (result.success && result.publicUrl) {
        imageUrl = result.publicUrl;
        stats.successful++;
      } else {
        stats.failed++;
        errors.push(`Recipe image failed: ${result.error}`);
      }
    } else {
      console.log(`  No recipe image found`);
    }

    // Download original photos
    if (scrapedImages.originalPhotos.length > 0) {
      console.log(`  Original photos found: ${scrapedImages.originalPhotos.length}`);
      
      for (let i = 0; i < scrapedImages.originalPhotos.length; i++) {
        const photoUrl = scrapedImages.originalPhotos[i];
        const result = await downloadAndSaveImage(
          photoUrl,
          recipeUuid,
          'recipe-photos',
          config,
          i + 1
        );

        stats.total++;
        if (result.success && result.publicUrl) {
          originalRecipePhotoUrls.push(result.publicUrl);
          stats.successful++;
        } else {
          stats.failed++;
          errors.push(`Original photo ${i + 1} failed: ${result.error}`);
        }
      }
    } else {
      console.log(`  No original photos found`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Scraping failed: ${errorMessage}`);
    errors.push(`Scraping failed: ${errorMessage}`);
  }

  if (errors.length > 0) {
    console.log(`  ⚠ ${errors.length} error(s) occurred`);
  }

  return {
    imageUrl,
    originalRecipePhotoUrls,
    errors,
  };
}
