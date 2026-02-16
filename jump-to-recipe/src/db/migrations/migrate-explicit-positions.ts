/**
 * Migration Script: Add Explicit Position Properties to Recipes
 * 
 * This script migrates existing recipes from implicit position tracking
 * (via array order) to explicit position persistence (via position property).
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * 
 * Usage:
 *   npx tsx src/db/migrations/migrate-explicit-positions.ts
 * 
 * Features:
 * - Adds position to flat ingredients based on array index
 * - Adds position to flat instructions based on array index
 * - Adds position to items within ingredient sections
 * - Adds position to items within instruction sections
 * - Idempotent (safe to run multiple times)
 * - Logs progress and errors (Requirement 8.3)
 * - Continues on errors without stopping (Requirement 8.4)
 * - Generates comprehensive migration summary report (Requirement 8.3)
 */

import { db } from '@/db';
import { recipes } from '@/db/schema/recipes';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationStats {
  processed: number;
  updated: number;
  skipped: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
  ingredientsUpdated: number;
  instructionsUpdated: number;
  ingredientSectionsUpdated: number;
  instructionSectionsUpdated: number;
}

interface MigrationError {
  recipeId: string;
  recipeTitle: string;
  error: string;
  timestamp: Date;
  stackTrace?: string;
}

interface MigrationReport {
  summary: {
    totalRecipes: number;
    processed: number;
    updated: number;
    skipped: number;
    errors: number;
    successRate: string;
    duration: string;
    startTime: string;
    endTime: string;
  };
  details: {
    ingredientsUpdated: number;
    instructionsUpdated: number;
    ingredientSectionsUpdated: number;
    instructionSectionsUpdated: number;
  };
  errors: MigrationError[];
}

/**
 * Check if an item has a valid position property
 */
function hasValidPosition(item: any): boolean {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.position === 'number' &&
    Number.isInteger(item.position) &&
    item.position >= 0
  );
}

/**
 * Add position to an array of items based on their index
 */
function addPositionToItems<T extends Record<string, any>>(
  items: T[]
): T[] {
  if (!Array.isArray(items)) {
    return items;
  }

  return items.map((item, index) => {
    // If item already has a valid position, keep it
    if (hasValidPosition(item)) {
      return item;
    }

    // Otherwise, assign position based on array index
    return {
      ...item,
      position: index,
    };
  });
}

/**
 * Add position to items within sections
 */
function addPositionToSections<T extends { items: any[] }>(
  sections: T[] | undefined | null
): T[] | undefined {
  if (!sections || !Array.isArray(sections)) {
    return undefined;
  }

  return sections.map((section) => ({
    ...section,
    items: addPositionToItems(section.items || []),
  }));
}

/**
 * Check if a recipe needs migration
 */
function needsMigration(recipe: any): boolean {
  // Check flat ingredients
  if (Array.isArray(recipe.ingredients)) {
    const needsIngredientMigration = recipe.ingredients.some(
      (item: any) => !hasValidPosition(item)
    );
    if (needsIngredientMigration) return true;
  }

  // Check flat instructions
  if (Array.isArray(recipe.instructions)) {
    const needsInstructionMigration = recipe.instructions.some(
      (item: any) => !hasValidPosition(item)
    );
    if (needsInstructionMigration) return true;
  }

  // Check ingredient sections
  if (Array.isArray(recipe.ingredientSections)) {
    const needsSectionMigration = recipe.ingredientSections.some(
      (section: any) =>
        Array.isArray(section.items) &&
        section.items.some((item: any) => !hasValidPosition(item))
    );
    if (needsSectionMigration) return true;
  }

  // Check instruction sections
  if (Array.isArray(recipe.instructionSections)) {
    const needsSectionMigration = recipe.instructionSections.some(
      (section: any) =>
        Array.isArray(section.items) &&
        section.items.some((item: any) => !hasValidPosition(item))
    );
    if (needsSectionMigration) return true;
  }

  return false;
}

/**
 * Migrate a single recipe to add explicit positions
 * Requirement 8.4: Logs errors without stopping migration
 */
