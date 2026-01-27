# Validation Module

This module implements Phase 3 (Validate) of the ETVI migration pipeline. It validates transformed recipe data against business rules, detects duplicates, and generates comprehensive reports.

## Overview

The validation layer ensures data quality before import by:
1. Validating recipes against Zod schemas and business rules
2. Classifying results as PASS, WARN, or FAIL
3. Detecting duplicate recipes using multiple strategies
4. Generating detailed reports and categorized recipe files

## Components

### 1. Recipe Validator (`recipe-validator.ts`)

Validates transformed recipes against business rules using Zod schemas.

**Key Functions:**
- `validateRecipe(recipe)` - Validate a single recipe
- `validateBatch(recipes)` - Validate multiple recipes

**Validation Rules:**
- **FAIL Criteria** (cannot import):
  - Empty or too long title (> 500 chars)
  - No ingredients or instructions
  - Invalid UUID format
  - Unmapped author ID
  - Negative servings or times

- **WARN Criteria** (can import with flags):
  - Missing description, image, or source URL
  - No tags
  - Unparsed ingredients
  - Very short instructions (< 10 chars)

- **PASS Criteria**:
  - All required fields valid
  - At least one ingredient and instruction
  - Valid UUIDs and author mapping

### 2. Duplicate Detector (`duplicate-detector.ts`)

Identifies potential duplicate recipes using multiple matching strategies.

**Detection Strategies:**
1. **Exact Title Match** (high confidence)
   - Normalized title comparison (case-insensitive, no special chars)

2. **Title + Ingredient Match** (high confidence)
   - Same normalized title + first 3 ingredients match

3. **Fuzzy Title Match** (medium/low confidence)
   - Levenshtein distance < 3
   - Optional ingredient similarity check

**Key Functions:**
- `detectDuplicates(recipes, config)` - Detect all duplicates
- `generateDuplicateReport(groups)` - Generate summary report
- `normalizeTitle(title)` - Normalize title for comparison
- `getIngredientFingerprint(ingredients)` - Generate ingredient fingerprint

### 3. Validation Report Generator (`validation-report-generator.ts`)

Generates comprehensive validation reports with statistics and categorized recipes.

**Generated Files:**
- `validation-report.json` - Complete report with all statistics
- `validation-summary.txt` - Human-readable summary
- `recipes-pass.json` - Recipes that passed validation
- `recipes-warn.json` - Recipes with warnings
- `recipes-fail.json` - Recipes that failed (with error details)
- `duplicates-report.json` - Duplicate detection results

**Key Functions:**
- `generateValidationReport(validationReport, duplicateReport, options)` - Generate all reports
- `createValidationReport(recipes, outputDir)` - Convenience function for complete validation

## Usage

### Basic Usage

```bash
# Run validation on transformed recipes
ts-node src/migration/validate/validate-recipes.ts \
  migration-data/transformed/2026-01-23-14-30-00 \
  migration-data/validated/2026-01-23-14-30-00
```

### Programmatic Usage

```typescript
import { validateBatch } from './recipe-validator';
import { detectDuplicates, generateDuplicateReport } from './duplicate-detector';
import { generateValidationReport } from './validation-report-generator';

// Load transformed recipes
const recipes = JSON.parse(
  await fs.readFile('migration-data/transformed/.../recipes-normalized.json', 'utf-8')
);

// Validate recipes
const validationReport = await validateBatch(recipes);

// Detect duplicates
const duplicateGroups = await detectDuplicates(recipes);
const duplicateReport = generateDuplicateReport(duplicateGroups);

// Generate reports
await generateValidationReport(validationReport, duplicateReport, {
  outputDir: 'migration-data/validated/...',
  includeRecipeDetails: true,
  generateSeparateFiles: true,
});
```

### Custom Duplicate Detection

```typescript
import { detectDuplicates } from './duplicate-detector';

// Customize detection behavior
const duplicateGroups = await detectDuplicates(recipes, {
  enableExactTitleMatch: true,
  enableTitleIngredientMatch: true,
  enableFuzzyTitleMatch: false, // Disable fuzzy matching
  fuzzyThreshold: 2, // Stricter threshold
  ingredientMatchCount: 5, // Compare more ingredients
});
```

