// Client-safe file storage configuration constants
// This file can be imported by client components

export const FILE_STORAGE_CONFIG = {
  MAX_RECIPE_PHOTO_SIZE_MB: 10,
  MAX_RECIPE_PHOTO_COUNT: 10,
  MAX_RECIPE_PHOTO_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic'],
} as const;