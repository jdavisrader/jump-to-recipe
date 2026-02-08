/**
 * Migration Orchestrator
 * 
 * Coordinates all four phases of the ETVI pipeline:
 * - Extract: Pull data from legacy database via SSH tunnel
 * - Transform: Normalize and parse legacy data
 * - Validate: Check data quality and detect duplicates
 * - Import: Load data into new system via API
 * 
 * Handles phase transitions, progress tracking, and final summary reporting.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { extractLegacyData } from './extract/extract-legacy-data';
import { transformRecipesFromFiles } from './transform/transform-recipes';
import { transformUsersFromFiles } from './transform/transform-users';
import { validateRecipes } from './validate/validate-recipes';
import { importRecipes } from './import/import-recipes';
import type { MigrationConfig, MigrationPhase } from './types/config';
import type { ExtractionResult } from './types/extraction';

// ============================================================================
// Types
// ============================================================================

interface PhaseResult {
  phase: MigrationPhase;
  success: boolean;
  duration: number;
  outputDir?: string;
  error?: string;
  stats?: Record<string, any>;
}

interface MigrationSummary {
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  phases: PhaseResult[];
  overallSuccess: boolean;
  finalStats: {
    usersExtracted: number;
    recipesExtracted: number;
    recipesTransformed: number;
    recipesPassed: number;
    recipesWarned: number;
    recipesFailed: number;
    recipesImported: number;
    duplicatesDetected: number;
  };
}

// ============================================================================
// Main Orchestrator
// ============================================================================

/**
 * Run the complete ETVI migration pipeline
 */
export async function runMigration(
  config: MigrationConfig,
  phases: MigrationPhase[] = ['extract', 'transform', 'validate', 'import']
): Promise<MigrationSummary> {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     LEGACY RECIPE MIGRATION - FULL ETVI PIPELINE          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const startTime = new Date();
  const phaseResults: PhaseResult[] = [];
  let currentOutputDir: string | undefined;

  try {
    // Display configuration summary
    displayConfigurationSummary(config, phases);

    // Execute each phase in sequence
    for (const phase of phases) {
      const result = await executePhase(phase, config, currentOutputDir);
      phaseResults.push(result);

      if (!result.success) {
        console.error(`\n❌ Phase "${phase}" failed. Stopping pipeline.`);
        break;
      }

      // Update output directory for next phase
      if (result.outputDir) {
        currentOutputDir = result.outputDir;
      }

      // Brief pause between phases
      await sleep(1000);
    }

    // Generate final summary
    const endTime = new Date();
    const summary = await generateMigrationSummary(
      startTime,
      endTime,
      phaseResults,
      currentOutputDir
    );

    // Display final summary
    displayFinalSummary(summary);

    return summary;

  } catch (error) {
    console.error('\n❌ Migration pipeline failed with error:');
    console.error(error);
    throw error;
  }
}

// ============================================================================
// Phase Execution
// ============================================================================

/**
 * Execute a single migration phase
 */
async function executePhase(
  phase: MigrationPhase,
  config: MigrationConfig,
  inputDir?: string
): Promise<PhaseResult> {
  console.log('\n' + '═'.repeat(60));
  console.log(`  PHASE: ${phase.toUpperCase()}`);
  console.log('═'.repeat(60) + '\n');

  const startTime = Date.now();

  try {
    let outputDir: string | undefined;
    const stats: Record<string, any> = {};

    switch (phase) {
      case 'extract':
        outputDir = await executeExtractPhase(config);
        break;

      case 'transform':
        if (!inputDir) {
          inputDir = await findLatestRawDir();
        }
        outputDir = await executeTransformPhase(inputDir);
        break;

      case 'validate':
        if (!inputDir) {
          inputDir = await findLatestTransformedDir();
        }
        outputDir = await executeValidatePhase(inputDir);
        break;

      case 'import':
        if (!inputDir) {
          inputDir = await findLatestValidatedDir();
        }
        outputDir = await executeImportPhase(config, inputDir);
        break;

      default:
        throw new Error(`Unknown phase: ${phase}`);
    }

    const duration = Date.now() - startTime;

    console.log(`\n✅ Phase "${phase}" completed in ${formatDuration(duration)}`);

    return {
      phase,
      success: true,
      duration,
      outputDir,
      stats,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`\n❌ Phase "${phase}" failed after ${formatDuration(duration)}`);
    console.error(`   Error: ${errorMessage}`);

    return {
      phase,
      success: false,
      duration,
      error: errorMessage,
    };
  }
}

