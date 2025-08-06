import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Configuration
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

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
  category: 'recipes' | 'cookbooks' | 'avatars';
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

// Ensure upload directory exists
async function ensureUploadDir(category: string) {
  const categoryDir = path.join(UPLOAD_DIR, category);
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
  return `${category}_${timestamp}_${random}${ext}`;
}

// Validate file
export function validateFile(file: File): { isValid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP images only.'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
    };
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
  
  // Resize if needed
  if (options.maxWidth || options.maxHeight) {
    image = image.resize(options.maxWidth, options.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Set quality and format
  const quality = options.quality || 85;
  
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
  category: string
): Promise<string> {
  const categoryDir = await ensureUploadDir(category);
  const filePath = path.join(categoryDir, filename);
  
  await writeFile(filePath, buffer);
  
  // Return URL path relative to public directory
  return `/uploads/${category}/${filename}`;
}

// Upload to S3
async function uploadToS3(
  buffer: Buffer,
  filename: string,
  category: string,
  contentType: string
): Promise<string> {
  if (!s3Client || !S3_BUCKET) {
    throw new Error('S3 not configured');
  }

  const key = `${category}/${filename}`;
  
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
  // Validate file
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(new Uint8Array(arrayBuffer));

  // Process image
  buffer = await processImage(buffer, options);

  // Generate filename
  const filename = generateFilename(file.name, options.category);

  // Upload to storage
  let url: string;
  if (USE_S3) {
    url = await uploadToS3(buffer, filename, options.category, file.type);
  } else {
    url = await uploadToLocal(buffer, filename, options.category);
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