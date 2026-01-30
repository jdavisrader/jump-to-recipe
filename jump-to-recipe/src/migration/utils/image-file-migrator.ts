/**
 * Image File Migrator (TEMPLATE)
 * 
 * This is a template/skeleton for migrating actual image files from the legacy
 * Active Storage system to your new storage solution.
 * 
 * IMPORTANT: This is NOT automatically run during migration. It's a starting
 * point for you to customize based on your storage solution.
 * 
 * Usage:
 *   1. Customize the download and upload functions for your environment
 *   2. Configure your storage credentials
 *   3. Run after the main migration completes
 *   4. Update database with real URLs
 */

import { Client as SSHClient } from 'ssh2';
import * as path from 'path';
import * as fs from 'fs/promises';

// ============================================================================
// Configuration
// ============================================================================

interface ImageMigrationConfig {
  // Legacy server SSH config
  ssh: {
    host: string;
    port: number;
    username: string;
    privateKeyPath: string;
  };
  
  // Legacy Active Storage path on server
  legacyStoragePath: string; // e.g., '/var/www/app/storage'
  
  // New storage config (customize for your solution)
  newStorage: {
    type: 'local' | 's3' | 'cloudinary' | 'uploadthing';
    // Add your storage-specific config here
  };
  
  // Processing options
  batchSize: number;
  delayBetweenBatches: number;
  resizeImages?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

// ============================================================================
// Image Reference Parser
// ============================================================================

/**
 * Parse image reference placeholder
 * Format: [LEGACY_IMAGE:key:filename]
 */
export function parseImageReference(reference: string | null): {
  blobKey: string;
  filename: string;
} | null {
  if (!reference || !reference.startsWith('[LEGACY_IMAGE:')) {
    return null;
  }

  const match = reference.match(/\[LEGACY_IMAGE:([^:]+):([^\]]+)\]/);
  if (!match) {
    return null;
  }

  return {
    blobKey: match[1],
    filename: match[2],
  };
}

// ============================================================================
// Legacy File Downloader
// ============================================================================

/**
 * Download file from legacy Active Storage via SSH/SFTP
 * 
 * Active Storage typically stores files at:
 * storage/[first 2 chars]/[next 2 chars]/[full key]
 * 
 * Example: key "abc123def456" → storage/ab/c1/abc123def456
 */
export async function downloadFromLegacyStorage(
  config: ImageMigrationConfig,
  blobKey: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ssh = new SSHClient();

    ssh.on('ready', () => {
      ssh.sftp((err, sftp) => {
        if (err) {
          ssh.end();
          return reject(err);
        }

        // Build file path based on Active Storage conventions
        const keyPrefix = blobKey.substring(0, 2);
        const keyMiddle = blobKey.substring(2, 4);
        const remotePath = path.join(
          config.legacyStoragePath,
          keyPrefix,
          keyMiddle,
          blobKey
        );

        console.log(`Downloading: ${remotePath}`);

        // Read file
        sftp.readFile(remotePath, (err, data) => {
          ssh.end();
          
          if (err) {
            return reject(new Error(`Failed to download ${remotePath}: ${err.message}`));
          }
          
          resolve(data);
        });
      });
    });

    ssh.on('error', (err) => {
      reject(new Error(`SSH connection failed: ${err.message}`));
    });

    // Connect
    ssh.connect({
      host: config.ssh.host,
      port: config.ssh.port,
      username: config.ssh.username,
      privateKey: require('fs').readFileSync(config.ssh.privateKeyPath),
    });
  });
}

// ============================================================================
// New Storage Uploader (CUSTOMIZE THIS)
// ============================================================================

/**
 * Upload file to new storage
 * 
 * CUSTOMIZE THIS FUNCTION based on your storage solution:
 * - S3: Use @aws-sdk/client-s3
 * - Cloudinary: Use cloudinary SDK
 * - UploadThing: Use uploadthing SDK
 * - Local: Use fs.writeFile
 */
export async function uploadToNewStorage(
  config: ImageMigrationConfig,
  fileBuffer: Buffer,
  filename: string,
  contentType?: string
): Promise<string> {
  // TODO: Implement based on your storage solution
  
  // Example for local storage:
  if (config.newStorage.type === 'local') {
    const localPath = path.join('./public/uploads', filename);
    await fs.writeFile(localPath, fileBuffer);
    return `/uploads/${filename}`;
  }

  // Example for S3:
  // const s3 = new S3Client({ region: 'us-east-1' });
  // const command = new PutObjectCommand({
  //   Bucket: 'your-bucket',
  //   Key: `recipes/${filename}`,
  //   Body: fileBuffer,
  //   ContentType: contentType,
  // });
  // await s3.send(command);
  // return `https://your-bucket.s3.amazonaws.com/recipes/${filename}`;

  // Example for Cloudinary:
  // const result = await cloudinary.uploader.upload_stream(
  //   { folder: 'recipes', public_id: filename },
  //   fileBuffer
  // );
  // return result.secure_url;

  throw new Error('Upload function not implemented. Customize uploadToNewStorage()');
}

// ============================================================================
// Image Processing (Optional)
// ============================================================================

/**
 * Resize/optimize image before upload
 * 
 * Requires: npm install sharp
 */
