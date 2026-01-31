/**
 * Type definitions for import phase
 */

import type { TransformedRecipe } from './transformation';
import type { TransformedUser } from './transformation';

export interface ImportConfig {
  batchSize: number;
  dryRun: boolean;
  stopOnError: boolean;
  apiBaseUrl: string;
  authToken: string; // Migration user token
  delayBetweenBatches: number; // milliseconds
  maxRetries: number;
  retryBackoffMs: number;
}

export interface ImportResult {
  success: boolean;
  legacyId: number;
  newId?: string;
  error?: string;
  errorType?: 'validation' | 'network' | 'server' | 'unknown';
  retryCount?: number;
}

export interface BatchImportResult {
  batchNumber: number;
  totalBatches: number;
  results: ImportResult[];
  successCount: number;
  failureCount: number;
  duration: number; // milliseconds
}

export interface ImportStats {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  duration: number; // milliseconds
  averageBatchDuration: number;
  errorsByType: Record<string, number>;
}

export interface RecipeMapping {
  legacyId: number;
  newUuid: string;
  title: string;
  migrated: boolean;
  migratedAt: string;
}

export interface ImportReport {
  timestamp: string;
  config: Omit<ImportConfig, 'authToken'>;
  stats: ImportStats;
  successes: ImportResult[];
  failures: ImportResult[];
  skipped: ImportResult[];
  recipeMappings: RecipeMapping[];
}

export type ImportableItem = TransformedRecipe | TransformedUser;
