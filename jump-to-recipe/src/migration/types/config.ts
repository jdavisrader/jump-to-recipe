/**
 * Configuration types for the legacy recipe migration system
 */

import type { ErrorCategory, MigrationPhase } from './errors';

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  privateKeyPath: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface TransformConfig {
  defaultVisibility: 'private' | 'public';
  preserveTimestamps: boolean;
}

export interface ValidationConfig {
  strictMode: boolean;
  duplicateStrategy: 'keep-first' | 'keep-all' | 'manual-review';
}

export interface ImportConfig {
  apiBaseUrl: string;
  batchSize: number;
  delayBetweenBatches: number;
  dryRun: boolean;
  stopOnError: boolean;
  authToken: string;
}

export interface LoggingConfig {
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  verbose: boolean;
  outputDir: string;
}

export interface MigrationUserConfig {
  email: string;
  name: string;
  role: 'admin';
}

export interface ExtractionConfig {
  ssh: SSHConfig;
  database: DatabaseConfig;
  outputDir?: string;
}

export interface MigrationConfig {
  ssh: SSHConfig;
  legacyDb: DatabaseConfig;
  newDb?: DatabaseConfig;
  transform: TransformConfig;
  validation: ValidationConfig;
  import: ImportConfig;
  logging: LoggingConfig;
  migrationUser: MigrationUserConfig;
}

export type { ErrorCategory, MigrationPhase };
