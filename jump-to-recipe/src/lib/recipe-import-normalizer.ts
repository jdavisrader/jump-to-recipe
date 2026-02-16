import { v4 as uuidv4 } from 'uuid';

/**
 * Recipe Import Normalization
 * 
 * This module provides functions to normalize imported recipe data from external sources
 * and existing recipes to ensure they meet strict validation requirements.
 * 
 * Key normalization operations:
 * - Assign default "Imported Section" name when section name is missing
 * - Flatten empty sections into unsectioned items
 * - Auto-assign sequential positions when missing
 * - Drop items with empty text
 * - Generate UUIDs for items missing IDs
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.1, 11.2, 11.3, 11.4, 11.5
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Imported ingredient item (may have missing or invalid fields)
 */
interface ImportedIngredientItem {
  id?: string;
  name?: string;
  amount?: number;
  unit?: string;
  displayAmount?: string;
  notes?: string;
  category?: string;
  sectionId?: string;
}

/**
 * Imported instruction item (may have missing or invalid fields)
 */
interface ImportedInstructionItem {
  id?: string;
  step?: number;
  content?: string;
  duration?: number;
  sectionId?: string;
}

/**
 * Imported section (may have missing or invalid fields)
 */
interface ImportedSection<T = any> {
  id?: string;
  name?: string;
  order?: number;
  items?: T[];
}

/**
 * Normalized ingredient item (all required fields present and valid)
 */
interface NormalizedIngredientItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  displayAmount?: string;
  notes?: string;
  category?: string;
  sectionId?: string;
}

/**
 * Normalized instruction item (all required fields present and valid)
 */
interface NormalizedInstructionItem {
  id: string;
  step: number;
  content: string;
  duration?: number;
  sectionId?: string;
}

/**
 * Normalized section (all required fields present and valid)
 */
interface NormalizedSection<T = any> {
  id: string;
  name: string;
  order: number;
  items: T[];
}

/**
 * Imported recipe data (may have missing or invalid fields)
 */
interface ImportedRecipeData {
  title?: string;
  description?: string | null;
  ingredients?: ImportedIngredientItem[];
  instructions?: ImportedInstructionItem[];
  ingredientSections?: ImportedSection<ImportedIngredientItem>[];
  instructionSections?: ImportedSection<ImportedInstructionItem>[];
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  tags?: string[];
  notes?: string | null;
  imageUrl?: string | null;
  sourceUrl?: string | null;
  authorId?: string | null;
  visibility?: 'public' | 'private';
  commentsEnabled?: boolean;
  viewCount?: number;
  likeCount?: number;
}

/**
 * Normalization summary with statistics about changes made
 */
export interface NormalizationSummary {
  sectionsRenamed: number;
  sectionsFlattened: number;
  itemsDropped: number;
  idsGenerated: number;
  positionsAssigned: number;
}

// ============================================================================
// Core Normalization Functions
// ============================================================================

/**
 * Normalizes imported recipe data to meet strict validation requirements.
 * 
 * This function processes external recipe data and applies all normalization rules:
 * - Assigns "Imported Section" name when section name is missing
 * - Flattens empty sections into unsectioned items
 * - Auto-assigns sequential positions when missing
 * - Drops items with empty text
 * - Generates UUIDs for items missing IDs
 * 
 * @param data - Imported recipe data (may have missing or invalid fields)
 * @param summary - Optional summary object to track normalization statistics
 * @returns Normalized recipe data ready for validation
 * 
 * @example
 * ```typescript
 * const importedRecipe = {
 *   title: "Pasta",
 *   ingredientSections: [
 *     { name: "", items: [{ name: "Pasta" }] },
 *     { items: [] }
 *   ]
 * };
 * 
 * const normalized = normalizeImportedRecipe(importedRecipe);
 * // Result: Section renamed to "Imported Section", empty section removed
 * ```
 */
