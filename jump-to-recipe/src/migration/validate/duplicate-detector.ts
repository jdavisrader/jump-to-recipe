/**
 * Duplicate Detector Module
 * 
 * Identifies potential duplicate recipes using multiple matching strategies.
 * Provides confidence levels for each duplicate group.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import type { TransformedRecipe } from '../transform/recipe-transformer';
import type { Ingredient } from '../../types/recipe';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Confidence level for duplicate detection
 */
export type DuplicateConfidence = 'high' | 'medium' | 'low';

/**
 * Reason for duplicate match
 */
export type MatchReason = 
  | 'exact-title'
  | 'title-and-ingredients'
  | 'fuzzy-title'
  | 'fuzzy-title-and-ingredients';

/**
 * Group of potentially duplicate recipes
 */
export interface DuplicateGroup {
  recipes: TransformedRecipe[];
  matchReason: MatchReason;
  confidence: DuplicateConfidence;
  normalizedTitle: string;
  ingredientFingerprint?: string;
}

/**
 * Duplicate detection configuration
 */
export interface DuplicateDetectionConfig {
  enableExactTitleMatch: boolean;
  enableTitleIngredientMatch: boolean;
  enableFuzzyTitleMatch: boolean;
  fuzzyThreshold: number; // Levenshtein distance threshold
  ingredientMatchCount: number; // Number of ingredients to compare
}

/**
 * Duplicate detection report
 */
