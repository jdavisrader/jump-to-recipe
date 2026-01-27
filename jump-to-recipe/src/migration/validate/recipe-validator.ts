/**
 * Recipe Validator Module
 * 
 * Validates transformed recipe data against business rules using Zod schemas.
 * Classifies validation results as PASS, WARN, or FAIL.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9
 */

import { validateRecipeStrict, type StrictValidationError } from '../../lib/validations/recipe-sections';
import type { TransformedRecipe } from '../transform/recipe-transformer';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Validation status classification
 */
export type ValidationStatus = 'PASS' | 'WARN' | 'FAIL';

/**
 * Validation error with severity
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'warning';
  value?: any;
}

/**
 * Validation warning for non-critical issues
 */
export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Result of validating a single recipe
 */
export interface ValidationResult {
  status: ValidationStatus;
  recipe: TransformedRecipe;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Batch validation statistics
 */
export interface ValidationStats {
  total: number;
  passed: number;
  warned: number;
  failed: number;
  criticalErrors: number;
  warningCount: number;
}

/**
 * Complete validation report for a batch of recipes
 */
export interface ValidationReport {
  results: ValidationResult[];
  stats: ValidationStats;
  passedRecipes: TransformedRecipe[];
  warnedRecipes: TransformedRecipe[];
  failedRecipes: TransformedRecipe[];
}

// ============================================================================
// Core Validation Functions
// ============================================================================

/**
 * Validate a single recipe against business rules
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9
 * 
 * @param recipe - Transformed recipe to validate
 * @returns Validation result with status and detailed errors/warnings
 */
export function validateRecipe(recipe: TransformedRecipe): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Use Zod schema validation (Requirement 5.1)
  const zodResult = validateRecipeStrict(recipe);

  if (!zodResult.success && zodResult.errors) {
    // Convert Zod errors to our format
    for (const zodError of zodResult.errors) {
      const isCritical = isCriticalError(zodError);
      
      if (isCritical) {
        errors.push({
          field: zodError.path,
          message: zodError.message,
          severity: 'critical',
        });
      } else {
        errors.push({
          field: zodError.path,
          message: zodError.message,
          severity: 'warning',
        });
      }
    }
  }

  // Additional business rule validations
  validateTitle(recipe, errors, warnings);
  validateIngredients(recipe, errors, warnings);
  validateInstructions(recipe, errors, warnings);
  validateServings(recipe, errors, warnings);
  validateTimes(recipe, errors, warnings);
  validateAuthor(recipe, errors, warnings);
  validateOptionalFields(recipe, warnings);

  // Classify result as PASS/WARN/FAIL
  const status = classifyValidationStatus(errors, warnings);

  return {
    status,
    recipe,
    errors,
    warnings,
  };
}

/**
 * Validate a batch of recipes
 * 
 * @param recipes - Array of transformed recipes to validate
 * @returns Complete validation report with statistics
 */
export async function validateBatch(recipes: TransformedRecipe[]): Promise<ValidationReport> {
  console.log('\n=== Starting Recipe Validation ===\n');
  console.log(`Validating ${recipes.length} recipes...`);

  const results: ValidationResult[] = [];
  const passedRecipes: TransformedRecipe[] = [];
  const warnedRecipes: TransformedRecipe[] = [];
  const failedRecipes: TransformedRecipe[] = [];

  const stats: ValidationStats = {
    total: recipes.length,
    passed: 0,
    warned: 0,
    failed: 0,
    criticalErrors: 0,
    warningCount: 0,
  };

  // Validate each recipe
  for (const recipe of recipes) {
    const result = validateRecipe(recipe);
    results.push(result);

    // Update statistics
    const criticalErrorCount = result.errors.filter(e => e.severity === 'critical').length;
    stats.criticalErrors += criticalErrorCount;
    stats.warningCount += result.warnings.length;

    // Categorize by status
    switch (result.status) {
      case 'PASS':
        stats.passed++;
        passedRecipes.push(recipe);
        break;
      case 'WARN':
        stats.warned++;
        warnedRecipes.push(recipe);
        break;
      case 'FAIL':
        stats.failed++;
        failedRecipes.push(recipe);
        break;
    }

    // Progress logging
    if ((stats.passed + stats.warned + stats.failed) % 100 === 0) {
      console.log(`Validated ${stats.passed + stats.warned + stats.failed}/${stats.total} recipes...`);
    }
  }

  console.log('\n=== Validation Complete ===');
  console.log(`Total: ${stats.total}`);
  console.log(`PASS: ${stats.passed} (${((stats.passed / stats.total) * 100).toFixed(1)}%)`);
  console.log(`WARN: ${stats.warned} (${((stats.warned / stats.total) * 100).toFixed(1)}%)`);
  console.log(`FAIL: ${stats.failed} (${((stats.failed / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Critical Errors: ${stats.criticalErrors}`);
  console.log(`Warnings: ${stats.warningCount}`);
  console.log('===========================\n');

  return {
    results,
    stats,
    passedRecipes,
    warnedRecipes,
    failedRecipes,
  };
}