export function normalizeImportedRecipe(
  data: ImportedRecipeData,
  summary?: NormalizationSummary
): any {
  const stats: NormalizationSummary = summary || {
    sectionsRenamed: 0,
    sectionsFlattened: 0,
    itemsDropped: 0,
    idsGenerated: 0,
    positionsAssigned: 0,
  };

  // Normalize ingredient sections
  const normalizedIngredientSections = normalizeImportedSections(
    data.ingredientSections,
    'ingredient',
    stats
  );

  // Normalize instruction sections
  const normalizedInstructionSections = normalizeImportedSections(
    data.instructionSections,
    'instruction',
    stats
  );

  // Build flat arrays from sections to maintain dual representation
  // Strategy:
  // - If sections exist AND flat arrays are explicitly provided (even if empty): Use what was provided
  // - If sections exist AND no flat arrays in input: Build flat arrays from sections
  // - If no sections: Use flat arrays from input
  // Note: Position property is now explicitly persisted in all items
  const hasIngredientSections = data.ingredientSections && Array.isArray(data.ingredientSections) && data.ingredientSections.length > 0;
  const hasInstructionSections = data.instructionSections && Array.isArray(data.instructionSections) && data.instructionSections.length > 0;
  
  // Check if flat arrays were explicitly provided in the input (even if empty)
  const ingredientsProvided = 'ingredients' in data && Array.isArray(data.ingredients);
  const instructionsProvided = 'instructions' in data && Array.isArray(data.instructions);
  
  let flatIngredients: NormalizedIngredientItem[] = [];
  let flatInstructions: NormalizedInstructionItem[] = [];
  
  // Handle ingredients
  if (hasIngredientSections && ingredientsProvided) {
    // Sections exist AND flat array was explicitly provided
    // Use the provided flat array (even if empty - this is sections-only mode)
    if (data.ingredients && data.ingredients.length > 0) {
      flatIngredients = normalizeIngredientItems(data.ingredients, stats);
    }
    // else: keep empty (sections-only mode)
  } else if (normalizedIngredientSections && normalizedIngredientSections.length > 0) {
    // Sections exist but no flat array provided - build from sections
    flatIngredients = buildFlatIngredientArray(normalizedIngredientSections);
  } else if (data.ingredients && data.ingredients.length > 0) {
    // No sections - use flat array from input
    flatIngredients = normalizeIngredientItems(data.ingredients, stats);
  }
  
  // Handle instructions
  if (hasInstructionSections && instructionsProvided) {
    // Sections exist AND flat array was explicitly provided
    // Use the provided flat array (even if empty - this is sections-only mode)
    if (data.instructions && data.instructions.length > 0) {
      flatInstructions = normalizeInstructionItems(data.instructions, stats);
    }
    // else: keep empty (sections-only mode)
  } else if (normalizedInstructionSections && normalizedInstructionSections.length > 0) {
    // Sections exist but no flat array provided - build from sections
    flatInstructions = buildFlatInstructionArray(normalizedInstructionSections);
  } else if (data.instructions && data.instructions.length > 0) {
    // No sections - use flat array from input
    flatInstructions = normalizeInstructionItems(data.instructions, stats);
  }

  return {
    title: data.title || 'Untitled Recipe',
    description: data.description ?? null,
    ingredients: flatIngredients,
    instructions: flatInstructions,
    ingredientSections: normalizedIngredientSections,
    instructionSections: normalizedInstructionSections,
    prepTime: data.prepTime ?? null,
    cookTime: data.cookTime ?? null,
    servings: data.servings ?? null,
    difficulty: data.difficulty ?? null,
    tags: data.tags || [],
    notes: data.notes ?? null,
    imageUrl: data.imageUrl ?? null,
    sourceUrl: data.sourceUrl ?? null,
    authorId: data.authorId ?? null,
    visibility: data.visibility || 'private',
    commentsEnabled: data.commentsEnabled ?? true,
    viewCount: data.viewCount || 0,
    likeCount: data.likeCount || 0,
  };
}

/**
 * Normalizes a list of imported sections (ingredient or instruction sections).
 * 
 * Applies the following normalization rules:
 * - Assigns "Imported Section" name when section name is missing or empty
 * - Flattens empty sections (removes them, items would go to unsectioned)
 * - Auto-assigns sequential order values when missing
 * - Normalizes items within each section
 * 
 * @param sections - Array of imported sections (may be undefined or have invalid data)
 * @param type - Type of section ('ingredient' or 'instruction')
 * @param summary - Summary object to track normalization statistics
 * @returns Normalized sections array or undefined if no valid sections
 */
