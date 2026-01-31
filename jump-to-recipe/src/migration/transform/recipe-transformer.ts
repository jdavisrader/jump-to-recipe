/**
 * Recipe Transformer Module
 * 
 * Transforms legacy recipe data into the new schema format.
 * Handles field mapping, time conversion, UUID generation, and default values.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  LegacyRecipe,
  LegacyIngredient,
  LegacyInstruction,
  LegacyTag,
  LegacyRecipeTag,
  LegacyActiveStorageAttachment,
  LegacyActiveStorageBlob,
} from '../types/extraction';
import type { UserMapping, TransformError } from '../types/transformation';
import type { Ingredient, Instruction } from '../../types/recipe';
import { parseIngredients as parseIngredientsImpl } from './ingredient-parser';
import { cleanInstructions as cleanInstructionsImpl } from './instruction-cleaner';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Transformed recipe ready for validation and import
 */
export interface TransformedRecipe {
  id: string; // Generated UUID
  title: string; // From name
  description: string | null;
  ingredients: Ingredient[]; // Parsed and structured
  instructions: Instruction[]; // Cleaned
  ingredientSections: undefined; // Legacy doesn't have sections
  instructionSections: undefined;
  prepTime: number | null; // Converted to minutes
  cookTime: number | null; // Converted to minutes
  servings: number | null;
  difficulty: null; // Not in legacy
  tags: string[]; // From recipe_tags join
  notes: null;
  imageUrl: string | null; // Will be set during import after download
  originalRecipePhotoUrls: string[]; // Will be set during import after download
  sourceUrl: string | null; // From original_url
  authorId: string; // Mapped from user_id
  visibility: 'public'; // Default for migrated recipes
  commentsEnabled: true;
  viewCount: 0;
  likeCount: 0;
  createdAt: Date;
  updatedAt: Date;
  legacyId: number; // For tracking
  // Image metadata for download during import
  _imageMetadata?: RecipeImages;
}

/**
 * Parsed ingredient with parse status
 */
export interface ParsedIngredient extends Ingredient {
  parseSuccess: boolean;
  originalText: string;
}

/**
 * Cleaned instruction with original HTML
 */
export interface CleanedInstruction extends Instruction {
  originalHtml?: string;
}

/**
 * Recipe image information
 */
export interface RecipeImages {
  headerImage: { blobKey: string; filename: string } | null;
  originalPhotos: Array<{ blobKey: string; filename: string }>;
}

/**
 * Transformation statistics
 */
export interface TransformationStats {
  total: number;
  successful: number;
  failed: number;
  ingredientsParsed: number;
  ingredientsUnparsed: number;
  instructionsCleaned: number;
  instructionsEmpty: number;
  timeConversions: number;
  userMappings: number;
  unmappedUsers: number;
  imagesFound: number;
  originalPhotosFound: number;
}

/**
 * Unparseable item for manual review
 */
export interface UnparseableItem {
  recipeId: number;
  recipeTitle: string;
  type: 'ingredient' | 'instruction';
  originalText: string;
  reason: string;
}

/**
 * Recipe transformation result
 */
export interface RecipeTransformationResult {
  recipes: TransformedRecipe[];
  errors: TransformError[];
  unparseableItems: UnparseableItem[];
  stats: TransformationStats;
}

// ============================================================================
// Core Transformation Function
// ============================================================================