## Output Structure

```
migration-data/validated/2026-01-23-14-30-00/
├── validation-report.json      # Complete validation report
├── validation-summary.txt       # Human-readable summary
├── recipes-pass.json           # Recipes ready for import
├── recipes-warn.json           # Recipes with warnings
├── recipes-fail.json           # Failed recipes with errors
└── duplicates-report.json      # Duplicate detection results
```

## Validation Report Structure

```json
{
  "metadata": {
    "timestamp": "2026-01-23T14:30:00.000Z",
    "totalRecipes": 1500,
    "validationDuration": 5234
  },
  "validation": {
    "passed": 1350,
    "warned": 120,
    "failed": 30,
    "passRate": 90.0,
    "warnRate": 8.0,
    "failRate": 2.0,
    "criticalErrors": 45,
    "warningCount": 380
  },
  "duplicates": {
    "totalGroups": 15,
    "highConfidence": 8,
    "mediumConfidence": 5,
    "lowConfidence": 2,
    "affectedRecipes": 35
  },
  "errorSummary": {
    "byField": { "title": 10, "ingredients": 15, "authorId": 20 },
    "bySeverity": { "critical": 45, "warning": 25 },
    "topErrors": [
      { "message": "Author ID is unmapped", "count": 20 },
      { "message": "Title cannot be empty", "count": 10 }
    ]
  },
  "warningSummary": {
    "byField": { "description": 100, "imageUrl": 120, "tags": 80 },
    "topWarnings": [
      { "message": "Recipe has no image", "count": 120 },
      { "message": "Recipe has no description", "count": 100 }
    ]
  },
  "recommendations": [
    "Low failure rate (2.0%). Validation quality is good.",
    "Found 8 high-confidence duplicate groups. Review and decide on duplicate handling strategy.",
    "1350 recipes passed validation and are ready for import."
  ]
}
```

## Requirements Mapping

This module implements the following requirements:

- **5.1-5.10**: Data Quality Validation
  - 5.1: Use Zod schemas from recipe-sections.ts
  - 5.2: Validate title (non-empty, < 500 chars)
  - 5.3: Validate ingredients (at least one)
  - 5.4: Validate instructions (at least one)
  - 5.5: Validate servings (positive integer or null)
  - 5.6: Validate times (non-negative integers or null)
  - 5.7: PASS/WARN/FAIL classification
  - 5.8: Warn on missing optional fields
  - 5.9: Fail on critical field errors
  - 5.10: Generate validation report with categories

- **6.1-6.7**: Duplicate Detection
  - 6.1: Compare by title (case-insensitive)
  - 6.2: Compare first 3 ingredients (normalized)
  - 6.3: Flag identical title + similar ingredients
  - 6.4: Log duplicate IDs and titles in report
  - 6.5: Provide duplicate handling options
  - 6.6: Keep first by created_at
  - 6.7: Keep both with flag

## Next Steps

After validation completes:

1. **Review Reports**
   - Check `validation-summary.txt` for overview
   - Review `recipes-fail.json` for critical errors
   - Check `duplicates-report.json` for potential duplicates

2. **Fix Issues** (if needed)
   - Update transformation logic for common errors
   - Re-run transformation and validation

3. **Proceed to Import**
   - Use `recipes-pass.json` for import
   - Optionally include `recipes-warn.json` if warnings are acceptable
   - Decide on duplicate handling strategy

## Testing

```bash
# Run validation on sample data
ts-node src/migration/validate/validate-recipes.ts \
  migration-data/transformed/sample \
  migration-data/validated/sample
```

## Troubleshooting

### High Failure Rate

If many recipes fail validation:
- Review `errorSummary.topErrors` in validation report
- Check transformation logic for common issues
- Verify user mapping was completed successfully

### Many Duplicates Detected

If duplicate detection finds many matches:
- Review duplicate groups by confidence level
- Adjust detection thresholds if needed
- Consider if duplicates are expected (e.g., recipe variations)

### Performance Issues

For large datasets (> 10k recipes):
- Validation is CPU-bound, consider batching
- Duplicate detection is O(n²) for fuzzy matching
- Disable fuzzy matching for faster processing
