/**
 * Configuration loader for migration scripts
 * Loads configuration from environment variables and/or JSON config files
 * Supports merging configurations with precedence rules
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { MigrationConfig, ExtractionConfig } from '../types/config';

/**
 * Load migration configuration from environment variables and/or config file
 * @param envPath Optional path to .env file (defaults to .env.migration)
 * @param configPath Optional path to JSON config file
 */
export function loadMigrationConfig(envPath?: string, configPath?: string): MigrationConfig {
  // Load environment variables from .env.migration file
  const envFile = envPath || resolve(process.cwd(), '.env.migration');
  config({ path: envFile });

  // Load from JSON config file if provided
  let fileConfig: Partial<MigrationConfig> | undefined;
  if (configPath) {
    fileConfig = loadConfigFromFile(configPath);
  }

  // Build configuration from environment variables
  const envConfig = loadConfigFromEnv();

  // Merge configurations (file config takes precedence over env)
  const mergedConfig = mergeConfigs(envConfig, fileConfig);

  return mergedConfig;
}

/**
 * Load configuration from environment variables
 */
function loadConfigFromEnv(): MigrationConfig {
  // Validate required environment variables
  const requiredVars = [
    'SSH_HOST',
    'SSH_USERNAME',
    'SSH_PRIVATE_KEY_PATH',
    'LEGACY_DB_HOST',
    'LEGACY_DB_NAME',
    'LEGACY_DB_USER',
    'LEGACY_DB_PASSWORD',
    'NEXT_PUBLIC_API_URL',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        `Please create a .env.migration file based on .env.migration.example`
    );
  }

  // Build configuration object
  const migrationConfig: MigrationConfig = {
    ssh: {
      host: process.env.SSH_HOST!,
      port: parseInt(process.env.SSH_PORT || '22', 10),
      username: process.env.SSH_USERNAME!,
      privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH!,
    },
    legacyDb: {
      host: process.env.LEGACY_DB_HOST!,
      port: parseInt(process.env.LEGACY_DB_PORT || '5432', 10),
      database: process.env.LEGACY_DB_NAME!,
      username: process.env.LEGACY_DB_USER!,
      password: process.env.LEGACY_DB_PASSWORD!,
    },
    transform: {
      defaultVisibility:
        (process.env.MIGRATION_DEFAULT_VISIBILITY as 'private' | 'public') || 'private',
      preserveTimestamps: process.env.MIGRATION_PRESERVE_TIMESTAMPS !== 'false',
    },
    validation: {
      strictMode: process.env.MIGRATION_STRICT_MODE === 'true',
      duplicateStrategy:
        (process.env.MIGRATION_DUPLICATE_STRATEGY as 'keep-first' | 'keep-all' | 'manual-review') ||
        'keep-first',
    },
    import: {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL!,
      batchSize: parseInt(process.env.MIGRATION_BATCH_SIZE || '50', 10),
      delayBetweenBatches: parseInt(process.env.MIGRATION_DELAY_BETWEEN_BATCHES || '100', 10),
      dryRun: process.env.MIGRATION_DRY_RUN === 'true',
      stopOnError: process.env.MIGRATION_STOP_ON_ERROR === 'true',
      authToken: process.env.MIGRATION_AUTH_TOKEN || '',
    },
    logging: {
      level: (process.env.MIGRATION_LOG_LEVEL as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR') || 'INFO',
      verbose: process.env.MIGRATION_VERBOSE === 'true',
      outputDir: process.env.MIGRATION_OUTPUT_DIR || './migration-data',
    },
    migrationUser: {
      email: process.env.MIGRATION_USER_EMAIL || 'migration@example.com',
      name: process.env.MIGRATION_USER_NAME || 'Migration User',
      role: 'admin',
    },
  };

  return migrationConfig;
}

/**
 * Load configuration from JSON file
 */
