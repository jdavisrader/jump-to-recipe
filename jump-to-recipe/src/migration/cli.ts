#!/usr/bin/env node
/**
 * Migration CLI
 * 
 * Command-line interface for the legacy recipe migration system.
 * Supports running individual phases or the complete pipeline.
 * 
 * Usage:
 *   npm run migrate -- [command] [options]
 * 
 * Commands:
 *   extract      Extract data from legacy database
 *   transform    Transform extracted data
 *   validate     Validate transformed data
 *   import       Import validated data
 *   all          Run complete ETVI pipeline
 * 
 * Options:
 *   --config <path>    Path to config file (default: .env.migration)
 *   --dry-run          Simulate import without writing data
 *   --help             Display help information
 */

import { parseArgs } from 'util';
import * as path from 'path';
import { runMigration } from './orchestrator';
import { extractLegacyData } from './extract/extract-legacy-data';
import { transformUsersFromFiles } from './transform/transform-users';
import { transformRecipesFromFiles } from './transform/transform-recipes';
import { validateRecipes } from './validate/validate-recipes';
import { importRecipes } from './import/import-recipes';
import {
  loadMigrationConfig,
  loadExtractionConfig,
  displayConfigSummary,
  validateConfig,
} from './utils/config-loader';
import type { MigrationPhase } from './types/config';

// ============================================================================
// CLI Configuration
// ============================================================================

const COMMANDS = ['extract', 'transform', 'validate', 'import', 'all'] as const;
type Command = typeof COMMANDS[number];

interface CLIOptions {
  command: Command;
  config?: string;
  dryRun: boolean;
  help: boolean;
  inputDir?: string;
}

// ============================================================================
// Main CLI Entry Point
// ============================================================================

async function main() {
  try {
    // Parse command-line arguments
    const options = parseCommandLine();

    // Display help if requested
    if (options.help) {
      displayHelp();
      process.exit(0);
    }

    // Load configuration
    const config = loadConfiguration(options);

    // Override dry-run if specified
    if (options.dryRun) {
      config.import.dryRun = true;
    }

    // Execute command
    await executeCommand(options, config);

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    console.error('\nRun with --help for usage information\n');
    process.exit(1);
  }
}

// ============================================================================
// Command Execution
// ============================================================================

/**
 * Execute the specified command
 */
async function executeCommand(options: CLIOptions, config: any): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        LEGACY RECIPE MIGRATION - CLI INTERFACE            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  switch (options.command) {
    case 'extract':
      await executeExtract(config);
      break;

    case 'transform':
      await executeTransform(options.inputDir);
      break;

    case 'validate':
      await executeValidate(options.inputDir);
      break;

    case 'import':
      await executeImport(config, options.inputDir);
      break;

    case 'all':
      await executeAll(config);
      break;

    default:
      throw new Error(`Unknown command: ${options.command}`);
  }
}

/**
 * Execute extract phase
 */
async function executeExtract(config: any): Promise<void> {
  console.log('Command: EXTRACT');
  console.log('Description: Extract data from legacy database via SSH tunnel\n');

  const extractionConfig = loadExtractionConfig(config.config);
  const result = await extractLegacyData(extractionConfig);

  if (result.success) {
    console.log('\n✅ Extraction completed successfully');
    console.log(`\nNext step: npm run migrate -- transform ${result.outputDir}\n`);
  } else {
    throw new Error('Extraction failed');
  }
}

/**
 * Execute transform phase
 */
async function executeTransform(inputDir?: string): Promise<void> {
  console.log('Command: TRANSFORM');
  console.log('Description: Transform extracted data to new schema\n');

  // Find input directory if not specified
  if (!inputDir) {
    inputDir = await findLatestDir('migration-data/raw');
    console.log(`Using latest raw data: ${inputDir}\n`);
  }

  // Transform users first
  console.log('Step 1: Transforming users...');
  await transformUsersFromFiles(inputDir);

  // Transform recipes
  console.log('\nStep 2: Transforming recipes...');
  await transformRecipesFromFiles(inputDir);

  const timestamp = path.basename(inputDir);
  const outputDir = path.join('migration-data', 'transformed', timestamp);

  console.log('\n✅ Transformation completed successfully');
  console.log(`\nNext step: npm run migrate -- validate ${outputDir}\n`);
}

