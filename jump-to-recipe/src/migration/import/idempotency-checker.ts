/**
 * Idempotency Checker Module
 * 
 * Checks if recipes/users have already been imported to prevent duplicates.
 * Maintains mapping tables of legacy IDs to new UUIDs.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { RecipeMapping, UserMapping } from '../types/transformation';

// ============================================================================
// Idempotency Checker
// ============================================================================

/**
 * Manages idempotency checking and ID mapping
 */
export class IdempotencyChecker {
  private recipeMappingPath: string;
  private userMappingPath: string;
  private recipeMapping: Map<number, RecipeMapping>;
  private userMapping: Map<number, UserMapping>;

  constructor(mappingDir: string) {
    this.recipeMappingPath = path.join(mappingDir, 'recipe-id-mapping.json');
    this.userMappingPath = path.join(mappingDir, 'user-id-mapping.json');
    this.recipeMapping = new Map();
    this.userMapping = new Map();
  }

  /**
   * Load existing mappings from disk
   */
  async loadMappings(): Promise<void> {
    console.log('\n📂 Loading existing ID mappings...');

    // Load recipe mappings
    try {
      const recipeData = await fs.readFile(this.recipeMappingPath, 'utf-8');
      const recipeMappings: RecipeMapping[] = JSON.parse(recipeData);
      
      for (const mapping of recipeMappings) {
        this.recipeMapping.set(mapping.legacyId, mapping);
      }
      
      console.log(`  ✓ Loaded ${this.recipeMapping.size} recipe mappings`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('  ℹ No existing recipe mappings found (first run)');
      } else {
        console.warn('  ⚠️  Error loading recipe mappings:', error);
      }
    }

    // Load user mappings
    try {
      const userData = await fs.readFile(this.userMappingPath, 'utf-8');
      const userMappings: UserMapping[] = JSON.parse(userData);
      
      for (const mapping of userMappings) {
        this.userMapping.set(mapping.legacyId, mapping);
      }
      
      console.log(`  ✓ Loaded ${this.userMapping.size} user mappings`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('  ℹ No existing user mappings found (first run)');
      } else {
        console.warn('  ⚠️  Error loading user mappings:', error);
      }
    }
  }

  /**
   * Save mappings to disk
   */
  async saveMappings(): Promise<void> {
    console.log('\n💾 Saving ID mappings...');

    // Ensure directory exists
    const mappingDir = path.dirname(this.recipeMappingPath);
    await fs.mkdir(mappingDir, { recursive: true });

    // Save recipe mappings
    const recipeMappings = Array.from(this.recipeMapping.values());
    await fs.writeFile(
      this.recipeMappingPath,
      JSON.stringify(recipeMappings, null, 2),
      'utf-8'
    );
    console.log(`  ✓ Saved ${recipeMappings.length} recipe mappings to ${this.recipeMappingPath}`);

    // Save user mappings
    const userMappings = Array.from(this.userMapping.values());
    await fs.writeFile(
      this.userMappingPath,
      JSON.stringify(userMappings, null, 2),
      'utf-8'
    );
    console.log(`  ✓ Saved ${userMappings.length} user mappings to ${this.userMappingPath}`);
  }

  /**
   * Check if recipe has already been imported
   */
  isRecipeImported(legacyId: number): boolean {
    const mapping = this.recipeMapping.get(legacyId);
    return mapping !== undefined && mapping.migrated === true;
  }

  /**
   * Check if user has already been imported
   */
  isUserImported(legacyId: number): boolean {
    const mapping = this.userMapping.get(legacyId);
    return mapping !== undefined && mapping.migrated === true;
  }

  /**
   * Get recipe mapping by legacy ID
   */
  getRecipeMapping(legacyId: number): RecipeMapping | undefined {
    return this.recipeMapping.get(legacyId);
  }

  /**
   * Get user mapping by legacy ID
   */
  getUserMapping(legacyId: number): UserMapping | undefined {
    return this.userMapping.get(legacyId);
  }

  /**
   * Get recipe UUID by legacy ID
   */
  getRecipeUuid(legacyId: number): string | undefined {
    return this.recipeMapping.get(legacyId)?.newUuid;
  }

  /**
   * Get user UUID by legacy ID
   */
  getUserUuid(legacyId: number): string | undefined {
    return this.userMapping.get(legacyId)?.newUuid;
  }

  /**
   * Add or update recipe mapping
   */
  addRecipeMapping(mapping: RecipeMapping): void {
    this.recipeMapping.set(mapping.legacyId, mapping);
  }

  /**
   * Add or update user mapping
   */
  addUserMapping(mapping: UserMapping): void {
    this.userMapping.set(mapping.legacyId, mapping);
  }

  /**
   * Mark recipe as imported
   */
  markRecipeImported(legacyId: number, newUuid: string, title: string): void {
    this.recipeMapping.set(legacyId, {
      legacyId,
      newUuid,
      title,
      migrated: true,
      migratedAt: new Date().toISOString(),
    });
  }

  /**
   * Mark user as imported
   */
  markUserImported(legacyId: number, newUuid: string, email: string): void {
    this.userMapping.set(legacyId, {
      legacyId,
      newUuid,
      email,
      migrated: true,
      migratedAt: new Date().toISOString(),
    });
  }

  /**
   * Get statistics about mappings
   */
  getStats(): {
    recipes: { total: number; imported: number; pending: number };
    users: { total: number; imported: number; pending: number };
  } {
    const recipeMappings = Array.from(this.recipeMapping.values());
    const userMappings = Array.from(this.userMapping.values());

    return {
      recipes: {
        total: recipeMappings.length,
        imported: recipeMappings.filter(m => m.migrated).length,
        pending: recipeMappings.filter(m => !m.migrated).length,
      },
      users: {
        total: userMappings.length,
        imported: userMappings.filter(m => m.migrated).length,
        pending: userMappings.filter(m => !m.migrated).length,
      },
    };
  }

  /**
   * Filter out already imported recipes
   */
  filterUnimportedRecipes<T extends { legacyId: number }>(recipes: T[]): {
    unimported: T[];
    skipped: T[];
  } {
    const unimported: T[] = [];
    const skipped: T[] = [];

    for (const recipe of recipes) {
      if (this.isRecipeImported(recipe.legacyId)) {
        skipped.push(recipe);
      } else {
        unimported.push(recipe);
      }
    }

    return { unimported, skipped };
  }

  /**
   * Filter out already imported users
   */
  filterUnimportedUsers<T extends { legacyId: number }>(users: T[]): {
    unimported: T[];
    skipped: T[];
  } {
    const unimported: T[] = [];
    const skipped: T[] = [];

    for (const user of users) {
      if (this.isUserImported(user.legacyId)) {
        skipped.push(user);
      } else {
        unimported.push(user);
      }
    }

    return { unimported, skipped };
  }

  /**
   * Clear all mappings (use with caution!)
   */
  clearMappings(): void {
    this.recipeMapping.clear();
    this.userMapping.clear();
  }

  /**
   * Export mappings for reporting
   */
  exportMappings(): {
    recipes: RecipeMapping[];
    users: UserMapping[];
  } {
    return {
      recipes: Array.from(this.recipeMapping.values()),
      users: Array.from(this.userMapping.values()),
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create idempotency checker with default paths
 */
export function createIdempotencyChecker(baseDir: string = 'migration-data/imported'): IdempotencyChecker {
  return new IdempotencyChecker(baseDir);
}
