/**
 * Transformation Report Generator
 * 
 * Generates comprehensive reports for the transformation phase.
 * Tracks statistics, logs unparseable items, and creates JSON reports.
 * 
 * Requirements: 2.10
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { TransformError } from '../types/transformation';
import type {
  TransformedRecipe,
  TransformationStats,
  UnparseableItem,
  RecipeTransformationResult,
} from './recipe-transformer';

// ============================================================================
// Report Types
// ============================================================================

/**
 * Comprehensive transformation report
 */
export interface TransformationReport {
  timestamp: string;
  summary: {
    totalRecipes: number;
    successfulRecipes: number;
    failedRecipes: number;
    successRate: string;
  };
  statistics: TransformationStats;
  errors: TransformError[];
  unparseableItems: {
    total: number;
    byType: {
      ingredients: number;
      instructions: number;
    };
    items: UnparseableItem[];
  };
  topIssues: {
    issue: string;
    count: number;
  }[];
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate transformation report from results
 * 
 * Requirement 2.10: Track transformation statistics and log unparseable items
 */
export function generateTransformationReport(
  result: RecipeTransformationResult
): TransformationReport {
  const { recipes, errors, unparseableItems, stats } = result;

  // Calculate success rate
  const successRate = stats.total > 0
    ? ((stats.successful / stats.total) * 100).toFixed(2)
    : '0.00';

  // Count unparseable items by type
  const ingredientIssues = unparseableItems.filter((item) => item.type === 'ingredient').length;
  const instructionIssues = unparseableItems.filter((item) => item.type === 'instruction').length;

  // Identify top issues
  const topIssues = identifyTopIssues(unparseableItems, errors);

  const report: TransformationReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRecipes: stats.total,
      successfulRecipes: stats.successful,
      failedRecipes: stats.failed,
      successRate: `${successRate}%`,
    },
    statistics: stats,
    errors,
    unparseableItems: {
      total: unparseableItems.length,
      byType: {
        ingredients: ingredientIssues,
        instructions: instructionIssues,
      },
      items: unparseableItems,
    },
    topIssues,
  };

  return report;
}

/**
 * Identify top issues from unparseable items and errors
 */
function identifyTopIssues(
  unparseableItems: UnparseableItem[],
  errors: TransformError[]
): { issue: string; count: number }[] {
  const issueCounts = new Map<string, number>();

  // Count unparseable item reasons
  for (const item of unparseableItems) {
    const count = issueCounts.get(item.reason) || 0;
    issueCounts.set(item.reason, count + 1);
  }

  // Count error types
  for (const error of errors) {
    const reason = error.field ? `${error.field}: ${error.error}` : error.error;
    const count = issueCounts.get(reason) || 0;
    issueCounts.set(reason, count + 1);
  }

  // Sort by count and return top 10
  return Array.from(issueCounts.entries())
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Save transformation report to file
 */
export async function saveTransformationReport(
  report: TransformationReport,
  outputDir: string
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  const reportPath = path.join(outputDir, 'transformation-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n✓ Transformation report saved to: ${reportPath}`);
}

/**
 * Save unparseable items to separate file for manual review
 */
export async function saveUnparseableItems(
  unparseableItems: UnparseableItem[],
  outputDir: string
): Promise<void> {
  if (unparseableItems.length === 0) {
    console.log('✓ No unparseable items to save');
    return;
  }

  await fs.mkdir(outputDir, { recursive: true });

  const itemsPath = path.join(outputDir, 'unparseable-items.json');
  await fs.writeFile(itemsPath, JSON.stringify(unparseableItems, null, 2), 'utf-8');

  console.log(`✓ Unparseable items saved to: ${itemsPath}`);
  console.log(`  Total unparseable items: ${unparseableItems.length}`);
}

/**
 * Save transformed recipes to file
 */
export async function saveTransformedRecipes(
  recipes: TransformedRecipe[],
  outputDir: string
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  const recipesPath = path.join(outputDir, 'recipes-normalized.json');
  await fs.writeFile(recipesPath, JSON.stringify(recipes, null, 2), 'utf-8');

  console.log(`✓ Transformed recipes saved to: ${recipesPath}`);
  console.log(`  Total recipes: ${recipes.length}`);
}

/**
 * Print transformation summary to console
 */
export function printTransformationSummary(report: TransformationReport): void {
  console.log('\n=== Transformation Summary ===');
  console.log(`Total recipes: ${report.summary.totalRecipes}`);
  console.log(`Successful: ${report.summary.successfulRecipes}`);
  console.log(`Failed: ${report.summary.failedRecipes}`);
  console.log(`Success rate: ${report.summary.successRate}`);
  console.log('\nStatistics:');
  console.log(`  Ingredients parsed: ${report.statistics.ingredientsParsed}`);
  console.log(`  Ingredients unparsed: ${report.statistics.ingredientsUnparsed}`);
  console.log(`  Instructions cleaned: ${report.statistics.instructionsCleaned}`);
  console.log(`  Empty instructions: ${report.statistics.instructionsEmpty}`);
  console.log(`  Time conversions: ${report.statistics.timeConversions}`);
  console.log(`  User mappings: ${report.statistics.userMappings}`);
  console.log(`  Unmapped users: ${report.statistics.unmappedUsers}`);

  if (report.topIssues.length > 0) {
    console.log('\nTop Issues:');
    report.topIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.issue} (${issue.count} occurrences)`);
    });
  }

  if (report.unparseableItems.total > 0) {
    console.log('\nUnparseable Items:');
    console.log(`  Total: ${report.unparseableItems.total}`);
    console.log(`  Ingredients: ${report.unparseableItems.byType.ingredients}`);
    console.log(`  Instructions: ${report.unparseableItems.byType.instructions}`);
  }

  console.log('==============================\n');
}

/**
 * Generate and save all transformation reports
 */
export async function generateAndSaveReports(
  result: RecipeTransformationResult,
  outputDir: string
): Promise<void> {
  console.log('\n=== Generating Transformation Reports ===\n');

  // Generate report
  const report = generateTransformationReport(result);

  // Save all reports
  await saveTransformationReport(report, outputDir);
  await saveTransformedRecipes(result.recipes, outputDir);
  await saveUnparseableItems(result.unparseableItems, outputDir);

  // Print summary
  printTransformationSummary(report);
}
