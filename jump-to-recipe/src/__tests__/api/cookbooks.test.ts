import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/cookbooks/route';
import { db } from '@/db';
import { getServerSession } from 'next-auth';
import { getUserAccessibleCookbooks } from '@/lib/cookbook-permissions';
import { sanitizeImageUrl } from '@/lib/image-validation';

// Mock dependencies
jest.mock('@/db');
jest.mock('next-auth');
jest.mock('@/lib/auth');
jest.mock('@/lib/cookbook-permissions');
jest.mock('@/lib/image-validation');

const mockDb = db as jest.Mocked<typeof db>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockGetUserAccessibleCookbooks = getUserAccessibleCookbooks as jest.MockedFunction<typeof getUserAccessibleCookbooks>;
const mockSanitizeImageUrl = sanitizeImageUrl as jest.MockedFunction<typeof sanitizeImageUrl>;

describe('/api/cookbooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/cookbooks', () => {
    it('should return 401 for unauthenticated users', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/cookbooks');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return cookbooks for authenticated users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const mockCookbooks = {
        owned: [
          {
            id: '1',
            title: 'My Cookbook',
            ownerId: 'user1',
            updatedAt: new Date('2023-01-01'),
          },
        ],
        collaborated: [
          {
            cookbook: {
              id: '2',
              title: 'Shared Cookbook',
              ownerId: 'user2',
              updatedAt: new Date('2023-01-02'),
            },
            permission: 'edit',
          },
        ],
        public: [
          {
            id: '3',
            title: 'Public Cookbook',
            ownerId: 'user3',
            updatedAt: new Date('2023-01-03'),
          },
        ],
      };

      mockGetUserAccessibleCookbooks.mockResolvedValue(mockCookbooks);

      const request = new NextRequest('http://localhost:3000/api/cookbooks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cookbooks).toHaveLength(3);
      expect(data.cookbooks[0].userRole).toBe('viewer'); // Most recent (public)
      expect(data.cookbooks[1].userRole).toBe('collaborator');
      expect(data.cookbooks[2].userRole).toBe('owner');
    });

    it('should handle pagination parameters', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const mockCookbooks = {
        owned: Array.from({ length: 10 }, (_, i) => ({
          id: `${i + 1}`,
          title: `Cookbook ${i + 1}`,
          ownerId: 'user1',
          updatedAt: new Date(`2023-01-${String(i + 1).padStart(2, '0')}`),
        })),
        collaborated: [],
        public: [],
      };

      mockGetUserAccessibleCookbooks.mockResolvedValue(mockCookbooks);

      const request = new NextRequest('http://localhost:3000/api/cookbooks?limit=5&offset=2');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cookbooks).toHaveLength(5);
    });

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      mockGetUserAccessibleCookbooks.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/cookbooks');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch cookbooks');
    });
  });

  describe('POST /api/cookbooks', () => {
    it('should return 401 for unauthenticated users', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/cookbooks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Cookbook' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should create a new cookbook with valid data', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const cookbookData = {
        title: 'New Cookbook',
        description: 'A test cookbook',
        coverImageUrl: 'https://example.com/image.jpg',
        isPublic: false,
      };

      const mockCreatedCookbook = {
        id: '1',
        ...cookbookData,
        ownerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSanitizeImageUrl.mockReturnValue('https://example.com/image.jpg');
      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreatedCookbook]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/cookbooks', {
        method: 'POST',
        body: JSON.stringify(cookbookData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.cookbook.id).toBe('1');
      expect(data.cookbook.title).toBe('New Cookbook');
      expect(mockSanitizeImageUrl).toHaveBeenCalledWith('https://example.com/image.jpg');
    });

    it('should create cookbook with recipes', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const cookbookData = {
        title: 'Cookbook with Recipes',
        recipes: ['recipe1', 'recipe2'],
      };

      const mockCreatedCookbook = {
        id: '1',
        title: 'Cookbook with Recipes',
        ownerId: 'user1',
      };

      mockSanitizeImageUrl.mockReturnValue(null);
      mockDb.insert = jest.fn()
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockCreatedCookbook]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockResolvedValue(undefined),
        });

      const request = new NextRequest('http://localhost:3000/api/cookbooks', {
        method: 'POST',
        body: JSON.stringify(cookbookData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.cookbook.title).toBe('Cookbook with Recipes');
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // Once for cookbook, once for recipes
    });

    it('should return 400 for invalid data', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const invalidData = {
        title: '', // Invalid: empty title
        description: 'Valid description',
      };

      const request = new NextRequest('http://localhost:3000/api/cookbooks', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid request');
      expect(data.details).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const cookbookData = {
        title: 'Test Cookbook',
      };

      mockSanitizeImageUrl.mockReturnValue(null);
      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/cookbooks', {
        method: 'POST',
        body: JSON.stringify(cookbookData),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to create cookbook');
    });
  });
});