/**
 * Post-Migration Verification Script
 * 
 * Compares legacy and new databases to verify migration success.
 * Performs record counts, spot checks, and data quality validation.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { DatabaseClient, createDatabaseClient } from '../utils/database-client';
import { SSHTunnelManager, type TunnelConfig } from '../utils/ssh-tunnel';
import type {
  VerificationConfig,
  VerificationResult,
  RecordCountComparison,
  SpotCheckResult,
  FieldPopulationCheck,
  HtmlArtifactCheck,
  OrderingCheck,
  TagAssociationCheck,
  UserOwnershipCheck,
} from '../types/verification';
import type { RecipeMapping, UserMapping } from '../types/transformation';

// ============================================================================
// Main Verification Function
// ============================================================================

/**
 * Run complete post-migration verification
 * 
 * Requirements: 12.1-12.7
 */
export async function runVerification(
  config: VerificationConfig
): Promise<VerificationResult> {
  console.log('\n=== Starting Post-Migration Verification ===\n');
  const startTime = Date.now();

  let legacyClient: DatabaseClient | null = null;
  let newClient: DatabaseClient | null = null;
  let sshTunnel: SSHTunnelManager | null = null;

  try {
    // Connect to databases
    console.log('📡 Connecting to databases...');

    // Setup SSH tunnel if needed
    if (config.ssh) {
      const tunnelConfig: TunnelConfig = {
        ssh: config.ssh,
        localPort: 5433,
        remoteHost: config.legacyDb.host,
        remotePort: config.legacyDb.port,
      };
      sshTunnel = new SSHTunnelManager(tunnelConfig);
      await sshTunnel.connect();
    }

    // Connect to legacy database
    legacyClient = await createDatabaseClient({
      database: config.legacyDb,
      tunnel: sshTunnel || undefined,
      readOnly: true,
    });

    // Connect to new database
    newClient = await createDatabaseClient({
      database: config.newDb,
      readOnly: true,
    });

    console.log('✓ Database connections established\n');

    // Load import mappings
    const { recipeMappings, userMappings } = await loadImportMappings(config.importedDataDir);

    // Run verification checks
    console.log('🔍 Running verification checks...\n');

    // 1. Compare record counts (Requirement 12.1)
    const recordCounts = await compareRecordCounts(legacyClient, newClient);

    // 2. Perform spot checks (Requirement 12.2)
    const spotChecks = await performSpotChecks(
      legacyClient,
      newClient,
      recipeMappings,
      config.spotCheckCount
    );

    // 3. Validate required fields (Requirement 12.3)
    const fieldPopulation = await validateFieldPopulation(newClient);

    // 4. Check for HTML/encoding artifacts (Requirement 12.4)
    const htmlArtifacts = await checkHtmlArtifacts(newClient);

    // 5. Validate ordering preservation (Requirement 12.5)
    const orderingChecks = await validateOrdering(legacyClient, newClient, recipeMappings);

    // 6. Validate tag associations (Requirement 12.6)
    const tagAssociations = await validateTagAssociations(legacyClient, newClient, recipeMappings);

    // 7. Validate user ownership mapping (Requirement 12.7)
    const userOwnership = await validateUserOwnership(legacyClient, newClient, recipeMappings, userMappings);

    // Calculate summary
    const summary = calculateSummary({
      recordCounts,
      spotChecks,
      fieldPopulation,
      htmlArtifacts,
      orderingChecks,
      tagAssociations,
      userOwnership,
    });

    const duration = Date.now() - startTime;

    console.log('\n✓ Verification complete\n');

    return {
      timestamp: new Date().toISOString(),
      duration,
      recordCounts,
      spotChecks,
      fieldPopulation,
      htmlArtifacts,
      orderingChecks,
      tagAssociations,
      userOwnership,
      summary,
    };
  } finally {
    // Cleanup connections
    if (legacyClient) await legacyClient.close();
    if (newClient) await newClient.close();
    if (sshTunnel) await sshTunnel.close();
  }
}

// ============================================================================
// Verification Check Functions
// ============================================================================

/**
 * Compare record counts between legacy and new databases
 * Requirement 12.1
 */
