import { put, del } from '@vercel/blob';

// Vercel Blob storage backend, used when a Blob store is connected to the
// project. The Vercel integration provides either a read-write token or a
// store id (authenticated via Vercel's OIDC token at runtime).
export const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

const BLOB_HOST_SUFFIX = '.blob.vercel-storage.com';

export function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

// Mirrors the local-disk layout (`uploads/<category>/[recipeId/]<filename>`) so
// files migrated from the old `/uploads/...` paths and new uploads share one scheme.
export async function uploadToBlob(
  buffer: Buffer,
  filename: string,
  category: string,
  contentType: string,
  recipeId?: string
): Promise<string> {
  const pathname = category === 'recipe-photos' && recipeId
    ? `uploads/${category}/${recipeId}/${filename}`
    : `uploads/${category}/${filename}`;

  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  });

  return blob.url;
}

export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}
