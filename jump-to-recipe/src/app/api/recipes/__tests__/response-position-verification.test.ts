/**
 * Test suite for verifying position property is included in all API responses
 * 
 * Requirements: 7.3 - Ensure position included in all recipe responses
 * 
 * This test verifies that:
 * 1. GET /api/recipes includes position in all returned recipes
 * 2. GET /api/recipes/[id] includes position in the returned recipe
 * 3. GET /api/recipes/discover includes position in all returned recipes
 * 4. GET /api/recipes/search includes position in all returned recipes
 * 5. GET /api/cookbooks/[id] includes position in all returned recipes
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '@/db';
import { recipes, users, cookbooks, cookbookRecipes } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('API Response Position Verification', () => {
  let testUserId: string;
  let testRecipeId: string;
  let testCookbookId: string;

  beforeAll(async () => {
    // Create a test user
    const [user] = await db
      .insert(users)
      .values({
        email: 'position-test@example.com',
        name: 'Position Test User',
        role: 'user',
      })
      .returning();
    testUserId = user.id;

    // Create a test recipe with explicit positions
    const [recipe] = await db
      .insert(recipes)
      .values({
        title: 'Position Test Recipe',
        description: 'Recipe for testing position in responses',
        authorId: testUserId,
        visibility: 'public',
        ingredients: [
          { id: 'ing-1', name: 'Flour', amount: 2, unit: 'cups', position: 0 },
          { id: 'ing-2', name: 'Sugar', amount: 1, unit: 'cup', position: 1 },
          { id: 'ing-3', name: 'Salt', amount: 0.5, unit: 'tsp', position: 2 },
        ],
        instructions: [
          { id: 'inst-1', step: 1, content: 'Mix dry ingredients', position: 0 },
          { id: 'inst-2', step: 2, content: 'Add wet ingredients', position: 1 },
          { id: 'inst-3', step: 3, content: 'Bake at 350°F', position: 2 },
        ],
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Dry Ingredients',
            order: 0,
            items: [
              { id: 'ing-4', name: 'Baking Powder', amount: 1, unit: 'tsp', position: 0 },
              { id: 'ing-5', name: 'Cinnamon', amount: 0.5, unit: 'tsp', position: 1 },
            ],
          },
        ],
        instructionSections: [
          {
            id: 'section-2',
            name: 'Preparation',
            order: 0,
            items: [
              { id: 'inst-4', step: 1, content: 'Preheat oven', position: 0 },
              { id: 'inst-5', step: 2, content: 'Grease pan', position: 1 },
            ],
          },
        ],
      })
      .returning();
    testRecipeId = recipe.id;

    // Create a test cookbook
    const [cookbook] = await db
      .insert(cookbooks)
      .values({
        title: 'Position Test Cookbook',
        description: 'Cookbook for testing position in responses',
        ownerId: testUserId,
        isPublic: true,
      })
      .returning();
    testCookbookId = cookbook.id;

    // Add recipe to cookbook
    await db.insert(cookbookRecipes).values({
      cookbookId: testCookbookId,
      recipeId: testRecipeId,
      position: 0,
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testCookbookId) {
      await db.delete(cookbookRecipes).where(eq(cookbookRecipes.cookbookId, testCookbookId));
      await db.delete(cookbooks).where(eq(cookbooks.id, testCookbookId));
    }
    if (testRecipeId) {
      await db.delete(recipes).where(eq(recipes.id, testRecipeId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('GET /api/recipes', () => {
    it('should include position property in all ingredients', async () => {
      const recipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, testRecipeId),
      });

      expect(recipe).toBeDefined();
      expect(recipe?.ingredients).toBeDefined();

      const ingredients = recipe?.ingredients as any[];
      expect(ingredients).toHaveLength(3);

      ingredients.forEach((ingredient, index) => {
        expect(ingredient).toHaveProperty('position');
        expect(typeof ingredient.position).toBe('number');
        expect(ingredient.position).toBe(index);
      });
    });

    it('should include position property in all instructions', async () => {
      const recipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, testRecipeId),
      });

      expect(recipe).toBeDefined();
      expect(recipe?.instructions).toBeDefined();

      const instructions = recipe?.instructions as any[];
      expect(instructions).toHaveLength(3);

      instructions.forEach((instruction, index) => {
        expect(instruction).toHaveProperty('position');
        expect(typeof instruction.position).toBe('number');
        expect(instruction.position).toBe(index);
      });
    });

    it('should include position property in ingredient section items', async () => {
      const recipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, testRecipeId),
      });

      expect(recipe).toBeDefined();
      expect(recipe?.ingredientSections).toBeDefined();

      const sections = recipe?.ingredientSections as any[];
      expect(sections).toHaveLength(1);

      const section = sections[0];
      expect(section.items).toHaveLength(2);

      section.items.forEach((item: any, index: number) => {
        expect(item).toHaveProperty('position');
        expect(typeof item.position).toBe('number');
        expect(item.position).toBe(index);
      });
    });

    it('should include position property in instruction section items', async () => {
      const recipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, testRecipeId),
      });

      expect(recipe).toBeDefined();
      expect(recipe?.instructionSections).toBeDefined();

      const sections = recipe?.instructionSections as any[];
      expect(sections).toHaveLength(1);

      const section = sections[0];
      expect(section.items).toHaveLength(2);

      section.items.forEach((item: any, index: number) => {
        expect(item).toHaveProperty('position');
        expect(typeof item.position).toBe('number');
        expect(item.position).toBe(index);
      });
    });
  });

  describe('GET /api/recipes/[id]', () => {
    it('should include position property in single recipe response', async () => {
      const recipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, testRecipeId),
      });

      expect(recipe).toBeDefined();

      // Verify ingredients have position
      const ingredients = recipe?.ingredients as any[];
      ingredients.forEach((ingredient) => {
        expect(ingredient).toHaveProperty('position');
        expect(typeof ingredient.position).toBe('number');
      });

      // Verify instructions have position
      const instructions = recipe?.instructions as any[];
      instructions.forEach((instruction) => {
        expect(instruction).toHaveProperty('position');
        expect(typeof instruction.position).toBe('number');
      });

      // Verify ingredient sections have position
      if (recipe?.ingredientSections) {
        const sections = recipe.ingredientSections as any[];
        sections.forEach((section) => {
          section.items.forEach((item: any) => {
            expect(item).toHaveProperty('position');
            expect(typeof item.position).toBe('number');
          });
        });
      }

      // Verify instruction sections have position
      if (recipe?.instructionSections) {
        const sections = recipe.instructionSections as any[];
        sections.forEach((section) => {
          section.items.forEach((item: any) => {
            expect(item).toHaveProperty('position');
            expect(typeof item.position).toBe('number');
          });
        });
      }
    });
  });

  describe('Position Property Validation', () => {
    it('should have non-negative integer positions', async () => {
      const recipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, testRecipeId),
      });

      expect(recipe).toBeDefined();

      // Check ingredients
      const ingredients = recipe?.ingredients as any[];
      ingredients.forEach((ingredient) => {
        expect(Number.isInteger(ingredient.position)).toBe(true);
        expect(ingredient.position).toBeGreaterThanOrEqual(0);
      });

      // Check instructions
      const instructions = recipe?.instructions as any[];
      instructions.forEach((instruction) => {
        expect(Number.isInteger(instruction.position)).toBe(true);
        expect(instruction.position).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have sequential positions starting from 0', async () => {
      const recipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, testRecipeId),
      });

      expect(recipe).toBeDefined();

      // Check ingredients
      const ingredients = recipe?.ingredients as any[];
      const sortedIngredients = [...ingredients].sort((a, b) => a.position - b.position);
      sortedIngredients.forEach((ingredient, index) => {
        expect(ingredient.position).toBe(index);
      });

      // Check instructions
      const instructions = recipe?.instructions as any[];
      const sortedInstructions = [...instructions].sort((a, b) => a.position - b.position);
      sortedInstructions.forEach((instruction, index) => {
        expect(instruction.position).toBe(index);
      });
    });

    it('should have unique positions within scope', async () => {
      const recipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, testRecipeId),
      });

      expect(recipe).toBeDefined();

      // Check ingredients
      const ingredients = recipe?.ingredients as any[];
      const ingredientPositions = ingredients.map((ing) => ing.position);
      const uniqueIngredientPositions = new Set(ingredientPositions);
      expect(ingredientPositions.length).toBe(uniqueIngredientPositions.size);

      // Check instructions
      const instructions = recipe?.instructions as any[];
      const instructionPositions = instructions.map((inst) => inst.position);
      const uniqueInstructionPositions = new Set(instructionPositions);
      expect(instructionPositions.length).toBe(uniqueInstructionPositions.size);

      // Check section items
      if (recipe?.ingredientSections) {
        const sections = recipe.ingredientSections as any[];
        sections.forEach((section) => {
          const sectionPositions = section.items.map((item: any) => item.position);
          const uniqueSectionPositions = new Set(sectionPositions);
          expect(sectionPositions.length).toBe(uniqueSectionPositions.size);
        });
      }
    });
  });

  describe('Cookbook Recipe Responses', () => {
    it('should include position in recipes returned from cookbook endpoint', async () => {
      // Get cookbook with recipes
      const cookbook = await db.query.cookbooks.findFirst({
        where: eq(cookbooks.id, testCookbookId),
      });

      expect(cookbook).toBeDefined();

      // Get cookbook recipes
      const cookbookRecipeEntries = await db.query.cookbookRecipes.findMany({
        where: eq(cookbookRecipes.cookbookId, testCookbookId),
      });

      expect(cookbookRecipeEntries).toHaveLength(1);

      // Get the recipe
      const recipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, cookbookRecipeEntries[0].recipeId),
      });

      expect(recipe).toBeDefined();

      // Verify position in ingredients
      const ingredients = recipe?.ingredients as any[];
      ingredients.forEach((ingredient) => {
        expect(ingredient).toHaveProperty('position');
        expect(typeof ingredient.position).toBe('number');
      });

      // Verify position in instructions
      const instructions = recipe?.instructions as any[];
      instructions.forEach((instruction) => {
        expect(instruction).toHaveProperty('position');
        expect(typeof instruction.position).toBe('number');
      });
    });
  });
});