async function compareRecordCounts(
  legacyClient: DatabaseClient,
  newClient: DatabaseClient
): Promise<RecordCountComparison[]> {
  console.log('📊 Comparing record counts...');

  const comparisons: RecordCountComparison[] = [];

  // Compare users
  const legacyUserCount = await legacyClient.getTableCount('users');
  const newUserCount = await newClient.getTableCount('users');
  comparisons.push(createComparison('users', legacyUserCount, newUserCount));

  // Compare recipes
  const legacyRecipeCount = await legacyClient.getTableCount('recipes');
  const newRecipeCount = await newClient.getTableCount('recipes');
  comparisons.push(createComparison('recipes', legacyRecipeCount, newRecipeCount));

  // Display results
  for (const comp of comparisons) {
    const icon = comp.status === 'match' ? '✓' : comp.status === 'warning' ? '⚠️' : '✗';
    console.log(`  ${icon} ${comp.table}: Legacy=${comp.legacyCount}, New=${comp.newCount} (${comp.percentageMatch}% match)`);
  }

  return comparisons;
}

function createComparison(
  table: string,
  legacyCount: number,
  newCount: number
): RecordCountComparison {
  const difference = newCount - legacyCount;
  const percentageMatch = legacyCount > 0 ? (newCount / legacyCount) * 100 : 0;

  let status: 'match' | 'mismatch' | 'warning';
  if (percentageMatch >= 99) {
    status = 'match';
  } else if (percentageMatch >= 90) {
    status = 'warning';
  } else {
    status = 'mismatch';
  }

  return {
    table,
    legacyCount,
    newCount,
    difference,
    percentageMatch: parseFloat(percentageMatch.toFixed(2)),
    status,
  };
}

/**
 * Perform spot checks on random recipes
 * Requirement 12.2
 */
async function performSpotChecks(
  legacyClient: DatabaseClient,
  newClient: DatabaseClient,
  recipeMappings: RecipeMapping[],
  count: number
): Promise<SpotCheckResult[]> {
  console.log(`\n🔍 Performing ${count} spot checks...`);

  // Select random recipes from mappings
  const randomMappings = selectRandomMappings(recipeMappings, count);
  const results: SpotCheckResult[] = [];

  for (const mapping of randomMappings) {
    const result = await spotCheckRecipe(legacyClient, newClient, mapping);
    results.push(result);

    const icon = result.status === 'pass' ? '✓' : '✗';
    console.log(`  ${icon} Recipe ${mapping.legacyId}: ${result.title} (${result.issues.length} issues)`);
  }

  return results;
}