// ============================================================================
// Field-Specific Validation Functions
// ============================================================================

/**
 * Validate title field
 * Requirements: 5.2
 */
function validateTitle(
  recipe: TransformedRecipe,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Title is non-empty (Requirement 5.2)
  if (!recipe.title || recipe.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Title cannot be empty',
      severity: 'critical',
      value: recipe.title,
    });
  }

  // Title is under 500 characters (Requirement 5.2)
  if (recipe.title && recipe.title.length > 500) {
    errors.push({
      field: 'title',
      message: 'Title exceeds 500 characters',
      severity: 'critical',
      value: recipe.title.length,
    });
  }
}

/**
 * Validate ingredients
 * Requirements: 5.3
 */
function validateIngredients(
  recipe: TransformedRecipe,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // At least one ingredient exists (Requirement 5.3)
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    errors.push({
      field: 'ingredients',
      message: 'Recipe must have at least one ingredient',
      severity: 'critical',
      value: 0,
    });
    return;
  }

  // Check for unparsed ingredients
  const unparsedCount = recipe.ingredients.filter(
    (ing: any) => ing.parseSuccess === false
  ).length;

  if (unparsedCount > 0) {
    warnings.push({
      field: 'ingredients',
      message: `${unparsedCount} ingredient(s) could not be fully parsed`,
      suggestion: 'Review unparseable items report for manual correction',
    });
  }

  // Validate each ingredient has required fields
  recipe.ingredients.forEach((ingredient, index) => {
    if (!ingredient.name || ingredient.name.trim().length === 0) {
      errors.push({
        field: `ingredients[${index}].name`,
        message: 'Ingredient name cannot be empty',
        severity: 'critical',
      });
    }

    if (ingredient.amount < 0) {
      errors.push({
        field: `ingredients[${index}].amount`,
        message: 'Ingredient amount cannot be negative',
        severity: 'critical',
        value: ingredient.amount,
      });
    }
  });
}

/**
 * Validate instructions
 * Requirements: 5.4
 */
function validateInstructions(
  recipe: TransformedRecipe,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // At least one instruction exists (Requirement 5.4)
  if (!recipe.instructions || recipe.instructions.length === 0) {
    errors.push({
      field: 'instructions',
      message: 'Recipe must have at least one instruction',
      severity: 'critical',
      value: 0,
    });
    return;
  }

  // Validate each instruction
  recipe.instructions.forEach((instruction, index) => {
    if (!instruction.content || instruction.content.trim().length === 0) {
      errors.push({
        field: `instructions[${index}].content`,
        message: 'Instruction content cannot be empty',
        severity: 'critical',
      });
    }

    // Warn about very short instructions (< 10 characters)
    if (instruction.content && instruction.content.trim().length < 10) {
      warnings.push({
        field: `instructions[${index}].content`,
        message: 'Instruction is very short (< 10 characters)',
        suggestion: 'Verify instruction content is complete',
      });
    }
  });
}

/**
 * Validate servings
 * Requirements: 5.5
 */
function validateServings(
  recipe: TransformedRecipe,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Servings is a positive integer or null (Requirement 5.5)
  if (recipe.servings !== null && recipe.servings !== undefined) {
    if (recipe.servings < 0) {
      errors.push({
        field: 'servings',
        message: 'Servings cannot be negative',
        severity: 'critical',
        value: recipe.servings,
      });
    }

    if (!Number.isInteger(recipe.servings)) {
      errors.push({
        field: 'servings',
        message: 'Servings must be an integer',
        severity: 'critical',
        value: recipe.servings,
      });
    }
  }
}

/**
 * Validate time fields
 * Requirements: 5.6
 */