function normalizeImportedSections<T extends ImportedIngredientItem | ImportedInstructionItem>(
  sections: ImportedSection<T>[] | undefined,
  type: 'ingredient' | 'instruction',
  summary: NormalizationSummary
): NormalizedSection<any>[] | undefined {
  if (!sections || sections.length === 0) {
    return undefined;
  }

  const normalized: NormalizedSection<any>[] = [];

  sections.forEach((section, sectionIndex) => {
    // Normalize section name (Requirement 6.1)
    let name = section.name?.trim() || '';
    if (!name) {
      name = 'Imported Section';
      summary.sectionsRenamed++;
    }

    // Normalize items within the section
    const normalizedItems = type === 'ingredient'
      ? normalizeIngredientItems(section.items as ImportedIngredientItem[] || [], summary)
      : normalizeInstructionItems(section.items as ImportedInstructionItem[] || [], summary);

    // Flatten empty sections (Requirement 6.2)
    if (normalizedItems.length === 0) {
      summary.sectionsFlattened++;
      return; // Skip this section
    }

    // Generate section ID if missing
    const sectionId = section.id || uuidv4();
    if (!section.id) {
      summary.idsGenerated++;
    }

    // Auto-assign order if missing (Requirement 6.3)
    const order = section.order ?? sectionIndex;
    if (section.order === undefined) {
      summary.positionsAssigned++;
    }

    // Add normalized section
    normalized.push({
      id: sectionId,
      name,
      order,
      items: normalizedItems,
    });
  });

  // If all sections were empty, return undefined
  if (normalized.length === 0) {
    return undefined;
  }

  // Reindex order values to ensure sequential order
  return normalized.map((section, index) => ({
    ...section,
    order: index,
  }));
}

/**
 * Normalizes ingredient items within a section.
 * 
 * Applies the following rules:
 * - Drops items with empty name (Requirement 6.4)
 * - Generates UUIDs for items missing IDs (Requirement 6.5)
 * - Ensures all required fields have valid values
 * - Sorts items by position if available (Requirement 6.2)
 * - Reindexes positions to be sequential after sorting (Requirement 6.4)
 * 
 * @param items - Array of imported ingredient items
 * @param summary - Summary object to track normalization statistics
 * @returns Normalized ingredient items array sorted by position with sequential indices
 */
function normalizeIngredientItems(
  items: ImportedIngredientItem[],
  summary: NormalizationSummary
): NormalizedIngredientItem[] {
  const normalized = items
    .filter(item => {
      // Drop items with empty name (Requirement 6.4)
      const hasName = item.name?.trim();
      if (!hasName) {
        summary.itemsDropped++;
        return false;
      }
      return true;
    })
    .map((item, index) => {
      // Generate UUID if missing (Requirement 6.5)
      const id = item.id || uuidv4();
      if (!item.id) {
        summary.idsGenerated++;
      }

      // Auto-assign position if missing (Requirement 6.3)
      const position = (item as any).position ?? index;
      if ((item as any).position === undefined) {
        summary.positionsAssigned++;
      }

      return {
        id,
        name: item.name!.trim(),
        amount: item.amount ?? 0,
        unit: item.unit || '',
        displayAmount: item.displayAmount,
        notes: item.notes,
        category: item.category,
        sectionId: item.sectionId,
        position,
      };
    });

  // Sort by position to ensure correct order (Requirement 6.2)
  const sorted = normalized.sort((a, b) => a.position - b.position);
  
  // Reindex positions to be sequential (0, 1, 2, ...) after sorting and filtering (Requirement 6.4)
  return sorted.map((item, index) => ({
    ...item,
    position: index,
  }));
}

/**
 * Normalizes instruction items within a section.
 * 
 * Applies the following rules:
 * - Drops items with empty content (Requirement 6.4)
 * - Generates UUIDs for items missing IDs (Requirement 6.5)
 * - Auto-assigns step numbers sequentially
 * - Sorts items by position if available (Requirement 6.2)
 * - Reindexes positions to be sequential after sorting (Requirement 6.4)
 * 
 * @param items - Array of imported instruction items
 * @param summary - Summary object to track normalization statistics
 * @returns Normalized instruction items array sorted by position with sequential indices
 */
function normalizeInstructionItems(
  items: ImportedInstructionItem[],
  summary: NormalizationSummary
): NormalizedInstructionItem[] {
  const normalized = items
    .filter(item => {
      // Drop items with empty content (Requirement 6.4)
      const hasContent = item.content?.trim();
      if (!hasContent) {
        summary.itemsDropped++;
        return false;
      }
      return true;
    })
    .map((item, index) => {
      // Generate UUID if missing (Requirement 6.5)
      const id = item.id || uuidv4();
      if (!item.id) {
        summary.idsGenerated++;
      }

      // Auto-assign step number if missing
      const step = item.step ?? index + 1;

      // Auto-assign position if missing (Requirement 6.3)
      const position = (item as any).position ?? index;
      if ((item as any).position === undefined) {
        summary.positionsAssigned++;
      }

      return {
        id,
        step,
        content: item.content!.trim(),
        duration: item.duration,
        sectionId: item.sectionId,
        position,
      };
    });

  // Sort by position to ensure correct order (Requirement 6.2)
  const sorted = normalized.sort((a, b) => a.position - b.position);
  
  // Reindex positions to be sequential (0, 1, 2, ...) after sorting and filtering (Requirement 6.4)
  return sorted.map((item, index) => ({
    ...item,
    position: index,
  }));
}

