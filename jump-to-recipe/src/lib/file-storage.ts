import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Configuration
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];

// Recipe photo specific configuration
const MAX_RECIPE_PHOTO_SIZE_MB = parseInt(process.env.MAX_RECIPE_PHOTO_SIZE_MB || '10');
const MAX_RECIPE_PHOTO_COUNT = parseInt(process.env.MAX_RECIPE_PHOTO_COUNT || '10');
const MAX_RECIPE_PHOTO_SIZE = MAX_RECIPE_PHOTO_SIZE_MB * 1024 * 1024;

// S3 Configuration (optional)
const s3Client = process.env.AWS_ACCESS_KEY_ID ? new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}) : null;

const S3_BUCKET = process.env.AWS_S3_BUCKET;
const USE_S3 = process.env.USE_S3 === 'true' && s3Client && S3_BUCKET;

export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

export interface FileUploadOptions {
  category: 'recipes' | 'cookbooks' | 'avatars' | 'recipe-photos';
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  recipeId?: string; // Required for recipe-photos category
}

// Ensure upload directory exists
async function ensureUploadDir(category: string, recipeId?: string) {
  let categoryDir = path.join(UPLOAD_DIR, category);
  
  // For recipe-photos, create subdirectory by recipeId
  if (category === 'recipe-photos' && recipeId) {
    categoryDir = path.join(categoryDir, recipeId);
  }
  
  if (!existsSync(categoryDir)) {
    await mkdir(categoryDir, { recursive: true });
  }
  return categoryDir;
}

// Generate unique filename
function generateFilename(originalName: string, category: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName).toLowerCase();
  
  // For recipe-photos, use a simpler naming convention since they're in subdirectories
  if (category === 'recipe-photos') {
    return `${timestamp}_${random}${ext}`;
  }
  
  return `${category}_${timestamp}_${random}${ext}`;
}

