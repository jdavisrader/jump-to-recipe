/**
 * Main extraction script
 * Orchestrates the extraction of legacy recipe data via SSH tunnel
 */

import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createSSHTunnel } from '../utils/ssh-tunnel';
import { createDatabaseClient } from '../utils/database-client';
import {
  loadExtractionConfig,
  validateExtractionConfig,
  displayExtractionConfigSummary,
} from '../utils/config-loader';
import { extractAllTables } from './table-extractors';
import { generateExportPackage } from './metadata-generator';
import type { ExtractionConfig } from '../types/config';
import type { ExtractionResult } from '../types/extraction';

/**
 * Create output directory with timestamp
 */
function createOutputDirectory(baseDir: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/T/, '-')
    .replace(/\..+/, '')
    .replace(/:/g, '-');

  const outputDir = join(baseDir, 'raw', timestamp);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`✓ Created output directory: ${outputDir}`);
  }

  return outputDir;
}

/**
 * Main extraction function
 */
export async function extractLegacyData(
  config: ExtractionConfig
): Promise<ExtractionResult> {
  const logs: string[] = [];
  const errors: string[] = [];

  let tunnel: any = null;
  let dbClient: any = null;

  try {
    // Display configuration
    displayExtractionConfigSummary(config);

    // Validate configuration
    console.log('Validating configuration...');
    validateExtractionConfig(config);
    console.log('✓ Configuration valid\n');

    // Create output directory
    const outputDir = createOutputDirectory(config.outputDir || './migration-data');
    logs.push(`Output directory: ${outputDir}`);

    // Step 1: Establish SSH tunnel
    console.log('=== Step 1: Establishing SSH Tunnel ===\n');
    logs.push('Establishing SSH tunnel...');

    tunnel = await createSSHTunnel(
      {
        ssh: config.ssh,
        localPort: 5433, // Use a different port to avoid conflicts
        remoteHost: config.database.host,
        remotePort: config.database.port,
      },
      3, // max retries
      2000 // retry delay
    );

    logs.push('SSH tunnel established successfully');
    console.log('');

    // Step 2: Connect to database through tunnel
    console.log('=== Step 2: Connecting to Database ===\n');
    logs.push('Connecting to database...');

    dbClient = await createDatabaseClient(
      {
        database: {
          ...config.database,
          host: 'localhost', // Connect through tunnel
          port: 5433, // Local tunnel port
        },
        readOnly: true,
        poolSize: 5,
      },
      3, // max retries
      1000 // retry delay
    );

    logs.push('Database connection established');

    // Get database version
    const version = await dbClient.getVersion();
    logs.push(`Database version: ${version}`);
    console.log('');

    // Step 3: Extract data from all tables
    console.log('=== Step 3: Extracting Data ===\n');
    logs.push('Starting data extraction...');

    const extractedData = await extractAllTables(dbClient);

    logs.push(`Extracted ${extractedData.users.length} users`);
    logs.push(`Extracted ${extractedData.recipes.length} recipes`);
    logs.push(`Extracted ${extractedData.ingredients.length} ingredients`);
    logs.push(`Extracted ${extractedData.instructions.length} instructions`);
    logs.push(`Extracted ${extractedData.tags.length} tags`);
    logs.push(`Extracted ${extractedData.recipeTags.length} recipe-tag associations`);
    logs.push(`Extracted ${extractedData.activeStorageAttachments.length} Active Storage attachments`);
    logs.push(`Extracted ${extractedData.activeStorageBlobs.length} Active Storage blobs`);

    // Step 4: Generate export package
    console.log('=== Step 4: Generating Export Package ===\n');
    logs.push('Generating export package...');

    const metadata = await generateExportPackage(
      outputDir,
      version,
      extractedData,
      logs
    );

    logs.push('Export package generated successfully');

    // Step 5: Cleanup
    console.log('=== Step 5: Cleanup ===\n');
    logs.push('Cleaning up connections...');

    if (dbClient) {
      await dbClient.close();
      logs.push('Database connection closed');
    }

    if (tunnel) {
      await tunnel.close();
      logs.push('SSH tunnel closed');
    }

    // Display summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           EXTRACTION COMPLETED SUCCESSFULLY                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`   Users:        ${metadata.recordCounts.users}`);
    console.log(`   Recipes:      ${metadata.recordCounts.recipes}`);
    console.log(`   Ingredients:  ${metadata.recordCounts.ingredients}`);
    console.log(`   Instructions: ${metadata.recordCounts.instructions}`);
    console.log(`   Tags:         ${metadata.recordCounts.tags}`);
    console.log(`   Recipe-Tags:  ${metadata.recordCounts.recipe_tags}`);
    console.log(`   Attachments:  ${metadata.recordCounts.active_storage_attachments}`);
    console.log(`   Blobs:        ${metadata.recordCounts.active_storage_blobs}`);
    console.log('');
    console.log(`📁 Output Directory: ${outputDir}`);
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Review the exported data in the output directory');
    console.log('   2. Check export-metadata.json for checksums and record counts');
    console.log('   3. Run the transformation script: npm run migration:transform');
    console.log('');

    return {
      success: true,
      metadata,
      outputDir,
      errors: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(errorMessage);
    logs.push(`ERROR: ${errorMessage}`);

    console.error('\n❌ Extraction failed:', errorMessage);
    console.error('');

    // Attempt cleanup even on error
    try {
      if (dbClient) {
        await dbClient.close();
        console.log('✓ Database connection closed');
      }
    } catch (closeError) {
      console.error('Failed to close database connection:', closeError);
    }

    try {
      if (tunnel) {
        await tunnel.close();
        console.log('✓ SSH tunnel closed');
      }
    } catch (closeError) {
      console.error('Failed to close SSH tunnel:', closeError);
    }

    throw error;
  }
}

/**
 * CLI entry point
 */
async function main() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     Legacy Recipe Migration - Data Extraction Script      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Load configuration from environment
    const config = loadExtractionConfig();

    // Run extraction
    const result = await extractLegacyData(config);

    if (result.success) {
      process.exit(0);
    } else {
      console.error('Extraction completed with errors');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error during extraction:');
    console.error(error);
    console.error('');
    console.error('Troubleshooting tips:');
    console.error('  1. Verify SSH credentials and key permissions (chmod 600)');
    console.error('  2. Check that the remote server is accessible');
    console.error('  3. Verify database credentials');
    console.error('  4. Ensure .env.migration file is properly configured');
    console.error('');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
