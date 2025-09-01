import { z } from 'zod';

// Schema for adding a recipe to a cookbook
export const addRecipeToCookbookSchema = z.object({
  recipeId: z.string().uuid('Recipe ID must be a valid UUID'),
});

// Schema for cookbook option response
export const cookbookOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  isChecked: z.boolean(),
  isOwned: z.boolean(),
  permission: z.enum(['edit', 'owner']),
  lastUsed: z.date().optional(),
});

// Schema for recipe cookbook status response
export const recipeCookbookStatusSchema = z.object({
  cookbooks: z.array(cookbookOptionSchema),
  totalCount: z.number(),
});

// Schema for success response
export const successResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

// Schema for error response
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});