/**
 * Execute validate phase
 */
async function executeValidate(inputDir?: string): Promise<void> {
  console.log('Command: VALIDATE');
  console.log('Description: Validate transformed data quality\n');

  // Find input directory if not specified
  if (!inputDir) {
    inputDir = await findLatestDir('migration-data/transformed');
    console.log(`Using latest transformed data: ${inputDir}\n`);
  }

  const timestamp = path.basename(inputDir);
  const outputDir = path.join('migration-data', 'validated', timestamp);

  // Call the validation with proper parameters
  await runValidation(inputDir, outputDir);

  console.log('\n✅ Validation completed successfully');
  console.log(`\nNext step: npm run migrate -- import ${outputDir}\n`);
}

/**
 * Run validation with input and output directories
 */
async function runValidation(transformedDir: string, outputDir: string): Promise<void> {
  const { validateRecipesWithDirs } = await import('./validate/validate-recipes');
  await validateRecipesWithDirs(transformedDir, outputDir);
}

/**
 * Execute import phase
 */
async function executeImport(config: any, inputDir?: string): Promise<void> {
  console.log('Command: IMPORT');
  console.log('Description: Import validated data via API\n');

  // Find input directory if not specified
  if (!inputDir) {
    inputDir = await findLatestDir('migration-data/validated');
    console.log(`Using latest validated data: ${inputDir}\n`);
  }

  // Display configuration
  displayConfigSummary(config);

  if (config.import.dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be imported\n');
  }

  const importConfig = {
    ...config.import,
    maxRetries: 3,
    retryBackoffMs: 1000,
  };

  const timestamp = path.basename(inputDir);
  const outputDir = path.join('migration-data', 'imported', timestamp);

  await importRecipes(importConfig, inputDir, outputDir);

  console.log('\n✅ Import completed successfully\n');
}

/**
 * Execute complete pipeline
 */
async function executeAll(config: any): Promise<void> {
  console.log('Command: ALL');
  console.log('Description: Run complete ETVI pipeline\n');

  // Display configuration
  displayConfigSummary(config);

  // Validate configuration
  validateConfig(config);

  // Confirm before starting
  if (!config.import.dryRun) {
    console.log('⚠️  This will run the complete migration pipeline.');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await sleep(5000);
  }

  // Run complete pipeline
  const phases: MigrationPhase[] = ['extract', 'transform', 'validate', 'import'];
  const summary = await runMigration(config, phases);

  if (summary.overallSuccess) {
    console.log('\n✅ Complete migration pipeline finished successfully\n');
  } else {
    throw new Error('Migration pipeline completed with errors');
  }
}

// ============================================================================
// Argument Parsing
// ============================================================================

/**
 * Parse command-line arguments
 */
function parseCommandLine(): CLIOptions {
  const args = process.argv.slice(2);

  // Extract command (first non-option argument)
  const command = args.find(arg => !arg.startsWith('--')) as Command | undefined;

  if (!command) {
    throw new Error('No command specified. Use --help for usage information.');
  }

  if (!COMMANDS.includes(command)) {
    throw new Error(`Invalid command: ${command}. Valid commands: ${COMMANDS.join(', ')}`);
  }

  // Parse options
  const { values } = parseArgs({
    args,
    options: {
      config: {
        type: 'string',
        short: 'c',
      },
      'dry-run': {
        type: 'boolean',
        default: false,
      },
      help: {
        type: 'boolean',
        short: 'h',
        default: false,
      },
      'input-dir': {
        type: 'string',
        short: 'i',
      },
    },
    allowPositionals: true,
  });

  return {
    command,
    config: values.config,
    dryRun: values['dry-run'] || false,
    help: values.help || false,
    inputDir: values['input-dir'],
  };
}

// ============================================================================
// Configuration Loading
// ============================================================================

/**
 * Load configuration from file or environment
 */
