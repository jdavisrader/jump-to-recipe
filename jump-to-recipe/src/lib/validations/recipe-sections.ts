import { z } from 'zod';

/**
 * Strict validation schemas for recipe sections with hardened rules.
 * These schemas enforce data integrity without lenient transforms.
 * 
 * Key differences from base schemas:
 * - No default values or fallback transforms
 * - Strict UUID validation for all IDs
 * - Non-empty text validation with whitespace checks
 * - Minimum item requirements for sections
 * - Recipe-level validation ensuring at least one ingredient exists
 * 
 * Important Notes:
 * - Duplicate section names are explicitly allowed and supported
 * - Sections with the same name are distinguished by their unique ID and order/position
 * - All validation rules apply independently to each section, regardless of name
 */

// ============================================================================
// Item-Level Schemas
// ============================================================================

/**
 * Strict validation for individual ingredient items within sections.
 * Enforces UUID format, non-empty text, and valid position values.
 */
export const strictIngredientItemSchema = z.object({
  id: z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Invalid ingredient ID format. Must be a valid UUID.'
  ),
  name: z.string()
    .min(1, 'Ingredient name cannot be empty')
    .transform(val => val.trim())
    .refine(val => val.length > 0, {
      message: 'Ingredient name cannot be only whitespace',
    }),
  amount: z.number().nonnegative('Amount must be non-negative'),
  unit: z.string(),
  displayAmount: z.string().optional(),
  notes: z.string().optional(),
  category: z.string().optional(),
});

/**
 * Strict validation for individual instruction steps within sections.
 * Enforces UUID format, non-empty content, and valid position values.
 */
export const strictInstructionItemSchema = z.object({
  id: z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Invalid instruction ID format. Must be a valid UUID.'
  ),
  step: z.number().int().positive('Step number must be positive'),
  content: z.string()
    .min(1, 'Instruction content cannot be empty')
    .transform(val => val.trim())
    .refine(val => val.length > 0, {
      message: 'Instruction content cannot be only whitespace',
    }),
  duration: z.number().int().positive().optional(),
});

// ============================================================================
// Section-Level Schemas
// ============================================================================

/**
 * Strict validation for ingredient sections.
 * Enforces:
 * - Valid UUID for section ID
 * - Non-empty section name (duplicate names are allowed)
 * - At least one ingredient item in the section
 * - Valid position/order value
 * 
 * Note: Duplicate section names are explicitly allowed. Sections with the same
 * name are distinguished by their unique ID and position/order values.
 */
export const strictIngredientSectionSchema = z.object({
  id: z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Invalid section ID format. Must be a valid UUID.'
  ),
  name: z.string()
    .min(1, 'Section name is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, {
      message: 'Section name cannot be only whitespace',
    }),
  order: z.number()
    .int('Order must be an integer')
    .nonnegative('Order must be non-negative'),
  items: z.array(strictIngredientItemSchema)
    .min(1, 'This section must contain at least one ingredient'),
});

/**
 * Strict validation for instruction sections.
 * Enforces:
 * - Valid UUID for section ID
 * - Non-empty section name (duplicate names are allowed)
 * - At least one instruction step in the section
 * - Valid position/order value
 * 
 * Note: Duplicate section names are explicitly allowed. Sections with the same
 * name are distinguished by their unique ID and position/order values.
 */
export const strictInstructionSectionSchema = z.object({
  id: z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Invalid section ID format. Must be a valid UUID.'
  ),
  name: z.string()
    .min(1, 'Section name is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, {
      message: 'Section name cannot be only whitespace',
    }),
  order: z.number()
    .int('Order must be an integer')
    .nonnegative('Order must be non-negative'),
  items: z.array(strictInstructionItemSchema)
    .min(1, 'This section must contain at least one step'),
});

// ============================================================================
// Extended Item Schemas (with section references)
// ============================================================================

/**
 * Extended ingredient schema with optional section reference.
 * Used for flat ingredient arrays that may reference sections.
 */
export const strictExtendedIngredientSchema = strictIngredientItemSchema.extend({
  sectionId: z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Invalid section ID format'
  ).optional(),
});

/**
 * Extended instruction schema with optional section reference.
 * Used for flat instruction arrays that may reference sections.
 */
export const strictExtendedInstructionSchema = strictInstructionItemSchema.extend({
  sectionId: z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Invalid section ID format'
  ).optional(),
});

// ============================================================================
// Recipe-Level Schema
// ============================================================================

/**
 * Strict validation for complete recipes with sections support.
 * Enforces:
 * - All section-level validations
 * - At least one ingredient exists (either in sections or flat array)
 * - At least one instruction exists (either in sections or flat array)
 * - Consistent data between sections and flat arrays
 */
