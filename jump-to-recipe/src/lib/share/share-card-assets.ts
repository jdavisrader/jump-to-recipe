import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { SITE_URL } from '@/constants';

const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif'];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function toDataUrl(bytes: ArrayBuffer | Buffer, contentType: string): string {
  return `data:${contentType};base64,${Buffer.from(bytes as ArrayBuffer).toString('base64')}`;
}

const EXTENSION_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
};

// Relative photo paths (/uploads/...) live in public/ in local dev.
async function loadPublicFileDataUrl(publicPath: string): Promise<string | null> {
  const publicDir = path.join(process.cwd(), 'public');
  const filePath = path.join(publicDir, decodeURIComponent(publicPath));
  const contentType = EXTENSION_TYPES[path.extname(filePath).toLowerCase()];
  if (!filePath.startsWith(publicDir + path.sep) || !contentType) return null;
  try {
    const bytes = await readFile(filePath);
    return bytes.byteLength > MAX_IMAGE_BYTES ? null : toDataUrl(bytes, contentType);
  } catch {
    return null;
  }
}

export async function loadMascotDataUrl(): Promise<string> {
  const bytes = await readFile(path.join(process.cwd(), 'public', 'happeacook-mascot.png'));
  return toDataUrl(bytes, 'image/png');
}

/**
 * Fetches a recipe photo as a data URL the card renderer can draw.
 * Returns null for anything it can't use (webp, too large, unreachable),
 * so the card falls back to the mascot instead of failing.
 */
export async function loadRecipePhotoDataUrl(imageUrl: string | null): Promise<string | null> {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('/')) {
    const fromDisk = await loadPublicFileDataUrl(imageUrl);
    if (fromDisk) return fromDisk;
  }
  try {
    const absoluteUrl = new URL(imageUrl, SITE_URL);
    const response = await fetch(absoluteUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type')?.split(';')[0] ?? '';
    if (!SUPPORTED_IMAGE_TYPES.includes(contentType)) return null;

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) return null;
    return toDataUrl(bytes, contentType);
  } catch {
    return null;
  }
}

/**
 * Loads Geist ExtraBold from Google Fonts, subset to just the characters
 * on the card. Returns null on failure so the card uses the default font.
 */
export async function loadTitleFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Geist:wght@800&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl, { signal: AbortSignal.timeout(3000) })).text();
    const fontUrl = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!fontUrl) return null;
    const fontResponse = await fetch(fontUrl, { signal: AbortSignal.timeout(3000) });
    return fontResponse.ok ? await fontResponse.arrayBuffer() : null;
  } catch {
    return null;
  }
}
