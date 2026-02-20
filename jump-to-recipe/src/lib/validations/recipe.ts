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
  position: z.number()
    .int('Position must be an integer')
    .nonnegative('Position must be non-negative'),
});

// Instruction validation
export const instructionSchema = z.object({
  id: z.string(),
  step: z.number().int().positive('Step number must be positive'),
  content: z.string().min(1, 'Instruction content is required'),
  duration: z.number().int().positive().optional(),
  position: z.number()
    .int('Position must be an integer')
    .nonnegative('Position must be non-negative'),
});

// Extended ingredient with section reference
export const extendedIngredientSchema = ingredientSchema.extend({
  sectionId: z.string().optional(),
});

// Extended instruction with section reference
export const extendedInstructionSchema = instructionSchema.extend({
  sectionId: z.string().optional(),
});

// Section validation schemas
export const ingredientSectionSchema = z.object({
  id: z.string(),
  name: z.string().transform((val) => val.trim() || 'Untitled Section'),
  order: z.number().int().nonnegative('Order must be non-negative'),
  items: z.array(ingredientSchema),
});

export const instructionSectionSchema = z.object({
  id: z.string(),
  name: z.string().transform((val) => val.trim() || 'Untitled Section'),
  order: z.number().int().nonnegative('Order must be non-negative'),
  items: z.array(instructionSchema),
});

// Section validation error schema
export const sectionValidationErrorSchema = z.object({
  sectionId: z.string(),
  type: z.enum(['empty_name', 'empty_section', 'invalid_order']),
  message: z.string(),
});

// Base recipe validation schema
export const baseRecipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  description: z.string().nullable().optional(),
  ingredients: z.array(extendedIngredientSchema),
  instructions: z.array(extendedInstructionSchema),
  prepTime: z.number().int().positive().nullable().optional(),
  cookTime: z.number().int().positive().nullable().optional(),
  servings: z.number().int().positive().nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  authorId: z.string().nullable().optional(),
  visibility: z.enum(['public', 'private']).default('private'),
  commentsEnabled: z.boolean().default(true),
  viewCount: z.number().int().nonnegative().default(0),
  likeCount: z.number().int().nonnegative().default(0),
});

// Extended recipe validation with sections support
export const recipeWithSectionsSchema = baseRecipeSchema.extend({
  ingredientSections: z.array(ingredientSectionSchema).optional(),
  instructionSections: z.array(instructionSectionSchema).optional(),
}).refine(
  (data) => {
    // At least one ingredient must exist in either flat array or sections
    const flatIngredientCount = data.ingredients.length;
    const sectionIngredientCount = data.ingredientSections
      ?.reduce((total, section) => total + section.items.length, 0) ?? 0;
    return flatIngredientCount > 0 || sectionIngredientCount > 0;
  },
  {
    message: 'At least one ingredient is required for a recipe',
    path: ['ingredients'],
  }
).refine(
  (data) => {
    // At least one instruction must exist in either flat array or sections
    const flatInstructionCount = data.instructions.length;
    const sectionInstructionCount = data.instructionSections
      ?.reduce((total, section) => total + section.items.length, 0) ?? 0;
    return flatInstructionCount > 0 || sectionInstructionCount > 0;
  },
  {
    message: 'At least one instruction is required for a recipe',
    path: ['instructions'],
  }
);

// Main recipe schema with sections support
export const recipeSchema = recipeWithSectionsSchema;

// Schema for creating a new recipe
export const createRecipeSchema = recipeSchema;

// Schema for updating an existing recipe
// Note: We apply .partial() to baseRecipeSchema (before refinements) to avoid Zod error
export const updateRecipeSchema = baseRecipeSchema
  .extend({
    ingredientSections: z.array(ingredientSectionSchema).optional(),
    instructionSections: z.array(instructionSectionSchema).optional(),
  })
  .partial()
  .omit({ authorId: true });

// Schema for recipe search/filtering
export const recipeFilterSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  maxCookTime: z.number().int().positive().optional(),
  minCookTime: z.number().int().positive().optional(),
  maxPrepTime: z.number().int().positive().optional(),
  minPrepTime: z.number().int().positive().optional(),
  authorId: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest', 'popular', 'title', 'cookTime', 'prepTime', 'random']).default('random'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// Validation functions for sections
export interface SectionValidationResult {
  isValid: boolean;
  errors: z.ZodError['issues'];
  warnings: {
    emptySections: Array<{
      sectionId: string;
      sectionName: string;
      type: 'ingredient' | 'instruction';
    }>;
  };
}

/**
 * Validates a recipe with sections and returns validation results including warnings
 */
export function validateRecipeWithSections(data: unknown): SectionValidationResult {
  const result = recipeSchema.safeParse(data);
  const warnings = { emptySections: [] as Array<{ sectionId: string; sectionName: string; type: 'ingredient' | 'instruction' }> };

  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.issues,
      warnings,
    };
  }

  const recipe = result.data;

  // Check for empty ingredient sections
  if (recipe.ingredientSections) {
    recipe.ingredientSections.forEach((section) => {
      if (section.items.length === 0) {
        warnings.emptySections.push({
          sectionId: section.id,
          sectionName: section.name,
          type: 'ingredient',
        });
      }
    });
  }

  // Check for empty instruction sections
  if (recipe.instructionSections) {
    recipe.instructionSections.forEach((section) => {
      if (section.items.length === 0) {
        warnings.emptySections.push({
          sectionId: section.id,
          sectionName: section.name,
          type: 'instruction',
        });
      }
    });
  }

  return {
    isValid: true,
    errors: [],
    warnings,
  };
}

/**
 * Validates section names and provides fallback for empty names
 */
export function validateSectionName(name: string): string {
  const trimmedName = name.trim();
  return trimmedName.length > 0 ? trimmedName : 'Untitled Section';
}

/**
 * Validates that sections have proper order values
 */
export function validateSectionOrder(sections: Array<{ id: string; order: number }>): boolean {
  const orders = sections.map(s => s.order);
  const uniqueOrders = new Set(orders);
  
  // Check for duplicate orders
  if (orders.length !== uniqueOrders.size) {
    return false;
  }
  
  // Check for negative orders
  return orders.every(order => order >= 0);
}

/**
 * Custom validation for recipes that ensures either flat arrays or sections are used consistently
 */
export function validateRecipeStructure(data: any): { isValid: boolean; message?: string } {
  // If sections are provided, ensure they contain all items
  if (data.ingredientSections || data.instructionSections) {
    const flatIngredients = data.ingredients || [];
    const flatInstructions = data.instructions || [];
    
    // Count items in sections
    const sectionIngredientCount = (data.ingredientSections || [])
      .reduce((total: number, section: any) => total + (section.items?.length || 0), 0);
    const sectionInstructionCount = (data.instructionSections || [])
      .reduce((total: number, section: any) => total + (section.items?.length || 0), 0);
    
    // If using sections, flat arrays should either be empty or match section content
    if (data.ingredientSections && flatIngredients.length > 0 && flatIngredients.length !== sectionIngredientCount) {
      return {
        isValid: false,
        message: 'Ingredient sections and flat ingredients array are inconsistent',
      };
    }
    
    if (data.instructionSections && flatInstructions.length > 0 && flatInstructions.length !== sectionInstructionCount) {
      return {
        isValid: false,
        message: 'Instruction sections and flat instructions array are inconsistent',
      };
    }
  }
  
  return { isValid: true };
}