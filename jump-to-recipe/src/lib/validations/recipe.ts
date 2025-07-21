import { z } from 'zod';
import type { Unit } from '@/types/recipe';

// Unit validation - accept any string to be more lenient
export const unitSchema = z.string().default('') as z.ZodType<Unit>;

// Ingredient validation
export const ingredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Ingredient name is required'),
  amount: z.number().nonnegative('Amount must be non-negative').default(0),
  unit: unitSchema.default(''),
  displayAmount: z.string().optional(), // Original fraction format for display
  notes: z.string().optional(),
  category: z.string().optional(),
});

// Instruction validation
export const instructionSchema = z.object({
  id: z.string(),
  step: z.number().int().positive('Step number must be positive'),
  content: z.string().min(1, 'Instruction content is required'),
  duration: z.number().int().positive().optional(),
});

// Recipe validation
export const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  description: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required'),
  instructions: z.array(instructionSchema).min(1, 'At least one instruction is required'),
  prepTime: z.number().int().positive().optional(),
  cookTime: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  sourceUrl: z.string().optional().or(z.literal('')),
  authorId: z.string(),
  visibility: z.enum(['public', 'private']).default('private'),
});

// Schema for creating a new recipe
export const createRecipeSchema = recipeSchema;

// Schema for updating an existing recipe
export const updateRecipeSchema = recipeSchema.partial().omit({ authorId: true });

// Schema for recipe search/filtering
export const recipeFilterSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  maxCookTime: z.number().int().positive().optional(),
  authorId: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});