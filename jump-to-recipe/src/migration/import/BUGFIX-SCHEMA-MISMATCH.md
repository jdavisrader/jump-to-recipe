# Bug Fix: Schema Mismatch in Recipe Migration API

## Problem

The migration was failing with a 500 error because the `/api/migration/recipes/route.ts` was trying to import `ingredients` and `instructions` as separate tables from the schema, but they don't exist as separate tables.

### Error Message
```
Export ingredients doesn't exist in target module
./jump-to-recipe/src/app/api/migration/recipes/route.ts:11:1
import { recipes, ingredients, instructions } from '@/db/schema';

The export ingredients was not found in module [project]/jump-to-recipe/src/db/schema/index.ts
```

## Root Cause

The database schema stores `ingredients` and `instructions` as **JSONB columns** within the `recipes` table, not as separate relational tables. The migration API route was written assuming a normalized schema with separate tables.

### Actual Schema Structure

```typescript
// jump-to-recipe/src/db/schema/recipes.ts
export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  ingredients: jsonb('ingredients').notNull(),  // ← JSONB column
  instructions: jsonb('instructions').notNull(), // ← JSONB column
  // ... other fields
});
```

## Solution

Updated `/api/migration/recipes/route.ts` to:

1. **Remove invalid imports**: Removed `ingredients` and `instructions` from the import statement
2. **Store as JSONB**: Pass ingredients and instructions arrays directly to the recipe insert

### Changes Made

**Before:**
```typescript
import { recipes, ingredients, instructions } from '@/db/schema';

// ... later in the code
const [newRecipe] = await db.insert(recipes).values({
  // ... recipe fields without ingredients/instructions
}).returning();

// Insert ingredients into separate table
await db.insert(ingredients).values(/* ... */);

// Insert instructions into separate table
await db.insert(instructions).values(/* ... */);
```

**After:**
```typescript
import { recipes } from '@/db/schema';

// ... later in the code
const [newRecipe] = await db.insert(recipes).values({
  // ... recipe fields
  ingredients: body.ingredients, // Store as JSONB
  instructions: body.instructions, // Store as JSONB
  ingredientSections: body.ingredientSections || null,
  instructionSections: body.instructionSections || null,
}).returning();

// No separate inserts needed - data is in JSONB columns
```

## Why This Happened

The migration API route was created based on an assumption of a normalized database schema (separate tables for ingredients and instructions), but the actual implementation uses a denormalized JSONB approach for flexibility.

## Testing

After this fix, the migration should work correctly:

```bash
npm run migration:import
```

You should see:
```
👥 Importing 9 users...
  ✓ Created user: user1@example.com
  ✓ Created user: user2@example.com
  ...

✓ User import complete:
  - Created: 9
  - Existing: 0
  - Skipped: 0
  - Failed: 0
```

## Related Files

- `jump-to-recipe/src/app/api/migration/recipes/route.ts` - Fixed recipe import endpoint
- `jump-to-recipe/src/db/schema/recipes.ts` - Actual schema definition
- `jump-to-recipe/src/db/schema/index.ts` - Schema exports

## Notes

- The JSONB approach is actually better for this use case as it keeps ingredients and instructions with their recipe
- No migration of the database schema is needed
- The transformation layer already produces the correct format (arrays of objects)
