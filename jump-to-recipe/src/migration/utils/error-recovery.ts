/**
 * Error recovery and graceful shutdown for migration operations
 */

import * as fs from 'fs';
import * as path from 'path';
import { MigrationError, type MigrationPhase } from '../types/errors';
import { logger } from './logger';

export interface RecoveryState {
  phase: MigrationPhase;
  timestamp: string;
  error: {
    message: string;
    category: string;
    stack?: string;
  };
  progress: {
    totalRecords: number;
    processedRecords: number;
    succeededRecords: number;
    failedRecords: number;
  };
  checkpoint?: any;
  metadata?: Record<string, any>;
}

export interface ErrorRecoveryConfig {
  stopOnError: boolean;
  saveStateOnError: boolean;
  outputDir: string;
}

class ErrorRecoveryManager {
  private config: ErrorRecoveryConfig;
  private shutdownHandlers: Array<() => Promise<void>> = [];
  private isShuttingDown = false;

  constructor(config: ErrorRecoveryConfig) {
    this.config = config;
    this.setupSignalHandlers();
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        if (this.isShuttingDown) {
          logger.warn('Forced shutdown - second signal received');
          process.exit(1);
        }

        logger.info(`Received ${signal}, initiating graceful shutdown...`);
        await this.gracefulShutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });
      await this.gracefulShutdown('uncaughtException');
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled promise rejection', {
        reason: String(reason),
        promise: String(promise),
      });
      await this.gracefulShutdown('unhandledRejection');
      process.exit(1);
    });
  }

  /**
   * Register a cleanup handler to be called on shutdown
   */
  registerShutdownHandler(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }

  /**
   * Perform graceful shutdown
   */
  async gracefulShutdown(reason: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info('Starting graceful shutdown', { reason });

    // Execute all shutdown handlers
    for (const handler of this.shutdownHandlers) {
      try {
        await handler();
      } catch (error) {
        logger.error('Error during shutdown handler execution', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Close logger
    await logger.close();

    logger.info('Graceful shutdown complete');
  }

  /**
   * Save recovery state to disk
   */
  async saveRecoveryState(state: RecoveryState): Promise<string> {
    if (!this.config.saveStateOnError) {
      return '';
    }

    const recoveryDir = path.join(this.config.outputDir, 'recovery');

    // Create recovery directory if it doesn't exist
    if (!fs.existsSync(recoveryDir)) {
      fs.mkdirSync(recoveryDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `recovery-${state.phase}-${timestamp}.json`;
    const filepath = path.join(recoveryDir, filename);

    // Write state to file
    fs.writeFileSync(filepath, JSON.stringify(state, null, 2));

    logger.info('Recovery state saved', { filepath });
    return filepath;
  }

  /**
   * Load recovery state from disk
   */
  loadRecoveryState(filepath: string): RecoveryState | null {
    try {
      if (!fs.existsSync(filepath)) {
        logger.warn('Recovery state file not found', { filepath });
        return null;
      }

      const content = fs.readFileSync(filepath, 'utf-8');
      const state = JSON.parse(content) as RecoveryState;

      logger.info('Recovery state loaded', { filepath });
      return state;
    } catch (error) {
      logger.error('Failed to load recovery state', {
        filepath,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * List available recovery states
   */
  listRecoveryStates(): string[] {
    const recoveryDir = path.join(this.config.outputDir, 'recovery');

    if (!fs.existsSync(recoveryDir)) {
      return [];
    }

    return fs
      .readdirSync(recoveryDir)
      .filter((file) => file.startsWith('recovery-') && file.endsWith('.json'))
      .map((file) => path.join(recoveryDir, file));
  }

  /**
   * Handle error based on configuration
   */
  async handleError(
    error: MigrationError,
    state: Partial<RecoveryState>
  ): Promise<void> {
    logger.error('Migration error occurred', {
      error: error.toJSON(),
      stopOnError: this.config.stopOnError,
    });

    // Save recovery state if configured
    if (this.config.saveStateOnError) {
      const recoveryState: RecoveryState = {
        phase: error.phase,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          category: error.category,
          stack: error.stack,
        },
        progress: state.progress || {
          totalRecords: 0,
          processedRecords: 0,
          succeededRecords: 0,
          failedRecords: 0,
        },
        checkpoint: state.checkpoint,
        metadata: state.metadata,
      };

      await this.saveRecoveryState(recoveryState);
    }

    // Stop execution if configured
    if (this.config.stopOnError) {
      logger.error('Stopping execution due to error (stopOnError=true)');
      await this.gracefulShutdown('error');
      process.exit(1);
    } else {
      logger.warn('Continuing execution despite error (stopOnError=false)');
    }
  }

  /**
   * Execute operation with error recovery
   */
  async withErrorRecovery<T>(
    operation: () => Promise<T>,
    phase: MigrationPhase,
    state: Partial<RecoveryState> = {}
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const migrationError =
        error instanceof MigrationError
          ? error
          : new MigrationError(
              error instanceof Error ? error.message : String(error),
              'UNKNOWN_ERROR',
              phase,
              false
            );

      await this.handleError(migrationError, { ...state, phase });
      throw migrationError;
    }
  }

  /**
   * Check if currently shutting down
   */
  isShuttingDownNow(): boolean {
    return this.isShuttingDown;
  }
}

// Export singleton instance
let recoveryManager: ErrorRecoveryManager | null = null;

/**
 * Initialize error recovery manager
 */
export function initializeErrorRecovery(
  config: ErrorRecoveryConfig
): ErrorRecoveryManager {
  recoveryManager = new ErrorRecoveryManager(config);
  return recoveryManager;
}

/**
 * Get error recovery manager instance
 */
export function getErrorRecovery(): ErrorRecoveryManager {
  if (!recoveryManager) {
    throw new Error('Error recovery manager not initialized');
  }
  return recoveryManager;
}

/**
 * Create recovery state from progress data
 */
export function createRecoveryState(
  phase: MigrationPhase,
  progress: RecoveryState['progress'],
  checkpoint?: any,
  metadata?: Record<string, any>,
  error?: MigrationError
): RecoveryState {
  return {
    phase,
    timestamp: new Date().toISOString(),
    error: error
      ? {
          message: error.message,
          category: error.category,
          stack: error.stack,
        }
      : {
          message: 'Recovery state saved without error',
          category: 'UNKNOWN_ERROR',
        },
    progress,
    checkpoint,
    metadata,
  };
}