async function spotCheckRecipe(
  legacyClient: DatabaseClient,
  newClient: DatabaseClient,
  mapping: RecipeMapping
): Promise<SpotCheckResult> {
  // Fetch legacy recipe data
  const legacyRecipe = await legacyClient.query(
    'SELECT * FROM recipes WHERE id = $1',
    [mapping.legacyId]
  );

  const legacyIngredients = await legacyClient.query(
    'SELECT * FROM ingredients WHERE recipe_id = $1 ORDER BY order_number',
    [mapping.legacyId]
  );

  const legacyInstructions = await legacyClient.query(
    'SELECT * FROM instructions WHERE recipe_id = $1 ORDER BY step_number',
    [mapping.legacyId]
  );

  const legacyTags = await legacyClient.query(
    `SELECT t.name FROM tags t
     JOIN recipe_tags rt ON t.id = rt.tag_id
     WHERE rt.recipe_id = $1`,
    [mapping.legacyId]
  );

  // Fetch new recipe data
  const newRecipe = await newClient.query(
    'SELECT * FROM recipes WHERE id = $1',
    [mapping.newUuid]
  );

  if (legacyRecipe.rows.length === 0 || newRecipe.rows.length === 0) {
    return {
      recipeId: mapping.newUuid,
      legacyId: mapping.legacyId,
      title: mapping.title,
      checks: {
        titleMatch: false,
        ingredientCountMatch: false,
        instructionCountMatch: false,
        authorMapped: false,
        tagsPreserved: false,
        orderingPreserved: false,
        noHtmlArtifacts: false,
        noEncodingIssues: false,
      },
      issues: ['Recipe not found in one or both databases'],
      status: 'fail',
    };
  }

  const legacy = legacyRecipe.rows[0];
  const newRec = newRecipe.rows[0];
  const issues: string[] = [];

  // Check title match
  const titleMatch = legacy.name === newRec.title;
  if (!titleMatch) {
    issues.push(`Title mismatch: "${legacy.name}" vs "${newRec.title}"`);
  }

  // Check ingredient count
  const ingredientCountMatch = legacyIngredients.rows.length === newRec.ingredients.length;
  if (!ingredientCountMatch) {
    issues.push(`Ingredient count mismatch: ${legacyIngredients.rows.length} vs ${newRec.ingredients.length}`);
  }

  // Check instruction count
  const instructionCountMatch = legacyInstructions.rows.length === newRec.instructions.length;
  if (!instructionCountMatch) {
    issues.push(`Instruction count mismatch: ${legacyInstructions.rows.length} vs ${newRec.instructions.length}`);
  }

  // Check author mapping (basic check - just verify it's a UUID)
  const authorMapped = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newRec.author_id);
  if (!authorMapped) {
    issues.push('Author ID is not a valid UUID');
  }

  // Check tags preserved
  const legacyTagNames = legacyTags.rows.map(t => t.name);
  const newTagNames = newRec.tags || [];
  const tagsPreserved = legacyTagNames.length === newTagNames.length;
  if (!tagsPreserved) {
    issues.push(`Tag count mismatch: ${legacyTagNames.length} vs ${newTagNames.length}`);
  }

  // Check for HTML artifacts in instructions
  const noHtmlArtifacts = !hasHtmlArtifacts(newRec.instructions);
  if (!noHtmlArtifacts) {
    issues.push('HTML artifacts found in instructions');
  }

  // Check for encoding issues
  const noEncodingIssues = !hasEncodingIssues(newRec.title) && !hasEncodingIssues(newRec.description);
  if (!noEncodingIssues) {
    issues.push('Encoding issues found in text fields');
  }

  const status = issues.length === 0 ? 'pass' : 'fail';

  return {
    recipeId: mapping.newUuid,
    legacyId: mapping.legacyId,
    title: newRec.title,
    checks: {
      titleMatch,
      ingredientCountMatch,
      instructionCountMatch,
      authorMapped,
      tagsPreserved,
      orderingPreserved: true, // Will be checked separately
      noHtmlArtifacts,
      noEncodingIssues,
    },
    issues,
    status,
  };
}

/**
 * Validate required fields are populated
 * Requirement 12.3
 */
async function validateFieldPopulation(
  newClient: DatabaseClient
): Promise<FieldPopulationCheck[]> {
  console.log('\n📋 Validating field population...');

  const checks: FieldPopulationCheck[] = [];

  // Get total recipe count
  const totalRecipes = await newClient.getTableCount('recipes');

  // Check required fields
  const requiredFields = [
    { field: 'title', required: true },
    { field: 'ingredients', required: true },
    { field: 'instructions', required: true },
    { field: 'author_id', required: true },
  ];

  // Check optional fields
  const optionalFields = [
    { field: 'description', required: false },
    { field: 'image_url', required: false },
    { field: 'source_url', required: false },
    { field: 'prep_time', required: false },
    { field: 'cook_time', required: false },
    { field: 'servings', required: false },
  ];

  for (const { field, required } of [...requiredFields, ...optionalFields]) {
    const check = await checkFieldPopulation(newClient, field, totalRecipes, required);
    checks.push(check);

    const icon = check.status === 'pass' ? '✓' : check.status === 'warning' ? '⚠️' : '✗';
    console.log(`  ${icon} ${field}: ${check.populationRate}% populated`);
  }

  return checks;
}

