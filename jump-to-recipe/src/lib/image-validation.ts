// Image validation utilities

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg", 
  "image/png",
  "image/gif",
  "image/webp"
];

export const MAX_FILE_SIZES = {
  avatar: 2 * 1024 * 1024, // 2MB
  recipe: 4 * 1024 * 1024, // 4MB
  cookbook: 4 * 1024 * 1024, // 4MB
};

export function validateImageFile(
  file: File, 
  type: keyof typeof MAX_FILE_SIZES
): { isValid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image."
    };
  }

  // Check file size
  const maxSize = MAX_FILE_SIZES[type];
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${maxSizeMB}MB.`
    };
  }

  return { isValid: true };
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    
    img.src = url;
  });
}

export function isUploadThingUrl(url: string): boolean {
  return url.includes("utfs.io") || url.includes("uploadthing");
}

export function extractFileKeyFromUrl(url: string): string | null {
  try {
    // UploadThing URLs typically look like: https://utfs.io/f/{fileKey}
    const match = url.match(/\/f\/([^/?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function sanitizeImageUrl(url: string | null | undefined): string {
  // Basic URL sanitization - handle both URLs and local file paths
  if (!url) return "";
  
  // If it's a local file path (starts with /), return as-is
  if (url.startsWith('/')) {
    return url;
  }
  
  // If it's a URL, validate and return
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.toString();
  } catch {
    // If URL parsing fails, return the original string (might be a relative path)
    return url;
  }
}

export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Check if it's a valid URL and has an image-like extension or is from trusted sources
    const trustedDomains = [
      'utfs.io', // UploadThing
      'images.unsplash.com',
      'unsplash.com',
      'pexels.com',
      'images.pexels.com',
      'foodnetwork.com',
      'bbcgoodfood.com'
    ];
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    return trustedDomains.some(domain => parsedUrl.hostname.includes(domain)) ||
           imageExtensions.some(ext => parsedUrl.pathname.toLowerCase().endsWith(ext));
  } catch {
    return false;
  }
}