# Explicit Position Migration

This directory contains the migration script for adding explicit position properties to existing recipes in the database.

## Overview

The migration converts recipes from implicit position tracking (via array order) to explicit position persistence (via a `position` property on each ingredient and instruction).

## Migration Script

**File**: `migrate-explicit-positions.ts`

**Purpose**: Adds position properties to all ingredients and instructions in existing recipes.

## What It Does

The migration script:

1. **Fetches all recipes** from the database
2. **Checks each recipe** to determine if migration is needed
3. **Adds position properties** based on array index:
   - Flat ingredients: position 0 to N-1
   - Flat instructions: position 0 to N-1
   - Items within ingredient sections: position 0 to N-1 per section
   - Items within instruction sections: position 0 to N-1 per section
4. **Preserves existing positions** if already valid
5. **Updates recipes** in the database
6. **Logs progress** and generates a summary report

## Features

- **Idempotent**: Safe to run multiple times (won't duplicate positions)
- **Non-destructive**: Preserves all existing recipe data
- **Error handling**: Logs errors without stopping the entire migration
- **Progress tracking**: Reports progress every 100 recipes
- **Summary report**: Provides detailed statistics at completion

## Usage

### Prerequisites

1. Ensure database connection is configured in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

2. Ensure all dependencies are installed:
   ```bash
   npm install
   ```

### Running the Migration

#### Option 1: Direct Execution (Recommended)

```bash
cd jump-to-recipe
npx tsx src/db/migrations/migrate-explicit-positions.ts
```

#### Option 2: Import and Run Programmatically

```typescript
import { migrateRecipesToExplicitPositions } from '@/db/migrations/migrate-explicit-positions';

const stats = await migrateRecipesToExplicitPositions();
console.log('Migration completed:', stats);
```

### Expected Output

```
╔════════════════════════════════════════════════════════════╗
║   Recipe Position Migration - Add Explicit Positions      ║
╚════════════════════════════════════════════════════════════╝

Fetching recipes from database...
Found 150 recipes to process

Progress: 100 processed, 95 updated, 5 skipped
Progress: 150 processed, 142 updated, 8 skipped

╔════════════════════════════════════════════════════════════╗
║                   Migration Summary                        ║
╚════════════════════════════════════════════════════════════╝

Total Recipes Processed: 150
Recipes Updated:         142
Recipes Skipped:         8 (already had positions)
Errors:                  0
Duration:                3s

✅ Migration completed successfully!
```

## Migration Logic

### Position Assignment

For items **without** a valid position:
```typescript
position = arrayIndex
```

For items **with** a valid position:
```typescript
position = existingPosition (preserved)
```

### Valid Position Criteria

A position is considered valid if:
- It is a number
- It is an integer
- It is non-negative (>= 0)

### Section Scoping

Positions are scoped to their container:
- **Flat list**: positions 0 to N-1 across all items
- **Within section**: positions 0 to N-1 per section (resets for each section)

## Testing

Run the test suite to verify migration logic:

```bash
npm test -- src/db/migrations/__tests__/migrate-explicit-positions.test.ts
```

The test suite validates:
- Position validation logic
- Position assignment for flat lists
- Position assignment for sections
- Preservation of existing positions
- Idempotency (safe to run multiple times)
- Data integrity (no data loss)

## Rollback

If issues are discovered after migration:

1. **Code rollback**: The old code is backward compatible with position data
2. **Database**: Position data can remain (it's additive, not destructive)
3. **Re-migration**: Safe to run the migration again if needed

## Troubleshooting

### Migration Fails to Connect to Database

**Error**: `Connection refused` or `Database not found`

**Solution**: Verify `DATABASE_URL` in `.env` is correct and database is running

### Migration Reports Errors

**Check**: Review error details in the summary report
**Action**: Investigate specific recipes that failed
**Note**: Other recipes will still be migrated successfully

### Migration Takes Too Long

**Expected**: ~100 recipes per second
**If slower**: Check database connection, server load, or network latency

## Related Files

- **Migration Script**: `src/db/migrations/migrate-explicit-positions.ts`
- **Tests**: `src/db/migrations/__tests__/migrate-explicit-positions.test.ts`
- **Design Document**: `.kiro/specs/explicit-position-persistence/design.md`
- **Requirements**: `.kiro/specs/explicit-position-persistence/requirements.md`
- **Tasks**: `.kiro/specs/explicit-position-persistence/tasks.md`

## Requirements Satisfied

This migration satisfies the following requirements:

- **Requirement 8.1**: Process all recipes in the database
- **Requirement 8.2**: Add position properties based on current array order
- **Requirement 8.3**: Report statistics (recipes processed, positions added)
- **Requirement 8.4**: Log failures without stopping the entire process
- **Requirement 8.5**: Verify all recipes have valid positions (idempotent)

## Next Steps

After running the migration:

1. **Verify**: Check a sample of recipes in the database to confirm positions are present
2. **Test**: Run the application and verify drag-and-drop functionality works
3. **Monitor**: Watch for any position-related errors in logs
4. **Deploy**: Continue with remaining deployment tasks

## Support

For issues or questions about the migration:
- Review the design document: `.kiro/specs/explicit-position-persistence/design.md`
- Check the test suite for examples
- Review error logs from the migration summary