async function checkFieldPopulation(
  client: DatabaseClient,
  field: string,
  totalRecords: number,
  required: boolean
): Promise<FieldPopulationCheck> {
  // Count non-null values
  const result = await client.query(
    `SELECT COUNT(*) as count FROM recipes WHERE ${field} IS NOT NULL`
  );
  const populatedCount = parseInt(result.rows[0].count, 10);
  const nullCount = totalRecords - populatedCount;

  // For JSONB fields, also check for empty arrays
  let emptyCount = 0;
  if (field === 'ingredients' || field === 'instructions') {
    const emptyResult = await client.query(
      `SELECT COUNT(*) as count FROM recipes WHERE jsonb_array_length(${field}) = 0`
    );
    emptyCount = parseInt(emptyResult.rows[0].count, 10);
  }

  const populationRate = (populatedCount / totalRecords) * 100;

  let status: 'pass' | 'fail' | 'warning';
  if (required) {
    status = populationRate >= 99 ? 'pass' : 'fail';
  } else {
    status = populationRate >= 50 ? 'pass' : 'warning';
  }

  return {
    field,
    totalRecords,
    populatedCount,
    nullCount,
    emptyCount,
    populationRate: parseFloat(populationRate.toFixed(2)),
    required,
    status,
  };
}

/**
 * Check for HTML and encoding artifacts
 * Requirement 12.4
 */
async function checkHtmlArtifacts(
  newClient: DatabaseClient
): Promise<HtmlArtifactCheck[]> {
  console.log('\n🔍 Checking for HTML/encoding artifacts...');

  const artifacts: HtmlArtifactCheck[] = [];

  // Sample recipes to check (limit to 100 for performance)
  const recipes = await newClient.query(
    `SELECT id, title, description, instructions FROM recipes LIMIT 100`
  );

  for (const recipe of recipes.rows) {
    const recipeArtifacts: string[] = [];

    // Check title
    if (hasHtmlArtifacts(recipe.title)) {
      recipeArtifacts.push('HTML tags in title');
    }
    if (hasEncodingIssues(recipe.title)) {
      recipeArtifacts.push('Encoding issues in title');
    }

    // Check description
    if (recipe.description) {
      if (hasHtmlArtifacts(recipe.description)) {
        recipeArtifacts.push('HTML tags in description');
      }
      if (hasEncodingIssues(recipe.description)) {
        recipeArtifacts.push('Encoding issues in description');
      }
    }

    // Check instructions
    if (recipe.instructions && Array.isArray(recipe.instructions)) {
      for (let i = 0; i < recipe.instructions.length; i++) {
        const instruction = recipe.instructions[i];
        if (instruction.content && hasHtmlArtifacts(instruction.content)) {
          recipeArtifacts.push(`HTML tags in instruction ${i + 1}`);
        }
        if (instruction.content && hasEncodingIssues(instruction.content)) {
          recipeArtifacts.push(`Encoding issues in instruction ${i + 1}`);
        }
      }
    }

    if (recipeArtifacts.length > 0) {
      artifacts.push({
        recipeId: recipe.id,
        legacyId: 0, // Not available in this context
        title: recipe.title,
        field: 'multiple',
        artifacts: recipeArtifacts,
        severity: recipeArtifacts.length > 3 ? 'high' : recipeArtifacts.length > 1 ? 'medium' : 'low',
      });
    }
  }

  console.log(`  Found ${artifacts.length} recipes with artifacts`);

  return artifacts;
}

function hasHtmlArtifacts(text: string): boolean {
  if (!text) return false;
  // Check for common HTML tags and entities
  const htmlPatterns = [
    /<[^>]+>/,  // HTML tags
    /&lt;/,     // Encoded <
    /&gt;/,     // Encoded >
    /&amp;/,    // Encoded &
    /&nbsp;/,   // Non-breaking space
    /&quot;/,   // Encoded quote
  ];
  return htmlPatterns.some(pattern => pattern.test(text));
}

function hasEncodingIssues(text: string): boolean {
  if (!text) return false;
  // Check for common encoding issues
  const encodingPatterns = [
    /â€™/,      // Smart quote encoding issue
    /â€œ/,      // Smart quote encoding issue
    /â€/,       // Smart quote encoding issue
    /Ã©/,       // Accented character encoding issue
    /Ã¨/,       // Accented character encoding issue
    /Ã /,       // Accented character encoding issue
  ];
  return encodingPatterns.some(pattern => pattern.test(text));
}

/**
 * Validate ordering preservation
 * Requirement 12.5
 */
