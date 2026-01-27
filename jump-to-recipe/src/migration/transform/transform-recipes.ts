/**
 * Recipe Transformation Orchestrator
 * 
 * Main script to transform legacy recipe data.
 * Coordinates ingredient parsing, instruction cleaning, and report generation.
 * 
 * Usage:
 *   npx tsx src/migration/transform/transform-recipes.ts <raw-data-dir>
 * 
 * Example:
 *   npx tsx src/migration/transform/transform-recipes.ts migration-data/raw/2026-01-23-14-30-00
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { transformRecipes } from './recipe-transformer';
import { generateAndSaveReports } from './transformation-report-generator';
import type {
  LegacyRecipe,
  LegacyIngredient,
  LegacyInstruction,
  LegacyTag,
  LegacyRecipeTag,
  LegacyActiveStorageAttachment,
  LegacyActiveStorageBlob,
} from '../types/extraction';
import type { UserMapping } from '../types/transformation';

// ============================================================================
// Main Transformation Function
// ============================================================================

/**
 * Transform recipes from raw extracted data
 */
export async function transformRecipesFromFiles(rawDataDir: string): Promise<void> {
  console.log('\n=== Recipe Transformation ===\n');
  console.log(`Input directory: ${rawDataDir}`);

  // Validate input directory exists
  try {
    await fs.access(rawDataDir);
  } catch (error) {
    throw new Error(`Input directory does not exist: ${rawDataDir}`);
  }

  // Load raw data files
  console.log('\nLoading raw data files...');
  const rawRecipes = await loadJsonFile<any[]>(path.join(rawDataDir, 'recipes.json'));
  const rawIngredients = await loadJsonFile<any[]>(path.join(rawDataDir, 'ingredients.json'));
  const rawInstructions = await loadJsonFile<any[]>(path.join(rawDataDir, 'instructions.json'));
  const rawRecipeTags = await loadJsonFile<any[]>(path.join(rawDataDir, 'recipe_tags.json'));
  
  // Load Active Storage data (optional - may not exist in older exports)
  let rawAttachments: any[] = [];
  let rawBlobs: any[] = [];
  try {
    rawAttachments = await loadJsonFile<any[]>(path.join(rawDataDir, 'active_storage_attachments.json'));
    rawBlobs = await loadJsonFile<any[]>(path.join(rawDataDir, 'active_storage_blobs.json'));
    console.log(`✓ Loaded ${rawAttachments.length} Active Storage attachments`);
    console.log(`✓ Loaded ${rawBlobs.length} Active Storage blobs`);
  } catch (error) {
    console.log('ℹ No Active Storage data found (images will be null)');
  }
  
  // Convert string IDs to numbers if needed
  const recipes: LegacyRecipe[] = rawRecipes.map(r => ({
    ...r,
    id: typeof r.id === 'string' ? parseInt(r.id, 10) : r.id,
    user_id: typeof r.user_id === 'string' ? parseInt(r.user_id, 10) : r.user_id,
  }));
  
  const ingredients: LegacyIngredient[] = rawIngredients.map(i => ({
    ...i,
    id: typeof i.id === 'string' ? parseInt(i.id, 10) : i.id,
    recipe_id: typeof i.recipe_id === 'string' ? parseInt(i.recipe_id, 10) : i.recipe_id,
  }));
  
  const instructions: LegacyInstruction[] = rawInstructions.map(i => ({
    ...i,
    id: typeof i.id === 'string' ? parseInt(i.id, 10) : i.id,
    recipe_id: typeof i.recipe_id === 'string' ? parseInt(i.recipe_id, 10) : i.recipe_id,
  }));
  
  const recipeTags: LegacyRecipeTag[] = rawRecipeTags.map(rt => ({
    ...rt,
    id: typeof rt.id === 'string' ? parseInt(rt.id, 10) : rt.id,
    recipe_id: typeof rt.recipe_id === 'string' ? parseInt(rt.recipe_id, 10) : rt.recipe_id,
    tag_id: typeof rt.tag_id === 'string' ? parseInt(rt.tag_id, 10) : rt.tag_id,
  }));
  
  const activeStorageAttachments: LegacyActiveStorageAttachment[] = rawAttachments.map(a => ({
    ...a,
    id: typeof a.id === 'string' ? parseInt(a.id, 10) : a.id,
    record_id: typeof a.record_id === 'string' ? parseInt(a.record_id, 10) : a.record_id,
    blob_id: typeof a.blob_id === 'string' ? parseInt(a.blob_id, 10) : a.blob_id,
  }));
  
  const activeStorageBlobs: LegacyActiveStorageBlob[] = rawBlobs.map(b => ({
    ...b,
    id: typeof b.id === 'string' ? parseInt(b.id, 10) : b.id,
  }));
  
  const tags = await loadJsonFile<LegacyTag[]>(path.join(rawDataDir, 'tags.json'));

  console.log(`✓ Loaded ${recipes.length} recipes`);
  console.log(`✓ Loaded ${ingredients.length} ingredients`);
  console.log(`✓ Loaded ${instructions.length} instructions`);
  console.log(`✓ Loaded ${tags.length} tags`);
  console.log(`✓ Loaded ${recipeTags.length} recipe-tag associations`);

  // Load user mapping from transformed directory
  const transformedDir = rawDataDir.replace('/raw/', '/transformed/');
  const userMappingPath = path.join(transformedDir, 'user-mapping.json');
  
  let userMapping: UserMapping[] = [];
  try {
    const userMappingFile = await loadJsonFile<any>(userMappingPath);
    
    // Handle both array format and object format with mappings property
    if (Array.isArray(userMappingFile)) {
      userMapping = userMappingFile;
    } else if (userMappingFile.mappings && Array.isArray(userMappingFile.mappings)) {
      // Convert string legacyId to number
      userMapping = userMappingFile.mappings.map((m: any) => ({
        ...m,
        legacyId: typeof m.legacyId === 'string' ? parseInt(m.legacyId, 10) : m.legacyId,
      }));
    } else {
      throw new Error('Invalid user mapping format');
    }
    
    console.log(`✓ Loaded ${userMapping.length} user mappings`);
  } catch (error) {
    console.warn('⚠ User mapping file not found. Run user transformation first.');
    console.warn(`  Expected: ${userMappingPath}`);
    throw new Error('User mapping required. Please run user transformation first.');
  }

  // Transform recipes
  const result = await transformRecipes(
    recipes,
    ingredients,
    instructions,
    tags,
    recipeTags,
    userMapping,
    activeStorageAttachments,
    activeStorageBlobs
  );

  // Create output directory
  const timestamp = path.basename(rawDataDir);
  const outputDir = path.join('migration-data', 'transformed', timestamp);
  await fs.mkdir(outputDir, { recursive: true });

  // Generate and save reports
  await generateAndSaveReports(result, outputDir);

  console.log('\n=== Transformation Complete ===');
  console.log(`Output directory: ${outputDir}`);
  console.log('===============================\n');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load JSON file
 */
async function loadJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npx tsx src/migration/transform/transform-recipes.ts <raw-data-dir>');
    console.error('Example: npx tsx src/migration/transform/transform-recipes.ts migration-data/raw/2026-01-23-14-30-00');
    process.exit(1);
  }

  const rawDataDir = args[0];

  transformRecipesFromFiles(rawDataDir)
    .then(() => {
      console.log('✓ Recipe transformation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Recipe transformation failed:', error);
      process.exit(1);
    });
}