export async function processImage(
  buffer: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<Buffer> {
  // TODO: Implement with sharp or similar library
  // const sharp = require('sharp');
  // return await sharp(buffer)
  //   .resize(options.maxWidth, options.maxHeight, { fit: 'inside' })
  //   .jpeg({ quality: options.quality || 85 })
  //   .toBuffer();
  
  return buffer; // No processing by default
}

// ============================================================================
// Main Migration Function
// ============================================================================

/**
 * Migrate a single image
 */
export async function migrateSingleImage(
  config: ImageMigrationConfig,
  imageReference: string,
  contentType?: string
): Promise<string | null> {
  try {
    // Parse reference
    const parsed = parseImageReference(imageReference);
    if (!parsed) {
      console.warn(`Invalid image reference: ${imageReference}`);
      return null;
    }

    console.log(`Migrating: ${parsed.filename} (${parsed.blobKey})`);

    // Download from legacy storage
    let fileBuffer = await downloadFromLegacyStorage(config, parsed.blobKey);

    // Optional: Process/resize image
    if (config.resizeImages) {
      fileBuffer = await processImage(fileBuffer, {
        maxWidth: config.maxWidth,
        maxHeight: config.maxHeight,
      });
    }

    // Upload to new storage
    const newUrl = await uploadToNewStorage(
      config,
      fileBuffer,
      parsed.filename,
      contentType
    );

    console.log(`✓ Migrated to: ${newUrl}`);
    return newUrl;

  } catch (error) {
    console.error(`✗ Failed to migrate image:`, error);
    return null;
  }
}

/**
 * Migrate all images for recipes
 */
export async function migrateRecipeImages(
  config: ImageMigrationConfig,
  recipes: any[]
): Promise<Map<string, { imageUrl: string | null; originalRecipePhotoUrl: string | null }>> {
  console.log(`\n=== Migrating Images for ${recipes.length} Recipes ===\n`);

  const results = new Map();
  let processed = 0;
  let successful = 0;
  let failed = 0;

  for (const recipe of recipes) {
    const recipeId = recipe.id;
    const result: any = {
      imageUrl: recipe.imageUrl,
      originalRecipePhotoUrl: recipe.originalRecipePhotoUrl,
    };

    // Migrate main image
    if (recipe.imageUrl?.startsWith('[LEGACY_IMAGE:')) {
      const newUrl = await migrateSingleImage(config, recipe.imageUrl);
      if (newUrl) {
        result.imageUrl = newUrl;
        successful++;
      } else {
        failed++;
      }
      processed++;
    }

    // Migrate original photo
    if (recipe.originalRecipePhotoUrl?.startsWith('[LEGACY_IMAGE:')) {
      const newUrl = await migrateSingleImage(config, recipe.originalRecipePhotoUrl);
      if (newUrl) {
        result.originalRecipePhotoUrl = newUrl;
        successful++;
      } else {
        failed++;
      }
      processed++;
    }

    results.set(recipeId, result);

    // Batch delay
    if (processed % config.batchSize === 0) {
      console.log(`Progress: ${processed} images processed...`);
      await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Total images processed: ${processed}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  return results;
}

// ============================================================================
// Database Update Function
// ============================================================================

/**
 * Update database with new image URLs
 * 
 * CUSTOMIZE THIS based on your database setup
 */
export async function updateRecipeImageUrls(
  recipeId: string,
  imageUrl: string | null,
  originalRecipePhotoUrl: string | null
): Promise<void> {
  // TODO: Implement database update
  
  // Example with Drizzle:
  // await db.update(recipes)
  //   .set({ imageUrl, originalRecipePhotoUrl })
  //   .where(eq(recipes.id, recipeId));

  // Example with Prisma:
  // await prisma.recipe.update({
  //   where: { id: recipeId },
  //   data: { imageUrl, originalRecipePhotoUrl },
  // });

  console.log(`Updated recipe ${recipeId} with new image URLs`);
}

// ============================================================================
// CLI Entry Point (Example)
// ============================================================================

/**
 * Example usage
 */
export async function main() {
  const config: ImageMigrationConfig = {
    ssh: {
      host: process.env.SSH_HOST || '',
      port: parseInt(process.env.SSH_PORT || '22'),
      username: process.env.SSH_USERNAME || '',
      privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH || '',
    },
    legacyStoragePath: process.env.LEGACY_STORAGE_PATH || '/var/www/app/storage',
    newStorage: {
      type: 'local', // Change to your storage type
    },
    batchSize: 10,
    delayBetweenBatches: 1000,
    resizeImages: false,
  };

  // Load recipes with image references
  const recipesPath = process.argv[2] || 'migration-data/transformed/latest/recipes-pass.json';
  const recipes = JSON.parse(await fs.readFile(recipesPath, 'utf-8'));

  // Migrate images
  const results = await migrateRecipeImages(config, recipes);

  // Update database
  for (const [recipeId, urls] of results.entries()) {
    await updateRecipeImageUrls(recipeId, urls.imageUrl, urls.originalRecipePhotoUrl);
  }

  console.log('\n✓ Image migration complete!');
}

// Uncomment to run:
// if (require.main === module) {
//   main().catch(console.error);
// }