/**
 * Transform legacy recipes with all related data into new schema format
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */
export async function transformRecipes(
  legacyRecipes: LegacyRecipe[],
  ingredients: LegacyIngredient[],
  instructions: LegacyInstruction[],
  tags: LegacyTag[],
  recipeTags: LegacyRecipeTag[],
  userMapping: UserMapping[],
  activeStorageAttachments: LegacyActiveStorageAttachment[] = [],
  activeStorageBlobs: LegacyActiveStorageBlob[] = []
): Promise<RecipeTransformationResult> {
  console.log('\n=== Starting Recipe Transformation ===\n');

  const transformedRecipes: TransformedRecipe[] = [];
  const errors: TransformError[] = [];
  const unparseableItems: UnparseableItem[] = [];

  const stats: TransformationStats = {
    total: legacyRecipes.length,
    successful: 0,
    failed: 0,
    ingredientsParsed: 0,
    ingredientsUnparsed: 0,
    instructionsCleaned: 0,
    instructionsEmpty: 0,
    timeConversions: 0,
    userMappings: 0,
    unmappedUsers: 0,
    imagesFound: 0,
    originalPhotosFound: 0,
  };

  // Create lookup maps for efficient access
  const ingredientsByRecipe = groupIngredientsByRecipe(ingredients);
  const instructionsByRecipe = groupInstructionsByRecipe(instructions);
  const tagsByRecipe = buildTagsByRecipeMap(recipeTags, tags);
  const userMappingLookup = buildUserMappingLookup(userMapping);
  const imagesByRecipe = buildImagesByRecipeMap(activeStorageAttachments, activeStorageBlobs, stats);

  // Transform each recipe
  for (const legacyRecipe of legacyRecipes) {
    try {
      const recipeIngredients = ingredientsByRecipe.get(legacyRecipe.id) || [];
      const recipeInstructions = instructionsByRecipe.get(legacyRecipe.id) || [];
      const recipeTags = tagsByRecipe.get(legacyRecipe.id) || [];
      const recipeImages = imagesByRecipe.get(legacyRecipe.id) || { headerImage: null, originalPhotos: [] };

      const transformed = await transformSingleRecipe(
        legacyRecipe,
        recipeIngredients,
        recipeInstructions,
        recipeTags,
        recipeImages,
        userMappingLookup,
        stats,
        unparseableItems
      );

      transformedRecipes.push(transformed);
      stats.successful++;

      if (stats.successful % 100 === 0) {
        console.log(`Transformed ${stats.successful}/${stats.total} recipes...`);
      }
    } catch (error) {
      stats.failed++;
      errors.push({
        phase: 'recipe',
        recordId: legacyRecipe.id,
        error: error instanceof Error ? error.message : String(error),
        originalData: legacyRecipe,
      });
      console.error(`✗ Failed to transform recipe ${legacyRecipe.id}: ${error}`);
    }
  }

  console.log('\n=== Transformation Complete ===');
  console.log(`Total: ${stats.total}`);
  console.log(`Successful: ${stats.successful}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Ingredients parsed: ${stats.ingredientsParsed}`);
  console.log(`Ingredients unparsed: ${stats.ingredientsUnparsed}`);
  console.log(`Instructions cleaned: ${stats.instructionsCleaned}`);
  console.log(`Empty instructions: ${stats.instructionsEmpty}`);
  console.log(`User mappings: ${stats.userMappings}`);
  console.log(`Unmapped users: ${stats.unmappedUsers}`);
  console.log(`Images found: ${stats.imagesFound}`);
  console.log(`Original photos found: ${stats.originalPhotosFound}`);
  console.log('===============================\n');

  return {
    recipes: transformedRecipes,
    errors,
    unparseableItems,
    stats,
  };
}

/**
 * Transform a single recipe with all its related data
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.8, 2.9
 */
