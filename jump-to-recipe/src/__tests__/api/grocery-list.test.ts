import { NextRequest } from 'next/server';
import { POST } from '@/app/api/grocery-list/generate/route';
import { db } from '@/db';
import { getServerSession } from 'next-auth';
import { generateGroceryList, generateGroceryListTitle } from '@/lib/grocery-list-generator';

// Mock dependencies
jest.mock('@/db');
jest.mock('next-auth');
jest.mock('@/lib/auth');
jest.mock('@/lib/grocery-list-generator');

const mockDb = db as jest.Mocked<typeof db>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockGenerateGroceryList = generateGroceryList as jest.MockedFunction<typeof generateGroceryList>;
const mockGenerateGroceryListTitle = generateGroceryListTitle as jest.MockedFunction<typeof generateGroceryListTitle>;

describe('/api/grocery-list/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/grocery-list/generate', () => {
    it('should return 401 for unauthenticated users', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/grocery-list/generate', {
        method: 'POST',
        body: JSON.stringify({ recipeIds: ['recipe1'] }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for missing recipe IDs', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/grocery-list/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Bad Request');
      expect(data.message).toBe('Recipe IDs are required');
    });

    it('should return 400 for empty recipe IDs array', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/grocery-list/generate', {
        method: 'POST',
        body: JSON.stringify({ recipeIds: [] }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Bad Request');
    });

    it('should return 404 when no recipes are found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/grocery-list/generate', {
        method: 'POST',
        body: JSON.stringify({ recipeIds: ['nonexistent'] }),
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Not Found');
      expect(data.message).toBe('No recipes found with the provided IDs');
    });

    it('should return 403 for unauthorized access to private recipes', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const mockRecipes = [
        {
          id: 'recipe1',
          title: 'Private Recipe',
          authorId: 'user2', // Different user
          visibility: 'private',
          ingredients: [],
          instructions: [],
        },
      ];

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockRecipes),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/grocery-list/generate', {
        method: 'POST',
        body: JSON.stringify({ recipeIds: ['recipe1'] }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
      expect(data.message).toBe('Access denied to some recipes');
    });

    it('should generate grocery list successfully for authorized recipes', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const mockRecipes = [
        {
          id: 'recipe1',
          title: 'Test Recipe',
          authorId: 'user1',
          visibility: 'public',
          ingredients: [
            { name: 'Flour', amount: 2, unit: 'cups' },
            { name: 'Sugar', amount: 1, unit: 'cup' },
          ],
          instructions: [{ step: 1, content: 'Mix ingredients' }],
          servings: 4,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockGroceryItems = [
        {
          id: '1',
          name: 'Flour',
          amount: 2,
          unit: 'cups',
          category: 'Baking',
          checked: false,
        },
        {
          id: '2',
          name: 'Sugar',
          amount: 1,
          unit: 'cup',
          category: 'Baking',
          checked: false,
        },
      ];

      const mockCreatedGroceryList = {
        id: 'list1',
        title: 'Grocery List for Test Recipe',
        items: mockGroceryItems,
        userId: 'user1',
        generatedFrom: ['recipe1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockRecipes),
        }),
      });

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreatedGroceryList]),
        }),
      });

      mockGenerateGroceryList.mockReturnValue(mockGroceryItems);
      mockGenerateGroceryListTitle.mockReturnValue('Grocery List for Test Recipe');

      const request = new NextRequest('http://localhost:3000/api/grocery-list/generate', {
        method: 'POST',
        body: JSON.stringify({ recipeIds: ['recipe1'] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('list1');
      expect(data.title).toBe('Grocery List for Test Recipe');
      expect(data.items).toHaveLength(2);
      expect(data.generatedFrom).toEqual(['recipe1']);
      expect(mockGenerateGroceryList).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'recipe1',
            title: 'Test Recipe',
          }),
        ]),
        undefined
      );
    });

    it('should handle serving adjustments', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const mockRecipes = [
        {
          id: 'recipe1',
          title: 'Test Recipe',
          authorId: 'user1',
          visibility: 'public',
          ingredients: [{ name: 'Flour', amount: 2, unit: 'cups' }],
          instructions: [{ step: 1, content: 'Mix ingredients' }],
          servings: 4,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const servingAdjustments = { recipe1: 8 }; // Double the servings

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockRecipes),
        }),
      });

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{
            id: 'list1',
            title: 'Test List',
            items: [],
            userId: 'user1',
            generatedFrom: ['recipe1'],
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      mockGenerateGroceryList.mockReturnValue([]);
      mockGenerateGroceryListTitle.mockReturnValue('Test List');

      const request = new NextRequest('http://localhost:3000/api/grocery-list/generate', {
        method: 'POST',
        body: JSON.stringify({
          recipeIds: ['recipe1'],
          servingAdjustments,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockGenerateGroceryList).toHaveBeenCalledWith(
        expect.any(Array),
        servingAdjustments
      );
    });

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/grocery-list/generate', {
        method: 'POST',
        body: JSON.stringify({ recipeIds: ['recipe1'] }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toBe('Failed to generate grocery list');
    });
  });
});