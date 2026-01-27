/**
 * Verification Example
 * 
 * Demonstrates how to run post-migration verification and generate reports.
 */

import { runVerification } from './post-migration-verification';
import { generateVerificationReport, printVerificationSummary } from './verification-report-generator';
import { generateComprehensiveReport } from './comprehensive-report-generator';
import type { VerificationConfig } from '../types/verification';

// ============================================================================
// Example 1: Basic Verification
// ============================================================================

async function example1_basicVerification() {
  console.log('Example 1: Basic Verification\n');

  const config: VerificationConfig = {
    legacyDb: {
      host: 'localhost',
      port: 5432,
      database: 'legacy_recipes',
      username: 'readonly_user',
      password: 'password',
    },
    newDb: {
      host: 'localhost',
      port: 5432,
      database: 'jump_to_recipe',
      username: 'readonly_user',
      password: 'password',
    },
    spotCheckCount: 20,
    importedDataDir: 'migration-data/imported',
  };

  try {
    // Run verification
    const result = await runVerification(config);

    // Print summary to console
    printVerificationSummary(result);

    // Generate detailed report
    await generateVerificationReport(result, 'migration-data/verified');

    console.log('✓ Verification complete');
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
}

// ============================================================================
// Example 2: Verification with SSH Tunnel
// ============================================================================

async function example2_verificationWithSSH() {
  console.log('Example 2: Verification with SSH Tunnel\n');

  const config: VerificationConfig = {
    legacyDb: {
      host: 'localhost', // localhost when using SSH tunnel
      port: 5432,
      database: 'legacy_recipes',
      username: 'readonly_user',
      password: 'password',
    },
    newDb: {
      host: 'localhost',
      port: 5432,
      database: 'jump_to_recipe',
      username: 'readonly_user',
      password: 'password',
    },
    ssh: {
      host: 'remote-server.example.com',
      port: 22,
      username: 'migration_user',
      privateKeyPath: '~/.ssh/id_rsa',
    },
    spotCheckCount: 50, // More thorough check
    importedDataDir: 'migration-data/imported',
  };

  try {
    const result = await runVerification(config);
    printVerificationSummary(result);
    await generateVerificationReport(result, 'migration-data/verified');
    console.log('✓ Verification with SSH complete');
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
}

// ============================================================================
// Example 3: Generate Comprehensive Report
// ============================================================================

async function example3_comprehensiveReport() {
  console.log('Example 3: Generate Comprehensive Report\n');

  try {
    // Generate comprehensive report combining all phases
    await generateComprehensiveReport({
      migrationDataDir: 'migration-data',
      outputDir: 'migration-data/reports',
      includeDetailedReports: true,
    });

    console.log('✓ Comprehensive report generated');
    console.log('\nReview the following files:');
    console.log('  - migration-data/reports/executive-summary.txt');
    console.log('  - migration-data/reports/comprehensive-report.md');
    console.log('  - migration-data/reports/comprehensive-migration-report.json');
  } catch (error) {
    console.error('Report generation failed:', error);
    throw error;
  }
}

// ============================================================================
// Example 4: Complete Verification Workflow
// ============================================================================

async function example4_completeWorkflow() {
  console.log('Example 4: Complete Verification Workflow\n');

  const config: VerificationConfig = {
    legacyDb: {
      host: 'localhost',
      port: 5432,
      database: 'legacy_recipes',
      username: 'readonly_user',
      password: 'password',
    },
    newDb: {
      host: 'localhost',
      port: 5432,
      database: 'jump_to_recipe',
      username: 'readonly_user',
      password: 'password',
    },
    ssh: {
      host: 'remote-server.example.com',
      port: 22,
      username: 'migration_user',
      privateKeyPath: '~/.ssh/id_rsa',
    },
    spotCheckCount: 30,
    importedDataDir: 'migration-data/imported',
  };

  try {
    // Step 1: Run verification
    console.log('Step 1: Running verification checks...');
    const result = await runVerification(config);

    // Step 2: Generate verification report
    console.log('\nStep 2: Generating verification report...');
    await generateVerificationReport(result, 'migration-data/verified');

    // Step 3: Generate comprehensive report
    console.log('\nStep 3: Generating comprehensive report...');
    await generateComprehensiveReport({
      migrationDataDir: 'migration-data',
      outputDir: 'migration-data/reports',
      includeDetailedReports: true,
    });

    // Step 4: Print summary
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICATION WORKFLOW COMPLETE');
    console.log('='.repeat(70));
    printVerificationSummary(result);

    // Step 5: Provide next steps based on status
    if (result.summary.overallStatus === 'pass') {
      console.log('\n✓ Migration verification PASSED');
      console.log('\nNext steps:');
      console.log('  1. Review comprehensive report');
      console.log('  2. Perform final manual spot checks');
      console.log('  3. Back up production database');
      console.log('  4. Deploy migrated data to production');
    } else if (result.summary.overallStatus === 'warning') {
      console.log('\n⚠️  Migration verification PASSED with WARNINGS');
      console.log('\nNext steps:');
      console.log('  1. Review warnings in verification report');
      console.log('  2. Decide if warnings are acceptable');
      console.log('  3. Address critical warnings if needed');
      console.log('  4. Proceed with caution to production');
    } else {
      console.log('\n✗ Migration verification FAILED');
      console.log('\nNext steps:');
      console.log('  1. Review critical issues in verification report');
      console.log('  2. Fix transformation or import logic');
      console.log('  3. Re-run migration pipeline');
      console.log('  4. DO NOT deploy to production');
    }

    console.log('\n' + '='.repeat(70) + '\n');
  } catch (error) {
    console.error('Verification workflow failed:', error);
    throw error;
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const example = process.argv[2] || '4';

  try {
    switch (example) {
      case '1':
        await example1_basicVerification();
        break;
      case '2':
        await example2_verificationWithSSH();
        break;
      case '3':
        await example3_comprehensiveReport();
        break;
      case '4':
        await example4_completeWorkflow();
        break;
      default:
        console.log('Usage: ts-node verify-example.ts [1|2|3|4]');
        console.log('  1: Basic verification');
        console.log('  2: Verification with SSH tunnel');
        console.log('  3: Generate comprehensive report');
        console.log('  4: Complete verification workflow (default)');
    }
  } catch (error) {
    console.error('Example failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  example1_basicVerification,
  example2_verificationWithSSH,
  example3_comprehensiveReport,
  example4_completeWorkflow,
};