export interface DuplicateDetectionReport {
  duplicateGroups: DuplicateGroup[];
  totalDuplicates: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  affectedRecipes: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: DuplicateDetectionConfig = {
  enableExactTitleMatch: true,
  enableTitleIngredientMatch: true,
  enableFuzzyTitleMatch: true,
  fuzzyThreshold: 3,
  ingredientMatchCount: 3,
};

// ============================================================================
// Core Detection Functions
// ============================================================================

/**
 * Detect duplicate recipes using multiple strategies
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 * 
 * @param recipes - Array of transformed recipes to check
 * @param config - Detection configuration (optional)
 * @returns Array of duplicate groups with confidence levels
 */
export async function detectDuplicates(
  recipes: TransformedRecipe[],
  config: Partial<DuplicateDetectionConfig> = {}
): Promise<DuplicateGroup[]> {
  console.log('\n=== Starting Duplicate Detection ===\n');
  console.log(`Analyzing ${recipes.length} recipes for duplicates...`);

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const duplicateGroups: DuplicateGroup[] = [];
  const processedRecipeIds = new Set<string>();

  // Strategy 1: Exact title match (Requirement 6.1)
  if (finalConfig.enableExactTitleMatch) {
    const exactMatches = detectExactTitleMatches(recipes, processedRecipeIds);
    duplicateGroups.push(...exactMatches);
    console.log(`Found ${exactMatches.length} exact title match groups`);
  }

  // Strategy 2: Title + ingredient match (Requirement 6.2, 6.3)
  if (finalConfig.enableTitleIngredientMatch) {
    const titleIngredientMatches = detectTitleAndIngredientMatches(
      recipes,
      processedRecipeIds,
      finalConfig.ingredientMatchCount
    );
    duplicateGroups.push(...titleIngredientMatches);
    console.log(`Found ${titleIngredientMatches.length} title + ingredient match groups`);
  }

  // Strategy 3: Fuzzy title match (Requirement 6.4)
  if (finalConfig.enableFuzzyTitleMatch) {
    const fuzzyMatches = detectFuzzyTitleMatches(
      recipes,
      processedRecipeIds,
      finalConfig.fuzzyThreshold,
      finalConfig.ingredientMatchCount
    );
    duplicateGroups.push(...fuzzyMatches);
    console.log(`Found ${fuzzyMatches.length} fuzzy title match groups`);
  }

  console.log('\n=== Duplicate Detection Complete ===');
  console.log(`Total duplicate groups: ${duplicateGroups.length}`);
  console.log(`Total affected recipes: ${countAffectedRecipes(duplicateGroups)}`);
  console.log('====================================\n');

  return duplicateGroups;
}

/**
 * Generate a comprehensive duplicate detection report
 * 
 * Requirements: 6.4
 */
export function generateDuplicateReport(
  duplicateGroups: DuplicateGroup[]
): DuplicateDetectionReport {
  const highConfidenceGroups = duplicateGroups.filter(g => g.confidence === 'high');
  const mediumConfidenceGroups = duplicateGroups.filter(g => g.confidence === 'medium');
  const lowConfidenceGroups = duplicateGroups.filter(g => g.confidence === 'low');

  return {
    duplicateGroups,
    totalDuplicates: duplicateGroups.length,
    highConfidenceCount: highConfidenceGroups.length,
    mediumConfidenceCount: mediumConfidenceGroups.length,
    lowConfidenceCount: lowConfidenceGroups.length,
    affectedRecipes: countAffectedRecipes(duplicateGroups),
  };
}

// ============================================================================
// Detection Strategies
// ============================================================================

/**
 * Strategy 1: Detect exact title matches
 * 
 * Requirement 6.1 - Compare recipes by title (case-insensitive)
 * 
 * @param recipes - Recipes to analyze
 * @param processedIds - Set of already processed recipe IDs
 * @returns Array of duplicate groups with high confidence
 */
function detectExactTitleMatches(
  recipes: TransformedRecipe[],
  processedIds: Set<string>
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const titleMap = new Map<string, TransformedRecipe[]>();

  // Group recipes by normalized title
  for (const recipe of recipes) {
    if (processedIds.has(recipe.id)) continue;

    const normalized = normalizeTitle(recipe.title);
    const existing = titleMap.get(normalized) || [];
    existing.push(recipe);
    titleMap.set(normalized, existing);
  }

  // Find groups with multiple recipes
  for (const [normalizedTitle, groupRecipes] of titleMap.entries()) {
    if (groupRecipes.length > 1) {
      groups.push({
        recipes: groupRecipes,
        matchReason: 'exact-title',
        confidence: 'high',
        normalizedTitle,
      });

      // Mark as processed
      groupRecipes.forEach(r => processedIds.add(r.id));
    }
  }

  return groups;
}

/**
 * Strategy 2: Detect title + ingredient matches
 * 
 * Requirements 6.2, 6.3 - Compare title and first N ingredients
 * 
 * @param recipes - Recipes to analyze
 * @param processedIds - Set of already processed recipe IDs
 * @param ingredientCount - Number of ingredients to compare
 * @returns Array of duplicate groups with high confidence
 */
function detectTitleAndIngredientMatches(
  recipes: TransformedRecipe[],
  processedIds: Set<string>,
  ingredientCount: number
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const compositeMap = new Map<string, TransformedRecipe[]>();

  // Group recipes by normalized title + ingredient fingerprint
  for (const recipe of recipes) {
    if (processedIds.has(recipe.id)) continue;

    const normalizedTitle = normalizeTitle(recipe.title);
    const ingredientFingerprint = getIngredientFingerprint(recipe.ingredients, ingredientCount);
    const compositeKey = `${normalizedTitle}::${ingredientFingerprint}`;

    const existing = compositeMap.get(compositeKey) || [];
    existing.push(recipe);
    compositeMap.set(compositeKey, existing);
  }

  // Find groups with multiple recipes
  for (const [compositeKey, groupRecipes] of compositeMap.entries()) {
    if (groupRecipes.length > 1) {
      const [normalizedTitle, ingredientFingerprint] = compositeKey.split('::');
      
      groups.push({
        recipes: groupRecipes,
        matchReason: 'title-and-ingredients',
        confidence: 'high',
        normalizedTitle,
        ingredientFingerprint,
      });

      // Mark as processed
      groupRecipes.forEach(r => processedIds.add(r.id));
    }
  }

  return groups;
}

/**
 * Strategy 3: Detect fuzzy title matches
 * 
 * Requirement 6.4 - Fuzzy title matching with Levenshtein distance
 * 
 * @param recipes - Recipes to analyze
 * @param processedIds - Set of already processed recipe IDs
 * @param threshold - Maximum Levenshtein distance for match
 * @param ingredientCount - Number of ingredients to compare for confidence
 * @returns Array of duplicate groups with medium confidence
 */
function detectFuzzyTitleMatches(
  recipes: TransformedRecipe[],
  processedIds: Set<string>,
  threshold: number,
  ingredientCount: number
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const unprocessedRecipes = recipes.filter(r => !processedIds.has(r.id));

  // Compare each recipe with every other recipe
  for (let i = 0; i < unprocessedRecipes.length; i++) {
    const recipe1 = unprocessedRecipes[i];
    if (processedIds.has(recipe1.id)) continue;

    const matchingRecipes: TransformedRecipe[] = [recipe1];
    const normalizedTitle1 = normalizeTitle(recipe1.title);

    for (let j = i + 1; j < unprocessedRecipes.length; j++) {
      const recipe2 = unprocessedRecipes[j];
      if (processedIds.has(recipe2.id)) continue;

      const normalizedTitle2 = normalizeTitle(recipe2.title);
      const distance = levenshteinDistance(normalizedTitle1, normalizedTitle2);

      if (distance <= threshold) {
        matchingRecipes.push(recipe2);
      }
    }

    // If we found matches, create a group
    if (matchingRecipes.length > 1) {
      // Check ingredient similarity for confidence level
      const ingredientSimilarity = checkIngredientSimilarity(
        matchingRecipes,
        ingredientCount
      );

      const confidence: DuplicateConfidence = ingredientSimilarity >= 0.5 ? 'medium' : 'low';

      groups.push({
        recipes: matchingRecipes,
        matchReason: ingredientSimilarity >= 0.5 
          ? 'fuzzy-title-and-ingredients' 
          : 'fuzzy-title',
        confidence,
        normalizedTitle: normalizedTitle1,
      });

      // Mark as processed
      matchingRecipes.forEach(r => processedIds.add(r.id));
    }
  }

  return groups;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize title for comparison
 * 
 * Requirement 6.1 - Case-insensitive comparison
 * 
 * @param title - Recipe title to normalize
 * @returns Normalized title
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Generate ingredient fingerprint from first N ingredients
 * 
 * Requirement 6.2 - Compare first 3 ingredients (normalized)
 * 
 * @param ingredients - Recipe ingredients
 * @param count - Number of ingredients to include
 * @returns Fingerprint string
 */
export function getIngredientFingerprint(
  ingredients: Ingredient[],
  count: number = 3
): string {
  return ingredients
    .slice(0, count)
    .map(ing => normalizeIngredientName(ing.name))
    .join('|');
}

/**
 * Normalize ingredient name for comparison
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate Levenshtein distance between two strings
 * 
 * Used for fuzzy title matching (Requirement 6.4)
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion
        matrix[i][j - 1] + 1, // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Check ingredient similarity across multiple recipes
 * 
 * @param recipes - Recipes to compare
 * @param ingredientCount - Number of ingredients to compare
 * @returns Similarity score (0-1)
 */
function checkIngredientSimilarity(
  recipes: TransformedRecipe[],
  ingredientCount: number
): number {
  if (recipes.length < 2) return 1;

  // Get ingredient fingerprints for all recipes
  const fingerprints = recipes.map(r => 
    getIngredientFingerprint(r.ingredients, ingredientCount)
  );

  // Compare first recipe with all others
  const baseFingerprint = fingerprints[0];
  let totalSimilarity = 0;

  for (let i = 1; i < fingerprints.length; i++) {
    const similarity = calculateFingerprintSimilarity(baseFingerprint, fingerprints[i]);
    totalSimilarity += similarity;
  }

  return totalSimilarity / (fingerprints.length - 1);
}

/**
 * Calculate similarity between two ingredient fingerprints
 * 
 * @param fp1 - First fingerprint
 * @param fp2 - Second fingerprint
 * @returns Similarity score (0-1)
 */
function calculateFingerprintSimilarity(fp1: string, fp2: string): number {
  const ingredients1 = fp1.split('|');
  const ingredients2 = fp2.split('|');

  let matches = 0;
  const maxLength = Math.max(ingredients1.length, ingredients2.length);

  for (let i = 0; i < Math.min(ingredients1.length, ingredients2.length); i++) {
    if (ingredients1[i] === ingredients2[i]) {
      matches++;
    }
  }

  return maxLength > 0 ? matches / maxLength : 0;
}

/**
 * Count total number of affected recipes across all groups
 */
function countAffectedRecipes(groups: DuplicateGroup[]): number {
  const uniqueRecipeIds = new Set<string>();
  
  for (const group of groups) {
    for (const recipe of group.recipes) {
      uniqueRecipeIds.add(recipe.id);
    }
  }

  return uniqueRecipeIds.size;
}
