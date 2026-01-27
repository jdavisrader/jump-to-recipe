# Validation Module - Quick Start Guide

## Overview

The validation module is Phase 3 of the ETVI (Extract-Transform-Validate-Import) migration pipeline. It validates transformed recipes and detects duplicates before import.

## Quick Start

### 1. Run Validation

```bash
# Navigate to the project directory
cd jump-to-recipe

# Run validation on transformed data
ts-node src/migration/validate/validate-recipes.ts \
  migration-data/transformed/2026-01-23-14-30-00 \
  migration-data/validated/2026-01-23-14-30-00
```

### 2. Review Results

After validation completes, check these files:

```bash
# Human-readable summary
cat migration-data/validated/2026-01-23-14-30-00/validation-summary.txt

# Detailed JSON report
cat migration-data/validated/2026-01-23-14-30-00/validation-report.json

# Failed recipes (need attention)
cat migration-data/validated/2026-01-23-14-30-00/recipes-fail.json

# Duplicate detection results
cat migration-data/validated/2026-01-23-14-30-00/duplicates-report.json
```

### 3. Interpret Results

**PASS** (Green Light ✓)
- Recipes are valid and ready for import
- Use `recipes-pass.json` for import phase

**WARN** (Yellow Light ⚠)
- Recipes have minor issues (missing optional fields)
- Can be imported but may need manual review
- Use `recipes-warn.json` if acceptable

**FAIL** (Red Light ✗)
- Recipes have critical errors
- Cannot be imported without fixes
- Review `recipes-fail.json` and fix transformation logic

## Common Scenarios

### Scenario 1: High Failure Rate

If many recipes fail validation:

```bash
# Check top errors
jq '.errorSummary.topErrors' migration-data/validated/.../validation-report.json

# Common fixes:
# - Unmapped users: Re-run user transformation
# - Empty fields: Check transformation logic
# - Invalid UUIDs: Verify UUID generation
```

### Scenario 2: Many Duplicates

If duplicate detection finds many matches:

```bash
# Review duplicate groups
jq '.groups[] | select(.confidence == "high")' \
  migration-data/validated/.../duplicates-report.json

# Decide on strategy:
# - Keep first (oldest recipe)
# - Keep all (mark as duplicates)
# - Manual review
```

### Scenario 3: Adjust Detection Sensitivity

To customize duplicate detection:

```typescript
// In your validation script
import { detectDuplicates } from './duplicate-detector';

const duplicateGroups = await detectDuplicates(recipes, {
  enableFuzzyTitleMatch: false,  // Disable fuzzy matching
  fuzzyThreshold: 2,              // Stricter threshold
  ingredientMatchCount: 5,        // Compare more ingredients
});
```

## Output Files

| File | Description | Use Case |
|------|-------------|----------|
| `validation-report.json` | Complete validation report | Detailed analysis |
| `validation-summary.txt` | Human-readable summary | Quick overview |
| `recipes-pass.json` | Valid recipes | Import these |
| `recipes-warn.json` | Recipes with warnings | Optional import |
| `recipes-fail.json` | Failed recipes | Fix and re-validate |
| `duplicates-report.json` | Duplicate detection | Review duplicates |

## Validation Criteria

### Critical Errors (FAIL)
- ✗ Empty title or > 500 characters
- ✗ No ingredients
- ✗ No instructions
- ✗ Invalid UUID format
- ✗ Unmapped author ID
- ✗ Negative servings or times

### Warnings (WARN)
- ⚠ Missing description
- ⚠ Missing image
- ⚠ Missing source URL
- ⚠ No tags
- ⚠ Unparsed ingredients
- ⚠ Very short instructions

## Next Steps

After validation:

1. **If failure rate < 5%**: Proceed to import with PASS recipes
2. **If failure rate 5-10%**: Review failures, fix if possible, proceed with PASS
3. **If failure rate > 10%**: Fix transformation logic and re-run

## Troubleshooting

### Error: "Recipes file not found"
```bash
# Verify transformed data exists
ls -la migration-data/transformed/2026-01-23-14-30-00/recipes-normalized.json

# If missing, run transformation first (Task 5)
```

### Error: "Invalid recipes file format"
```bash
# Check file is valid JSON array
jq 'type' migration-data/transformed/.../recipes-normalized.json
# Should output: "array"
```

### Performance Issues
```bash
# For large datasets (> 10k recipes), disable fuzzy matching
# Edit validate-recipes.ts and add:
const duplicateGroups = await detectDuplicates(recipes, {
  enableFuzzyTitleMatch: false,
});
```

## Examples

See `validate-recipes-example.ts` for code examples:

```bash
# Run examples
ts-node src/migration/validate/validate-recipes-example.ts
```

## Support

For detailed documentation, see:
- `README.md` - Complete module documentation
- `TASK-6-IMPLEMENTATION.md` - Implementation details
- Design document: `.kiro/specs/legacy-recipe-migration/design.md`
