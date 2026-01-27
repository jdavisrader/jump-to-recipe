/**
 * Progress Tracker Module
 * 
 * Tracks migration progress and creates checkpoints for resumption.
 * Enables recovery from interruptions.
 * 
 * Requirements: 7.6, 7.7
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Type Definitions
// ============================================================================

export type MigrationPhase = 'extract' | 'transform' | 'validate' | 'import';

export interface MigrationProgress {
  migrationId: string;
  phase: MigrationPhase;
  startTime: string;
  lastCheckpoint: string;
  totalRecords: number;
  processedRecords: number;
  succeededRecords: number;
  failedRecords: number;
  warnedRecords: number;
  skippedRecords: number;
  currentBatch?: number;
  totalBatches?: number;
  metadata?: Record<string, any>;
}

export interface CheckpointData {
  progress: MigrationProgress;
  processedIds: number[]; // Legacy IDs that have been processed
  failedIds: number[]; // Legacy IDs that failed
}

// ============================================================================
// Progress Tracker
// ============================================================================

/**
 * Tracks migration progress and manages checkpoints
 */
export class ProgressTracker {
  private progress: MigrationProgress;
  private processedIds: Set<number>;
  private failedIds: Set<number>;
  private checkpointPath: string;
  private autoSaveInterval: number;
  private lastSaveTime: number;

  constructor(
    migrationId: string,
    phase: MigrationPhase,
    progressDir: string = 'migration-data/progress',
    autoSaveInterval: number = 30000 // 30 seconds
  ) {
    this.progress = {
      migrationId,
      phase,
      startTime: new Date().toISOString(),
      lastCheckpoint: new Date().toISOString(),
      totalRecords: 0,
      processedRecords: 0,
      succeededRecords: 0,
      failedRecords: 0,
      warnedRecords: 0,
      skippedRecords: 0,
    };
    this.processedIds = new Set();
    this.failedIds = new Set();
    this.checkpointPath = path.join(progressDir, `${migrationId}-${phase}.json`);
    this.autoSaveInterval = autoSaveInterval;
    this.lastSaveTime = Date.now();
  }

  /**
   * Initialize progress with total record count
   */
  initialize(totalRecords: number, totalBatches?: number): void {
    this.progress.totalRecords = totalRecords;
    this.progress.totalBatches = totalBatches;
  }

  /**
   * Update progress after processing a record
   */
  recordProcessed(legacyId: number, success: boolean, warned: boolean = false): void {
    this.processedIds.add(legacyId);
    this.progress.processedRecords++;

    if (success) {
      this.progress.succeededRecords++;
      if (warned) {
        this.progress.warnedRecords++;
      }
    } else {
      this.progress.failedRecords++;
      this.failedIds.add(legacyId);
    }

    // Auto-save checkpoint if interval has passed
    if (Date.now() - this.lastSaveTime > this.autoSaveInterval) {
      this.saveCheckpoint().catch(err => {
        console.warn('Failed to auto-save checkpoint:', err);
      });
    }
  }

  /**
   * Record skipped items
   */
  recordSkipped(count: number): void {
    this.progress.skippedRecords += count;
  }

  /**
   * Update current batch number
   */
  updateBatch(batchNumber: number): void {
    this.progress.currentBatch = batchNumber;
    this.progress.lastCheckpoint = new Date().toISOString();
  }

  /**
   * Add metadata to progress
   */
  setMetadata(key: string, value: any): void {
    if (!this.progress.metadata) {
      this.progress.metadata = {};
    }
    this.progress.metadata[key] = value;
  }

  /**
   * Get current progress
   */
  getProgress(): MigrationProgress {
    return { ...this.progress };
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    if (this.progress.totalRecords === 0) {
      return 0;
    }
    return Math.round((this.progress.processedRecords / this.progress.totalRecords) * 100);
  }

  /**
   * Get estimated time remaining (in milliseconds)
   */
  getEstimatedTimeRemaining(): number | null {
    if (this.progress.processedRecords === 0) {
      return null;
    }

    const elapsed = Date.now() - new Date(this.progress.startTime).getTime();
    const avgTimePerRecord = elapsed / this.progress.processedRecords;
    const remaining = this.progress.totalRecords - this.progress.processedRecords;
    
    return Math.round(avgTimePerRecord * remaining);
  }