function validateTimes(
  recipe: TransformedRecipe,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // prepTime and cookTime are non-negative integers or null (Requirement 5.6)
  if (recipe.prepTime !== null && recipe.prepTime !== undefined) {
    if (recipe.prepTime < 0) {
      errors.push({
        field: 'prepTime',
        message: 'Prep time cannot be negative',
        severity: 'critical',
        value: recipe.prepTime,
      });
    }

    if (!Number.isInteger(recipe.prepTime)) {
      errors.push({
        field: 'prepTime',
        message: 'Prep time must be an integer',
        severity: 'critical',
        value: recipe.prepTime,
      });
    }
  }

  if (recipe.cookTime !== null && recipe.cookTime !== undefined) {
    if (recipe.cookTime < 0) {
      errors.push({
        field: 'cookTime',
        message: 'Cook time cannot be negative',
        severity: 'critical',
        value: recipe.cookTime,
      });
    }

    if (!Number.isInteger(recipe.cookTime)) {
      errors.push({
        field: 'cookTime',
        message: 'Cook time must be an integer',
        severity: 'critical',
        value: recipe.cookTime,
      });
    }
  }
}

/**
 * Validate author ID
 * Requirements: 5.7
 */
function validateAuthor(
  recipe: TransformedRecipe,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Author ID must be a valid UUID
  if (!recipe.authorId) {
    errors.push({
      field: 'authorId',
      message: 'Author ID is required',
      severity: 'critical',
    });
    return;
  }

  // Check for placeholder UUID (unmapped user)
  if (recipe.authorId === '00000000-0000-0000-0000-000000000000') {
    errors.push({
      field: 'authorId',
      message: 'Author ID is unmapped (placeholder UUID)',
      severity: 'critical',
      value: recipe.authorId,
    });
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(recipe.authorId)) {
    errors.push({
      field: 'authorId',
      message: 'Author ID is not a valid UUID',
      severity: 'critical',
      value: recipe.authorId,
    });
  }
}

/**
 * Validate optional fields and generate warnings
 * Requirements: 5.8, 5.9
 */
function validateOptionalFields(
  recipe: TransformedRecipe,
  warnings: ValidationWarning[]
): void {
  // Missing description (Requirement 5.8)
  if (!recipe.description || recipe.description.trim().length === 0) {
    warnings.push({
      field: 'description',
      message: 'Recipe has no description',
      suggestion: 'Consider adding a description for better user experience',
    });
  }

  // Missing image (Requirement 5.8)
  if (!recipe.imageUrl) {
    warnings.push({
      field: 'imageUrl',
      message: 'Recipe has no image',
      suggestion: 'Image migration can be performed separately',
    });
  }

  // Missing source URL (Requirement 5.8)
  if (!recipe.sourceUrl) {
    warnings.push({
      field: 'sourceUrl',
      message: 'Recipe has no source URL',
      suggestion: 'Original source may not have been recorded',
    });
  }

  // No tags (Requirement 5.8)
  if (!recipe.tags || recipe.tags.length === 0) {
    warnings.push({
      field: 'tags',
      message: 'Recipe has no tags',
      suggestion: 'Tags help with recipe discovery',
    });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine if a Zod validation error is critical
 */
function isCriticalError(error: StrictValidationError): boolean {
  const criticalFields = [
    'title',
    'ingredients',
    'instructions',
    'authorId',
    'id',
  ];

  const criticalMessages = [
    'cannot be empty',
    'is required',
    'must be',
    'invalid',
    'at least one',
  ];

  // Check if error is on a critical field
  const isCriticalField = criticalFields.some(field => 
    error.path.startsWith(field)
  );

  // Check if error message indicates critical issue
  const hasCriticalMessage = criticalMessages.some(msg =>
    error.message.toLowerCase().includes(msg)
  );

  return isCriticalField || hasCriticalMessage;
}

/**
 * Classify validation status based on errors and warnings
 * 
 * Requirements: 5.7, 5.8, 5.9
 * 
 * FAIL: Has critical errors (cannot import)
 * WARN: Has warnings but no critical errors (can import with flags)
 * PASS: No errors or warnings
 */
function classifyValidationStatus(
  errors: ValidationError[],
  warnings: ValidationWarning[]
): ValidationStatus {
  // Check for critical errors
  const hasCriticalErrors = errors.some(e => e.severity === 'critical');

  if (hasCriticalErrors) {
    return 'FAIL';
  }

  // Check for warnings
  if (warnings.length > 0 || errors.length > 0) {
    return 'WARN';
  }

  return 'PASS';
}
