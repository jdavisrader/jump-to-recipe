/**
 * User Mapping Table Generator
 * Generates and saves legacy_id → new_uuid mapping
 * 
 * Requirements: 9.8
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { UserMapping } from '../types/transformation';

/**
 * Save user mapping to JSON file
 * 
 * @param mapping - Array of user mappings
 * @param outputDir - Directory to save the mapping file
 * @returns Path to the saved mapping file
 */
export async function saveUserMapping(
  mapping: UserMapping[],
  outputDir: string
): Promise<string> {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  const mappingFilePath = path.join(outputDir, 'user-mapping.json');

  // Format mapping for readability
  const formattedMapping = JSON.stringify(mapping, null, 2);

  // Write to file
  await fs.writeFile(mappingFilePath, formattedMapping, 'utf-8');

  console.log(`✓ User mapping saved to: ${mappingFilePath}`);
  console.log(`  Total mappings: ${mapping.length}`);

  return mappingFilePath;
}

/**
 * Load user mapping from JSON file
 * 
 * @param mappingFilePath - Path to the mapping file
 * @returns Array of user mappings
 */
export async function loadUserMapping(mappingFilePath: string): Promise<UserMapping[]> {
  try {
    const content = await fs.readFile(mappingFilePath, 'utf-8');
    const mapping = JSON.parse(content) as UserMapping[];
    console.log(`✓ Loaded ${mapping.length} user mappings from: ${mappingFilePath}`);
    return mapping;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load user mapping: ${errorMessage}`);
  }
}

/**
 * Generate user mapping table with additional metadata
 * 
 * @param mapping - Array of user mappings
 * @param outputDir - Directory to save the mapping file
 * @returns Path to the saved mapping file
 */
export async function generateUserMappingTable(
  mapping: UserMapping[],
  outputDir: string
): Promise<string> {
  console.log('\n=== Generating User Mapping Table ===');

  // Create mapping table with metadata
  const mappingTable = {
    generatedAt: new Date().toISOString(),
    totalMappings: mapping.length,
    mappings: mapping,
    index: {
      byLegacyId: Object.fromEntries(
        mapping.map((m) => [m.legacyId, m.newUuid])
      ),
      byEmail: Object.fromEntries(
        mapping.map((m) => [m.email, m.newUuid])
      ),
    },
  };

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  const mappingFilePath = path.join(outputDir, 'user-mapping.json');

  // Write to file with formatting
  await fs.writeFile(
    mappingFilePath,
    JSON.stringify(mappingTable, null, 2),
    'utf-8'
  );

  console.log(`✓ User mapping table generated: ${mappingFilePath}`);
  console.log(`  Total mappings: ${mappingTable.totalMappings}`);
  console.log(`  Indexed by legacy ID: ${Object.keys(mappingTable.index.byLegacyId).length}`);
  console.log(`  Indexed by email: ${Object.keys(mappingTable.index.byEmail).length}`);
  console.log('======================================\n');

  return mappingFilePath;
}

/**
 * Export user mapping as CSV for easy viewing
 * 
 * @param mapping - Array of user mappings
 * @param outputDir - Directory to save the CSV file
 * @returns Path to the saved CSV file
 */
export async function exportUserMappingCsv(
  mapping: UserMapping[],
  outputDir: string
): Promise<string> {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  const csvFilePath = path.join(outputDir, 'user-mapping.csv');

  // Create CSV header
  const header = 'legacy_id,new_uuid,email,migrated,migrated_at\n';

  // Create CSV rows
  const rows = mapping.map((m) => {
    return `${m.legacyId},"${m.newUuid}","${m.email}",${m.migrated},"${m.migratedAt}"`;
  }).join('\n');

  const csvContent = header + rows;

  // Write to file
  await fs.writeFile(csvFilePath, csvContent, 'utf-8');

  console.log(`✓ User mapping CSV exported to: ${csvFilePath}`);

  return csvFilePath;
}

/**
 * Validate user mapping integrity
 * 
 * @param mapping - Array of user mappings
 * @returns Validation result
 */
export function validateUserMapping(mapping: UserMapping[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for duplicate legacy IDs
  const legacyIds = mapping.map((m) => m.legacyId);
  const uniqueLegacyIds = new Set(legacyIds);
  if (legacyIds.length !== uniqueLegacyIds.size) {
    errors.push('Duplicate legacy IDs found in mapping');
  }

  // Check for duplicate UUIDs
  const uuids = mapping.map((m) => m.newUuid);
  const uniqueUuids = new Set(uuids);
  if (uuids.length !== uniqueUuids.size) {
    errors.push('Duplicate UUIDs found in mapping');
  }

  // Check for duplicate emails
  const emails = mapping.map((m) => m.email);
  const uniqueEmails = new Set(emails);
  if (emails.length !== uniqueEmails.size) {
    errors.push('Duplicate emails found in mapping');
  }

  // Check for invalid UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const m of mapping) {
    if (!uuidRegex.test(m.newUuid)) {
      errors.push(`Invalid UUID format for legacy ID ${m.legacyId}: ${m.newUuid}`);
    }
  }

  // Check for invalid emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const m of mapping) {
    if (!emailRegex.test(m.email)) {
      errors.push(`Invalid email format for legacy ID ${m.legacyId}: ${m.email}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