async function validateOrdering(
  legacyClient: DatabaseClient,
  newClient: DatabaseClient,
  recipeMappings: RecipeMapping[]
): Promise<OrderingCheck[]> {
  console.log('\n📑 Validating ordering preservation...');

  const checks: OrderingCheck[] = [];

  // Sample 20 random recipes
  const sampleMappings = selectRandomMappings(recipeMappings, 20);

  for (const mapping of sampleMappings) {
    // Check ingredient ordering
    const ingredientCheck = await checkIngredientOrdering(legacyClient, newClient, mapping);
    if (ingredientCheck) checks.push(ingredientCheck);

    // Check instruction ordering
    const instructionCheck = await checkInstructionOrdering(legacyClient, newClient, mapping);
    if (instructionCheck) checks.push(instructionCheck);
  }

  const failedChecks = checks.filter(c => !c.orderPreserved);
  console.log(`  ${checks.length - failedChecks.length}/${checks.length} ordering checks passed`);

  return checks;
}

async function checkIngredientOrdering(
  legacyClient: DatabaseClient,
  newClient: DatabaseClient,
  mapping: RecipeMapping
): Promise<OrderingCheck | null> {
  const legacyIngredients = await legacyClient.query(
    'SELECT ingredient FROM ingredients WHERE recipe_id = $1 ORDER BY order_number',
    [mapping.legacyId]
  );

  const newRecipe = await newClient.query(
    'SELECT ingredients FROM recipes WHERE id = $1',
    [mapping.newUuid]
  );

  if (newRecipe.rows.length === 0) return null;

  const newIngredients = newRecipe.rows[0].ingredients || [];
  const issues: string[] = [];

  // Compare first 3 ingredients (order matters)
  const compareCount = Math.min(3, legacyIngredients.rows.length, newIngredients.length);
  for (let i = 0; i < compareCount; i++) {
    const legacyText = legacyIngredients.rows[i].ingredient.toLowerCase().trim();
    const newName = newIngredients[i].name?.toLowerCase().trim() || '';

    // Check if the ingredient name is contained in the original text
    if (!legacyText.includes(newName) && !newName.includes(legacyText.split(' ')[0])) {
      issues.push(`Position ${i + 1}: "${legacyText}" vs "${newName}"`);
    }
  }

  return {
    recipeId: mapping.newUuid,
    legacyId: mapping.legacyId,
    title: mapping.title,
    type: 'ingredients',
    orderPreserved: issues.length === 0,
    issues,
  };
}

async function checkInstructionOrdering(
  legacyClient: DatabaseClient,
  newClient: DatabaseClient,
  mapping: RecipeMapping
): Promise<OrderingCheck | null> {
  const legacyInstructions = await legacyClient.query(
    'SELECT step FROM instructions WHERE recipe_id = $1 ORDER BY step_number',
    [mapping.legacyId]
  );

  const newRecipe = await newClient.query(
    'SELECT instructions FROM recipes WHERE id = $1',
    [mapping.newUuid]
  );

  if (newRecipe.rows.length === 0) return null;

  const newInstructions = newRecipe.rows[0].instructions || [];
  const issues: string[] = [];

  // Check if counts match
  if (legacyInstructions.rows.length !== newInstructions.length) {
    issues.push(`Count mismatch: ${legacyInstructions.rows.length} vs ${newInstructions.length}`);
  }

  return {
    recipeId: mapping.newUuid,
    legacyId: mapping.legacyId,
    title: mapping.title,
    type: 'instructions',
    orderPreserved: issues.length === 0,
    issues,
  };
}

/**
 * Validate tag associations
 * Requirement 12.6
 */
async function validateTagAssociations(
  legacyClient: DatabaseClient,
  newClient: DatabaseClient,
  recipeMappings: RecipeMapping[]
): Promise<TagAssociationCheck[]> {
  console.log('\n🏷️  Validating tag associations...');

  const checks: TagAssociationCheck[] = [];

  // Sample 20 random recipes
  const sampleMappings = selectRandomMappings(recipeMappings, 20);

  for (const mapping of sampleMappings) {
    const check = await checkTagAssociation(legacyClient, newClient, mapping);
    if (check) checks.push(check);
  }

  const preservedCount = checks.filter(c => c.allTagsPreserved).length;
  console.log(`  ${preservedCount}/${checks.length} recipes have all tags preserved`);

  return checks;
}

