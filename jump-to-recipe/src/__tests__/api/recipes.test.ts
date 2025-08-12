import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/recipes/route';
import { db } from '@/db';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/db');
jest.mock('next-auth');
jest.mock('@/lib/auth');

const mockDb = db as jest.Mocked<typeof db>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/recipes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/recipes', () => {
    it('should return public recipes for unauthenticated users', async () => {
      // Mock unauthenticated session
      mockGetServerSession.mockResolvedValue(null);

      // Mock database query
      const mockRecipes = [
        {
          id: '1',
          title: 'Test Recipe',
          description: 'A test recipe',
          visibility: 'public',
          authorId: 'user1',
          createdAt: new Date(),
        },
      ];

      mockDb.query = {
        recipes: {
          findMany: jest.fn().mockResolvedValue(mockRecipes),
        },
      } as any;

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/recipes');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipes).toHaveLength(1);
      expect(data.recipes[0].title).toBe('Test Recipe');
      expect(data.pagination.total).toBe(1);
    });

    it('should return both public and private recipes for authenticated users', async () => {
      // Mock authenticated session
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const mockRecipes = [
        {
          id: '1',
          title: 'Public Recipe',
          visibility: 'public',
          authorId: 'user2',
        },
        {
          id: '2',
          title: 'Private Recipe',
          visibility: 'private',
          authorId: 'user1',
        },
      ];

      mockDb.query = {
        recipes: {
          findMany: jest.fn().mockResolvedValue(mockRecipes),
        },
      } as any;

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 2 }]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/recipes');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipes).toHaveLength(2);
    });

    it('should filter recipes by query parameter', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockRecipes = [
        {
          id: '1',
          title: 'Chocolate Cake',
          description: 'Delicious chocolate cake',
          visibility: 'public',
        },
      ];

      mockDb.query = {
        recipes: {
          findMany: jest.fn().mockResolvedValue(mockRecipes),
        },
      } as any;

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/recipes?query=chocolate');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipes).toHaveLength(1);
      expect(data.recipes[0].title).toBe('Chocolate Cake');
    });

    it('should handle pagination correctly', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockRecipes = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Recipe ${i + 1}`,
        visibility: 'public',
      }));

      mockDb.query = {
        recipes: {
          findMany: jest.fn().mockResolvedValue(mockRecipes.slice(0, 3)),
        },
      } as any;

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/recipes?page=1&limit=3');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipes).toHaveLength(3);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(3);
      expect(data.pagination.total).toBe(5);
      expect(data.pagination.totalPages).toBe(2);
      expect(data.pagination.hasNextPage).toBe(true);
      expect(data.pagination.hasPrevPage).toBe(false);
    });

    it('should return 400 for invalid query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes?page=invalid');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('POST /api/recipes', () => {
    it('should create a new recipe with valid data', async () => {
      const validRecipeData = {
        title: 'New Recipe',
        description: 'A new test recipe',
        ingredients: [
          { name: 'Flour', amount: 2, unit: 'cups' },
          { name: 'Sugar', amount: 1, unit: 'cup' },
        ],
        instructions: [
          { step: 1, content: 'Mix ingredients' },
          { step: 2, content: 'Bake for 30 minutes' },
        ],
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        difficulty: 'easy',
        tags: ['dessert', 'cake'],
        authorId: 'user1',
        visibility: 'public',
      };

      const mockCreatedRecipe = { id: '1', ...validRecipeData };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreatedRecipe]),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        body: JSON.stringify(validRecipeData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('1');
      expect(data.title).toBe('New Recipe');
    });

    it('should return 400 for invalid recipe data', async () => {
      const invalidRecipeData = {
        title: '', // Invalid: empty title
        ingredients: [], // Invalid: empty ingredients
        instructions: [], // Invalid: empty instructions
      };

      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        body: JSON.stringify(invalidRecipeData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid recipe data');
      expect(data.details).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      const validRecipeData = {
        title: 'New Recipe',
        ingredients: [{ name: 'Flour', amount: 2, unit: 'cups' }],
        instructions: [{ step: 1, content: 'Mix ingredients' }],
        authorId: 'user1',
      };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        body: JSON.stringify(validRecipeData),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to create recipe');
    });
  });
});