/**
 * Verification Report Generator
 * 
 * Generates detailed verification reports with all check results.
 * 
 * Requirements: 12.8, 12.9
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { VerificationResult, VerificationReport } from '../types/verification';

// ============================================================================
// Main Report Generation Function
// ============================================================================

/**
 * Generate verification report
 * 
 * Requirements: 12.8, 12.9
 */
export async function generateVerificationReport(
  result: VerificationResult,
  outputDir: string
): Promise<string> {
  console.log('\n=== Generating Verification Report ===\n');

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Build complete report
  const report: VerificationReport = {
    metadata: {
      timestamp: result.timestamp,
      duration: result.duration,
      legacyDatabase: 'legacy_recipes',
      newDatabase: 'jump_to_recipe',
    },
    results: result,
    detailedFindings: {
      recordCountDetails: result.recordCounts,
      spotCheckDetails: result.spotChecks,
      fieldPopulationDetails: result.fieldPopulation,
      htmlArtifactDetails: result.htmlArtifacts,
      orderingDetails: result.orderingChecks,
      tagAssociationDetails: result.tagAssociations,
      userOwnershipDetails: result.userOwnership,
    },
    recommendations: result.summary.recommendations,
  };

  // Save main report
  const reportPath = path.join(outputDir, 'verification-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`✓ Saved verification report: ${reportPath}`);

  // Generate human-readable summary
  await generateTextSummary(result, outputDir);

  // Generate detailed findings report
  await generateDetailedFindings(result, outputDir);

  // Generate markdown report
  await generateMarkdownReport(result, outputDir);

  console.log(`\nReports saved to: ${outputDir}\n`);

  return reportPath;
}

// ============================================================================
// Report Output Functions
// ============================================================================

async function generateTextSummary(
  result: VerificationResult,
  outputDir: string
): Promise<void> {
  const lines: string[] = [];

  lines.push('='.repeat(70));
  lines.push('VERIFICATION SUMMARY');
  lines.push('='.repeat(70));
  lines.push('');
  lines.push(`Timestamp: ${result.timestamp}`);
  lines.push(`Duration: ${formatDuration(result.duration)}`);
  lines.push(`Overall Status: ${result.summary.overallStatus.toUpperCase()}`);
  lines.push('');

  lines.push('CHECK RESULTS');
  lines.push('-'.repeat(70));
  lines.push(`Total Checks: ${result.summary.totalChecks}`);
  lines.push(`Passed: ${result.summary.passedChecks}`);
  lines.push(`Failed: ${result.summary.failedChecks}`);
  lines.push(`Warnings: ${result.summary.warningChecks}`);
  lines.push('');

  lines.push('RECORD COUNT COMPARISON');
  lines.push('-'.repeat(70));
  for (const comp of result.recordCounts) {
    const icon = comp.status === 'match' ? '✓' : comp.status === 'warning' ? '⚠️' : '✗';
    lines.push(`${icon} ${comp.table}: Legacy=${comp.legacyCount}, New=${comp.newCount} (${comp.percentageMatch}%)`);
  }
  lines.push('');

  lines.push('SPOT CHECKS');
  lines.push('-'.repeat(70));
  const passedSpotChecks = result.spotChecks.filter(c => c.status === 'pass').length;
  lines.push(`Passed: ${passedSpotChecks}/${result.spotChecks.length}`);
  const failedSpotChecks = result.spotChecks.filter(c => c.status === 'fail');
  if (failedSpotChecks.length > 0) {
    lines.push('\nFailed Spot Checks:');
    failedSpotChecks.slice(0, 5).forEach(check => {
      lines.push(`  - Recipe ${check.legacyId}: ${check.title}`);
      check.issues.forEach(issue => {
        lines.push(`    • ${issue}`);
      });
    });
  }
  lines.push('');

  lines.push('FIELD POPULATION');
  lines.push('-'.repeat(70));
  for (const field of result.fieldPopulation) {
    const icon = field.status === 'pass' ? '✓' : field.status === 'warning' ? '⚠️' : '✗';
    lines.push(`${icon} ${field.field}: ${field.populationRate}% populated (${field.required ? 'required' : 'optional'})`);
  }
  lines.push('');

  if (result.htmlArtifacts.length > 0) {
    lines.push('HTML/ENCODING ARTIFACTS');
    lines.push('-'.repeat(70));
    lines.push(`Found ${result.htmlArtifacts.length} recipes with artifacts`);
    const highSeverity = result.htmlArtifacts.filter(a => a.severity === 'high').length;
    const mediumSeverity = result.htmlArtifacts.filter(a => a.severity === 'medium').length;
    const lowSeverity = result.htmlArtifacts.filter(a => a.severity === 'low').length;
    lines.push(`  High: ${highSeverity}, Medium: ${mediumSeverity}, Low: ${lowSeverity}`);
    lines.push('');
  }

  if (result.summary.criticalIssues.length > 0) {
    lines.push('CRITICAL ISSUES');
    lines.push('-'.repeat(70));
    result.summary.criticalIssues.forEach((issue, i) => {
      lines.push(`${i + 1}. ${issue}`);
    });
    lines.push('');
  }

  lines.push('RECOMMENDATIONS');
  lines.push('-'.repeat(70));
  result.summary.recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. ${rec}`);
  });
  lines.push('');

  lines.push('='.repeat(70));

  const summaryPath = path.join(outputDir, 'verification-summary.txt');
  await fs.writeFile(summaryPath, lines.join('\n'));
  console.log(`✓ Saved text summary: ${summaryPath}`);
}

async function generateDetailedFindings(
  result: VerificationResult,
  outputDir: string
): Promise<void> {
  // Save detailed spot check results
  if (result.spotChecks.length > 0) {
    const spotCheckPath = path.join(outputDir, 'spot-check-details.json');
    await fs.writeFile(spotCheckPath, JSON.stringify(result.spotChecks, null, 2));
    console.log(`✓ Saved spot check details: ${spotCheckPath}`);
  }

  // Save HTML artifacts
  if (result.htmlArtifacts.length > 0) {
    const artifactsPath = path.join(outputDir, 'html-artifacts.json');
    await fs.writeFile(artifactsPath, JSON.stringify(result.htmlArtifacts, null, 2));
    console.log(`✓ Saved HTML artifacts: ${artifactsPath}`);
  }

  // Save ordering issues
  const orderingIssues = result.orderingChecks.filter(c => !c.orderPreserved);
  if (orderingIssues.length > 0) {
    const orderingPath = path.join(outputDir, 'ordering-issues.json');
    await fs.writeFile(orderingPath, JSON.stringify(orderingIssues, null, 2));
    console.log(`✓ Saved ordering issues: ${orderingPath}`);
  }

  // Save tag association issues
  const tagIssues = result.tagAssociations.filter(c => !c.allTagsPreserved);
  if (tagIssues.length > 0) {
    const tagPath = path.join(outputDir, 'tag-issues.json');
    await fs.writeFile(tagPath, JSON.stringify(tagIssues, null, 2));
    console.log(`✓ Saved tag issues: ${tagPath}`);
  }

  // Save user ownership issues
  const ownershipIssues = result.userOwnership.filter(c => !c.ownershipMapped);
  if (ownershipIssues.length > 0) {
    const ownershipPath = path.join(outputDir, 'ownership-issues.json');
    await fs.writeFile(ownershipPath, JSON.stringify(ownershipIssues, null, 2));
    console.log(`✓ Saved ownership issues: ${ownershipPath}`);
  }
}

async function generateMarkdownReport(
  result: VerificationResult,
  outputDir: string
): Promise<void> {
  const lines: string[] = [];

  lines.push('# Verification Report');
  lines.push('');
  lines.push(`**Timestamp:** ${result.timestamp}`);
  lines.push(`**Duration:** ${formatDuration(result.duration)}`);
  lines.push(`**Overall Status:** ${result.summary.overallStatus.toUpperCase()}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total Checks | ${result.summary.totalChecks} |`);
  lines.push(`| Passed | ${result.summary.passedChecks} |`);
  lines.push(`| Failed | ${result.summary.failedChecks} |`);
  lines.push(`| Warnings | ${result.summary.warningChecks} |`);
  lines.push('');

  lines.push('## Record Count Comparison');
  lines.push('');
  lines.push('| Table | Legacy | New | Match % | Status |');
  lines.push('|-------|--------|-----|---------|--------|');
  for (const comp of result.recordCounts) {
    const status = comp.status === 'match' ? '✓' : comp.status === 'warning' ? '⚠️' : '✗';
    lines.push(`| ${comp.table} | ${comp.legacyCount} | ${comp.newCount} | ${comp.percentageMatch}% | ${status} |`);
  }
  lines.push('');

  lines.push('## Spot Checks');
  lines.push('');
  const passedSpotChecks = result.spotChecks.filter(c => c.status === 'pass').length;
  lines.push(`**Passed:** ${passedSpotChecks}/${result.spotChecks.length}`);
  lines.push('');

  const failedSpotChecks = result.spotChecks.filter(c => c.status === 'fail');
  if (failedSpotChecks.length > 0) {
    lines.push('### Failed Spot Checks');
    lines.push('');
    failedSpotChecks.forEach(check => {
      lines.push(`#### Recipe ${check.legacyId}: ${check.title}`);
      lines.push('');
      check.issues.forEach(issue => {
        lines.push(`- ${issue}`);
      });
      lines.push('');
    });
  }

  lines.push('## Field Population');
  lines.push('');
  lines.push('| Field | Population % | Status |');
  lines.push('|-------|--------------|--------|');
  for (const field of result.fieldPopulation) {
    const status = field.status === 'pass' ? '✓' : field.status === 'warning' ? '⚠️' : '✗';
    lines.push(`| ${field.field} | ${field.populationRate}% | ${status} |`);
  }
  lines.push('');

  if (result.summary.criticalIssues.length > 0) {
    lines.push('## Critical Issues');
    lines.push('');
    result.summary.criticalIssues.forEach((issue, i) => {
      lines.push(`${i + 1}. ${issue}`);
    });
    lines.push('');
  }

  lines.push('## Recommendations');
  lines.push('');
  result.summary.recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. ${rec}`);
  });
  lines.push('');

  const markdownPath = path.join(outputDir, 'verification-report.md');
  await fs.writeFile(markdownPath, lines.join('\n'));
  console.log(`✓ Saved markdown report: ${markdownPath}`);
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

/**
 * Print verification summary to console
 */
export function printVerificationSummary(result: VerificationResult): void {
  console.log('\n' + '='.repeat(70));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(70));
  console.log(`\nOverall Status: ${result.summary.overallStatus.toUpperCase()}`);
  console.log(`Total Checks: ${result.summary.totalChecks}`);
  console.log(`  ✓ Passed: ${result.summary.passedChecks}`);
  console.log(`  ✗ Failed: ${result.summary.failedChecks}`);
  console.log(`  ⚠️  Warnings: ${result.summary.warningChecks}`);

  if (result.summary.criticalIssues.length > 0) {
    console.log('\n⚠️  Critical Issues:');
    result.summary.criticalIssues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
  }

  console.log('\n' + '='.repeat(70) + '\n');
}
