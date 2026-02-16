# Task 5: Update Recipe Normalizer for Position

## Overview
Updated the recipe normalizer functions to ensure position is always present in ingredients and instructions, supporting the migration to explicit position persistence.

## Changes Made

### 1. Updated `recipe-normalizer.ts`

#### Modified `normalizeIngredients` function:
- Added position assignment for string ingredients (from HTML parsing)
- Added position preservation for object ingredients with valid positions
- Added position auto-assignment for ingredients missing positions
- Added sequential reindexing after filtering to ensure positions are 0, 1, 2, ...
- Added documentation referencing Requirements 5.1, 5.2, 5.5

#### Modified `normalizeInstructions` function:
- Added position assignment for string instructions
- Added position preservation for object instructions with valid positions
- Added position auto-assignment for instructions missing positions
- Added sequential reindexing after filtering to ensure positions are 0, 1, 2, ...
- Added documentation referencing Requirements 5.1, 5.2, 5.5

### 2. Verified `recipe-import-normalizer.ts`

The recipe-import-normalizer already had comprehensive position handling:
- `normalizeIngredientItems` assigns positions and reindexes after filtering
- `normalizeInstructionItems` assigns positions and reindexes after filtering
- `normalizeImportedRecipe` handles missing positions in imported data
- `normalizeExistingRecipe` applies same normalization for legacy data

All existing tests continue to pass.

### 3. Created Test Coverage

Created `recipe-normalizer.test.ts` with comprehensive tests:
- Position assignment for ingredients when missing (Req 5.1)
- Position assignment for instructions when missing (Req 5.1)
- Position preservation when valid (Req 5.2)
- Position handling for empty ingredient names (Req 5.5)
- Position assignment for string ingredients (Req 5.1)
- Position assignment for string instructions (Req 5.1)
- Position assignment for default items (Req 5.1)
- Position handling for mixed valid/invalid positions (Req 5.5)
- Position reindexing after filtering empty instructions (Req 5.5)

## Requirements Addressed

### Requirement 5.1: Auto-assign positions to legacy data
✅ Both normalizers now auto-assign positions based on array index when missing

### Requirement 5.2: Preserve existing valid positions
✅ Both normalizers check for existing valid positions and preserve them

### Requirement 5.5: Reindex positions after filtering
✅ Both normalizers reindex positions to be sequential (0, 1, 2, ...) after filtering

## Position Assignment Strategy

1. **Initial Assignment**: When processing items, use existing position if valid (>= 0), otherwise use array index
2. **Filtering**: Remove items with empty content (instructions) or invalid data
3. **Reindexing**: After filtering, reindex all positions to be sequential starting from 0

This ensures:
- No gaps in position sequences
- No duplicate positions
- Positions always start at 0
- Positions are always non-negative integers

## Test Results

All tests passing:
- ✅ 9/9 tests in `recipe-normalizer.test.ts`
- ✅ 26/26 tests in `recipe-import-normalizer.test.ts`

## Behavior Notes

### Empty Ingredient Names
The normalizer converts empty or whitespace-only ingredient names to "Unknown ingredient" rather than filtering them out. This is intentional to preserve the ingredient entry for user correction.

### String Parsing
When ingredients or instructions are provided as strings (from HTML scraping), the normalizer:
1. Parses the string to extract structured data
2. Assigns a position based on array index
3. Creates a proper Ingredient/Instruction object

### Default Items
When ingredient or instruction arrays are empty, the normalizer adds default placeholder items with position 0 to ensure the recipe has at least one item of each type.

## Next Steps

This task completes Phase 2 of the explicit position persistence implementation. The normalizers now ensure position is always present and valid. Subsequent tasks will:
- Remove position stripping logic from components (Task 7)
- Update drag-and-drop handlers (Task 8)
- Update API layer (Tasks 10-12)
- Create database migration (Tasks 13-15)

## Files Modified

- `jump-to-recipe/src/lib/recipe-normalizer.ts` - Updated normalizeIngredients and normalizeInstructions
- `jump-to-recipe/src/lib/__tests__/recipe-normalizer.test.ts` - Created comprehensive test coverage

## Files Verified (No Changes Needed)

- `jump-to-recipe/src/lib/recipe-import-normalizer.ts` - Already has position handling
- `jump-to-recipe/src/lib/__tests__/recipe-import-normalizer.test.ts` - All tests passing
