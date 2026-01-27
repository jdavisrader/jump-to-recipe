/**
 * Dry Run Validator Module
 * 
 * Validates import payloads without actually sending to API.
 * Simulates API calls and generates "would import" reports.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { TransformedRecipe, TransformedUser } from '../types/transformation';
import type { ImportResult } from '../types/import';

// ============================================================================
// Dry Run Validator
// ============================================================================

/**
 * Validates import data without actually importing
 */
export class DryRunValidator {
  private validationResults: {
    recipes: DryRunResult[];
    users: DryRunResult[];
  };

  constructor() {
    this.validationResults = {
      recipes: [],
      users: [],
    };
  }

  /**
   * Validate recipes for import
   */
  validateRecipes(recipes: TransformedRecipe[]): ImportResult[] {
    console.log(`\n🔍 [DRY RUN] Validating ${recipes.length} recipes...`);

    const results: ImportResult[] = [];

    for (const recipe of recipes) {
      const result = this.validateRecipe(recipe);
      results.push(result);
      
      this.validationResults.recipes.push({
        legacyId: recipe.legacyId,
        title: recipe.title,
        valid: result.success,
        errors: result.error ? [result.error] : [],
        warnings: this.getRecipeWarnings(recipe),
        wouldImport: result.success,
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`  ✓ Validation complete: ${successCount} valid, ${failureCount} invalid`);

    return results;
  }

  /**
   * Validate users for import
   */
  validateUsers(users: TransformedUser[]): ImportResult[] {
    console.log(`\n🔍 [DRY RUN] Validating ${users.length} users...`);

    const results: ImportResult[] = [];

    for (const user of users) {
      const result = this.validateUser(user);
      results.push(result);
      
      this.validationResults.users.push({
        legacyId: user.legacyId,
        title: user.email,
        valid: result.success,
        errors: result.error ? [result.error] : [],
        warnings: this.getUserWarnings(user),
        wouldImport: result.success,
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`  ✓ Validation complete: ${successCount} valid, ${failureCount} invalid`);

    return results;
  }

  /**
   * Validate a single recipe
   */
  private validateRecipe(recipe: TransformedRecipe): ImportResult {
    const errors: string[] = [];

    // Required field validation
    if (!recipe.title || recipe.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (recipe.title && recipe.title.length > 500) {
      errors.push('Title exceeds maximum length of 500 characters');
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    }

    if (!recipe.instructions || recipe.instructions.length === 0) {
      errors.push('At least one instruction is required');
    }

    if (!recipe.authorId) {
      errors.push('Author ID is required');
    }

    // UUID format validation
    if (recipe.id && !this.isValidUuid(recipe.id)) {
      errors.push('Invalid recipe ID format (must be UUID)');
    }

    if (recipe.authorId && !this.isValidUuid(recipe.authorId)) {
      errors.push('Invalid author ID format (must be UUID)');
    }

    // Numeric field validation
    if (recipe.servings !== null && recipe.servings !== undefined) {
      if (recipe.servings < 0) {
        errors.push('Servings cannot be negative');
      }
      if (!Number.isInteger(recipe.servings)) {
        errors.push('Servings must be an integer');
      }
    }

    if (recipe.prepTime !== null && recipe.prepTime !== undefined) {
      if (recipe.prepTime < 0) {
        errors.push('Prep time cannot be negative');
      }
      if (!Number.isInteger(recipe.prepTime)) {
        errors.push('Prep time must be an integer');
      }
    }

    if (recipe.cookTime !== null && recipe.cookTime !== undefined) {
      if (recipe.cookTime < 0) {
        errors.push('Cook time cannot be negative');
      }
      if (!Number.isInteger(recipe.cookTime)) {
        errors.push('Cook time must be an integer');
      }
    }

    // Ingredient validation
    for (let i = 0; i < recipe.ingredients.length; i++) {
      const ingredient = recipe.ingredients[i];
      if (!ingredient.name || ingredient.name.trim().length === 0) {
        errors.push(`Ingredient ${i + 1} is missing a name`);
      }
      if (!ingredient.id || !this.isValidUuid(ingredient.id)) {
        errors.push(`Ingredient ${i + 1} has invalid ID format`);
      }
    }

    // Instruction validation
    for (let i = 0; i < recipe.instructions.length; i++) {
      const instruction = recipe.instructions[i];
      if (!instruction.content || instruction.content.trim().length === 0) {
        errors.push(`Instruction ${i + 1} is empty`);
      }
      if (!instruction.id || !this.isValidUuid(instruction.id)) {
        errors.push(`Instruction ${i + 1} has invalid ID format`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        legacyId: recipe.legacyId,
        error: errors.join('; '),
        errorType: 'validation',
      };
    }

    return {
      success: true,
      legacyId: recipe.legacyId,
      newId: recipe.id,
    };
  }

  /**
   * Validate a single user
   */
  private validateUser(user: TransformedUser): ImportResult {
    const errors: string[] = [];

    // Required field validation
    if (!user.name || user.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!user.email || user.email.trim().length === 0) {
      errors.push('Email is required');
    }

    if (user.email && !this.isValidEmail(user.email)) {
      errors.push('Invalid email format');
    }

    if (!user.role || !['user', 'admin'].includes(user.role)) {
      errors.push('Valid role is required (user or admin)');
    }

    // UUID format validation
    if (user.id && !this.isValidUuid(user.id)) {
      errors.push('Invalid user ID format (must be UUID)');
    }

    if (errors.length > 0) {
      return {
        success: false,
        legacyId: user.legacyId,
        error: errors.join('; '),
        errorType: 'validation',
      };
    }

    return {
      success: true,
      legacyId: user.legacyId,
      newId: user.id,
    };
  }

  /**
   * Get warnings for a recipe (non-critical issues)
   */
  private getRecipeWarnings(recipe: TransformedRecipe): string[] {
    const warnings: string[] = [];

    if (!recipe.description || recipe.description.trim().length === 0) {
      warnings.push('Missing description');
    }

    if (!recipe.imageUrl) {
      warnings.push('Missing image URL');
    }

    if (!recipe.sourceUrl) {
      warnings.push('Missing source URL');
    }

    if (!recipe.tags || recipe.tags.length === 0) {
      warnings.push('No tags');
    }

    if (recipe.ingredients.some((ing: any) => ing.parseSuccess === false)) {
      warnings.push('Some ingredients could not be parsed');
    }

    if (recipe.instructions.some((inst: any) => inst.content.length < 10)) {
      warnings.push('Some instructions are very short');
    }

    return warnings;
  }

  /**
   * Get warnings for a user (non-critical issues)
   */
  private getUserWarnings(user: TransformedUser): string[] {
    const warnings: string[] = [];

    if (!user.image) {
      warnings.push('No profile image');
    }

    if (user.name === user.email.split('@')[0]) {
      warnings.push('Name is derived from email (no username in legacy data)');
    }

    return warnings;
  }

  /**
   * Generate dry run report
   */
  async generateReport(outputPath: string): Promise<void> {
    console.log(`\n📄 Generating dry run report...`);

    const report: DryRunReport = {
      timestamp: new Date().toISOString(),
      summary: {
        recipes: {
          total: this.validationResults.recipes.length,
          valid: this.validationResults.recipes.filter(r => r.valid).length,
          invalid: this.validationResults.recipes.filter(r => !r.valid).length,
          withWarnings: this.validationResults.recipes.filter(r => r.warnings.length > 0).length,
        },
        users: {
          total: this.validationResults.users.length,
          valid: this.validationResults.users.filter(u => u.valid).length,
          invalid: this.validationResults.users.filter(u => !u.valid).length,
          withWarnings: this.validationResults.users.filter(u => u.warnings.length > 0).length,
        },
      },
      recipes: this.validationResults.recipes,
      users: this.validationResults.users,
    };

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Write report
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');

    console.log(`  ✓ Report saved to ${outputPath}`);
    console.log(`\n📊 Dry Run Summary:`);
    console.log(`  Recipes: ${report.summary.recipes.valid}/${report.summary.recipes.total} valid`);
    console.log(`  Users: ${report.summary.users.valid}/${report.summary.users.total} valid`);
    
    if (report.summary.recipes.withWarnings > 0) {
      console.log(`  ⚠️  ${report.summary.recipes.withWarnings} recipes have warnings`);
    }
    if (report.summary.users.withWarnings > 0) {
      console.log(`  ⚠️  ${report.summary.users.withWarnings} users have warnings`);
    }
  }

  /**
   * Validate UUID format
   */
  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Reset validation results
   */
  reset(): void {
    this.validationResults = {
      recipes: [],
      users: [],
    };
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface DryRunResult {
  legacyId: number;
  title: string; // Recipe title or user email
  valid: boolean;
  errors: string[];
  warnings: string[];
  wouldImport: boolean;
}

interface DryRunReport {
  timestamp: string;
  summary: {
    recipes: {
      total: number;
      valid: number;
      invalid: number;
      withWarnings: number;
    };
    users: {
      total: number;
      valid: number;
      invalid: number;
      withWarnings: number;
    };
  };
  recipes: DryRunResult[];
  users: DryRunResult[];
}

// ============================================================================
// Exports
// ============================================================================

export type { DryRunResult, DryRunReport };
