/**
 * Tests for recipe update API endpoint with strict validation
 * 
 * Tests cover:
 * - Strict validation on update
 * - Normalization of existing recipes
 * - Backward compatibility
 * - Error response format
 * - Authorization checks
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PUT } from '../[id]/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/db');
jest.mock('@/lib/auth', () => ({
  authOptions: {},
  hasRole: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('PUT /api/recipes/[id] - Update with Strict Validation', () => {
  const mockUserId = 'user-123';
  const mockRecipeId = 'recipe-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/recipes/recipe-456', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const params = Promise.resolve({ id: mockRecipeId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 404 if recipe does not exist', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, role: 'user' },
      } as any);

      (db.query.recipes.findFirst as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/recipes/recipe-456', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const params = Promise.resolve({ id: mockRecipeId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Recipe not found');
    });

    it('should return 403 if user is not the author or admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, role: 'user' },
      } as any);

      (db.query.recipes.findFirst as jest.Mock).mockResolvedValue({
        id: mockRecipeId,
        authorId: 'different-user-id',
      });

      const request = new NextRequest('http://localhost/api/recipes/recipe-456', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const params = Promise.resolve({ id: mockRecipeId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Not authorized to update this recipe');
    });
  });

  describe('Strict Validation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, role: 'user' },
      } as any);

      (db.query.recipes.findFirst as jest.Mock).mockResolvedValue({
        id: mockRecipeId,
        authorId: mockUserId,
      });
    });

    it('should reject recipe with empty section name', async () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup', step: 1 }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: '',  // Empty name should fail
            order: 0,
            items: [
              { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
            ]
          }
        ]
      };

      const request = new NextRequest('http://localhost/api/recipes/recipe-456', {
        method: 'PUT',
        body: JSON.stringify(invalidRecipe),
      });

      const params = Promise.resolve({ id: mockRecipeId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
      expect(Array.isArray(data.details)).toBe(true);
    });

    it('should reject recipe with empty section', async () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Dry Ingredients',
            order: 0,
            items: []  // Empty section should fail
          }
        ]
      };

      const request = new NextRequest('http://localhost/api/recipes/recipe-456', {
        method: 'PUT',
        body: JSON.stringify(invalidRecipe),
      });

      const params = Promise.resolve({ id: mockRecipeId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should reject recipe with no ingredients', async () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ]
      };

      const request = new NextRequest('http://localhost/api/recipes/recipe-456', {
        method: 'PUT',
        body: JSON.stringify(invalidRecipe),
      });

      const params = Promise.resolve({ id: mockRecipeId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should reject recipe with invalid UUID format', async () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { id: 'invalid-uuid', name: 'Flour', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ]
      };

      const request = new NextRequest('http://localhost/api/recipes/recipe-456', {
        method: 'PUT',
        body: JSON.stringify(invalidRecipe),
      });

      const params = Promise.resolve({ id: mockRecipeId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should return structured error details with path and message', async () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: '', amount: 1, unit: 'cup' }  // Empty name
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ]
      };

      const request = new NextRequest('http://localhost/api/recipes/recipe-456', {
        method: 'PUT',
        body: JSON.stringify(invalidRecipe),
      });

      const params = Promise.resolve({ id: mockRecipeId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
      expect(Array.isArray(data.details)).toBe(true);
      
      if (data.details.length > 0) {
        expect(data.details[0]).toHaveProperty('path');
        expect(data.details[0]).toHaveProperty('message');
      }
    });
  });

  describe('Normalization and Backward Compatibility', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, role: 'user' },
      } as any);

      (db.query.recipes.findFirst as jest.Mock).mockResolvedValue({
        id: mockRecipeId,
        authorId: mockUserId,
      });

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: mockRecipeId,
                title: 'Test Recipe',
                updatedAt: new Date(),
              }
            ])
          })
        })
      });
    });

    it('should normalize existing recipe data on update', async () => {
      const recipeWithMissingData = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: '',  // Will be normalized to "Imported Section"
            order: 0,
            items: [
              { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
            ]
          }
        ]
      };

      const request = new NextRequest('http://localhost/api/recipes/recipe-456', {
        method: 'PUT',
        body: JSON.stringify(recipeWithMissingData),
      });

      const params = Promise.resolve({ id: mockRecipeId });
      const response = await PUT(request, { params });

      // Should succeed after normalization
      expect(response.status).toBe(200);
    });

    it('should accept valid recipe with sections', async () => {
      const validRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Dry Ingredients',
            order: 0,
            items: [
              { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
            ]
          }
        ]
      };

      const request = new NextRequest('http://localhost/api/recipes/recipe-456', {
        method: 'PUT',
        body: JSON.stringify(validRecipe),
      });

      const params = Promise.resolve({ id: mockRecipeId });
      const response = await PUT(request, { params });

      expect(response.status).toBe(200);
    });
  });

  describe('Admin Ownership Transfer', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, role: 'admin' },
      } as any);

      (db.query.recipes.findFirst as jest.Mock).mockResolvedValue({
        id: mockRecipeId,
        authorId: 'original-author-id',
      });

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: mockRecipeId,
                title: 'Test Recipe',
                authorId: 'new-author-id',
                updatedAt: new Date(),
              }
            ])
          })
        })
      });
    });

    it('should allow admin to transfer ownership with valid recipe data', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        id: 'new-author-id',
        name: 'New Author',
      });

      const validRecipe = {
        title: 'Test Recipe',
        authorId: 'new-author-id',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ]
      };

      const request = new NextRequest('http://localhost/api/recipes/recipe-456', {
        method: 'PUT',
        body: JSON.stringify(validRecipe),
      });

      const params = Promise.resolve({ id: mockRecipeId });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('ownership transferred');
    });
  });
});