/**
 * Builds a flat ingredient array from sections.
 * 
 * Creates a flattened representation of sectioned ingredients while preserving
 * section references and explicit position values.
 * 
 * @param sections - Normalized ingredient sections
 * @returns Flat array of all ingredients with section references and positions
 */
function buildFlatIngredientArray(
  sections: NormalizedSection<NormalizedIngredientItem>[] | undefined
): NormalizedIngredientItem[] {
  if (!sections || sections.length === 0) {
    return [];
  }

  const flatArray: NormalizedIngredientItem[] = [];

  sections.forEach(section => {
    section.items.forEach(item => {
      flatArray.push({
        ...item,
        sectionId: section.id,
      });
    });
  });

  return flatArray;
}

/**
 * Builds a flat instruction array from sections.
 * 
 * Creates a flattened representation of sectioned instructions while preserving
 * section references and explicit position values.
 * 
 * @param sections - Normalized instruction sections
 * @returns Flat array of all instructions with section references and positions
 */
function buildFlatInstructionArray(
  sections: NormalizedSection<NormalizedInstructionItem>[] | undefined
): NormalizedInstructionItem[] {
  if (!sections || sections.length === 0) {
    return [];
  }

  const flatArray: NormalizedInstructionItem[] = [];

  sections.forEach(section => {
    section.items.forEach(item => {
      flatArray.push({
        ...item,
        sectionId: section.id,
      });
    });
  });

  return flatArray;
}

// ============================================================================
// Recipe Data Normalization Functions
// ============================================================================

/**
 * Normalizes existing recipe data from the database.
 * 
 * This function ensures existing recipes meet current validation requirements,
 * including explicit position properties. It applies the same normalization
 * rules as imported recipes, ensuring consistency across all data sources.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 * 
 * @param data - Existing recipe data from database
 * @param summary - Optional summary object to track normalization statistics
 * @returns Normalized recipe data with explicit positions
 * 
 * @example
 * ```typescript
 * const existingRecipe = await db.getRecipe(id);
 * const normalized = normalizeExistingRecipe(existingRecipe);
 * // Recipe now has explicit position properties on all items
 * ```
 */
export function normalizeExistingRecipe(
  data: any,
  summary?: NormalizationSummary
): any {
  // Use the same normalization logic as imported recipes
  // This ensures all recipes have explicit position properties
  return normalizeImportedRecipe(data, summary);
}

/**
 * Creates a normalization summary with default values.
 * 
 * @returns Empty normalization summary
 */
export function createNormalizationSummary(): NormalizationSummary {
  return {
    sectionsRenamed: 0,
    sectionsFlattened: 0,
    itemsDropped: 0,
    idsGenerated: 0,
    positionsAssigned: 0,
  };
}

/**
 * Formats a normalization summary into a human-readable message.
 * 
 * @param summary - Normalization summary with statistics
 * @returns Human-readable summary message
 * 
 * @example
 * ```typescript
 * const summary = createNormalizationSummary();
 * const normalized = normalizeImportedRecipe(data, summary);
 * console.log(formatNormalizationSummary(summary));
 * // Output: "Fixed 2 empty sections, renamed 1 section, dropped 3 empty items"
 * ```
 */
export function formatNormalizationSummary(summary: NormalizationSummary): string {
  const messages: string[] = [];

  if (summary.sectionsFlattened > 0) {
    messages.push(`removed ${summary.sectionsFlattened} empty section${summary.sectionsFlattened > 1 ? 's' : ''}`);
  }

  if (summary.sectionsRenamed > 0) {
    messages.push(`renamed ${summary.sectionsRenamed} section${summary.sectionsRenamed > 1 ? 's' : ''}`);
  }

  if (summary.itemsDropped > 0) {
    messages.push(`dropped ${summary.itemsDropped} empty item${summary.itemsDropped > 1 ? 's' : ''}`);
  }

  if (summary.idsGenerated > 0) {
    messages.push(`generated ${summary.idsGenerated} ID${summary.idsGenerated > 1 ? 's' : ''}`);
  }

  if (summary.positionsAssigned > 0) {
    messages.push(`assigned ${summary.positionsAssigned} position${summary.positionsAssigned > 1 ? 's' : ''}`);
  }

  if (messages.length === 0) {
    return 'No changes needed';
  }

  return `Fixed: ${messages.join(', ')}`;
}