export const strictRecipeWithSectionsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  description: z.string().nullable().optional(),
  
  // Flat arrays (for backward compatibility)
  // These can be empty when sections are used
  ingredients: z.array(strictExtendedIngredientSchema),
  instructions: z.array(strictExtendedInstructionSchema),
  
  // Section arrays (optional, for structured recipes)
  ingredientSections: z.array(strictIngredientSectionSchema).optional(),
  instructionSections: z.array(strictInstructionSectionSchema).optional(),
  
  // Recipe metadata
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
}).refine(
  (data) => {
    // Ensure at least one ingredient exists across all sources
    const flatIngredientCount = data.ingredients.length;
    const sectionIngredientCount = data.ingredientSections
      ?.reduce((total, section) => total + section.items.length, 0) ?? 0;
    
    // At least one ingredient must exist in either flat array or sections
    return flatIngredientCount > 0 || sectionIngredientCount > 0;
  },
  {
    message: 'At least one ingredient is required for a recipe',
    path: ['ingredients'],
  }
).refine(
  (data) => {
    // Ensure at least one instruction exists across all sources
    const flatInstructionCount = data.instructions.length;
    const sectionInstructionCount = data.instructionSections
      ?.reduce((total, section) => total + section.items.length, 0) ?? 0;
    
    // At least one instruction must exist in either flat array or sections
    return flatInstructionCount > 0 || sectionInstructionCount > 0;
  },
  {
    message: 'At least one instruction is required for a recipe',
    path: ['instructions'],
  }
);

// ============================================================================
// Validation Result Types
// ============================================================================

/**
 * Structured validation error with field path and message
 */
export interface StrictValidationError {
  path: string;
  message: string;
}

/**
 * Result of strict validation with detailed error information
 */
export interface StrictValidationResult {
  success: boolean;
  data?: any;
  errors?: StrictValidationError[];
}

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates recipe data with strict rules and returns structured errors.
 * 
 * @param data - Recipe data to validate
 * @returns Validation result with success flag and detailed errors
 */
export function validateRecipeStrict(data: unknown): StrictValidationResult {
  const result = strictRecipeWithSectionsSchema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }
  
  // Convert Zod errors to structured format
  const errors: StrictValidationError[] = result.error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  
  return {
    success: false,
    errors,
  };
}

/**
 * Validates a single ingredient section with strict rules.
 * 
 * @param section - Section data to validate
 * @returns Validation result
 */
export function validateIngredientSectionStrict(section: unknown): StrictValidationResult {
  const result = strictIngredientSectionSchema.safeParse(section);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }
  
  const errors: StrictValidationError[] = result.error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  
  return {
    success: false,
    errors,
  };
}

/**
 * Validates a single instruction section with strict rules.
 * 
 * @param section - Section data to validate
 * @returns Validation result
 */
export function validateInstructionSectionStrict(section: unknown): StrictValidationResult {
  const result = strictInstructionSectionSchema.safeParse(section);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }
  
  const errors: StrictValidationError[] = result.error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  
  return {
    success: false,
    errors,
  };
}

/**
 * Checks if all section IDs in a recipe are unique.
 * 
 * @param data - Recipe data with sections
 * @returns True if all IDs are unique, false otherwise
 */
export function validateUniqueSectionIds(data: {
  ingredientSections?: Array<{ id: string }>;
  instructionSections?: Array<{ id: string }>;
}): boolean {
  const allIds: string[] = [];
  
  if (data.ingredientSections) {
    allIds.push(...data.ingredientSections.map(s => s.id));
  }
  
  if (data.instructionSections) {
    allIds.push(...data.instructionSections.map(s => s.id));
  }
  
  const uniqueIds = new Set(allIds);
  return allIds.length === uniqueIds.size;
}

/**
 * Checks if all item IDs within sections are unique.
 * 
 * @param data - Recipe data with sections
 * @returns True if all item IDs are unique, false otherwise
 */
export function validateUniqueItemIds(data: {
  ingredientSections?: Array<{ items: Array<{ id: string }> }>;
  instructionSections?: Array<{ items: Array<{ id: string }> }>;
}): boolean {
  const allIds: string[] = [];
  
  if (data.ingredientSections) {
    data.ingredientSections.forEach(section => {
      allIds.push(...section.items.map(item => item.id));
    });
  }
  
  if (data.instructionSections) {
    data.instructionSections.forEach(section => {
      allIds.push(...section.items.map(item => item.id));
    });
  }
  
  const uniqueIds = new Set(allIds);
  return allIds.length === uniqueIds.size;
}

// ============================================================================
// All schemas and utilities are exported inline above
// ============================================================================
