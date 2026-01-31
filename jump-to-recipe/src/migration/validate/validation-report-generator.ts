/**
 * Validation Report Generator Module
 * 
 * Generates comprehensive validation reports with statistics and categorized recipes.
 * Saves reports and categorized recipe files for review and import.
 * 
 * Requirements: 5.10, 6.4
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ValidationReport, ValidationResult } from './recipe-validator';
import type { DuplicateGroup, DuplicateDetectionReport } from './duplicate-detector';
import type { TransformedRecipe } from '../transform/recipe-transformer';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Complete validation report with all data
 */
export interface CompleteValidationReport {
  metadata: {
    timestamp: string;
    totalRecipes: number;
    validationDuration: number; // milliseconds
  };
  validation: {
    passed: number;
    warned: number;
    failed: number;
    passRate: number;
    warnRate: number;
    failRate: number;
    criticalErrors: number;
    warningCount: number;
  };
  duplicates: {
    totalGroups: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    affectedRecipes: number;
  };
  errorSummary: {
    byField: Record<string, number>;
    bySeverity: Record<string, number>;
    topErrors: Array<{ message: string; count: number }>;
  };
  warningSummary: {
    byField: Record<string, number>;
    topWarnings: Array<{ message: string; count: number }>;
  };
  recommendations: string[];
}

/**
 * Options for report generation
 */
export interface ReportGenerationOptions {
  outputDir: string;
  includeRecipeDetails: boolean;
  generateSeparateFiles: boolean;
}

// ============================================================================
// Core Report Generation Functions
// ============================================================================

/**
 * Generate complete validation report with statistics and categorized recipes
 * 
 * Requirements: 5.10, 6.4
 * 
 * @param validationReport - Validation results from recipe validator
 * @param duplicateReport - Duplicate detection results
 * @param options - Report generation options
 * @returns Path to generated report file
 */
