/**
 * Export metadata generator
 * Creates checksums, metadata, and manifest files for exported data
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { ExportMetadata } from '../types/extraction';

/**
 * Generate SHA-256 checksum for a file
 */
export function generateChecksum(filePath: string): string {
  const fileBuffer = readFileSync(filePath);
  const hash = createHash('sha256');
  hash.update(fileBuffer);
  return hash.digest('hex');
}

/**
 * Generate checksums for all exported files
 */
export function generateChecksums(outputDir: string, files: string[]): Record<string, string> {
  console.log('\nGenerating checksums...');

  const checksums: Record<string, string> = {};

  for (const file of files) {
    const filePath = join(outputDir, file);
    try {
      const checksum = generateChecksum(filePath);
      checksums[file] = checksum;
      console.log(`✓ ${file}: ${checksum.substring(0, 16)}...`);
    } catch (error) {
      console.error(`✗ Failed to generate checksum for ${file}:`, error);
      checksums[file] = 'ERROR';
    }
  }

  return checksums;
}

/**
 * Create export metadata file
 */
export function createExportMetadata(
  outputDir: string,
  databaseVersion: string,
  recordCounts: {
    users: number;
    recipes: number;
    ingredients: number;
    instructions: number;
    tags: number;
    recipe_tags: number;
    active_storage_attachments: number;
    active_storage_blobs: number;
  },
  checksums: Record<string, string>
): ExportMetadata {
  const metadata: ExportMetadata = {
    exportTimestamp: new Date().toISOString(),
    legacyDatabaseVersion: databaseVersion,
    recordCounts,
    checksums,
    outputDirectory: outputDir,
  };

  // Write metadata to file
  const metadataPath = join(outputDir, 'export-metadata.json');
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

  console.log(`\n✓ Export metadata saved to: ${metadataPath}`);

  return metadata;
}

/**
 * Create manifest file listing all exported files
 */
export function createManifest(
  outputDir: string,
  files: string[],
  checksums: Record<string, string>
): void {
  const manifest = {
    generatedAt: new Date().toISOString(),
    files: files.map((file) => ({
      name: file,
      checksum: checksums[file] || 'UNKNOWN',
      path: join(outputDir, file),
    })),
    totalFiles: files.length,
  };

  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`✓ Manifest file saved to: ${manifestPath}`);
}

/**
 * Save extracted data to JSON files
 */
export function saveToJsonFile(
  outputDir: string,
  filename: string,
  data: any[]
): void {
  const filePath = join(outputDir, filename);
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✓ Saved ${data.length} records to: ${filename}`);
}

/**
 * Create export log file
 */
export function createExportLog(
  outputDir: string,
  logs: string[]
): void {
  const logPath = join(outputDir, 'export-log.txt');
  const logContent = [
    '=== Legacy Recipe Migration - Extraction Log ===',
    `Generated: ${new Date().toISOString()}`,
    '',
    ...logs,
    '',
    '=== End of Log ===',
  ].join('\n');

  writeFileSync(logPath, logContent, 'utf8');
  console.log(`✓ Export log saved to: ${logPath}`);
}

/**
 * Generate complete export package with all metadata
 */
export async function generateExportPackage(
  outputDir: string,
  databaseVersion: string,
  extractedData: {
    users: any[];
    recipes: any[];
    ingredients: any[];
    instructions: any[];
    tags: any[];
    recipeTags: any[];
    activeStorageAttachments: any[];
    activeStorageBlobs: any[];
  },
  logs: string[]
): Promise<ExportMetadata> {
  console.log('\n=== Generating Export Package ===\n');

  // Save all data to JSON files
  saveToJsonFile(outputDir, 'users.json', extractedData.users);
  saveToJsonFile(outputDir, 'recipes.json', extractedData.recipes);
  saveToJsonFile(outputDir, 'ingredients.json', extractedData.ingredients);
  saveToJsonFile(outputDir, 'instructions.json', extractedData.instructions);
  saveToJsonFile(outputDir, 'tags.json', extractedData.tags);
  saveToJsonFile(outputDir, 'recipe_tags.json', extractedData.recipeTags);
  saveToJsonFile(outputDir, 'active_storage_attachments.json', extractedData.activeStorageAttachments);
  saveToJsonFile(outputDir, 'active_storage_blobs.json', extractedData.activeStorageBlobs);

  // Define exported files
  const exportedFiles = [
    'users.json',
    'recipes.json',
    'ingredients.json',
    'instructions.json',
    'tags.json',
    'recipe_tags.json',
    'active_storage_attachments.json',
    'active_storage_blobs.json',
  ];

  // Generate checksums
  const checksums = generateChecksums(outputDir, exportedFiles);

  // Create metadata
  const metadata = createExportMetadata(
    outputDir,
    databaseVersion,
    {
      users: extractedData.users.length,
      recipes: extractedData.recipes.length,
      ingredients: extractedData.ingredients.length,
      instructions: extractedData.instructions.length,
      tags: extractedData.tags.length,
      recipe_tags: extractedData.recipeTags.length,
      active_storage_attachments: extractedData.activeStorageAttachments.length,
      active_storage_blobs: extractedData.activeStorageBlobs.length,
    },
    checksums
  );

  // Create manifest
  createManifest(outputDir, exportedFiles, checksums);

  // Create export log
  createExportLog(outputDir, logs);

  console.log('\n=== Export Package Complete ===\n');

  return metadata;
}