/**
 * Execute extraction phase
 */
async function executeExtractPhase(config: MigrationConfig): Promise<string> {
  const extractionConfig = {
    ssh: config.ssh,
    database: config.legacyDb,
    outputDir: config.logging.outputDir,
  };

  const result = await extractLegacyData(extractionConfig);

  if (!result.success || !result.outputDir) {
    throw new Error('Extraction failed');
  }

  return result.outputDir;
}

/**
 * Execute transformation phase
 */
async function executeTransformPhase(rawDataDir: string): Promise<string> {
  // Transform users first (recipes depend on user mappings)
  console.log('Step 1: Transforming users...');
  await transformUsersFromFiles(rawDataDir);

  // Transform recipes
  console.log('\nStep 2: Transforming recipes...');
  await transformRecipesFromFiles(rawDataDir);

  // Return transformed directory
  const timestamp = path.basename(rawDataDir);
  return path.join('migration-data', 'transformed', timestamp);
}

/**
 * Execute validation phase
 */
async function executeValidatePhase(transformedDir: string): Promise<string> {
  const timestamp = path.basename(transformedDir);
  const outputDir = path.join('migration-data', 'validated', timestamp);

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Run validation (this is a wrapper around the existing validate script)
  await validateRecipes();

  return outputDir;
}

/**
 * Execute import phase
 */
async function executeImportPhase(config: MigrationConfig, validatedDir: string): Promise<string> {
  const timestamp = path.basename(validatedDir);
  const outputDir = path.join('migration-data', 'imported', timestamp);

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Run import
  const importConfig = {
    ...config.import,
    apiBaseUrl: config.import.apiBaseUrl,
    authToken: config.import.authToken,
    batchSize: config.import.batchSize,
    delayBetweenBatches: config.import.delayBetweenBatches,
    dryRun: config.import.dryRun,
    stopOnError: config.import.stopOnError,
    maxRetries: 3,
    retryBackoffMs: 1000,
  };

  await importRecipes(importConfig, validatedDir, outputDir);

  return outputDir;
}

// ============================================================================
// Summary Generation
// ============================================================================

/**
 * Generate comprehensive migration summary
 */