export async function generateValidationReport(
  validationReport: ValidationReport,
  duplicateReport: DuplicateDetectionReport,
  options: ReportGenerationOptions
): Promise<string> {
  console.log('\n=== Generating Validation Report ===\n');

  const startTime = Date.now();

  // Create output directory if it doesn't exist
  await fs.mkdir(options.outputDir, { recursive: true });

  // Generate comprehensive report
  const report = buildCompleteReport(validationReport, duplicateReport, startTime);

  // Save main report
  const reportPath = path.join(options.outputDir, 'validation-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`✓ Saved validation report: ${reportPath}`);

  // Save categorized recipes to separate files (Requirement 5.10)
  if (options.generateSeparateFiles) {
    await saveCategorizedRecipes(validationReport, options.outputDir);
  }

  // Save duplicates report (Requirement 6.4)
  await saveDuplicatesReport(duplicateReport, options.outputDir);

  // Generate human-readable summary
  await generateTextSummary(report, options.outputDir);

  console.log('\n=== Report Generation Complete ===');
  console.log(`Reports saved to: ${options.outputDir}`);
  console.log('===================================\n');

  return reportPath;
}

/**
 * Build complete validation report with all statistics
 */
function buildCompleteReport(
  validationReport: ValidationReport,
  duplicateReport: DuplicateDetectionReport,
  startTime: number
): CompleteValidationReport {
  const duration = Date.now() - startTime;
  const { stats, results } = validationReport;

  // Calculate rates
  const passRate = (stats.passed / stats.total) * 100;
  const warnRate = (stats.warned / stats.total) * 100;
  const failRate = (stats.failed / stats.total) * 100;

  // Analyze errors and warnings
  const errorSummary = analyzeErrors(results);
  const warningSummary = analyzeWarnings(results);

  // Generate recommendations
  const recommendations = generateRecommendations(
    validationReport,
    duplicateReport
  );

  return {
    metadata: {
      timestamp: new Date().toISOString(),
      totalRecipes: stats.total,
      validationDuration: duration,
    },
    validation: {
      passed: stats.passed,
      warned: stats.warned,
      failed: stats.failed,
      passRate: parseFloat(passRate.toFixed(2)),
      warnRate: parseFloat(warnRate.toFixed(2)),
      failRate: parseFloat(failRate.toFixed(2)),
      criticalErrors: stats.criticalErrors,
      warningCount: stats.warningCount,
    },
    duplicates: {
      totalGroups: duplicateReport.totalDuplicates,
      highConfidence: duplicateReport.highConfidenceCount,
      mediumConfidence: duplicateReport.mediumConfidenceCount,
      lowConfidence: duplicateReport.lowConfidenceCount,
      affectedRecipes: duplicateReport.affectedRecipes,
    },
    errorSummary,
    warningSummary,
    recommendations,
  };
}

/**
 * Save categorized recipes to separate JSON files
 * 
 * Requirement 5.10 - Separate recipes into PASS/WARN/FAIL categories
 */
async function saveCategorizedRecipes(
  validationReport: ValidationReport,
  outputDir: string
): Promise<void> {
  // Save PASS recipes
  const passPath = path.join(outputDir, 'recipes-pass.json');
  await fs.writeFile(
    passPath,
    JSON.stringify(validationReport.passedRecipes, null, 2)
  );
  console.log(`✓ Saved ${validationReport.passedRecipes.length} PASS recipes: ${passPath}`);

  // Save WARN recipes
  const warnPath = path.join(outputDir, 'recipes-warn.json');
  await fs.writeFile(
    warnPath,
    JSON.stringify(validationReport.warnedRecipes, null, 2)
  );
  console.log(`✓ Saved ${validationReport.warnedRecipes.length} WARN recipes: ${warnPath}`);

  // Save FAIL recipes with error details
  const failedWithErrors = validationReport.results
    .filter(r => r.status === 'FAIL')
    .map(r => ({
      recipe: r.recipe,
      errors: r.errors,
      warnings: r.warnings,
    }));

  const failPath = path.join(outputDir, 'recipes-fail.json');
  await fs.writeFile(
    failPath,
    JSON.stringify(failedWithErrors, null, 2)
  );
  console.log(`✓ Saved ${validationReport.failedRecipes.length} FAIL recipes: ${failPath}`);
}

/**
 * Save duplicates report with detailed information
 * 
 * Requirement 6.4 - Create duplicates report
 */
async function saveDuplicatesReport(
  duplicateReport: DuplicateDetectionReport,
  outputDir: string
): Promise<void> {
  // Format duplicate groups for readability
  const formattedGroups = duplicateReport.duplicateGroups.map(group => ({
    matchReason: group.matchReason,
    confidence: group.confidence,
    normalizedTitle: group.normalizedTitle,
    ingredientFingerprint: group.ingredientFingerprint,
    recipeCount: group.recipes.length,
    recipes: group.recipes.map(r => ({
      id: r.id,
      legacyId: r.legacyId,
      title: r.title,
      authorId: r.authorId,
      createdAt: r.createdAt,
      ingredientCount: r.ingredients.length,
      firstThreeIngredients: r.ingredients
        .slice(0, 3)
        .map(ing => ing.name),
    })),
  }));

  const duplicatesPath = path.join(outputDir, 'duplicates-report.json');
  await fs.writeFile(
    duplicatesPath,
    JSON.stringify(
      {
        summary: {
          totalGroups: duplicateReport.totalDuplicates,
          highConfidence: duplicateReport.highConfidenceCount,
          mediumConfidence: duplicateReport.mediumConfidenceCount,
          lowConfidence: duplicateReport.lowConfidenceCount,
          affectedRecipes: duplicateReport.affectedRecipes,
        },
        groups: formattedGroups,
      },
      null,
      2
    )
  );
  console.log(`✓ Saved duplicates report: ${duplicatesPath}`);
}

/**
 * Generate human-readable text summary
 */
async function generateTextSummary(
  report: CompleteValidationReport,
  outputDir: string
): Promise<void> {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('VALIDATION REPORT SUMMARY');
  lines.push('='.repeat(60));
  lines.push('');

  lines.push(`Generated: ${report.metadata.timestamp}`);
  lines.push(`Total Recipes: ${report.metadata.totalRecipes}`);
  lines.push(`Validation Duration: ${(report.metadata.validationDuration / 1000).toFixed(2)}s`);
  lines.push('');

  lines.push('VALIDATION RESULTS');
  lines.push('-'.repeat(60));
  lines.push(`PASS: ${report.validation.passed} (${report.validation.passRate}%)`);
  lines.push(`WARN: ${report.validation.warned} (${report.validation.warnRate}%)`);
  lines.push(`FAIL: ${report.validation.failed} (${report.validation.failRate}%)`);
  lines.push(`Critical Errors: ${report.validation.criticalErrors}`);
  lines.push(`Warnings: ${report.validation.warningCount}`);
  lines.push('');

  lines.push('DUPLICATE DETECTION');
  lines.push('-'.repeat(60));
  lines.push(`Total Duplicate Groups: ${report.duplicates.totalGroups}`);
  lines.push(`High Confidence: ${report.duplicates.highConfidence}`);
  lines.push(`Medium Confidence: ${report.duplicates.mediumConfidence}`);
  lines.push(`Low Confidence: ${report.duplicates.lowConfidence}`);
  lines.push(`Affected Recipes: ${report.duplicates.affectedRecipes}`);
  lines.push('');

  lines.push('TOP ERRORS');
  lines.push('-'.repeat(60));
  report.errorSummary.topErrors.slice(0, 10).forEach((error, index) => {
    lines.push(`${index + 1}. ${error.message} (${error.count} occurrences)`);
  });
  lines.push('');

  lines.push('TOP WARNINGS');
  lines.push('-'.repeat(60));
  report.warningSummary.topWarnings.slice(0, 10).forEach((warning, index) => {
    lines.push(`${index + 1}. ${warning.message} (${warning.count} occurrences)`);
  });
  lines.push('');

  lines.push('RECOMMENDATIONS');
  lines.push('-'.repeat(60));
  report.recommendations.forEach((rec, index) => {
    lines.push(`${index + 1}. ${rec}`);
  });
  lines.push('');

  lines.push('='.repeat(60));

  const summaryPath = path.join(outputDir, 'validation-summary.txt');
  await fs.writeFile(summaryPath, lines.join('\n'));
  console.log(`✓ Saved text summary: ${summaryPath}`);
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyze errors across all validation results
 */
function analyzeErrors(results: ValidationResult[]): {
  byField: Record<string, number>;
  bySeverity: Record<string, number>;
  topErrors: Array<{ message: string; count: number }>;
} {
  const byField: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const errorMessages: Record<string, number> = {};

  for (const result of results) {
    for (const error of result.errors) {
      // Count by field
      byField[error.field] = (byField[error.field] || 0) + 1;

      // Count by severity
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;

      // Count by message
      errorMessages[error.message] = (errorMessages[error.message] || 0) + 1;
    }
  }

  // Get top errors
  const topErrors = Object.entries(errorMessages)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count);

  return { byField, bySeverity, topErrors };
}

/**
 * Analyze warnings across all validation results
 */
function analyzeWarnings(results: ValidationResult[]): {
  byField: Record<string, number>;
  topWarnings: Array<{ message: string; count: number }>;
} {
  const byField: Record<string, number> = {};
  const warningMessages: Record<string, number> = {};

  for (const result of results) {
    for (const warning of result.warnings) {
      // Count by field
      byField[warning.field] = (byField[warning.field] || 0) + 1;

      // Count by message
      warningMessages[warning.message] = (warningMessages[warning.message] || 0) + 1;
    }
  }

  // Get top warnings
  const topWarnings = Object.entries(warningMessages)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count);

  return { byField, topWarnings };
}

