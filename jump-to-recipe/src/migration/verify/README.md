# Verification Module

This module provides post-migration verification functionality to ensure data quality and migration success.

## Overview

The verification module compares legacy and new databases to validate:
- Record counts match
- Data quality is maintained
- Relationships are preserved
- No data corruption occurred

## Components

### 1. Post-Migration Verification (`post-migration-verification.ts`)

Main verification script that performs comprehensive checks:

**Requirements Covered:**
- 12.1: Compare record counts between databases
- 12.2: Perform spot-checks on random recipes
- 12.3: Validate required fields are populated
- 12.4: Check for HTML/encoding artifacts
- 12.5: Validate ordering preservation
- 12.6: Validate tag associations
- 12.7: Validate user ownership mapping

**Checks Performed:**
- Record count comparison (users, recipes)
- Random spot checks (configurable count)
- Field population validation
- HTML artifact detection
- Ingredient/instruction ordering
- Tag association preservation
- User ownership mapping

### 2. Verification Report Generator (`verification-report-generator.ts`)

Generates detailed verification reports:

**Requirements Covered:**
- 12.8: Generate verification report with pass/fail status
- 12.9: Provide detailed information about failures

**Outputs:**
- JSON report with all check results
- Text summary for quick review
- Markdown report for documentation
- Detailed findings for failed checks

### 3. Comprehensive Report Generator (`comprehensive-report-generator.ts`)

Combines all migration phase reports into one:

**Requirements Covered:**
- 11.2: Generate extraction report
- 11.3: Generate transformation report
- 11.4: Generate validation report
- 11.5: Generate import report
- 11.7: Create summary report with overall statistics

**Outputs:**
- Executive summary (text)
- Comprehensive JSON report
- Markdown documentation
- CSV summary for analysis

## Usage

### Basic Verification

```typescript
import { runVerification } from './verify/post-migration-verification';
import { generateVerificationReport } from './verify/verification-report-generator';

const config = {
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
    host: 'remote-server.com',
    port: 22,
    username: 'user',
    privateKeyPath: '~/.ssh/id_rsa',
  },
  spotCheckCount: 20,
  importedDataDir: 'migration-data/imported',
};

// Run verification
const result = await runVerification(config);

// Generate report
await generateVerificationReport(result, 'migration-data/verified');
```

### Generate Comprehensive Report

```typescript
import { generateComprehensiveReport } from './verify/comprehensive-report-generator';

await generateComprehensiveReport({
  migrationDataDir: 'migration-data',
  outputDir: 'migration-data/reports',
  includeDetailedReports: true,
});
```

## Configuration

### Verification Config

```typescript
interface VerificationConfig {
  legacyDb: DatabaseConfig;
  newDb: DatabaseConfig;
  ssh?: SSHConfig;
  spotCheckCount: number;
  importedDataDir: string;
}
```

### Report Options

```typescript
interface ReportGenerationOptions {
  migrationDataDir: string;
  outputDir: string;
  includeDetailedReports: boolean;
}
```

## Output Files

### Verification Phase

```
migration-data/verified/
├── verification-report.json       # Complete verification results
├── verification-summary.txt       # Human-readable summary
├── verification-report.md         # Markdown documentation
├── spot-check-details.json        # Detailed spot check results
├── html-artifacts.json            # HTML/encoding issues
├── ordering-issues.json           # Ordering preservation issues
├── tag-issues.json                # Tag association issues
└── ownership-issues.json          # User ownership issues
```

### Comprehensive Report

```
migration-data/reports/
├── comprehensive-migration-report.json  # Complete migration report
├── executive-summary.txt                # Executive summary
├── comprehensive-report.md              # Markdown documentation
└── migration-summary.csv                # CSV for analysis
```

## Verification Checks

### 1. Record Count Comparison
- Compares user and recipe counts
- Status: match (≥99%), warning (≥90%), mismatch (<90%)

### 2. Spot Checks
- Random sample of recipes
- Validates title, ingredient count, instruction count
- Checks author mapping, tags, HTML artifacts

### 3. Field Population
- Validates required fields are populated
- Checks optional field population rates
- Status: pass (required ≥99%, optional ≥50%)

### 4. HTML Artifacts
- Detects HTML tags in text fields
- Identifies encoding issues
- Severity: low, medium, high

### 5. Ordering Preservation
- Validates ingredient order
- Validates instruction order
- Compares first 3 items

### 6. Tag Associations
- Compares legacy and new tags
- Identifies missing/extra tags

### 7. User Ownership
- Validates user ID mapping
- Ensures correct recipe ownership

## Status Codes

### Overall Status
- `pass`: All checks passed
- `warning`: Some warnings, but acceptable
- `fail`: Critical issues found

### Check Status
- `pass`: Check passed
- `warning`: Minor issues
- `fail`: Critical failure

## Best Practices

1. **Run verification after import**: Always verify after importing data
2. **Review warnings**: Even if status is "pass", review warnings
3. **Spot check count**: Use at least 20 for meaningful sample
4. **Save reports**: Keep reports for audit trail
5. **Address failures**: Fix critical issues before production

## Troubleshooting

### Connection Issues
- Verify SSH tunnel is working
- Check database credentials
- Ensure read-only access

### Missing Mappings
- Ensure import phase completed
- Check mapping files exist
- Verify file paths are correct

### High Failure Rate
- Review transformation logic
- Check validation rules
- Analyze failed recipes

## Next Steps

After verification:
1. Review comprehensive report
2. Address critical issues
3. Re-run migration if needed
4. Deploy to production if passed
