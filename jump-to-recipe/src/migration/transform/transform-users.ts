/**
 * User Transformation Orchestrator
 * 
 * Main script to transform legacy user data.
 * Coordinates user transformation and mapping generation.
 * 
 * Usage:
 *   npx tsx src/migration/transform/transform-users.ts <raw-data-dir>
 * 
 * Example:
 *   npx tsx src/migration/transform/transform-users.ts migration-data/raw/2026-01-23-14-30-00
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { transformUsers } from './user-transformer';
import { generateUserMappingTable, validateUserMapping } from './user-mapping-generator';
import type { LegacyUser } from '../types/extraction';

// ============================================================================
// Main Transformation Function
// ============================================================================

/**
 * Transform users from raw extracted data
 */
export async function transformUsersFromFiles(rawDataDir: string): Promise<void> {
  console.log('\n=== User Transformation ===\n');
  console.log(`Input directory: ${rawDataDir}`);

  // Validate input directory exists
  try {
    await fs.access(rawDataDir);
  } catch (error) {
    throw new Error(`Input directory does not exist: ${rawDataDir}`);
  }

  // Load raw data files
  console.log('\nLoading raw data files...');
  const users = await loadJsonFile<LegacyUser[]>(path.join(rawDataDir, 'users.json'));

  console.log(`✓ Loaded ${users.length} users`);

  // Transform users
  console.log('\nTransforming users...');
  const result = await transformUsers(users);

  console.log(`✓ Transformed ${result.stats.successful} users`);
  console.log(`✓ Generated ${result.mapping.length} user mappings`);
  
  if (result.errors.length > 0) {
    console.warn(`⚠ ${result.errors.length} transformation errors`);
  }

  // Validate mapping
  console.log('\nValidating user mapping...');
  const validation = validateUserMapping(result.mapping);
  
  if (!validation.valid) {
    console.error('✗ Mapping validation failed:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error('User mapping validation failed');
  }
  console.log('✓ User mapping validation passed');

  // Create output directory
  const timestamp = path.basename(rawDataDir);
  const outputDir = path.join('migration-data', 'transformed', timestamp);
  await fs.mkdir(outputDir, { recursive: true });

  // Save transformed users
  console.log('\nSaving transformed users...');
  const usersPath = path.join(outputDir, 'users-normalized.json');
  await fs.writeFile(usersPath, JSON.stringify(result.users, null, 2), 'utf-8');
  console.log(`✓ Saved to: ${usersPath}`);

  // Generate and save user mapping
  console.log('\nGenerating user mapping table...');
  await generateUserMappingTable(result.mapping, outputDir);

  // Save transformation errors if any
  if (result.errors.length > 0) {
    const errorsPath = path.join(outputDir, 'user-transformation-errors.json');
    await fs.writeFile(errorsPath, JSON.stringify(result.errors, null, 2), 'utf-8');
    console.log(`✓ Saved errors to: ${errorsPath}`);
  }

  // Generate transformation report
  const report = {
    timestamp: new Date().toISOString(),
    inputDirectory: rawDataDir,
    outputDirectory: outputDir,
    statistics: result.stats,
    validation: validation,
    errors: result.errors.map((e) => ({
      recordId: e.recordId,
      error: e.error,
    })),
  };

  const reportPath = path.join(outputDir, 'user-transformation-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log('\n=== Transformation Complete ===');
  console.log(`Output directory: ${outputDir}`);
  console.log(`Total users: ${result.stats.total}`);
  console.log(`Successful: ${result.stats.successful}`);
  console.log(`Failed: ${result.stats.failed}`);
  console.log(`Admin users: ${result.stats.adminCount}`);
  console.log(`Regular users: ${result.stats.userCount}`);
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
    console.error('Usage: npx tsx src/migration/transform/transform-users.ts <raw-data-dir>');
    console.error('Example: npx tsx src/migration/transform/transform-users.ts migration-data/raw/2026-01-23-14-30-00');
    process.exit(1);
  }

  const rawDataDir = args[0];

  transformUsersFromFiles(rawDataDir)
    .then(() => {
      console.log('✓ User transformation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ User transformation failed:', error);
      process.exit(1);
    });
}