async function transformSingleRecipe(
  legacyRecipe: LegacyRecipe,
  ingredients: LegacyIngredient[],
  instructions: LegacyInstruction[],
  tags: string[],
  images: RecipeImages,
  userMapping: Map<number, string>,
  stats: TransformationStats,
  unparseableItems: UnparseableItem[]
): Promise<TransformedRecipe> {
  // Generate UUID for recipe (Requirement 2.8)
  const recipeId = uuidv4();

  // Map name → title (Requirement 2.1)
  const title = legacyRecipe.name.trim();

  // Convert time fields to integer minutes (Requirements 2.2, 2.3)
  const prepTime = convertTimeToMinutes(
    legacyRecipe.prep_time,
    legacyRecipe.prep_time_descriptor
  );
  const cookTime = convertTimeToMinutes(
    legacyRecipe.cook_time,
    legacyRecipe.cook_time_descriptor
  );
  if (prepTime !== null || cookTime !== null) {
    stats.timeConversions++;
  }

  // Parse ingredients (handled in sub-task 5.2)
  const parsedIngredients = await parseIngredients(
    ingredients,
    legacyRecipe.id,
    legacyRecipe.name,
    stats,
    unparseableItems
  );

  // Clean instructions (handled in sub-task 5.3)
  const cleanedInstructions = await cleanInstructions(
    instructions,
    legacyRecipe.id,
    legacyRecipe.name,
    stats,
    unparseableItems
  );

  // Map user_id to new UUID (handled in sub-task 5.5)
  const authorId = mapUserId(legacyRecipe.user_id, userMapping, stats);

  // Set default values for new fields (Requirement 2.9)
  const transformed: TransformedRecipe = {
    id: recipeId,
    title,
    description: legacyRecipe.description,
    ingredients: parsedIngredients,
    instructions: cleanedInstructions,
    ingredientSections: undefined, // Legacy doesn't have sections
    instructionSections: undefined,
    prepTime,
    cookTime,
    servings: legacyRecipe.servings,
    difficulty: null, // Not in legacy
    tags,
    notes: null,
    imageUrl: null, // Will be set during import after download
    originalRecipePhotoUrls: [], // Will be set during import after download
    sourceUrl: legacyRecipe.original_url,
    authorId,
    visibility: 'public', // Default for migrated recipes
    commentsEnabled: true,
    viewCount: 0,
    likeCount: 0,
    createdAt: new Date(legacyRecipe.created_at),
    updatedAt: new Date(legacyRecipe.updated_at),
    legacyId: legacyRecipe.id,
    // Store image metadata for download during import
    _imageMetadata: images,
  };

  return transformed;
}

// ============================================================================
// Time Conversion (Requirements 2.2, 2.3)
// ============================================================================

/**
 * Convert legacy time format to integer minutes
 * 
 * Requirements: 2.2, 2.3
 * 
 * @param time - Time value (float)
 * @param descriptor - Time unit ('minutes', 'hours', or null)
 * @returns Time in minutes (integer) or null
 */
export function convertTimeToMinutes(
  time: number | null,
  descriptor: string | null
): number | null {
  if (time === null || time === 0) {
    return null;
  }

  // If descriptor is 'hours', multiply by 60
  if (descriptor === 'hours' || descriptor === 'hour') {
    return Math.round(time * 60);
  }

  // If descriptor is 'minutes' or null, use as-is
  // Round to nearest integer
  return Math.round(time);
}

// ============================================================================
// Helper Functions for Data Grouping
// ============================================================================

/**
 * Group ingredients by recipe_id for efficient lookup
 * Requirement 2.4
 */
function groupIngredientsByRecipe(
  ingredients: LegacyIngredient[]
): Map<number, LegacyIngredient[]> {
  const grouped = new Map<number, LegacyIngredient[]>();

  for (const ingredient of ingredients) {
    const existing = grouped.get(ingredient.recipe_id) || [];
    existing.push(ingredient);
    grouped.set(ingredient.recipe_id, existing);
  }

  // Sort each group by order_number
  for (const [recipeId, items] of grouped.entries()) {
    items.sort((a, b) => a.order_number - b.order_number);
  }

  return grouped;
}

/**
 * Group instructions by recipe_id for efficient lookup
 * Requirement 2.5
 */
function groupInstructionsByRecipe(
  instructions: LegacyInstruction[]
): Map<number, LegacyInstruction[]> {
  const grouped = new Map<number, LegacyInstruction[]>();

  for (const instruction of instructions) {
    const existing = grouped.get(instruction.recipe_id) || [];
    existing.push(instruction);
    grouped.set(instruction.recipe_id, existing);
  }

  // Sort each group by step_number
  for (const [recipeId, items] of grouped.entries()) {
    items.sort((a, b) => a.step_number - b.step_number);
  }

  return grouped;
}

/**
 * Build tags by recipe map
 * Requirement 2.6
 */
