/**
 * Utility functions for validating and handling images
 */

// List of allowed image domains for cookbook covers
const ALLOWED_IMAGE_DOMAINS = [
  'images.unsplash.com',
  'unsplash.com',
  'cdn.pixabay.com',
  'images.pexels.com',
  'www.pexels.com',
  'foodnetwork.sndimg.com',
  'food.fnr.sndimg.com',
  'hips.hearstapps.com',
  'assets.bonappetit.com',
  'www.foodandwine.com',
  'images.immediate.co.uk',
  'www.bbcgoodfood.com',
  // Add more trusted domains as needed
];

// Common image file extensions
const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/**
 * Validate if an image URL is from an allowed domain and has a valid extension
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Check if domain is allowed
    const isAllowedDomain = ALLOWED_IMAGE_DOMAINS.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowedDomain) {
      console.warn(`Image domain not allowed: ${parsedUrl.hostname}`);
      return false;
    }
    
    // Check if URL has a valid image extension
    const hasValidExtension = VALID_IMAGE_EXTENSIONS.some(ext => 
      parsedUrl.pathname.toLowerCase().endsWith(ext)
    );
    
    // Some URLs might not have extensions but still be valid (e.g., Unsplash URLs)
    // Allow URLs from trusted domains even without extensions
    const isTrustedDomainWithoutExtension = [
      'images.unsplash.com',
      'unsplash.com'
    ].some(domain => parsedUrl.hostname.includes(domain));
    
    if (!hasValidExtension && !isTrustedDomainWithoutExtension) {
      console.warn(`Image URL doesn't have valid extension: ${url}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn(`Invalid image URL format: ${url}`, error);
    return false;
  }
}

/**
 * Validate an image URL by attempting to fetch its headers
 * This is more thorough but requires a network request
 */
export async function validateImageUrlByFetch(url: string): Promise<boolean> {
  try {
    // First check basic URL validation
    if (!isValidImageUrl(url)) {
      return false;
    }
    
    // Attempt to fetch just the headers to check if image exists and is accessible
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JumpToRecipe/1.0)',
      },
      // Set a timeout to avoid hanging
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      console.warn(`Image URL returned ${response.status}: ${url}`);
      return false;
    }
    
    // Check if the content type is an image
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.warn(`URL is not an image (content-type: ${contentType}): ${url}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn(`Failed to validate image URL: ${url}`, error);
    return false;
  }
}

/**
 * Sanitize and validate an image URL for cookbook covers
 * Returns null if the URL is invalid, otherwise returns the validated URL
 */
export function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') {
    return null;
  }
  
  const trimmedUrl = url.trim();
  
  // Basic validation
  if (!isValidImageUrl(trimmedUrl)) {
    return null;
  }
  
  return trimmedUrl;
}