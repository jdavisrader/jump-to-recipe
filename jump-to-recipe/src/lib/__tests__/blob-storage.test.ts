/**
 * @jest-environment node
 */
import { put, del } from '@vercel/blob';
import { isBlobUrl, uploadToBlob, deleteFromBlob } from '../blob-storage';

jest.mock('@vercel/blob', () => ({
  put: jest.fn(async (pathname: string) => ({
    url: `https://abc123.public.blob.vercel-storage.com/${pathname}`,
  })),
  del: jest.fn(async () => undefined),
}));

describe('isBlobUrl', () => {
  it('matches Vercel Blob URLs', () => {
    expect(isBlobUrl('https://abc123.public.blob.vercel-storage.com/uploads/x.jpg')).toBe(true);
  });

  it('rejects local paths, S3, and lookalike hosts', () => {
    expect(isBlobUrl('/uploads/recipes/x.jpg')).toBe(false);
    expect(isBlobUrl('https://bucket.s3.us-east-1.amazonaws.com/x.jpg')).toBe(false);
    expect(isBlobUrl('https://blob.vercel-storage.com.evil.com/x.jpg')).toBe(false);
    expect(isBlobUrl('')).toBe(false);
  });
});

describe('uploadToBlob', () => {
  beforeEach(() => jest.clearAllMocks());

  it('nests recipe photos under the recipe id, matching the local-disk layout', async () => {
    const url = await uploadToBlob(Buffer.from('img'), '1_ab.jpg', 'recipe-photos', 'image/jpeg', 'recipe-1');

    expect(put).toHaveBeenCalledWith(
      'uploads/recipe-photos/recipe-1/1_ab.jpg',
      expect.any(Buffer),
      { access: 'public', contentType: 'image/jpeg', addRandomSuffix: false }
    );
    expect(url).toBe('https://abc123.public.blob.vercel-storage.com/uploads/recipe-photos/recipe-1/1_ab.jpg');
  });

  it('stores other categories directly under the category', async () => {
    await uploadToBlob(Buffer.from('img'), 'avatars_1_ab.png', 'avatars', 'image/png');

    expect(put).toHaveBeenCalledWith('uploads/avatars/avatars_1_ab.png', expect.any(Buffer), expect.any(Object));
  });
});

describe('deleteFromBlob', () => {
  it('deletes by URL', async () => {
    await deleteFromBlob('https://abc123.public.blob.vercel-storage.com/uploads/x.jpg');
    expect(del).toHaveBeenCalledWith('https://abc123.public.blob.vercel-storage.com/uploads/x.jpg');
  });
});