function buildTagsByRecipeMap(
  recipeTags: LegacyRecipeTag[],
  tags: LegacyTag[]
): Map<number, string[]> {
  const tagLookup = new Map<number, string>();
  for (const tag of tags) {
    tagLookup.set(tag.id, tag.name);
  }

  const tagsByRecipe = new Map<number, string[]>();
  for (const recipeTag of recipeTags) {
    const tagName = tagLookup.get(recipeTag.tag_id);
    if (tagName) {
      const existing = tagsByRecipe.get(recipeTag.recipe_id) || [];
      existing.push(tagName);
      tagsByRecipe.set(recipeTag.recipe_id, existing);
    }
  }

  return tagsByRecipe;
}

/**
 * Build user mapping lookup
 * Requirement 2.7
 */
function buildUserMappingLookup(userMapping: UserMapping[]): Map<number, string> {
  const lookup = new Map<number, string>();
  for (const mapping of userMapping) {
    lookup.set(mapping.legacyId, mapping.newUuid);
  }
  return lookup;
}

/**
 * Build images by recipe map from Active Storage attachments and blobs
 * Stores blob keys and filenames for download during import
 */
function buildImagesByRecipeMap(
  attachments: LegacyActiveStorageAttachment[],
  blobs: LegacyActiveStorageBlob[],
  stats: TransformationStats
): Map<number, RecipeImages> {
  // Create blob lookup by ID
  const blobLookup = new Map<number, LegacyActiveStorageBlob>();
  for (const blob of blobs) {
    blobLookup.set(blob.id, blob);
  }

  // Group attachments by recipe ID
  const imagesByRecipe = new Map<number, RecipeImages>();

  for (const attachment of attachments) {
    if (attachment.record_type !== 'Recipe') {
      continue;
    }

    const blob = blobLookup.get(attachment.blob_id);
    if (!blob) {
      console.warn(`⚠ Blob ${attachment.blob_id} not found for attachment ${attachment.id}`);
      continue;
    }

    // Get or create recipe images entry
    let recipeImages = imagesByRecipe.get(attachment.record_id);
    if (!recipeImages) {
      recipeImages = {
        headerImage: null,
        originalPhotos: [],
      };
      imagesByRecipe.set(attachment.record_id, recipeImages);
    }

    // Map attachment name to appropriate field
    // 'header' or 'image' = main recipe image
    if (attachment.name === 'header' || attachment.name === 'image') {
      recipeImages.headerImage = {
        blobKey: blob.key,
        filename: blob.filename,
      };
      stats.imagesFound++;
    } else if (attachment.name === 'original_recipe_photos' || attachment.name === 'original_recipe_photo') {
      recipeImages.originalPhotos.push({
        blobKey: blob.key,
        filename: blob.filename,
      });
      stats.originalPhotosFound++;
    }
  }

  return imagesByRecipe;
}

/**
 * Map legacy user_id to new UUID
 * Requirement 2.7, 9.8, 9.11
 */
function mapUserId(
  legacyUserId: number,
  userMapping: Map<number, string>,
  stats: TransformationStats
): string {
  const newUuid = userMapping.get(legacyUserId);

  if (newUuid) {
    stats.userMappings++;
    return newUuid;
  }

  // Handle unmapped users - this should not happen if user transformation ran first
  stats.unmappedUsers++;
  console.warn(`⚠ Unmapped user ID: ${legacyUserId}`);

  // Return a placeholder UUID - this will be caught in validation
  return '00000000-0000-0000-0000-000000000000';
}

// ============================================================================
// Placeholder Functions (Implemented in Sub-tasks)
// ============================================================================

/**
 * Parse ingredients (implemented in sub-task 5.2)
 * Requirements: 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */
async function parseIngredients(
  ingredients: LegacyIngredient[],
  recipeId: number,
  recipeTitle: string,
  stats: TransformationStats,
  unparseableItems: UnparseableItem[]
): Promise<Ingredient[]> {
  return parseIngredientsImpl(ingredients, recipeId, recipeTitle, stats, unparseableItems);
}

/**
 * Clean instructions (implemented in sub-task 5.3)
 * Requirements: 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
async function cleanInstructions(
  instructions: LegacyInstruction[],
  recipeId: number,
  recipeTitle: string,
  stats: TransformationStats,
  unparseableItems: UnparseableItem[]
): Promise<Instruction[]> {
  return cleanInstructionsImpl(instructions, recipeId, recipeTitle, stats, unparseableItems);
}
