import { NextRequest } from 'next/server';
import { PATCH } from '../reorder/route';
import { getServerSession } from 'next-auth';
import { db } from '@/db';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/db');
jest.mock('@/lib/photo-operations');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/recipes/[id]/photos/reorder', () => {
  const mockRecipeId = 'recipe-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH', () => {
    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/recipes/recipe-123/photos/reorder', {
        method: 'PATCH',
        body: JSON.stringify({
          photoOrders: [
            { id: 'photo1', position: 0 },
            { id: 'photo2', position: 1 },
          ],
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: mockRecipeId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 404 for non-existent recipe', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, role: 'user' },
      } as any);

      // Mock db.query.recipes.findFirst to return null
      const mockDb = {
        query: {
          recipes: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        },
      };
      (db as any) = mockDb;

      const request = new NextRequest('http://localhost/api/recipes/recipe-123/photos/reorder', {
        method: 'PATCH',
        body: JSON.stringify({
          photoOrders: [
            { id: 'photo1', position: 0 },
          ],
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: mockRecipeId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Recipe not found');
    });

    it('should return 403 for unauthorized user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'different-user', role: 'user' },
      } as any);

      // Mock db.query.recipes.findFirst to return a recipe owned by different user
      const mockDb = {
        query: {
          recipes: {
            findFirst: jest.fn().mockResolvedValue({
              id: mockRecipeId,
              authorId: mockUserId,
            }),
          },
        },
      };
      (db as any) = mockDb;

      const request = new NextRequest('http://localhost/api/recipes/recipe-123/photos/reorder', {
        method: 'PATCH',
        body: JSON.stringify({
          photoOrders: [
            { id: 'photo1', position: 0 },
          ],
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: mockRecipeId }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Not authorized to edit this recipe');
    });

    it('should validate request body schema', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, role: 'user' },
      } as any);

      // Mock db.query.recipes.findFirst to return a recipe owned by user
      const mockDb = {
        query: {
          recipes: {
            findFirst: jest.fn().mockResolvedValue({
              id: mockRecipeId,
              authorId: mockUserId,
            }),
          },
        },
      };
      (db as any) = mockDb;

      const request = new NextRequest('http://localhost/api/recipes/recipe-123/photos/reorder', {
        method: 'PATCH',
        body: JSON.stringify({
          photoOrders: [
            { id: 'invalid-uuid', position: 0 }, // Invalid UUID format
          ],
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: mockRecipeId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('should handle empty photoOrders array', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, role: 'user' },
      } as any);

      const mockDb = {
        query: {
          recipes: {
            findFirst: jest.fn().mockResolvedValue({
              id: mockRecipeId,
              authorId: mockUserId,
            }),
          },
        },
      };
      (db as any) = mockDb;

      const request = new NextRequest('http://localhost/api/recipes/recipe-123/photos/reorder', {
        method: 'PATCH',
        body: JSON.stringify({
          photoOrders: [],
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: mockRecipeId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should handle malformed JSON', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, role: 'user' },
      } as any);

      const request = new NextRequest('http://localhost/api/recipes/recipe-123/photos/reorder', {
        method: 'PATCH',
        body: 'invalid json',
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: mockRecipeId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});