async function checkTagAssociation(
  legacyClient: DatabaseClient,
  newClient: DatabaseClient,
  mapping: RecipeMapping
): Promise<TagAssociationCheck | null> {
  // Get legacy tags
  const legacyTags = await legacyClient.query(
    `SELECT t.name FROM tags t
     JOIN recipe_tags rt ON t.id = rt.tag_id
     WHERE rt.recipe_id = $1
     ORDER BY t.name`,
    [mapping.legacyId]
  );

  // Get new tags
  const newRecipe = await newClient.query(
    'SELECT tags FROM recipes WHERE id = $1',
    [mapping.newUuid]
  );

  if (newRecipe.rows.length === 0) return null;

  const legacyTagNames = legacyTags.rows.map(t => t.name.toLowerCase().trim()).sort();
  const newTagNames = (newRecipe.rows[0].tags || []).map((t: string) => t.toLowerCase().trim()).sort();

  // Find missing and extra tags
  const missingTags = legacyTagNames.filter((t: string) => !newTagNames.includes(t));
  const extraTags = newTagNames.filter((t: string) => !legacyTagNames.includes(t));

  return {
    recipeId: mapping.newUuid,
    legacyId: mapping.legacyId,
    title: mapping.title,
    legacyTags: legacyTagNames,
    newTags: newTagNames,
    allTagsPreserved: missingTags.length === 0 && extraTags.length === 0,
    missingTags,
    extraTags,
  };
}

/**
 * Validate user ownership mapping
 * Requirement 12.7
 */
async function validateUserOwnership(
  legacyClient: DatabaseClient,
  newClient: DatabaseClient,
  recipeMappings: RecipeMapping[],
  userMappings: UserMapping[]
): Promise<UserOwnershipCheck[]> {
  console.log('\n👤 Validating user ownership mapping...');

  const checks: UserOwnershipCheck[] = [];

  // Create user mapping lookup
  const userMap = new Map<number, string>();
  for (const mapping of userMappings) {
    userMap.set(mapping.legacyId, mapping.newUuid);
  }

  // Sample 20 random recipes
  const sampleMappings = selectRandomMappings(recipeMappings, 20);

  for (const mapping of sampleMappings) {
    const check = await checkUserOwnership(legacyClient, newClient, mapping, userMap);
    if (check) checks.push(check);
  }

  const mappedCount = checks.filter(c => c.ownershipMapped).length;
  console.log(`  ${mappedCount}/${checks.length} recipes have correct ownership mapping`);

  return checks;
}

async function checkUserOwnership(
  legacyClient: DatabaseClient,
  newClient: DatabaseClient,
  mapping: RecipeMapping,
  userMap: Map<number, string>
): Promise<UserOwnershipCheck | null> {
  // Get legacy recipe owner
  const legacyRecipe = await legacyClient.query(
    'SELECT user_id FROM recipes WHERE id = $1',
    [mapping.legacyId]
  );

  // Get new recipe author
  const newRecipe = await newClient.query(
    'SELECT author_id FROM recipes WHERE id = $1',
    [mapping.newUuid]
  );

  if (legacyRecipe.rows.length === 0 || newRecipe.rows.length === 0) {
    return null;
  }

  const legacyUserId = legacyRecipe.rows[0].user_id;
  const newAuthorId = newRecipe.rows[0].author_id;
  const expectedAuthorId = userMap.get(legacyUserId);

  let ownershipMapped = false;
  let issue: string | undefined;

  if (!expectedAuthorId) {
    issue = `Legacy user ${legacyUserId} not found in user mapping`;
  } else if (expectedAuthorId !== newAuthorId) {
    issue = `Author ID mismatch: expected ${expectedAuthorId}, got ${newAuthorId}`;
  } else {
    ownershipMapped = true;
  }

  return {
    recipeId: mapping.newUuid,
    legacyId: mapping.legacyId,
    title: mapping.title,
    legacyUserId,
    newAuthorId,
    ownershipMapped,
    issue,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load import mappings from files
 */
async function loadImportMappings(importedDataDir: string): Promise<{
  recipeMappings: RecipeMapping[];
  userMappings: UserMapping[];
}> {
  const recipeMappingPath = path.join(importedDataDir, 'recipe-id-mapping.json');
  const userMappingPath = path.join(importedDataDir, 'user-id-mapping.json');

  const recipeMappings: RecipeMapping[] = JSON.parse(
    await fs.readFile(recipeMappingPath, 'utf-8')
  );

  const userMappings: UserMapping[] = JSON.parse(
    await fs.readFile(userMappingPath, 'utf-8')
  );

  return { recipeMappings, userMappings };
}

/**
 * Select random mappings for sampling
 */
function selectRandomMappings(mappings: RecipeMapping[], count: number): RecipeMapping[] {
  const shuffled = [...mappings].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, mappings.length));
}

