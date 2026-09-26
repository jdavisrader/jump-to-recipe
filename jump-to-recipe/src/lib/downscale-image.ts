// Browser-side photo downscaling so phone photos fit under Vercel's ~4.5 MB
// request body limit. The server still resizes to its final size with sharp;
// this only needs to get the upload small enough to arrive.

// Leaves headroom under 4.5 MB for multipart form overhead.
export const DOWNSCALE_THRESHOLD_BYTES = 3.5 * 1024 * 1024;
export const MAX_DIMENSION_PX = 2400;
const JPEG_QUALITY = 0.85;

export function scaleToFit(width: number, height: number, maxDimension = MAX_DIMENSION_PX) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function toJpegName(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, '');
  return `${baseName || 'photo'}.jpg`;
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
}

/**
 * Returns a JPEG no larger than MAX_DIMENSION_PX on its long edge when `file`
 * exceeds DOWNSCALE_THRESHOLD_BYTES. Returns `file` unchanged when it is already
 * small enough, or when the browser can't decode it (e.g. HEIC outside Safari) —
 * the server's own size validation then decides.
 */
export async function downscaleImageForUpload(file: File): Promise<File> {
  if (file.size <= DOWNSCALE_THRESHOLD_BYTES) return file;

  try {
    // Honors EXIF orientation, so rotated phone photos stay upright.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { width, height } = scaleToFit(bitmap.width, bitmap.height);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await canvasToJpegBlob(canvas);
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], toJpegName(file.name), {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });
  } catch (error) {
    console.warn(`Could not downscale ${file.name}; uploading original`, error);
    return file;
  }
}