function loadConfigFromFile(configPath: string): Partial<MigrationConfig> {
  try {
    const absolutePath = resolve(process.cwd(), configPath);
    
    if (!existsSync(absolutePath)) {
      throw new Error(`Config file not found: ${absolutePath}`);
    }

    const fileContent = readFileSync(absolutePath, 'utf-8');
    const config = JSON.parse(fileContent);

    return config;
  } catch (error) {
    throw new Error(
      `Failed to load config file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Merge configurations with precedence
 * File config takes precedence over environment config
 */
function mergeConfigs(
  envConfig: MigrationConfig,
  fileConfig?: Partial<MigrationConfig>
): MigrationConfig {
  if (!fileConfig) {
    return envConfig;
  }

  return {
    ssh: { ...envConfig.ssh, ...fileConfig.ssh },
    legacyDb: { ...envConfig.legacyDb, ...fileConfig.legacyDb },
    newDb: fileConfig.newDb || envConfig.newDb,
    transform: { ...envConfig.transform, ...fileConfig.transform },
    validation: { ...envConfig.validation, ...fileConfig.validation },
    import: { ...envConfig.import, ...fileConfig.import },
    logging: { ...envConfig.logging, ...fileConfig.logging },
    migrationUser: { ...envConfig.migrationUser, ...fileConfig.migrationUser },
  };
}

/**
 * Display configuration summary (without sensitive data)
 */
export function displayConfigSummary(config: MigrationConfig): void {
  console.log('\n=== Migration Configuration ===');
  console.log(`SSH Host: ${config.ssh.host}:${config.ssh.port}`);
  console.log(`SSH User: ${config.ssh.username}`);
  console.log(`Legacy DB: ${config.legacyDb.database} on ${config.legacyDb.host}:${config.legacyDb.port}`);
  console.log(`API URL: ${config.import.apiBaseUrl}`);
  console.log(`Batch Size: ${config.import.batchSize}`);
  console.log(`Dry Run: ${config.import.dryRun ? 'YES' : 'NO'}`);
  console.log(`Stop on Error: ${config.import.stopOnError ? 'YES' : 'NO'}`);
  console.log(`Duplicate Strategy: ${config.validation.duplicateStrategy}`);
  console.log(`Log Level: ${config.logging.level}`);
  console.log(`Output Directory: ${config.logging.outputDir}`);
  console.log('===============================\n');
}

/**
 * Validate configuration values
 */
export function validateConfig(config: MigrationConfig): void {
  const errors: string[] = [];

  // Validate SSH configuration
  if (config.ssh.port < 1 || config.ssh.port > 65535) {
    errors.push('SSH port must be between 1 and 65535');
  }

  // Validate database configuration
  if (config.legacyDb.port < 1 || config.legacyDb.port > 65535) {
    errors.push('Database port must be between 1 and 65535');
  }

  // Validate import configuration
  if (config.import.batchSize < 1 || config.import.batchSize > 1000) {
    errors.push('Batch size must be between 1 and 1000');
  }

  if (config.import.delayBetweenBatches < 0) {
    errors.push('Delay between batches must be non-negative');
  }

  // Validate API URL format
  try {
    new URL(config.import.apiBaseUrl);
  } catch {
    errors.push('API base URL must be a valid URL');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Load extraction-specific configuration
 * @param envPath Optional path to .env file
 */
export function loadExtractionConfig(envPath?: string): ExtractionConfig {
  // Load environment variables
  const envFile = envPath || resolve(process.cwd(), '.env.migration');
  config({ path: envFile });

  // Validate required environment variables for extraction
  const requiredVars = [
    'SSH_HOST',
    'SSH_USERNAME',
    'SSH_PRIVATE_KEY_PATH',
    'LEGACY_DB_HOST',
    'LEGACY_DB_NAME',
    'LEGACY_DB_USER',
    'LEGACY_DB_PASSWORD',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        `Please create a .env.migration file based on .env.migration.example`
    );
  }

  const extractionConfig: ExtractionConfig = {
    ssh: {
      host: process.env.SSH_HOST!,
      port: parseInt(process.env.SSH_PORT || '22', 10),
      username: process.env.SSH_USERNAME!,
      privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH!,
    },
    database: {
      host: process.env.LEGACY_DB_HOST!,
      port: parseInt(process.env.LEGACY_DB_PORT || '5432', 10),
      database: process.env.LEGACY_DB_NAME!,
      username: process.env.LEGACY_DB_USER!,
      password: process.env.LEGACY_DB_PASSWORD!,
    },
    outputDir: process.env.MIGRATION_OUTPUT_DIR || './migration-data',
  };

  return extractionConfig;
}

/**
 * Validate extraction configuration
 */
export function validateExtractionConfig(config: ExtractionConfig): void {
  const errors: string[] = [];

  // Validate SSH configuration
  if (config.ssh.port < 1 || config.ssh.port > 65535) {
    errors.push('SSH port must be between 1 and 65535');
  }

  if (!config.ssh.host || config.ssh.host.trim() === '') {
    errors.push('SSH host is required');
  }

  if (!config.ssh.username || config.ssh.username.trim() === '') {
    errors.push('SSH username is required');
  }

  if (!config.ssh.privateKeyPath || config.ssh.privateKeyPath.trim() === '') {
    errors.push('SSH private key path is required');
  }

  // Validate database configuration
  if (config.database.port < 1 || config.database.port > 65535) {
    errors.push('Database port must be between 1 and 65535');
  }

  if (!config.database.host || config.database.host.trim() === '') {
    errors.push('Database host is required');
  }

  if (!config.database.database || config.database.database.trim() === '') {
    errors.push('Database name is required');
  }

  if (!config.database.username || config.database.username.trim() === '') {
    errors.push('Database username is required');
  }

  if (!config.database.password || config.database.password.trim() === '') {
    errors.push('Database password is required');
  }

  if (errors.length > 0) {
    throw new Error(`Extraction configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Display extraction configuration summary
 */
export function displayExtractionConfigSummary(config: ExtractionConfig): void {
  console.log('\n=== Extraction Configuration ===');
  console.log(`SSH Host: ${config.ssh.host}:${config.ssh.port}`);
  console.log(`SSH User: ${config.ssh.username}`);
  console.log(`SSH Key: ${config.ssh.privateKeyPath}`);
  console.log(`Legacy DB: ${config.database.database} on ${config.database.host}:${config.database.port}`);
  console.log(`Legacy DB User: ${config.database.username}`);
  console.log(`Output Directory: ${config.outputDir || './migration-data'}`);
  console.log('================================\n');
}