async function migrateRecipe(
  recipe: any,
  stats: MigrationStats,
  errors: MigrationError[]
): Promise<void> {
  try {
    stats.processed++;

    // Check if migration is needed
    if (!needsMigration(recipe)) {
      stats.skipped++;
      if (stats.processed % 100 === 0) {
        logProgress(stats);
      }
      return;
    }

    // Track what gets updated for detailed stats
    let needsIngredientUpdate = false;
    let needsInstructionUpdate = false;
    let needsIngredientSectionUpdate = false;
    let needsInstructionSectionUpdate = false;

    // Add positions to flat ingredients
    const ingredients = addPositionToItems(recipe.ingredients || []);
    if (
      Array.isArray(recipe.ingredients) &&
      recipe.ingredients.some((item: any) => !hasValidPosition(item))
    ) {
      needsIngredientUpdate = true;
      stats.ingredientsUpdated++;
    }

    // Add positions to flat instructions
    const instructions = addPositionToItems(recipe.instructions || []);
    if (
      Array.isArray(recipe.instructions) &&
      recipe.instructions.some((item: any) => !hasValidPosition(item))
    ) {
      needsInstructionUpdate = true;
      stats.instructionsUpdated++;
    }

    // Add positions to ingredient sections
    const ingredientSections = addPositionToSections(recipe.ingredientSections);
    if (
      Array.isArray(recipe.ingredientSections) &&
      recipe.ingredientSections.some(
        (section: any) =>
          Array.isArray(section.items) &&
          section.items.some((item: any) => !hasValidPosition(item))
      )
    ) {
      needsIngredientSectionUpdate = true;
      stats.ingredientSectionsUpdated++;
    }

    // Add positions to instruction sections
    const instructionSections = addPositionToSections(
      recipe.instructionSections
    );
    if (
      Array.isArray(recipe.instructionSections) &&
      recipe.instructionSections.some(
        (section: any) =>
          Array.isArray(section.items) &&
          section.items.some((item: any) => !hasValidPosition(item))
      )
    ) {
      needsInstructionSectionUpdate = true;
      stats.instructionSectionsUpdated++;
    }

    // Update the recipe in the database
    await db
      .update(recipes)
      .set({
        ingredients,
        instructions,
        ingredientSections,
        instructionSections,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, recipe.id));

    stats.updated++;

    // Log progress every 100 recipes (Requirement 8.3)
    if (stats.processed % 100 === 0) {
      logProgress(stats);
    }
  } catch (error) {
    // Requirement 8.4: Log error without stopping migration
    stats.errors++;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;

    errors.push({
      recipeId: recipe.id,
      recipeTitle: recipe.title || 'Unknown',
      error: errorMessage,
      timestamp: new Date(),
      stackTrace,
    });

    console.error(
      `❌ Error migrating recipe "${recipe.title}" (${recipe.id}): ${errorMessage}`
    );
    // Continue processing other recipes
  }
}

/**
 * Log migration progress
 * Requirement 8.3: Log migration progress
 */
function logProgress(stats: MigrationStats): void {
  const elapsed = Math.round(
    (new Date().getTime() - stats.startTime.getTime()) / 1000
  );
  const rate =
    stats.processed > 0 ? Math.round(stats.processed / elapsed) : 0;

  console.log(
    `📊 Progress: ${stats.processed} processed | ${stats.updated} updated | ${stats.skipped} skipped | ${stats.errors} errors | ${rate} recipes/sec`
  );
}

/**
 * Generate and save migration report
 * Requirement 8.3: Create migration summary report
 */
function generateMigrationReport(
  stats: MigrationStats,
  errors: MigrationError[]
): MigrationReport {
  const duration = stats.endTime
    ? Math.round((stats.endTime.getTime() - stats.startTime.getTime()) / 1000)
    : 0;

  const successRate =
    stats.processed > 0
      ? ((stats.updated / stats.processed) * 100).toFixed(2)
      : '0.00';

  return {
    summary: {
      totalRecipes: stats.processed,
      processed: stats.processed,
      updated: stats.updated,
      skipped: stats.skipped,
      errors: stats.errors,
      successRate: `${successRate}%`,
      duration: `${duration}s`,
      startTime: stats.startTime.toISOString(),
      endTime: stats.endTime?.toISOString() || '',
    },
    details: {
      ingredientsUpdated: stats.ingredientsUpdated,
      instructionsUpdated: stats.instructionsUpdated,
      ingredientSectionsUpdated: stats.ingredientSectionsUpdated,
      instructionSectionsUpdated: stats.instructionSectionsUpdated,
    },
    errors,
  };
}

