/**
 * Photo validation utilities for recipe photos
 * Provides comprehensive client-side and server-side validation
 */

import { FILE_STORAGE_CONFIG } from '@/lib/file-storage-config';

export interface PhotoValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}

export interface PhotoFileValidation extends PhotoValidationResult {
  file?: File;
}

/**
 * Allowed MIME types for recipe photos
 */
export const ALLOWED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

/**
 * Human-readable file extensions
 */
export const ALLOWED_PHOTO_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.heic',
] as const;

/**
 * Validates a single photo file
 */
export function validatePhotoFile(file: File): PhotoFileValidation {
  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided',
    };
  }

  // Check file type
  const isValidType = ALLOWED_PHOTO_MIME_TYPES.includes(file.type as typeof ALLOWED_PHOTO_MIME_TYPES[number]);
  if (!isValidType) {
    return {
      isValid: false,
      error: `Invalid file type "${file.type}". Supported formats: ${ALLOWED_PHOTO_EXTENSIONS.join(', ')}`,
      file,
    };
  }

  // Check file size
  const maxSizeBytes = FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File "${file.name}" is too large (${fileSizeMB}MB). Maximum size is ${FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_SIZE_MB}MB`,
      file,
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      isValid: false,
      error: `File "${file.name}" is empty`,
      file,
    };
  }

  return {
    isValid: true,
    file,
  };
}

/**
 * Validates multiple photo files
 */
export function validatePhotoFiles(
  files: File[],
  existingPhotoCount: number = 0
): PhotoValidationResult {
  const errors: string[] = [];

  // Check if any files provided
  if (!files || files.length === 0) {
    return {
      isValid: false,
      error: 'No files provided',
    };
  }

  // Check total count limit
  const totalCount = existingPhotoCount + files.length;
  if (totalCount > FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_COUNT) {
    return {
      isValid: false,
      error: `Cannot upload ${files.length} photo(s). Recipe would have ${totalCount} photos, but maximum is ${FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_COUNT}`,
    };
  }

  // Validate each file
  files.forEach((file, index) => {
    const validation = validatePhotoFile(file);
    if (!validation.isValid) {
      errors.push(`Photo ${index + 1}: ${validation.error}`);
    }
  });

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors.length === 1 ? errors[0] : 'Multiple validation errors',
      errors,
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates photo count against limits
 */
export function validatePhotoCount(
  newPhotoCount: number,
  existingPhotoCount: number = 0
): PhotoValidationResult {
  const totalCount = existingPhotoCount + newPhotoCount;

  if (totalCount > FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_COUNT) {
    return {
      isValid: false,
      error: `Cannot add ${newPhotoCount} photo(s). Recipe would have ${totalCount} photos, but maximum is ${FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_COUNT}`,
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Gets user-friendly error message for file validation errors
 */
export function getPhotoValidationErrorMessage(error: string): string {
  // Map common error codes to user-friendly messages
  const errorMap: Record<string, string> = {
    'file-too-large': `File is too large. Maximum size is ${FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_SIZE_MB}MB`,
    'file-invalid-type': `Invalid file type. Supported formats: ${ALLOWED_PHOTO_EXTENSIONS.join(', ')}`,
    'too-many-files': `Too many files. Maximum is ${FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_COUNT} photos per recipe`,
    'file-too-small': 'File is empty or corrupted',
  };

  return errorMap[error] || error;
}

/**
 * Validates photo position for reordering
 */
export function validatePhotoPosition(
  position: number,
  totalPhotos: number
): PhotoValidationResult {
  if (position < 0) {
    return {
      isValid: false,
      error: 'Position cannot be negative',
    };
  }

  if (position >= totalPhotos) {
    return {
      isValid: false,
      error: `Position ${position} is out of range. Total photos: ${totalPhotos}`,
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates photo reorder request
 */
export function validatePhotoReorder(
  photoIds: string[],
  existingPhotoIds: string[]
): PhotoValidationResult {
  // Check if arrays have same length
  if (photoIds.length !== existingPhotoIds.length) {
    return {
      isValid: false,
      error: 'Photo count mismatch in reorder request',
    };
  }

  // Check for duplicate IDs first (before checking missing IDs)
  const uniqueIds = new Set(photoIds);
  if (uniqueIds.size !== photoIds.length) {
    return {
      isValid: false,
      error: 'Duplicate photo IDs in reorder request',
    };
  }

  // Check if all IDs are present
  const missingIds = existingPhotoIds.filter(id => !photoIds.includes(id));
  if (missingIds.length > 0) {
    return {
      isValid: false,
      error: `Missing photo IDs in reorder request: ${missingIds.join(', ')}`,
    };
  }

  return {
    isValid: true,
  };
}
