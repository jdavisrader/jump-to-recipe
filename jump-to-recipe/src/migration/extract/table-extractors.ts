/**
 * Table extraction functions
 * Extracts data from legacy database tables
 */

import { DatabaseClient } from '../utils/database-client';
import type {
  LegacyUser,
  LegacyRecipe,
  LegacyIngredient,
  LegacyInstruction,
  LegacyTag,
  LegacyRecipeTag,
  LegacyActiveStorageAttachment,
  LegacyActiveStorageBlob,
} from '../types/extraction';

/**
 * Extract all users from legacy database
 */
export async function extractUsers(client: DatabaseClient): Promise<LegacyUser[]> {
  console.log('Extracting users...');

  const query = `
    SELECT 
      id, 
      email, 
      username, 
      encrypted_password, 
      super_user, 
      created_at, 
      updated_at
    FROM users
    ORDER BY id
  `;

  const result = await client.query<LegacyUser>(query);
  const users = result.rows;

  console.log(`✓ Extracted ${users.length} users`);
  return users;
}

/**
 * Extract all recipes from legacy database
 */
export async function extractRecipes(client: DatabaseClient): Promise<LegacyRecipe[]> {
  console.log('Extracting recipes...');

  const query = `
    SELECT 
      id,
      name,
      user_id,
      description,
      servings,
      prep_time,
      prep_time_descriptor,
      cook_time,
      cook_time_descriptor,
      original_url,
      created_at,
      updated_at
    FROM recipes
    ORDER BY id
  `;

  const result = await client.query<LegacyRecipe>(query);
  const recipes = result.rows;

  console.log(`✓ Extracted ${recipes.length} recipes`);
  return recipes;
}

/**
 * Extract all ingredients from legacy database
 */
export async function extractIngredients(
  client: DatabaseClient
): Promise<LegacyIngredient[]> {
  console.log('Extracting ingredients...');

  const query = `
    SELECT 
      id,
      recipe_id,
      order_number,
      ingredient,
      created_at,
      updated_at
    FROM ingredients
    ORDER BY recipe_id, order_number
  `;

  const result = await client.query<LegacyIngredient>(query);
  const ingredients = result.rows;

  console.log(`✓ Extracted ${ingredients.length} ingredients`);
  return ingredients;
}

/**
 * Extract all instructions from legacy database
 */
export async function extractInstructions(
  client: DatabaseClient
): Promise<LegacyInstruction[]> {
  console.log('Extracting instructions...');

  const query = `
    SELECT 
      id,
      recipe_id,
      step_number,
      step,
      created_at,
      updated_at
    FROM instructions
    ORDER BY recipe_id, step_number
  `;

  const result = await client.query<LegacyInstruction>(query);
  const instructions = result.rows;

  console.log(`✓ Extracted ${instructions.length} instructions`);
  return instructions;
}

/**
 * Extract all tags from legacy database
 */
export async function extractTags(client: DatabaseClient): Promise<LegacyTag[]> {
  console.log('Extracting tags...');

  const query = `
    SELECT 
      id,
      name,
      created_at,
      updated_at
    FROM tags
    ORDER BY id
  `;

  const result = await client.query<LegacyTag>(query);
  const tags = result.rows;

  console.log(`✓ Extracted ${tags.length} tags`);
  return tags;
}

/**
 * Extract all recipe-tag associations from legacy database
 */
export async function extractRecipeTags(
  client: DatabaseClient
): Promise<LegacyRecipeTag[]> {
  console.log('Extracting recipe-tag associations...');

  const query = `
    SELECT 
      id,
      recipe_id,
      tag_id,
      created_at,
      updated_at
    FROM recipe_tags
    ORDER BY recipe_id, tag_id
  `;

  const result = await client.query<LegacyRecipeTag>(query);
  const recipeTags = result.rows;

  console.log(`✓ Extracted ${recipeTags.length} recipe-tag associations`);
  return recipeTags;
}

/**
 * Extract Active Storage attachments from legacy database
 */
export async function extractActiveStorageAttachments(
  client: DatabaseClient
): Promise<LegacyActiveStorageAttachment[]> {
  console.log('Extracting Active Storage attachments...');

  const query = `
    SELECT 
      id,
      name,
      record_type,
      record_id,
      blob_id,
      created_at
    FROM active_storage_attachments
    WHERE record_type = 'Recipe'
    ORDER BY record_id, name
  `;

  try {
    const result = await client.query<LegacyActiveStorageAttachment>(query);
    const attachments = result.rows;

    console.log(`✓ Extracted ${attachments.length} Active Storage attachments`);
    return attachments;
  } catch (error) {
    console.warn('⚠ Active Storage attachments table not found or empty, skipping...');
    return [];
  }
}

/**
 * Extract Active Storage blobs from legacy database
 */
export async function extractActiveStorageBlobs(
  client: DatabaseClient
): Promise<LegacyActiveStorageBlob[]> {
  console.log('Extracting Active Storage blobs...');

  const query = `
    SELECT 
      id,
      key,
      filename,
      content_type,
      metadata,
      service_name,
      byte_size,
      checksum,
      created_at
    FROM active_storage_blobs
    ORDER BY id
  `;

  try {
    const result = await client.query<LegacyActiveStorageBlob>(query);
    const blobs = result.rows;

    console.log(`✓ Extracted ${blobs.length} Active Storage blobs`);
    return blobs;
  } catch (error) {
    console.warn('⚠ Active Storage blobs table not found or empty, skipping...');
    return [];
  }
}

/**
 * Extract all tables with progress tracking
 */
export async function extractAllTables(client: DatabaseClient) {
  const startTime = Date.now();

  console.log('\n=== Starting Data Extraction ===\n');

  // Extract each table
  const users = await extractUsers(client);
  const recipes = await extractRecipes(client);
  const ingredients = await extractIngredients(client);
  const instructions = await extractInstructions(client);
  const tags = await extractTags(client);
  const recipeTags = await extractRecipeTags(client);
  const activeStorageAttachments = await extractActiveStorageAttachments(client);
  const activeStorageBlobs = await extractActiveStorageBlobs(client);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n=== Extraction Complete ===');
  console.log(`Total time: ${duration}s`);
  console.log('===========================\n');

  return {
    users,
    recipes,
    ingredients,
    instructions,
    tags,
    recipeTags,
    activeStorageAttachments,
    activeStorageBlobs,
  };
}