  /**
   * Format time remaining as human-readable string
   */
  getFormattedTimeRemaining(): string {
    const ms = this.getEstimatedTimeRemaining();
    if (ms === null) {
      return 'Calculating...';
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Save checkpoint to disk
   */
  async saveCheckpoint(): Promise<void> {
    const checkpoint: CheckpointData = {
      progress: this.progress,
      processedIds: Array.from(this.processedIds),
      failedIds: Array.from(this.failedIds),
    };

    // Ensure directory exists
    await fs.mkdir(path.dirname(this.checkpointPath), { recursive: true });

    // Write checkpoint
    await fs.writeFile(
      this.checkpointPath,
      JSON.stringify(checkpoint, null, 2),
      'utf-8'
    );

    this.lastSaveTime = Date.now();
    this.progress.lastCheckpoint = new Date().toISOString();
  }

  /**
   * Load checkpoint from disk
   */
  static async loadCheckpoint(
    migrationId: string,
    phase: MigrationPhase,
    progressDir: string = 'migration-data/progress'
  ): Promise<ProgressTracker | null> {
    const checkpointPath = path.join(progressDir, `${migrationId}-${phase}.json`);

    try {
      const data = await fs.readFile(checkpointPath, 'utf-8');
      const checkpoint: CheckpointData = JSON.parse(data);

      const tracker = new ProgressTracker(migrationId, phase, progressDir);
      tracker.progress = checkpoint.progress;
      tracker.processedIds = new Set(checkpoint.processedIds);
      tracker.failedIds = new Set(checkpoint.failedIds);
      tracker.checkpointPath = checkpointPath;

      return tracker;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null; // No checkpoint found
      }
      throw error;
    }
  }

  /**
   * Check if a record has been processed
   */
  isProcessed(legacyId: number): boolean {
    return this.processedIds.has(legacyId);
  }

  /**
   * Check if a record failed
   */
  isFailed(legacyId: number): boolean {
    return this.failedIds.has(legacyId);
  }

  /**
   * Get list of processed IDs
   */
  getProcessedIds(): number[] {
    return Array.from(this.processedIds);
  }

  /**
   * Get list of failed IDs
   */
  getFailedIds(): number[] {
    return Array.from(this.failedIds);
  }

  /**
   * Print progress summary
   */
  printSummary(): void {
    const percentage = this.getProgressPercentage();
    const timeRemaining = this.getFormattedTimeRemaining();

    console.log(`\n📊 Progress Summary:`);
    console.log(`  Phase: ${this.progress.phase}`);
    console.log(`  Progress: ${this.progress.processedRecords}/${this.progress.totalRecords} (${percentage}%)`);
    console.log(`  Succeeded: ${this.progress.succeededRecords}`);
    console.log(`  Failed: ${this.progress.failedRecords}`);
    console.log(`  Warned: ${this.progress.warnedRecords}`);
    console.log(`  Skipped: ${this.progress.skippedRecords}`);
    
    if (this.progress.currentBatch && this.progress.totalBatches) {
      console.log(`  Batch: ${this.progress.currentBatch}/${this.progress.totalBatches}`);
    }
    
    console.log(`  Estimated time remaining: ${timeRemaining}`);
    console.log(`  Last checkpoint: ${this.progress.lastCheckpoint}`);
  }

  /**
   * Delete checkpoint file
   */
  async deleteCheckpoint(): Promise<void> {
    try {
      await fs.unlink(this.checkpointPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Check if migration is complete
   */
  isComplete(): boolean {
    return this.progress.processedRecords >= this.progress.totalRecords;
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.progress.processedRecords === 0) {
      return 0;
    }
    return Math.round((this.progress.succeededRecords / this.progress.processedRecords) * 100);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create or resume progress tracker
 */
export async function createOrResumeTracker(
  migrationId: string,
  phase: MigrationPhase,
  progressDir?: string
): Promise<{ tracker: ProgressTracker; resumed: boolean }> {
  // Try to load existing checkpoint
  const existingTracker = await ProgressTracker.loadCheckpoint(migrationId, phase, progressDir);

  if (existingTracker) {
    console.log(`\n♻️  Resuming from checkpoint...`);
    existingTracker.printSummary();
    return { tracker: existingTracker, resumed: true };
  }

  // Create new tracker
  const tracker = new ProgressTracker(migrationId, phase, progressDir);
  return { tracker, resumed: false };
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
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