function loadConfiguration(options: CLIOptions): any {
  try {
    // Load from specified config file or default
    const config = loadMigrationConfig(undefined, options.config);

    return config;
  } catch (error) {
    throw new Error(
      `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}\n` +
      `Make sure .env.migration exists and is properly configured.`
    );
  }
}

// ============================================================================
// Help Display
// ============================================================================

/**
 * Display help information
 */
function displayHelp(): void {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║        LEGACY RECIPE MIGRATION - CLI INTERFACE            ║
╚════════════════════════════════════════════════════════════╝

USAGE:
  npm run migrate -- <command> [options]

COMMANDS:
  extract      Extract data from legacy database via SSH tunnel
  transform    Transform extracted data to new schema format
  validate     Validate transformed data quality and detect duplicates
  import       Import validated data into new system via API
  all          Run complete ETVI pipeline (all phases in sequence)

OPTIONS:
  --config, -c <path>    Path to config file (default: .env.migration)
  --dry-run              Simulate import without writing data (import phase only)
  --input-dir, -i <dir>  Input directory for phase (auto-detected if omitted)
  --help, -h             Display this help information

EXAMPLES:
  # Run complete pipeline
  npm run migrate -- all

  # Run individual phases
  npm run migrate -- extract
  npm run migrate -- transform
  npm run migrate -- validate
  npm run migrate -- import

  # Run with custom config
  npm run migrate -- all --config .env.production

  # Dry run import
  npm run migrate -- import --dry-run

  # Specify input directory
  npm run migrate -- transform --input-dir migration-data/raw/2026-01-23-14-30-00

CONFIGURATION:
  Configuration is loaded from .env.migration file by default.
  Copy .env.migration.example to .env.migration and edit with your settings.

  Required environment variables:
    SSH_HOST                    - Remote server hostname
    SSH_USERNAME                - SSH username
    SSH_PRIVATE_KEY_PATH        - Path to SSH private key
    LEGACY_DB_HOST              - Legacy database host (usually localhost)
    LEGACY_DB_NAME              - Legacy database name
    LEGACY_DB_USER              - Legacy database username
    LEGACY_DB_PASSWORD          - Legacy database password
    NEXT_PUBLIC_API_URL         - New application API URL

  Optional environment variables:
    MIGRATION_DRY_RUN           - Enable dry run mode (true/false)
    MIGRATION_BATCH_SIZE        - Import batch size (default: 50)
    MIGRATION_STOP_ON_ERROR     - Stop on first error (true/false)
    MIGRATION_DUPLICATE_STRATEGY - How to handle duplicates (keep-first/keep-all/manual-review)
    MIGRATION_LOG_LEVEL         - Log level (DEBUG/INFO/WARN/ERROR)

WORKFLOW:
  The migration follows a four-phase ETVI pipeline:

  1. EXTRACT  - Connect to legacy database and export data to JSON
  2. TRANSFORM - Parse and normalize data to new schema
  3. VALIDATE - Check data quality and detect duplicates
  4. IMPORT   - Load data into new system via API

  Each phase produces output that feeds into the next phase.
  You can run phases individually or use 'all' to run the complete pipeline.

TROUBLESHOOTING:
  - Ensure SSH key has correct permissions: chmod 600 ~/.ssh/id_rsa
  - Test SSH connection manually: ssh -i ~/.ssh/id_rsa user@host
  - Verify .env.migration file exists and is properly configured
  - Check logs in migration-data/logs/ for detailed error information
  - Use --dry-run flag to test import without writing data

For more information, see: jump-to-recipe/src/migration/README.md
`);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find latest directory in a base path
 */
async function findLatestDir(basePath: string): Promise<string> {
  const fs = await import('fs/promises');
  
  try {
    const entries = await fs.readdir(basePath);
    const dirs = entries.filter(e => e.match(/^\d{4}-\d{2}-\d{2}/));
    
    if (dirs.length === 0) {
      throw new Error(`No directories found in ${basePath}`);
    }

    dirs.sort().reverse();
    return path.join(basePath, dirs[0]);
  } catch (error) {
    throw new Error(`Could not find latest directory in ${basePath}: ${error}`);
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Execute
// ============================================================================

if (require.main === module) {
  main().catch(error => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });
}

export { main as runCLI };
