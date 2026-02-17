# Tag Filtering Issue - February 16, 2026

## Problem
When applying tag filters in the recipe search, recipes were not being filtered correctly. Users reported that recipes without the selected tags were still appearing in results.

## Root Causes

### 1. Case Sensitivity Issue (FIXED)
The tag filtering was case-sensitive, causing mismatches:
- User searches for: `breakfast` (lowercase)
- Database stores: `Breakfast` (capitalized)
- PostgreSQL array comparison: `ARRAY['breakfast'] @> ARRAY['Breakfast']` = false

**Solution:** Modified the search API to perform case-insensitive tag matching by converting both search tags and stored tags to lowercase before comparison.

### 2. Missing Tags in Database (DATA ISSUE)
- Total recipes: 104
- Recipes without tags: 103 (99%)
- Recipes with tags: 1 (1%)

Most recipes in the database have empty tag arrays (`{}`), so when users apply tag filters, no recipes match because they don't have any tags assigned.

## Changes Made

### File: `jump-to-recipe/src/app/api/recipes/search/route.ts`

**Before:**
```typescript
if (tags && tags.length > 0) {
    const tagsArray = tags.map(tag => String(tag).toLowerCase());
    whereConditions.push(sql`${recipes.tags} @> ARRAY[${sql.join(tagsArray.map(tag => sql`${tag}`), sql`, `)}]::text[]`);
}
```

**After:**
```typescript
if (tags && tags.length > 0) {
    const tagsArray = tags.map(tag => String(tag).toLowerCase());
    // Use case-insensitive comparison by converting stored tags to lowercase
    whereConditions.push(
        sql`(
            SELECT array_agg(lower(tag)) 
            FROM unnest(${recipes.tags}) AS tag
        ) @> ARRAY[${sql.join(tagsArray.map(tag => sql`${tag}`), sql`, `)}]::text[]`
    );
}
```

## Testing

Test query to verify case-insensitive matching works:
```sql
SELECT id, title, tags 
FROM recipes 
WHERE (
    SELECT array_agg(lower(tag)) 
    FROM unnest(tags) AS tag
) @> ARRAY['breakfast']::text[];
```

Result: Successfully finds "Eggs Benedict" recipe with "Breakfast" tag.

## Recommendations

1. **Add tags to existing recipes**: Consider running a data migration or providing a bulk tag editor in the admin interface
2. **Make tags required or suggested**: When creating/editing recipes, encourage users to add tags
3. **Tag suggestions**: Implement autocomplete with common tags to improve consistency
4. **Data validation**: Ensure tags are stored in a consistent format (e.g., lowercase or title case)

## Status
✅ Case sensitivity issue - FIXED
⚠️ Missing tags in database - DATA ISSUE (requires content update)