// Validate file
export function validateFile(file: File, category?: string): { isValid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, GIF, WebP, or HEIC images only.'
    };
  }

  // Use recipe photo specific limits for recipe-photos category
  const maxSize = category === 'recipe-photos' ? MAX_RECIPE_PHOTO_SIZE : MAX_FILE_SIZE;
  const maxSizeMB = category === 'recipe-photos' ? MAX_RECIPE_PHOTO_SIZE_MB : (MAX_FILE_SIZE / (1024 * 1024));

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${maxSizeMB}MB.`
    };
  }

  return { isValid: true };
}

// Validate multiple recipe photos
export function validateRecipePhotos(files: File[]): { isValid: boolean; error?: string } {
  if (files.length > MAX_RECIPE_PHOTO_COUNT) {
    return {
      isValid: false,
      error: `Too many photos. Maximum is ${MAX_RECIPE_PHOTO_COUNT} photos per recipe.`
    };
  }

  for (const file of files) {
    const validation = validateFile(file, 'recipe-photos');
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}

// Process and optimize image
async function processImage(
  buffer: Buffer, 
  options: FileUploadOptions
): Promise<Buffer> {
  let image = sharp(buffer);

  // Get image metadata
  const metadata = await image.metadata();
  
  // Apply recipe photo specific settings
  if (options.category === 'recipe-photos') {
    // Recipe photos: max 1200x800, 85% quality
    image = image.resize(1200, 800, {
      fit: 'inside',
      withoutEnlargement: true
    });
  } else if (options.maxWidth || options.maxHeight) {
    // Other categories: use provided dimensions
    image = image.resize(options.maxWidth, options.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Set quality and format
  const quality = options.category === 'recipe-photos' ? 85 : (options.quality || 85);
  
  if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
    image = image.jpeg({ quality });
  } else if (metadata.format === 'png') {
    image = image.png({ quality });
  } else if (metadata.format === 'webp') {
    image = image.webp({ quality });
  }

  const result = await image.toBuffer();
  return Buffer.from(result);
}

// Upload to local storage
async function uploadToLocal(
  buffer: Buffer,
  filename: string,
  category: string,
  recipeId?: string
): Promise<string> {
  const categoryDir = await ensureUploadDir(category, recipeId);
  const filePath = path.join(categoryDir, filename);
  
  await writeFile(filePath, buffer);
  
  // Return URL path relative to public directory
  if (category === 'recipe-photos' && recipeId) {
    return `/uploads/${category}/${recipeId}/${filename}`;
  }
  return `/uploads/${category}/${filename}`;
}

// Upload to S3
async function uploadToS3(
  buffer: Buffer,
  filename: string,
  category: string,
  contentType: string,
  recipeId?: string
): Promise<string> {
  if (!s3Client || !S3_BUCKET) {
    throw new Error('S3 not configured');
  }

  // For recipe-photos, include recipeId in the key
  let key = `${category}/${filename}`;
  if (category === 'recipe-photos' && recipeId) {
    key = `${category}/${recipeId}/${filename}`;
  }
  
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  });

  await s3Client.send(command);
  
  // Return S3 URL
  return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

// Main upload function
export async function uploadFile(
  file: File,
  options: FileUploadOptions
): Promise<FileUploadResult> {
  // Validate recipeId is provided for recipe-photos
  if (options.category === 'recipe-photos' && !options.recipeId) {
    throw new Error('recipeId is required for recipe-photos category');
  }

  // Validate file
  const validation = validateFile(file, options.category);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(new Uint8Array(arrayBuffer));

  // Process image
  buffer = Buffer.from(await processImage(buffer, options));

  // Generate filename
  const filename = generateFilename(file.name, options.category);

  // Upload to storage
  let url: string;
  if (USE_S3) {
    url = await uploadToS3(buffer, filename, options.category, file.type, options.recipeId);
  } else {
    url = await uploadToLocal(buffer, filename, options.category, options.recipeId);
  }

  return {
    url,
    filename,
    size: buffer.length,
    type: file.type,
  };
}

// Delete file from local storage
async function deleteFromLocal(url: string): Promise<void> {
  // Extract path from URL (remove leading slash)
  const relativePath = url.startsWith('/') ? url.slice(1) : url;
  const filePath = path.join(process.cwd(), 'public', relativePath);
  
  try {
    await unlink(filePath);
  } catch (error) {
    // File might not exist, which is okay
    console.warn('Failed to delete local file:', filePath, error);
  }
}

// Delete file from S3
async function deleteFromS3(url: string): Promise<void> {
  if (!s3Client || !S3_BUCKET) {
    throw new Error('S3 not configured');
  }

  // Extract key from S3 URL
  const urlParts = url.split('/');
  const key = urlParts.slice(-2).join('/'); // category/filename

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

// Main delete function
export async function deleteFile(url: string): Promise<void> {
  if (!url) return;

  try {
    if (USE_S3 && url.includes('s3.')) {
      await deleteFromS3(url);
    } else {
      await deleteFromLocal(url);
    }
  } catch (error) {
    console.error('Failed to delete file:', url, error);
    // Don't throw error - file deletion failure shouldn't break the app
  }
}

// Upload multiple recipe photos
export async function uploadRecipePhotos(
  files: File[],
  recipeId: string
): Promise<FileUploadResult[]> {
  // Validate all files first
  const validation = validateRecipePhotos(files);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Upload all files
  const uploadPromises = files.map(file => 
    uploadFile(file, { 
      category: 'recipe-photos', 
      recipeId 
    })
  );

  return Promise.all(uploadPromises);
}

// Get image dimensions and metadata
export async function getImageInfo(file: File): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const metadata = await sharp(buffer).metadata();
  
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: file.size,
  };
}

// Export configuration constants (server-side only)
export const FILE_STORAGE_CONFIG = {
  MAX_RECIPE_PHOTO_SIZE_MB,
  MAX_RECIPE_PHOTO_COUNT,
  MAX_RECIPE_PHOTO_SIZE,
  ALLOWED_TYPES,
} as const;