/**
 * Save migration report to file
 * Requirement 8.3: Create migration summary report
 */
function saveMigrationReport(report: MigrationReport): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `migration-report-${timestamp}.json`;
  const reportDir = path.join(process.cwd(), 'migration-reports');

  // Create directory if it doesn't exist
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const filepath = path.join(reportDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

  return filepath;
}

/**
 * Main migration function
 * Requirements 8.3, 8.4: Comprehensive logging and error handling
 */
export async function migrateRecipesToExplicitPositions(): Promise<MigrationStats> {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   Recipe Position Migration - Add Explicit Positions      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const stats: MigrationStats = {
    processed: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    startTime: new Date(),
    ingredientsUpdated: 0,
    instructionsUpdated: 0,
    ingredientSectionsUpdated: 0,
    instructionSectionsUpdated: 0,
  };

  const errors: MigrationError[] = [];

  try {
    console.log('🔍 Fetching recipes from database...');

    // Fetch all recipes
    const allRecipes = await db.query.recipes.findMany();

    console.log(`📦 Found ${allRecipes.length} recipes to process\n`);
    console.log('🚀 Starting migration...\n');

    // Process each recipe (Requirement 8.4: Continue on errors)
    for (const recipe of allRecipes) {
      await migrateRecipe(recipe, stats, errors);
    }

    stats.endTime = new Date();

    // Generate migration report (Requirement 8.3)
    const report = generateMigrationReport(stats, errors);

    // Save report to file (Requirement 8.3)
    const reportPath = saveMigrationReport(report);

    // Print summary (Requirement 8.3)
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                   Migration Summary                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`📊 Total Recipes Processed:  ${stats.processed}`);
    console.log(`✅ Recipes Updated:          ${stats.updated}`);
    console.log(`⏭️  Recipes Skipped:          ${stats.skipped} (already had positions)`);
    console.log(`❌ Errors:                   ${stats.errors}`);
    console.log(`⏱️  Duration:                 ${Math.round((stats.endTime.getTime() - stats.startTime.getTime()) / 1000)}s`);
    console.log(`📈 Success Rate:             ${report.summary.successRate}`);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                   Detailed Statistics                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`🥕 Flat Ingredients Updated:        ${stats.ingredientsUpdated}`);
    console.log(`📝 Flat Instructions Updated:       ${stats.instructionsUpdated}`);
    console.log(`📦 Ingredient Sections Updated:     ${stats.ingredientSectionsUpdated}`);
    console.log(`📋 Instruction Sections Updated:    ${stats.instructionSectionsUpdated}`);

    if (errors.length > 0) {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║                      Error Details                         ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      errors.forEach((err, index) => {
        console.log(`${index + 1}. Recipe: "${err.recipeTitle}" (${err.recipeId})`);
        console.log(`   Error: ${err.error}`);
        console.log(`   Time: ${err.timestamp.toISOString()}`);
        if (err.stackTrace) {
          console.log(`   Stack: ${err.stackTrace.split('\n')[0]}`);
        }
        console.log('');
      });

      console.log(`⚠️  Note: ${errors.length} recipe(s) failed but migration continued for others.`);
    }

    console.log(`\n📄 Full report saved to: ${reportPath}`);
    console.log('\n✅ Migration completed successfully!\n');

    return stats;
  } catch (error) {
    console.error('\n❌ Migration failed with critical error:', error);
    
    // Try to save partial report even on critical failure
    try {
      stats.endTime = new Date();
      const report = generateMigrationReport(stats, errors);
      const reportPath = saveMigrationReport(report);
      console.log(`📄 Partial report saved to: ${reportPath}`);
    } catch (reportError) {
      console.error('Failed to save error report:', reportError);
    }
    
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateRecipesToExplicitPositions()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}