/**
 * Generate actionable recommendations based on validation results
 */
function generateRecommendations(
  validationReport: ValidationReport,
  duplicateReport: DuplicateDetectionReport
): string[] {
  const recommendations: string[] = [];
  const { stats } = validationReport;

  // Recommendation based on fail rate
  const failRate = (stats.failed / stats.total) * 100;
  if (failRate > 10) {
    recommendations.push(
      `High failure rate (${failRate.toFixed(1)}%). Review failed recipes and consider improving transformation logic.`
    );
  } else if (failRate > 5) {
    recommendations.push(
      `Moderate failure rate (${failRate.toFixed(1)}%). Review failed recipes before import.`
    );
  } else {
    recommendations.push(
      `Low failure rate (${failRate.toFixed(1)}%). Validation quality is good.`
    );
  }

  // Recommendation based on duplicates
  if (duplicateReport.highConfidenceCount > 0) {
    recommendations.push(
      `Found ${duplicateReport.highConfidenceCount} high-confidence duplicate groups. Review and decide on duplicate handling strategy.`
    );
  }

  if (duplicateReport.mediumConfidenceCount > 0) {
    recommendations.push(
      `Found ${duplicateReport.mediumConfidenceCount} medium-confidence duplicate groups. Manual review recommended.`
    );
  }

  // Recommendation based on warnings
  const warnRate = (stats.warned / stats.total) * 100;
  if (warnRate > 50) {
    recommendations.push(
      `High warning rate (${warnRate.toFixed(1)}%). Many recipes have missing optional fields. Consider if this is acceptable.`
    );
  }

  // Recommendation for next steps
  if (stats.passed > 0) {
    recommendations.push(
      `${stats.passed} recipes passed validation and are ready for import.`
    );
  }

  if (stats.warned > 0) {
    recommendations.push(
      `${stats.warned} recipes have warnings but can be imported. Review warnings to ensure data quality.`
    );
  }

  if (stats.failed > 0) {
    recommendations.push(
      `${stats.failed} recipes failed validation and should not be imported. Review errors and fix transformation logic if needed.`
    );
  }

  return recommendations;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a validation report from scratch (for testing or manual use)
 */
export async function createValidationReport(
  recipes: TransformedRecipe[],
  outputDir: string
): Promise<string> {
  const { validateBatch } = await import('./recipe-validator');
  const { detectDuplicates, generateDuplicateReport } = await import('./duplicate-detector');

  // Run validation
  const validationReport = await validateBatch(recipes);

  // Run duplicate detection
  const duplicateGroups = await detectDuplicates(recipes);
  const duplicateReport = generateDuplicateReport(duplicateGroups);

  // Generate report
  return generateValidationReport(validationReport, duplicateReport, {
    outputDir,
    includeRecipeDetails: true,
    generateSeparateFiles: true,
  });
}
