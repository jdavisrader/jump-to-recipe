/**
 * Comprehensive Report Generator
 * 
 * Generates unified reports combining all migration phases:
 * - Extraction
 * - Transformation
 * - Validation
 * - Import
 * - Verification
 * 
 * Requirements: 11.2, 11.3, 11.4, 11.5, 11.7, 12.8, 12.9
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { VerificationResult, VerificationReport } from '../types/verification';

// ============================================================================
// Type Definitions
// ============================================================================

export interface MigrationPhaseReport {
  phase: 'extract' | 'transform' | 'validate' | 'import' | 'verify';
  timestamp: string;
  duration: number;
  status: 'success' | 'partial' | 'failed';
  summary: Record<string, any>;
  reportPath: string;
}

export interface ComprehensiveMigrationReport {
  metadata: {
    migrationId: string;
    startTime: string;
    endTime: string;
    totalDuration: number;
    generatedAt: string;
  };
  phases: {
    extraction?: MigrationPhaseReport;
    transformation?: MigrationPhaseReport;
    validation?: MigrationPhaseReport;
    import?: MigrationPhaseReport;
    verification?: MigrationPhaseReport;
  };
  overallSummary: {
    totalRecipes: number;
    successfullyMigrated: number;
    failed: number;
    warnings: number;
    successRate: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  keyMetrics: {
    extractionRecordCount: number;
    transformationSuccessRate: number;
    validationPassRate: number;
    importSuccessRate: number;
    verificationStatus: string;
  };
  issues: {
    critical: string[];
    warnings: string[];
    informational: string[];
  };
  recommendations: string[];
  nextSteps: string[];
}

export interface ReportGenerationOptions {
  migrationDataDir: string;
  outputDir: string;
  includeDetailedReports: boolean;
}

// ============================================================================
// Main Report Generation Function
// ============================================================================

/**
 * Generate comprehensive migration report
 * 
 * Requirements: 11.2, 11.3, 11.4, 11.5, 11.7, 12.8, 12.9
 */
