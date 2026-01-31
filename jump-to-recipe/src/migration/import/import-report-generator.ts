/**
 * Import Report Generator Module
 * 
 * Generates comprehensive reports for the import phase.
 * Logs successes, failures, and creates ID mapping files.
 * 
 * Requirements: 11.5
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ImportResult, ImportStats, ImportReport, RecipeMapping } from '../types/import';
import type { UserMapping } from '../types/transformation';
import type { MigrationProgress } from './progress-tracker';

// ============================================================================
// Import Report Generator
// ============================================================================

/**
 * Generates comprehensive import reports
 */
export class ImportReportGenerator {
  private outputDir: string;
  private timestamp: string;

  constructor(outputDir: string = 'migration-data/imported') {
    this.outputDir = outputDir;
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  /**
   * Generate complete import report
   */
  async generateReport(
    recipeResults: ImportResult[],
    userResults: ImportResult[],
    recipeMappings: RecipeMapping[],
    userMappings: UserMapping[],
    progress: MigrationProgress,
    config: any
  ): Promise<void> {
    console.log(`\n📄 Generating import report...`);

    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    // Generate individual reports
    await this.generateSummaryReport(recipeResults, userResults, progress, config);
    await this.generateSuccessLog(recipeResults, userResults);
    await this.generateErrorLog(recipeResults, userResults);
    await this.generateMappingFiles(recipeMappings, userMappings);
    await this.generateStatisticsReport(recipeResults, userResults, progress);

    console.log(`  ✓ Reports saved to ${this.outputDir}`);
  }

  /**
   * Generate summary report
   */
  private async generateSummaryReport(
    recipeResults: ImportResult[],
    userResults: ImportResult[],
    progress: MigrationProgress,
    config: any
  ): Promise<void> {
    const recipeStats = this.calculateStats(recipeResults);
    const userStats = this.calculateStats(userResults);

    const summary = {
      timestamp: new Date().toISOString(),
      migrationId: progress.migrationId,
      phase: progress.phase,
      duration: this.calculateDuration(progress.startTime),
      config: {
        dryRun: config.dryRun,
        batchSize: config.batchSize,
        stopOnError: config.stopOnError,
        apiBaseUrl: config.apiBaseUrl,
      },
      recipes: {
        total: recipeResults.length,
        succeeded: recipeStats.successCount,
        failed: recipeStats.failureCount,
        skipped: recipeStats.skippedCount,
        successRate: this.calculateSuccessRate(recipeStats),
        errorsByType: recipeStats.errorsByType,
      },
      users: {
        total: userResults.length,
        succeeded: userStats.successCount,
        failed: userStats.failureCount,
        skipped: userStats.skippedCount,
        successRate: this.calculateSuccessRate(userStats),
        errorsByType: userStats.errorsByType,
      },
      overall: {
        totalRecords: recipeResults.length + userResults.length,
        totalSucceeded: recipeStats.successCount + userStats.successCount,
        totalFailed: recipeStats.failureCount + userStats.failureCount,
        totalSkipped: recipeStats.skippedCount + userStats.skippedCount,
      },
    };

    const summaryPath = path.join(this.outputDir, `import-summary-${this.timestamp}.json`);
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

    console.log(`  ✓ Summary report: ${summaryPath}`);
  }

  /**
   * Generate success log
   */
  private async generateSuccessLog(
    recipeResults: ImportResult[],
    userResults: ImportResult[]
  ): Promise<void> {
    const successfulRecipes = recipeResults.filter(r => r.success);
    const successfulUsers = userResults.filter(r => r.success);

    const successLog = {
      timestamp: new Date().toISOString(),
      recipes: successfulRecipes.map(r => ({
        legacyId: r.legacyId,
        newId: r.newId,
        retryCount: r.retryCount || 0,
      })),
      users: successfulUsers.map(u => ({
        legacyId: u.legacyId,
        newId: u.newId,
        retryCount: u.retryCount || 0,
      })),
      summary: {
        totalRecipes: successfulRecipes.length,
        totalUsers: successfulUsers.length,
        recipesWithRetries: successfulRecipes.filter(r => (r.retryCount || 0) > 0).length,
        usersWithRetries: successfulUsers.filter(u => (u.retryCount || 0) > 0).length,
      },
    };

    const successPath = path.join(this.outputDir, `import-success-${this.timestamp}.json`);
    await fs.writeFile(successPath, JSON.stringify(successLog, null, 2), 'utf-8');

    console.log(`  ✓ Success log: ${successPath}`);
  }

  /**
   * Generate error log
   */
  private async generateErrorLog(
    recipeResults: ImportResult[],
    userResults: ImportResult[]
  ): Promise<void> {
    const failedRecipes = recipeResults.filter(r => !r.success);
    const failedUsers = userResults.filter(r => !r.success);

    const errorLog = {
      timestamp: new Date().toISOString(),
      recipes: failedRecipes.map(r => ({
        legacyId: r.legacyId,
        error: r.error,
        errorType: r.errorType,
        retryCount: r.retryCount || 0,
      })),
      users: failedUsers.map(u => ({
        legacyId: u.legacyId,
        error: u.error,
        errorType: u.errorType,
        retryCount: u.retryCount || 0,
      })),
      summary: {
        totalRecipes: failedRecipes.length,
        totalUsers: failedUsers.length,
        errorsByType: this.groupErrorsByType([...failedRecipes, ...failedUsers]),
      },
    };

    const errorPath = path.join(this.outputDir, `import-errors-${this.timestamp}.json`);
    await fs.writeFile(errorPath, JSON.stringify(errorLog, null, 2), 'utf-8');

    console.log(`  ✓ Error log: ${errorPath}`);

    // Also generate human-readable error report
    await this.generateHumanReadableErrorReport(failedRecipes, failedUsers);
  }

  /**
   * Generate human-readable error report
   */
  private async generateHumanReadableErrorReport(
    failedRecipes: ImportResult[],
    failedUsers: ImportResult[]
  ): Promise<void> {
    const lines: string[] = [];
    
    lines.push('# Import Error Report');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    
    if (failedRecipes.length > 0) {
      lines.push('## Failed Recipes');
      lines.push('');
      for (const recipe of failedRecipes) {
        lines.push(`- Legacy ID: ${recipe.legacyId}`);
        lines.push(`  Error Type: ${recipe.errorType || 'unknown'}`);
        lines.push(`  Error: ${recipe.error}`);
        lines.push(`  Retry Count: ${recipe.retryCount || 0}`);
        lines.push('');
      }
    }

    if (failedUsers.length > 0) {
      lines.push('## Failed Users');
      lines.push('');
      for (const user of failedUsers) {
        lines.push(`- Legacy ID: ${user.legacyId}`);
        lines.push(`  Error Type: ${user.errorType || 'unknown'}`);
        lines.push(`  Error: ${user.error}`);
        lines.push(`  Retry Count: ${user.retryCount || 0}`);
        lines.push('');
      }
    }

    const errorReportPath = path.join(this.outputDir, `import-errors-${this.timestamp}.md`);
    await fs.writeFile(errorReportPath, lines.join('\n'), 'utf-8');
  }

  /**
   * Generate ID mapping files
   */
  private async generateMappingFiles(
    recipeMappings: RecipeMapping[],
    userMappings: UserMapping[]
  ): Promise<void> {
    // Recipe mappings
    const recipeMappingPath = path.join(this.outputDir, 'recipe-id-mapping.json');
    await fs.writeFile(
      recipeMappingPath,
      JSON.stringify(recipeMappings, null, 2),
      'utf-8'
    );
    console.log(`  ✓ Recipe ID mapping: ${recipeMappingPath}`);

    // User mappings
    const userMappingPath = path.join(this.outputDir, 'user-id-mapping.json');
    await fs.writeFile(
      userMappingPath,
      JSON.stringify(userMappings, null, 2),
      'utf-8'
    );
    console.log(`  ✓ User ID mapping: ${userMappingPath}`);

    // CSV format for easy lookup
    await this.generateMappingCSV(recipeMappings, userMappings);
  }

  /**
   * Generate CSV mapping files
   */
  private async generateMappingCSV(
    recipeMappings: RecipeMapping[],
    userMappings: UserMapping[]
  ): Promise<void> {
    // Recipe CSV
    const recipeCSV = [
      'legacy_id,new_uuid,title,migrated,migrated_at',
      ...recipeMappings.map(m => 
        `${m.legacyId},${m.newUuid},"${m.title.replace(/"/g, '""')}",${m.migrated},${m.migratedAt}`
      ),
    ].join('\n');

    const recipeCSVPath = path.join(this.outputDir, 'recipe-id-mapping.csv');
    await fs.writeFile(recipeCSVPath, recipeCSV, 'utf-8');

    // User CSV
    const userCSV = [
      'legacy_id,new_uuid,email,migrated,migrated_at',
      ...userMappings.map(m => 
        `${m.legacyId},${m.newUuid},${m.email},${m.migrated},${m.migratedAt}`
      ),
    ].join('\n');

    const userCSVPath = path.join(this.outputDir, 'user-id-mapping.csv');
    await fs.writeFile(userCSVPath, userCSV, 'utf-8');
  }

  /**
   * Generate statistics report
   */
  private async generateStatisticsReport(
    recipeResults: ImportResult[],
    userResults: ImportResult[],
    progress: MigrationProgress
  ): Promise<void> {
    const recipeStats = this.calculateStats(recipeResults);
    const userStats = this.calculateStats(userResults);

    const stats = {
      timestamp: new Date().toISOString(),
      duration: this.calculateDuration(progress.startTime),
      recipes: recipeStats,
      users: userStats,
      performance: {
        totalRecords: recipeResults.length + userResults.length,
        recordsPerSecond: this.calculateRecordsPerSecond(
          recipeResults.length + userResults.length,
          progress.startTime
        ),
        averageBatchDuration: recipeStats.averageBatchDuration,
      },
    };

    const statsPath = path.join(this.outputDir, `import-statistics-${this.timestamp}.json`);
    await fs.writeFile(statsPath, JSON.stringify(stats, null, 2), 'utf-8');

    console.log(`  ✓ Statistics report: ${statsPath}`);
  }

  /**
   * Calculate statistics from results
   */
  private calculateStats(results: ImportResult[]): ImportStats & { averageBatchDuration: number } {
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const skippedCount = 0; // Skipped items are not in results

    const errorsByType: Record<string, number> = {};
    for (const result of results) {
      if (!result.success && result.errorType) {
        errorsByType[result.errorType] = (errorsByType[result.errorType] || 0) + 1;
      }
    }

    return {
      totalRecords: results.length,
      successCount,
      failureCount,
      skippedCount,
      duration: 0, // Will be set by caller
      averageBatchDuration: 0, // Will be calculated if batch info available
      errorsByType,
    };
  }

  /**
   * Group errors by type
   */
  private groupErrorsByType(results: ImportResult[]): Record<string, number> {
    const errorsByType: Record<string, number> = {};
    
    for (const result of results) {
      if (!result.success && result.errorType) {
        errorsByType[result.errorType] = (errorsByType[result.errorType] || 0) + 1;
      }
    }

    return errorsByType;
  }

  /**
   * Calculate duration in milliseconds
   */
  private calculateDuration(startTime: string): number {
    return Date.now() - new Date(startTime).getTime();
  }

  /**
   * Calculate records per second
   */
  private calculateRecordsPerSecond(totalRecords: number, startTime: string): number {
    const durationSeconds = this.calculateDuration(startTime) / 1000;
    return Math.round(totalRecords / durationSeconds);
  }

  /**
   * Print summary to console
   */
  printSummary(
    recipeResults: ImportResult[],
    userResults: ImportResult[],
    progress: MigrationProgress
  ): void {
    const recipeStats = this.calculateStats(recipeResults);
    const userStats = this.calculateStats(userResults);
    const duration = this.calculateDuration(progress.startTime);

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nRecipes:`);
    console.log(`  Total: ${recipeStats.totalRecords}`);
    console.log(`  ✓ Succeeded: ${recipeStats.successCount}`);
    console.log(`  ✗ Failed: ${recipeStats.failureCount}`);
    console.log(`  Success Rate: ${this.calculateSuccessRate(recipeStats)}%`);

    console.log(`\nUsers:`);
    console.log(`  Total: ${userStats.totalRecords}`);
    console.log(`  ✓ Succeeded: ${userStats.successCount}`);
    console.log(`  ✗ Failed: ${userStats.failureCount}`);
    console.log(`  Success Rate: ${this.calculateSuccessRate(userStats)}%`);

    console.log(`\nPerformance:`);
    console.log(`  Duration: ${this.formatDuration(duration)}`);
    console.log(`  Records/sec: ${this.calculateRecordsPerSecond(
      recipeStats.totalRecords + userStats.totalRecords,
      progress.startTime
    )}`);

    if (recipeStats.failureCount > 0 || userStats.failureCount > 0) {
      console.log(`\n⚠️  Errors by type:`);
      const allErrors = { ...recipeStats.errorsByType };
      for (const [type, count] of Object.entries(userStats.errorsByType)) {
        allErrors[type] = (allErrors[type] || 0) + count;
      }
      for (const [type, count] of Object.entries(allErrors)) {
        console.log(`  - ${type}: ${count}`);
      }
    }

    console.log(`\n${'='.repeat(60)}\n`);
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(stats: ImportStats): number {
    if (stats.totalRecords === 0) return 0;
    return Math.round((stats.successCount / stats.totalRecords) * 100);
  }

  /**
   * Format duration
   */
  private formatDuration(ms: number): string {
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
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create import report generator
 */
export function createImportReportGenerator(outputDir?: string): ImportReportGenerator {
  return new ImportReportGenerator(outputDir);
}
