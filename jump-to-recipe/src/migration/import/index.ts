/**
 * Import Phase - Public API
 * 
 * Main exports for the import phase of the migration system.
 */

// Main orchestrator
export { importRecipes, main } from './import-recipes';

// Core components
export { BatchImporter, ApiError, withRetry } from './batch-importer';
export { IdempotencyChecker, createIdempotencyChecker } from './idempotency-checker';
export { UserImporter, createUserImporter } from './user-importer';
export { DryRunValidator } from './dry-run-validator';
export { ProgressTracker, createOrResumeTracker, formatDuration } from './progress-tracker';
export { ImportReportGenerator, createImportReportGenerator } from './import-report-generator';

// Types
export type {
  ImportConfig,
  ImportResult,
  BatchImportResult,
  ImportStats,
  RecipeMapping,
  ImportReport,
  ImportableItem,
} from '../types/import';

export type {
  MigrationPhase,
  MigrationProgress,
  CheckpointData,
} from './progress-tracker';

export type {
  DryRunResult,
  DryRunReport,
} from './dry-run-validator';
