import { NextRequest } from 'next/server';
import { DELETE, GET } from '../route';
import { getServerSession } from 'next-auth';
import { db } from '@/db';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/db');
jest.mock('@/lib/photo-operations');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/recipes/photos/[photoId]', () => {
  const mockPhotoId = 'photo-123';
  const mockRecipeId = 'recipe-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE', () => {
    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/recipes/photos/${mockPhotoId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ photoId: mockPhotoId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 404 for non-existent photo', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, role: 'user' },
      } as any);

      // Mock db.query.recipePhotos.findFirst to return null
      const mockDb = {
        query: {
          recipePhotos: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        },
      };
      (db as any) = mockDb;

      const request = new NextRequest(`http://localhost/api/recipes/photos/${mockPhotoId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ photoId: mockPhotoId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Photo not found or already deleted');
    });

    it('should return 404 when associated recipe not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, role: 'user' },
      } as any);

      // Mock photo exists but recipe doesn't
      const mockDb = {
        query: {
          recipePhotos: {
            findFirst: jest.fn().mockResolvedValue({
              id: mockPhotoId,
              recipeId: mockRecipeId,
            }),
          },
          recipes: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        },
      };
      (db as any) = mockDb;

      const request = new NextRequest(`http://localhost/api/recipes/photos/${mockPhotoId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ photoId: mockPhotoId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Associated recipe not found');
    });

    it('should return 403 for unauthorized user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'different-user', role: 'user' },
      } as any);

      const mockDb = {
        query: {
          recipePhotos: {
            findFirst: jest.fn().mockResolvedValue({
              id: mockPhotoId,
              recipeId: mockRecipeId,
            }),
          },
          recipes: {
            findFirst: jest.fn().mockResolvedValue({
              id: mockRecipeId,
              authorId: mockUserId, // Different from session user
            }),
          },
        },
      };
      (db as any) = mockDb;

      const request = new NextRequest(`http://localhost/api/recipes/photos/${mockPhotoId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ photoId: mockPhotoId }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Not authorized to delete photos from this recipe');
    });

    it('should allow admin users to delete any photo', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin-user', role: 'admin' },
      } as any);

      const mockDb = {
        query: {
          recipePhotos: {
            findFirst: jest.fn().mockResolvedValue({
              id: mockPhotoId,
              recipeId: mockRecipeId,
            }),
          },
          recipes: {
            findFirst: jest.fn().mockResolvedValue({
              id: mockRecipeId,
              authorId: mockUserId, // Different from session user, but user is admin
            }),
          },
        },
      };
      (db as any) = mockDb;

      // Mock the softDeletePhoto function
      const { softDeletePhoto } = require('@/lib/photo-operations');
      softDeletePhoto.mockResolvedValue({
        success: true,
        remainingPhotos: [],
      });

      const request = new NextRequest(`http://localhost/api/recipes/photos/${mockPhotoId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ photoId: mockPhotoId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deletedPhotoId).toBe(mockPhotoId);
    });
  });

  describe('GET', () => {
    it('should return 404 for non-existent photo', async () => {
      const mockDb = {
        query: {
          recipePhotos: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        },
      };
      (db as any) = mockDb;

      const request = new NextRequest(`http://localhost/api/recipes/photos/${mockPhotoId}`, {
        method: 'GET',
      });

      const response = await GET(request, { params: Promise.resolve({ photoId: mockPhotoId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Photo not found');
    });

    it('should return photo for public recipe without authentication', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockDb = {
        query: {
          recipePhotos: {
            findFirst: jest.fn().mockResolvedValue({
              id: mockPhotoId,
              recipeId: mockRecipeId,
            }),
          },
          recipes: {
            findFirst: jest.fn().mockResolvedValue({
              id: mockRecipeId,
              visibility: 'public',
              authorId: mockUserId,
            }),
          },
        },
      };
      (db as any) = mockDb;

      const request = new NextRequest(`http://localhost/api/recipes/photos/${mockPhotoId}`, {
        method: 'GET',
      });

      const response = await GET(request, { params: Promise.resolve({ photoId: mockPhotoId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.photo.id).toBe(mockPhotoId);
    });

    it('should return 403 for private recipe without proper access', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'different-user', role: 'user' },
      } as any);

      const mockDb = {
        query: {
          recipePhotos: {
            findFirst: jest.fn().mockResolvedValue({
              id: mockPhotoId,
              recipeId: mockRecipeId,
            }),
          },
          recipes: {
            findFirst: jest.fn().mockResolvedValue({
              id: mockRecipeId,
              visibility: 'private',
              authorId: mockUserId, // Different from session user
            }),
          },
        },
      };
      (db as any) = mockDb;

      const request = new NextRequest(`http://localhost/api/recipes/photos/${mockPhotoId}`, {
        method: 'GET',
      });

      const response = await GET(request, { params: Promise.resolve({ photoId: mockPhotoId }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Not authorized to view this photo');
    });
  });
});