export async function generateComprehensiveReport(
  options: ReportGenerationOptions
): Promise<string> {
  console.log('\n=== Generating Comprehensive Migration Report ===\n');

  const startTime = Date.now();

  // Create output directory
  await fs.mkdir(options.outputDir, { recursive: true });

  // Load reports from each phase
  const extractionReport = await loadExtractionReport(options.migrationDataDir);
  const transformationReport = await loadTransformationReport(options.migrationDataDir);
  const validationReport = await loadValidationReport(options.migrationDataDir);
  const importReport = await loadImportReport(options.migrationDataDir);
  const verificationReport = await loadVerificationReport(options.migrationDataDir);

  // Build comprehensive report
  const report = buildComprehensiveReport({
    extraction: extractionReport,
    transformation: transformationReport,
    validation: validationReport,
    import: importReport,
    verification: verificationReport,
  });

  // Save main report
  const reportPath = path.join(options.outputDir, 'comprehensive-migration-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`✓ Saved comprehensive report: ${reportPath}`);

  // Generate human-readable summary
  await generateExecutiveSummary(report, options.outputDir);

  // Generate detailed markdown report
  await generateMarkdownReport(report, options.outputDir);

  // Generate CSV summary for spreadsheet analysis
  await generateCsvSummary(report, options.outputDir);

  const duration = Date.now() - startTime;
  console.log(`\n✓ Report generation complete (${(duration / 1000).toFixed(2)}s)`);
  console.log(`Reports saved to: ${options.outputDir}\n`);

  return reportPath;
}

// ============================================================================
// Report Loading Functions
// ============================================================================

async function loadExtractionReport(dataDir: string): Promise<MigrationPhaseReport | null> {
  try {
    const rawDir = path.join(dataDir, 'raw');
    const dirs = await fs.readdir(rawDir);
    if (dirs.length === 0) return null;

    // Get most recent extraction
    const latestDir = dirs.sort().reverse()[0];
    const metadataPath = path.join(rawDir, latestDir, 'export-metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    return {
      phase: 'extract',
      timestamp: metadata.exportTimestamp,
      duration: 0, // Not tracked in extraction
      status: 'success',
      summary: {
        recordCounts: metadata.recordCounts,
        totalRecords: Object.values(metadata.recordCounts).reduce((a: any, b: any) => a + b, 0),
      },
      reportPath: metadataPath,
    };
  } catch (error) {
    console.warn('Could not load extraction report:', error);
    return null;
  }
}

async function loadTransformationReport(dataDir: string): Promise<MigrationPhaseReport | null> {
  try {
    const transformedDir = path.join(dataDir, 'transformed');
    const files = await fs.readdir(transformedDir);
    const reportFile = files.find(f => f.startsWith('transformation-report'));
    if (!reportFile) return null;

    const reportPath = path.join(transformedDir, reportFile);
    const report = JSON.parse(await fs.readFile(reportPath, 'utf-8'));

    return {
      phase: 'transform',
      timestamp: report.timestamp || new Date().toISOString(),
      duration: report.duration || 0,
      status: report.stats?.failed > 0 ? 'partial' : 'success',
      summary: report.stats || {},
      reportPath,
    };
  } catch (error) {
    console.warn('Could not load transformation report:', error);
    return null;
  }
}

async function loadValidationReport(dataDir: string): Promise<MigrationPhaseReport | null> {
  try {
    const validatedDir = path.join(dataDir, 'validated');
    const reportPath = path.join(validatedDir, 'validation-report.json');
    const report = JSON.parse(await fs.readFile(reportPath, 'utf-8'));

    return {
      phase: 'validate',
      timestamp: report.metadata?.timestamp || new Date().toISOString(),
      duration: report.metadata?.validationDuration || 0,
      status: report.validation?.failed > 0 ? 'partial' : 'success',
      summary: {
        validation: report.validation,
        duplicates: report.duplicates,
      },
      reportPath,
    };
  } catch (error) {
    console.warn('Could not load validation report:', error);
    return null;
  }
}

async function loadImportReport(dataDir: string): Promise<MigrationPhaseReport | null> {
  try {
    const importedDir = path.join(dataDir, 'imported');
    const files = await fs.readdir(importedDir);
    const summaryFile = files.find(f => f.startsWith('import-summary'));
    if (!summaryFile) return null;

    const reportPath = path.join(importedDir, summaryFile);
    const report = JSON.parse(await fs.readFile(reportPath, 'utf-8'));

    return {
      phase: 'import',
      timestamp: report.timestamp || new Date().toISOString(),
      duration: report.duration || 0,
      status: report.recipes?.failed > 0 || report.users?.failed > 0 ? 'partial' : 'success',
      summary: {
        recipes: report.recipes,
        users: report.users,
        overall: report.overall,
      },
      reportPath,
    };
  } catch (error) {
    console.warn('Could not load import report:', error);
    return null;
  }
}

async function loadVerificationReport(dataDir: string): Promise<MigrationPhaseReport | null> {
  try {
    const verifyDir = path.join(dataDir, 'verified');
    const reportPath = path.join(verifyDir, 'verification-report.json');
    const report = JSON.parse(await fs.readFile(reportPath, 'utf-8'));

    return {
      phase: 'verify',
      timestamp: report.metadata?.timestamp || new Date().toISOString(),
      duration: report.metadata?.duration || 0,
      status: report.results?.summary?.overallStatus === 'pass' ? 'success' : 
              report.results?.summary?.overallStatus === 'warning' ? 'partial' : 'failed',
      summary: report.results?.summary || {},
      reportPath,
    };
  } catch (error) {
    console.warn('Could not load verification report:', error);
    return null;
  }
}

// ============================================================================
// Report Building Functions
// ============================================================================

function buildComprehensiveReport(phases: {
  extraction: MigrationPhaseReport | null;
  transformation: MigrationPhaseReport | null;
  validation: MigrationPhaseReport | null;
  import: MigrationPhaseReport | null;
  verification: MigrationPhaseReport | null;
}): ComprehensiveMigrationReport {
  // Calculate overall metrics
  const totalRecipes = phases.extraction?.summary?.recordCounts?.recipes || 0;
  const successfullyMigrated = phases.import?.summary?.recipes?.succeeded || 0;
  const failed = phases.import?.summary?.recipes?.failed || 0;
  const warnings = phases.validation?.summary?.validation?.warned || 0;
  const successRate = totalRecipes > 0 ? (successfullyMigrated / totalRecipes) * 100 : 0;

  // Determine data quality
  let dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  if (successRate >= 95 && warnings < totalRecipes * 0.1) {
    dataQuality = 'excellent';
  } else if (successRate >= 90 && warnings < totalRecipes * 0.2) {
    dataQuality = 'good';
  } else if (successRate >= 80) {
    dataQuality = 'fair';
  } else {
    dataQuality = 'poor';
  }

  // Collect issues
  const issues = {
    critical: [] as string[],
    warnings: [] as string[],
    informational: [] as string[],
  };

  // Add verification issues
  if (phases.verification?.summary?.criticalIssues) {
    issues.critical.push(...phases.verification.summary.criticalIssues);
  }

  // Add import issues
  if (failed > 0) {
    issues.critical.push(`${failed} recipes failed to import`);
  }

  // Add validation warnings
  if (warnings > 0) {
    issues.warnings.push(`${warnings} recipes have validation warnings`);
  }

  // Generate recommendations
  const recommendations = generateRecommendations(phases, {
    totalRecipes,
    successfullyMigrated,
    failed,
    warnings,
    successRate,
    dataQuality,
  });

  // Generate next steps
  const nextSteps = generateNextSteps(phases, dataQuality);

  // Calculate timestamps
  const timestamps = [
    phases.extraction?.timestamp,
    phases.transformation?.timestamp,
    phases.validation?.timestamp,
    phases.import?.timestamp,
    phases.verification?.timestamp,
  ].filter(Boolean) as string[];

  const startTime = timestamps.length > 0 ? timestamps[0] : new Date().toISOString();
  const endTime = timestamps.length > 0 ? timestamps[timestamps.length - 1] : new Date().toISOString();
  const totalDuration = new Date(endTime).getTime() - new Date(startTime).getTime();

  return {
    metadata: {
      migrationId: `migration-${Date.now()}`,
      startTime,
      endTime,
      totalDuration,
      generatedAt: new Date().toISOString(),
    },
    phases: {
      extraction: phases.extraction || undefined,
      transformation: phases.transformation || undefined,
      validation: phases.validation || undefined,
      import: phases.import || undefined,
      verification: phases.verification || undefined,
    },
    overallSummary: {
      totalRecipes,
      successfullyMigrated,
      failed,
      warnings,
      successRate: parseFloat(successRate.toFixed(2)),
      dataQuality,
    },
    keyMetrics: {
      extractionRecordCount: phases.extraction?.summary?.totalRecords || 0,
      transformationSuccessRate: phases.transformation?.summary?.successRate || 0,
      validationPassRate: phases.validation?.summary?.validation?.passRate || 0,
      importSuccessRate: phases.import?.summary?.recipes?.successRate || 0,
      verificationStatus: phases.verification?.summary?.overallStatus || 'unknown',
    },
    issues,
    recommendations,
    nextSteps,
  };
}

function generateRecommendations(
  phases: any,
  summary: any
): string[] {
  const recommendations: string[] = [];

  // Based on success rate
  if (summary.successRate >= 95) {
    recommendations.push('Migration was highly successful. Data quality is excellent.');
  } else if (summary.successRate >= 90) {
    recommendations.push('Migration was successful with minor issues. Review warnings before production use.');
  } else if (summary.successRate >= 80) {
    recommendations.push('Migration completed with moderate issues. Review failed recipes and consider re-running transformation.');
  } else {
    recommendations.push('Migration had significant issues. Review transformation logic and re-run migration.');
  }

  // Based on verification status
  if (phases.verification?.summary?.overallStatus === 'fail') {
    recommendations.push('Verification failed. Address critical issues before using migrated data in production.');
  } else if (phases.verification?.summary?.overallStatus === 'warning') {
    recommendations.push('Verification passed with warnings. Review warnings and decide if acceptable for production.');
  }

  // Based on data quality
  if (summary.dataQuality === 'poor') {
    recommendations.push('Consider improving ingredient parsing and HTML cleaning logic.');
    recommendations.push('Review failed recipes manually and update transformation rules.');
  }

  // Add verification recommendations
  if (phases.verification?.summary?.recommendations) {
    recommendations.push(...phases.verification.summary.recommendations);
  }

  return recommendations;
}

function generateNextSteps(phases: any, dataQuality: string): string[] {
  const steps: string[] = [];

  if (dataQuality === 'excellent' || dataQuality === 'good') {
    steps.push('Review comprehensive report and verification results');
    steps.push('Perform final manual spot checks on random recipes');
    steps.push('Back up current production database');
    steps.push('Deploy migrated data to production');
    steps.push('Monitor application for any data-related issues');
  } else if (dataQuality === 'fair') {
    steps.push('Review failed recipes and transformation errors');
    steps.push('Update transformation logic to handle edge cases');
    steps.push('Re-run transformation and validation phases');
    steps.push('Perform additional verification before production deployment');
  } else {
    steps.push('Analyze root causes of migration failures');
    steps.push('Review and update transformation logic');
    steps.push('Consider manual review of problematic recipes');
    steps.push('Re-run complete migration pipeline');
    steps.push('Do not deploy to production until issues are resolved');
  }

  return steps;
}

// ============================================================================
// Report Output Functions
// ============================================================================

async function generateExecutiveSummary(
  report: ComprehensiveMigrationReport,
  outputDir: string
): Promise<void> {
  const lines: string[] = [];

  lines.push('='.repeat(70));
  lines.push('MIGRATION EXECUTIVE SUMMARY');
  lines.push('='.repeat(70));
  lines.push('');
  lines.push(`Generated: ${report.metadata.generatedAt}`);
  lines.push(`Migration ID: ${report.metadata.migrationId}`);
  lines.push(`Duration: ${formatDuration(report.metadata.totalDuration)}`);
  lines.push('');

  lines.push('OVERALL RESULTS');
  lines.push('-'.repeat(70));
  lines.push(`Total Recipes: ${report.overallSummary.totalRecipes}`);
  lines.push(`Successfully Migrated: ${report.overallSummary.successfullyMigrated}`);
  lines.push(`Failed: ${report.overallSummary.failed}`);
  lines.push(`Warnings: ${report.overallSummary.warnings}`);
  lines.push(`Success Rate: ${report.overallSummary.successRate}%`);
  lines.push(`Data Quality: ${report.overallSummary.dataQuality.toUpperCase()}`);
  lines.push('');

  lines.push('KEY METRICS');
  lines.push('-'.repeat(70));
  lines.push(`Extraction Record Count: ${report.keyMetrics.extractionRecordCount}`);
  lines.push(`Transformation Success Rate: ${report.keyMetrics.transformationSuccessRate}%`);
  lines.push(`Validation Pass Rate: ${report.keyMetrics.validationPassRate}%`);
  lines.push(`Import Success Rate: ${report.keyMetrics.importSuccessRate}%`);
  lines.push(`Verification Status: ${report.keyMetrics.verificationStatus.toUpperCase()}`);
  lines.push('');

  if (report.issues.critical.length > 0) {
    lines.push('CRITICAL ISSUES');
    lines.push('-'.repeat(70));
    report.issues.critical.forEach((issue, i) => {
      lines.push(`${i + 1}. ${issue}`);
    });
    lines.push('');
  }

  if (report.issues.warnings.length > 0) {
    lines.push('WARNINGS');
    lines.push('-'.repeat(70));
    report.issues.warnings.slice(0, 5).forEach((warning, i) => {
      lines.push(`${i + 1}. ${warning}`);
    });
    if (report.issues.warnings.length > 5) {
      lines.push(`... and ${report.issues.warnings.length - 5} more warnings`);
    }
    lines.push('');
  }

  lines.push('RECOMMENDATIONS');
  lines.push('-'.repeat(70));
  report.recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. ${rec}`);
  });
  lines.push('');

  lines.push('NEXT STEPS');
  lines.push('-'.repeat(70));
  report.nextSteps.forEach((step, i) => {
    lines.push(`${i + 1}. ${step}`);
  });
  lines.push('');

  lines.push('='.repeat(70));

  const summaryPath = path.join(outputDir, 'executive-summary.txt');
  await fs.writeFile(summaryPath, lines.join('\n'));
  console.log(`✓ Saved executive summary: ${summaryPath}`);
}

async function generateMarkdownReport(
  report: ComprehensiveMigrationReport,
  outputDir: string
): Promise<void> {
  const lines: string[] = [];

  lines.push('# Migration Comprehensive Report');
  lines.push('');
  lines.push(`**Generated:** ${report.metadata.generatedAt}`);
  lines.push(`**Migration ID:** ${report.metadata.migrationId}`);
  lines.push(`**Duration:** ${formatDuration(report.metadata.totalDuration)}`);
  lines.push('');

  lines.push('## Overall Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total Recipes | ${report.overallSummary.totalRecipes} |`);
  lines.push(`| Successfully Migrated | ${report.overallSummary.successfullyMigrated} |`);
  lines.push(`| Failed | ${report.overallSummary.failed} |`);
  lines.push(`| Warnings | ${report.overallSummary.warnings} |`);
  lines.push(`| Success Rate | ${report.overallSummary.successRate}% |`);
  lines.push(`| Data Quality | ${report.overallSummary.dataQuality.toUpperCase()} |`);
  lines.push('');

  lines.push('## Phase Results');
  lines.push('');

  if (report.phases.extraction) {
    lines.push('### Extraction');
    lines.push(`- Status: ${report.phases.extraction.status}`);
    lines.push(`- Timestamp: ${report.phases.extraction.timestamp}`);
    lines.push(`- Total Records: ${report.phases.extraction.summary.totalRecords}`);
    lines.push('');
  }

  if (report.phases.transformation) {
    lines.push('### Transformation');
    lines.push(`- Status: ${report.phases.transformation.status}`);
    lines.push(`- Timestamp: ${report.phases.transformation.timestamp}`);
    lines.push(`- Duration: ${formatDuration(report.phases.transformation.duration)}`);
    lines.push('');
  }

  if (report.phases.validation) {
    lines.push('### Validation');
    lines.push(`- Status: ${report.phases.validation.status}`);
    lines.push(`- Timestamp: ${report.phases.validation.timestamp}`);
    lines.push(`- Pass Rate: ${report.phases.validation.summary.validation?.passRate}%`);
    lines.push('');
  }

  if (report.phases.import) {
    lines.push('### Import');
    lines.push(`- Status: ${report.phases.import.status}`);
    lines.push(`- Timestamp: ${report.phases.import.timestamp}`);
    lines.push(`- Success Rate: ${report.phases.import.summary.recipes?.successRate}%`);
    lines.push('');
  }

  if (report.phases.verification) {
    lines.push('### Verification');
    lines.push(`- Status: ${report.phases.verification.status}`);
    lines.push(`- Timestamp: ${report.phases.verification.timestamp}`);
    lines.push(`- Overall Status: ${report.phases.verification.summary.overallStatus}`);
    lines.push('');
  }

  if (report.issues.critical.length > 0) {
    lines.push('## Critical Issues');
    lines.push('');
    report.issues.critical.forEach((issue, i) => {
      lines.push(`${i + 1}. ${issue}`);
    });
    lines.push('');
  }

  if (report.issues.warnings.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    report.issues.warnings.forEach((warning, i) => {
      lines.push(`${i + 1}. ${warning}`);
    });
    lines.push('');
  }

  lines.push('## Recommendations');
  lines.push('');
  report.recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. ${rec}`);
  });
  lines.push('');

  lines.push('## Next Steps');
  lines.push('');
  report.nextSteps.forEach((step, i) => {
    lines.push(`${i + 1}. ${step}`);
  });
  lines.push('');

  const markdownPath = path.join(outputDir, 'comprehensive-report.md');
  await fs.writeFile(markdownPath, lines.join('\n'));
  console.log(`✓ Saved markdown report: ${markdownPath}`);
}

async function generateCsvSummary(
  report: ComprehensiveMigrationReport,
  outputDir: string
): Promise<void> {
  const lines: string[] = [];

  // Header
  lines.push('Phase,Metric,Value');

  // Overall metrics
  lines.push(`Overall,Total Recipes,${report.overallSummary.totalRecipes}`);
  lines.push(`Overall,Successfully Migrated,${report.overallSummary.successfullyMigrated}`);
  lines.push(`Overall,Failed,${report.overallSummary.failed}`);
  lines.push(`Overall,Warnings,${report.overallSummary.warnings}`);
  lines.push(`Overall,Success Rate,${report.overallSummary.successRate}%`);
  lines.push(`Overall,Data Quality,${report.overallSummary.dataQuality}`);

  // Phase metrics
  if (report.phases.extraction) {
    lines.push(`Extraction,Status,${report.phases.extraction.status}`);
    lines.push(`Extraction,Total Records,${report.phases.extraction.summary.totalRecords}`);
  }

  if (report.phases.transformation) {
    lines.push(`Transformation,Status,${report.phases.transformation.status}`);
    lines.push(`Transformation,Duration (ms),${report.phases.transformation.duration}`);
  }

  if (report.phases.validation) {
    lines.push(`Validation,Status,${report.phases.validation.status}`);
    lines.push(`Validation,Pass Rate,${report.phases.validation.summary.validation?.passRate}%`);
  }

  if (report.phases.import) {
    lines.push(`Import,Status,${report.phases.import.status}`);
    lines.push(`Import,Success Rate,${report.phases.import.summary.recipes?.successRate}%`);
  }

  if (report.phases.verification) {
    lines.push(`Verification,Status,${report.phases.verification.status}`);
    lines.push(`Verification,Overall Status,${report.phases.verification.summary.overallStatus}`);
  }

  const csvPath = path.join(outputDir, 'migration-summary.csv');
  await fs.writeFile(csvPath, lines.join('\n'));
  console.log(`✓ Saved CSV summary: ${csvPath}`);
}

// ============================================================================
// Utility Functions
// ============================================================================

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