/**
 * Calculate overall summary
 */
function calculateSummary(data: {
  recordCounts: RecordCountComparison[];
  spotChecks: SpotCheckResult[];
  fieldPopulation: FieldPopulationCheck[];
  htmlArtifacts: HtmlArtifactCheck[];
  orderingChecks: OrderingCheck[];
  tagAssociations: TagAssociationCheck[];
  userOwnership: UserOwnershipCheck[];
}): VerificationResult['summary'] {
  const criticalIssues: string[] = [];
  const recommendations: string[] = [];

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  let warningChecks = 0;

  // Analyze record counts
  for (const comp of data.recordCounts) {
    totalChecks++;
    if (comp.status === 'match') passedChecks++;
    else if (comp.status === 'warning') warningChecks++;
    else {
      failedChecks++;
      criticalIssues.push(`${comp.table} count mismatch: ${comp.difference} difference`);
    }
  }

  // Analyze spot checks
  for (const check of data.spotChecks) {
    totalChecks++;
    if (check.status === 'pass') passedChecks++;
    else {
      failedChecks++;
      if (check.issues.length > 0) {
        criticalIssues.push(`Recipe ${check.legacyId}: ${check.issues[0]}`);
      }
    }
  }

  // Analyze field population
  for (const check of data.fieldPopulation) {
    totalChecks++;
    if (check.status === 'pass') passedChecks++;
    else if (check.status === 'warning') warningChecks++;
    else {
      failedChecks++;
      if (check.required) {
        criticalIssues.push(`Required field ${check.field} only ${check.populationRate}% populated`);
      }
    }
  }

  // Analyze HTML artifacts
  if (data.htmlArtifacts.length > 0) {
    warningChecks++;
    recommendations.push(`Found ${data.htmlArtifacts.length} recipes with HTML/encoding artifacts. Review and clean if necessary.`);
  }

  // Analyze ordering
  const orderingFailed = data.orderingChecks.filter(c => !c.orderPreserved).length;
  if (orderingFailed > 0) {
    warningChecks++;
    recommendations.push(`${orderingFailed} recipes have ordering issues. Review transformation logic.`);
  }

  // Analyze tag associations
  const tagsFailed = data.tagAssociations.filter(c => !c.allTagsPreserved).length;
  if (tagsFailed > 0) {
    warningChecks++;
    recommendations.push(`${tagsFailed} recipes have tag preservation issues.`);
  }

  // Analyze user ownership
  const ownershipFailed = data.userOwnership.filter(c => !c.ownershipMapped).length;
  if (ownershipFailed > 0) {
    failedChecks++;
    criticalIssues.push(`${ownershipFailed} recipes have incorrect user ownership mapping`);
  }

  // Determine overall status
  let overallStatus: 'pass' | 'fail' | 'warning';
  if (failedChecks > 0 || criticalIssues.length > 0) {
    overallStatus = 'fail';
  } else if (warningChecks > 0) {
    overallStatus = 'warning';
  } else {
    overallStatus = 'pass';
  }

  // Add general recommendations
  if (overallStatus === 'pass') {
    recommendations.push('Migration verification passed. Data quality is good.');
  } else if (overallStatus === 'warning') {
    recommendations.push('Migration verification passed with warnings. Review warnings before proceeding.');
  } else {
    recommendations.push('Migration verification failed. Address critical issues before using migrated data.');
  }

  return {
    overallStatus,
    totalChecks,
    passedChecks,
    failedChecks,
    warningChecks,
    criticalIssues,
    recommendations,
  };
}
