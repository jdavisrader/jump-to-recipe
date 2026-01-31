/**
 * Example script for user transformation
 * Demonstrates how to transform legacy users and generate mapping tables
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { LegacyUser } from '../types/extraction';
import {
  transformUsers,
  transformUser,
  isValidEmail,
  getUserUuidByLegacyId,
  getUserUuidByEmail,
} from './user-transformer';
import {
  generateUserMappingTable,
  exportUserMappingCsv,
  validateUserMapping,
  saveUserMapping,
  loadUserMapping,
} from './user-mapping-generator';

/**
 * Main transformation function
 * Reads extracted user data, transforms it, and generates mapping tables
 */
export async function runUserTransformation(
  extractedDataDir: string,
  outputDir: string
): Promise<void> {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   User Transformation Pipeline         ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // Step 1: Load extracted user data
    console.log('Step 1: Loading extracted user data...');
    const usersFilePath = path.join(extractedDataDir, 'users.json');
    const usersContent = await fs.readFile(usersFilePath, 'utf-8');
    const legacyUsers: LegacyUser[] = JSON.parse(usersContent);
    console.log(`✓ Loaded ${legacyUsers.length} legacy users\n`);

    // Step 2: Transform users
    console.log('Step 2: Transforming users...');
    const result = await transformUsers(legacyUsers);

    // Step 3: Validate mapping
    console.log('Step 3: Validating user mapping...');
    const validation = validateUserMapping(result.mapping);
    if (!validation.valid) {
      console.error('✗ Mapping validation failed:');
      validation.errors.forEach((error) => console.error(`  - ${error}`));
      throw new Error('User mapping validation failed');
    }
    console.log('✓ User mapping validation passed\n');

    // Step 4: Save transformed users
    console.log('Step 4: Saving transformed users...');
    const transformedDir = path.join(outputDir, 'transformed');
    await fs.mkdir(transformedDir, { recursive: true });

    const usersOutputPath = path.join(transformedDir, 'users-normalized.json');
    await fs.writeFile(
      usersOutputPath,
      JSON.stringify(result.users, null, 2),
      'utf-8'
    );
    console.log(`✓ Transformed users saved to: ${usersOutputPath}\n`);

    // Step 5: Generate mapping table
    console.log('Step 5: Generating user mapping table...');
    await generateUserMappingTable(result.mapping, transformedDir);

    // Step 6: Export CSV for easy viewing
    console.log('Step 6: Exporting mapping as CSV...');
    await exportUserMappingCsv(result.mapping, transformedDir);
    console.log('');

    // Step 7: Save transformation errors if any
    if (result.errors.length > 0) {
      console.log('Step 7: Saving transformation errors...');
      const errorsPath = path.join(transformedDir, 'user-transformation-errors.json');
      await fs.writeFile(
        errorsPath,
        JSON.stringify(result.errors, null, 2),
        'utf-8'
      );
      console.log(`✓ Errors saved to: ${errorsPath}\n`);
    }

    // Step 8: Generate transformation report
    console.log('Step 8: Generating transformation report...');
    const report = {
      timestamp: new Date().toISOString(),
      inputFile: usersFilePath,
      outputDirectory: transformedDir,
      statistics: result.stats,
      validation: validation,
      errors: result.errors.map((e) => ({
        recordId: e.recordId,
        error: e.error,
      })),
    };

    const reportPath = path.join(transformedDir, 'user-transformation-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`✓ Transformation report saved to: ${reportPath}\n`);

    // Summary
    console.log('╔════════════════════════════════════════╗');
    console.log('║   Transformation Summary               ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`Total users processed: ${result.stats.total}`);
    console.log(`Successfully transformed: ${result.stats.successful}`);
    console.log(`Failed: ${result.stats.failed}`);
    console.log(`Admin users: ${result.stats.adminCount}`);
    console.log(`Regular users: ${result.stats.userCount}`);
    console.log(`\nOutput directory: ${transformedDir}`);
    console.log('════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n✗ User transformation failed:');
    console.error(error);
    throw error;
  }
}

/**
 * Example: Transform a single user
 */
export function exampleTransformSingleUser() {
  console.log('\n=== Example: Transform Single User ===\n');

  const legacyUser: LegacyUser = {
    id: 1,
    email: 'john.doe@example.com',
    username: 'johndoe',
    encrypted_password: 'encrypted_hash_here',
    super_user: false,
    created_at: '2020-01-15T10:30:00Z',
    updated_at: '2023-06-20T14:45:00Z',
  };

  console.log('Legacy user:');
  console.log(JSON.stringify(legacyUser, null, 2));

  const transformedUser = transformUser(legacyUser);

  console.log('\nTransformed user:');
  console.log(JSON.stringify(transformedUser, null, 2));
  console.log('');
}

/**
 * Example: Transform user with null username
 */
export function exampleTransformUserWithNullUsername() {
  console.log('\n=== Example: Transform User with Null Username ===\n');

  const legacyUser: LegacyUser = {
    id: 2,
    email: 'jane.smith@example.com',
    username: null,
    encrypted_password: 'encrypted_hash_here',
    super_user: true,
    created_at: '2019-03-10T08:15:00Z',
    updated_at: '2023-12-01T16:20:00Z',
  };

  console.log('Legacy user (null username):');
  console.log(JSON.stringify(legacyUser, null, 2));

  const transformedUser = transformUser(legacyUser);

  console.log('\nTransformed user (name from email prefix):');
  console.log(JSON.stringify(transformedUser, null, 2));
  console.log('');
}

/**
 * Example: Lookup user by legacy ID
 */
export function exampleLookupUserByLegacyId() {
  console.log('\n=== Example: Lookup User by Legacy ID ===\n');

  const mapping = [
    {
      legacyId: 1,
      newUuid: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user1@example.com',
      migrated: false,
      migratedAt: '2026-01-24T12:00:00Z',
    },
    {
      legacyId: 2,
      newUuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      email: 'user2@example.com',
      migrated: false,
      migratedAt: '2026-01-24T12:00:00Z',
    },
  ];

  const legacyId = 1;
  const uuid = getUserUuidByLegacyId(legacyId, mapping);

  console.log(`Legacy ID: ${legacyId}`);
  console.log(`New UUID: ${uuid}`);
  console.log('');
}

/**
 * Example: Lookup user by email
 */
export function exampleLookupUserByEmail() {
  console.log('\n=== Example: Lookup User by Email ===\n');

  const mapping = [
    {
      legacyId: 1,
      newUuid: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user1@example.com',
      migrated: false,
      migratedAt: '2026-01-24T12:00:00Z',
    },
    {
      legacyId: 2,
      newUuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      email: 'user2@example.com',
      migrated: false,
      migratedAt: '2026-01-24T12:00:00Z',
    },
  ];

  const email = 'user2@example.com';
  const uuid = getUserUuidByEmail(email, mapping);

  console.log(`Email: ${email}`);
  console.log(`New UUID: ${uuid}`);
  console.log('');
}

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Running user transformation examples...\n');

  exampleTransformSingleUser();
  exampleTransformUserWithNullUsername();
  exampleLookupUserByLegacyId();
  exampleLookupUserByEmail();

  console.log('Examples complete!\n');
  console.log('To run the full transformation pipeline:');
  console.log('  const extractedDir = "migration-data/raw/2026-01-24-12-00-00";');
  console.log('  const outputDir = "migration-data";');
  console.log('  await runUserTransformation(extractedDir, outputDir);');
}