async function generateMigrationSummary(
  startTime: Date,
  endTime: Date,
  phases: PhaseResult[],
  finalOutputDir?: string
): Promise<MigrationSummary> {
  const totalDuration = endTime.getTime() - startTime.getTime();
  const overallSuccess = phases.every(p => p.success);

  // Collect statistics from output files
  const finalStats = await collectFinalStatistics(finalOutputDir);

  const summary: MigrationSummary = {
    startTime,
    endTime,
    totalDuration,
    phases,
    overallSuccess,
    finalStats,
  };

  // Save summary to file
  if (finalOutputDir) {
    const summaryPath = path.join(finalOutputDir, 'migration-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n📄 Summary saved to: ${summaryPath}`);
  }

  return summary;
}

/**
 * Collect final statistics from output files
 */
async function collectFinalStatistics(outputDir?: string): Promise<MigrationSummary['finalStats']> {
  const stats: MigrationSummary['finalStats'] = {
    usersExtracted: 0,
    recipesExtracted: 0,
    recipesTransformed: 0,
    recipesPassed: 0,
    recipesWarned: 0,
    recipesFailed: 0,
    recipesImported: 0,
    duplicatesDetected: 0,
  };

  if (!outputDir) {
    return stats;
  }

  try {
    // Try to load validation report
    const validationReportPath = path.join(outputDir, '..', '..', 'validated', path.basename(outputDir), 'validation-report.json');
    try {
      const validationReport = JSON.parse(await fs.readFile(validationReportPath, 'utf-8'));
      stats.recipesPassed = validationReport.stats?.passed || 0;
      stats.recipesWarned = validationReport.stats?.warned || 0;
      stats.recipesFailed = validationReport.stats?.failed || 0;
    } catch {
      // Validation report not found
    }

    // Try to load import report
    const importReportPath = path.join(outputDir, 'import-report.json');
    try {
      const importReport = JSON.parse(await fs.readFile(importReportPath, 'utf-8'));
      stats.recipesImported = importReport.summary?.recipesImported || 0;
    } catch {
      // Import report not found
    }

  } catch (error) {
    console.warn('Could not collect all statistics:', error);
  }

  return stats;
}

// ============================================================================
// Display Functions
// ============================================================================

/**
 * Display configuration summary
 */
function displayConfigurationSummary(config: MigrationConfig, phases: MigrationPhase[]): void {
  console.log('Configuration:');
  console.log(`  Phases to run: ${phases.join(' → ')}`);
  console.log(`  SSH Host: ${config.ssh.host}:${config.ssh.port}`);
  console.log(`  Legacy DB: ${config.legacyDb.database}`);
  console.log(`  API URL: ${config.import.apiBaseUrl}`);
  console.log(`  Batch Size: ${config.import.batchSize}`);
  console.log(`  Dry Run: ${config.import.dryRun ? 'YES' : 'NO'}`);
  console.log(`  Stop on Error: ${config.import.stopOnError ? 'YES' : 'NO'}`);
  console.log(`  Duplicate Strategy: ${config.validation.duplicateStrategy}`);
  console.log(`  Output Directory: ${config.logging.outputDir}`);
  console.log('');
}

/**
 * Display final migration summary
 */
function displayFinalSummary(summary: MigrationSummary): void {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              MIGRATION PIPELINE SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Status: ${summary.overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Total Duration: ${formatDuration(summary.totalDuration)}`);
  console.log(`Start Time: ${summary.startTime.toISOString()}`);
  console.log(`End Time: ${summary.endTime.toISOString()}`);
  console.log('');

  console.log('Phase Results:');
  for (const phase of summary.phases) {
    const icon = phase.success ? '✅' : '❌';
    const duration = formatDuration(phase.duration);
    console.log(`  ${icon} ${phase.phase.toUpperCase().padEnd(12)} - ${duration}`);
    if (phase.error) {
      console.log(`     Error: ${phase.error}`);
    }
  }
  console.log('');

  console.log('Final Statistics:');
  console.log(`  Users Extracted:      ${summary.finalStats.usersExtracted}`);
  console.log(`  Recipes Extracted:    ${summary.finalStats.recipesExtracted}`);
  console.log(`  Recipes Transformed:  ${summary.finalStats.recipesTransformed}`);
  console.log(`  Recipes Passed:       ${summary.finalStats.recipesPassed}`);
  console.log(`  Recipes Warned:       ${summary.finalStats.recipesWarned}`);
  console.log(`  Recipes Failed:       ${summary.finalStats.recipesFailed}`);
  console.log(`  Recipes Imported:     ${summary.finalStats.recipesImported}`);
  console.log(`  Duplicates Detected:  ${summary.finalStats.duplicatesDetected}`);
  console.log('');

  if (summary.overallSuccess) {
    console.log('🎉 Migration completed successfully!');
  } else {
    console.log('⚠️  Migration completed with errors. Review the logs for details.');
  }
  console.log('');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find latest raw data directory
 */
async function findLatestRawDir(): Promise<string> {
  return findLatestDir('migration-data/raw');
}

/**
 * Find latest transformed data directory
 */
async function findLatestTransformedDir(): Promise<string> {
  return findLatestDir('migration-data/transformed');
}

/**
 * Find latest validated data directory
 */
async function findLatestValidatedDir(): Promise<string> {
  return findLatestDir('migration-data/validated');
}

/**
 * Find latest directory in a base path
 */
async function findLatestDir(basePath: string): Promise<string> {
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
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Export
// ============================================================================

export type { MigrationSummary, PhaseResult };
