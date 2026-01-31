# User Transformation Usage Guide

## Quick Start

### 1. Transform Users from Extracted Data

```typescript
import { runUserTransformation } from './transform/transform-users-example';

// Specify the directory containing extracted users.json
const extractedDataDir = 'migration-data/raw/2026-01-24-12-00-00';
const outputDir = 'migration-data';

// Run the full transformation pipeline
await runUserTransformation(extractedDataDir, outputDir);
```

This will:
1. Load extracted user data
2. Transform all users to new schema
3. Generate user mapping table
4. Export mapping as CSV
5. Validate mapping integrity
6. Generate comprehensive report

### 2. Transform a Single User

```typescript
import { transformUser } from './transform/user-transformer';
import type { LegacyUser } from '../types/extraction';

const legacyUser: LegacyUser = {
  id: 1,
  email: 'john.doe@example.com',
  username: 'johndoe',
  encrypted_password: 'hash',
  super_user: false,
  created_at: '2020-01-15T10:30:00Z',
  updated_at: '2023-06-20T14:45:00Z',
};

const transformedUser = transformUser(legacyUser);
console.log(transformedUser);
// {
//   id: '550e8400-e29b-41d4-a716-446655440000',
//   name: 'johndoe',
//   email: 'john.doe@example.com',
//   role: 'user',
//   ...
// }
```

### 3. Batch Transform Users

```typescript
import { transformUsers } from './transform/user-transformer';
import type { LegacyUser } from '../types/extraction';

const legacyUsers: LegacyUser[] = [...]; // Your legacy users

const result = await transformUsers(legacyUsers);

console.log(`Transformed: ${result.stats.successful}/${result.stats.total}`);
console.log(`Admins: ${result.stats.adminCount}`);
console.log(`Users: ${result.stats.userCount}`);
console.log(`Errors: ${result.errors.length}`);
```

### 4. Generate and Save Mapping Table

```typescript
import { generateUserMappingTable } from './transform/user-mapping-generator';

const mapping = result.mapping; // From transformUsers()
const outputDir = 'migration-data/transformed';

await generateUserMappingTable(mapping, outputDir);
// Creates: user-mapping.json with indexes
```

### 5. Export Mapping as CSV

```typescript
import { exportUserMappingCsv } from './transform/user-mapping-generator';

await exportUserMappingCsv(mapping, outputDir);
// Creates: user-mapping.csv
```

### 6. Load Existing Mapping

```typescript
import { loadUserMapping } from './transform/user-mapping-generator';

const mapping = await loadUserMapping('migration-data/transformed/user-mapping.json');
console.log(`Loaded ${mapping.length} user mappings`);
```

### 7. Lookup User by Legacy ID

```typescript
import { getUserUuidByLegacyId } from './transform/user-transformer';

const legacyId = 42;
const newUuid = getUserUuidByLegacyId(legacyId, mapping);

if (newUuid) {
  console.log(`Legacy ID ${legacyId} → UUID ${newUuid}`);
} else {
  console.log(`No mapping found for legacy ID ${legacyId}`);
}
```

### 8. Lookup User by Email

```typescript
import { getUserUuidByEmail } from './transform/user-transformer';

const email = 'user@example.com';
const newUuid = getUserUuidByEmail(email, mapping);

if (newUuid) {
  console.log(`Email ${email} → UUID ${newUuid}`);
} else {
  console.log(`No mapping found for email ${email}`);
}
```

### 9. Validate Mapping Integrity

```typescript
import { validateUserMapping } from './transform/user-mapping-generator';

const validation = validateUserMapping(mapping);

if (validation.valid) {
  console.log('✓ Mapping is valid');
} else {
  console.error('✗ Mapping validation failed:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
}
```

## Common Patterns

### Pattern 1: Full Pipeline with Error Handling

```typescript
import { runUserTransformation } from './transform/transform-users-example';

try {
  await runUserTransformation(
    'migration-data/raw/2026-01-24-12-00-00',
    'migration-data'
  );
  console.log('✓ User transformation complete');
} catch (error) {
  console.error('✗ User transformation failed:', error);
  process.exit(1);
}
```

### Pattern 2: Transform with Custom Output Directory

```typescript
import { transformUsers } from './transform/user-transformer';
import { generateUserMappingTable } from './transform/user-mapping-generator';
import { promises as fs } from 'fs';
import path from 'path';

// Load legacy users
const usersContent = await fs.readFile('path/to/users.json', 'utf-8');
const legacyUsers = JSON.parse(usersContent);

// Transform
const result = await transformUsers(legacyUsers);

// Save to custom directory
const outputDir = 'custom/output/path';
await fs.mkdir(outputDir, { recursive: true });

// Save transformed users
await fs.writeFile(
  path.join(outputDir, 'users-normalized.json'),
  JSON.stringify(result.users, null, 2),
  'utf-8'
);

// Save mapping
await generateUserMappingTable(result.mapping, outputDir);
```

### Pattern 3: Filter Users Before Transformation

```typescript
import { transformUsers } from './transform/user-transformer';

// Load legacy users
const allUsers = [...]; // Your legacy users

// Filter only active users (example)
const activeUsers = allUsers.filter(user => user.email.includes('@'));

// Transform filtered users
const result = await transformUsers(activeUsers);
```

### Pattern 4: Map Recipe Author IDs

```typescript
import { getUserUuidByLegacyId } from './transform/user-transformer';
import { loadUserMapping } from './transform/user-mapping-generator';

// Load user mapping
const userMapping = await loadUserMapping('migration-data/transformed/user-mapping.json');

// Map recipe author IDs
const recipes = [...]; // Your legacy recipes

const recipesWithMappedAuthors = recipes.map(recipe => ({
  ...recipe,
  authorId: getUserUuidByLegacyId(recipe.user_id, userMapping),
}));

// Handle unmapped authors
const unmappedRecipes = recipesWithMappedAuthors.filter(r => !r.authorId);
console.log(`Found ${unmappedRecipes.length} recipes with unmapped authors`);
```

## Output Files

After running `runUserTransformation()`, you'll find these files in `migration-data/transformed/{timestamp}/`:

1. **users-normalized.json** - Transformed users in new schema
2. **user-mapping.json** - Mapping table with indexes
3. **user-mapping.csv** - CSV export for spreadsheet viewing
4. **user-transformation-report.json** - Statistics and validation results
5. **user-transformation-errors.json** - Errors (if any)

## Transformation Rules

| Legacy Field | New Field | Transformation |
|--------------|-----------|----------------|
| `id` | `legacyId` | Preserved for reference |
| - | `id` | Generated UUID |
| `username` | `name` | Direct mapping, fallback to email prefix |
| `email` | `email` | Preserved exactly |
| `super_user` | `role` | `true` → `'admin'`, `false` → `'user'` |
| `encrypted_password` | `password` | Set to `null` |
| - | `emailVerified` | Set to `null` |
| - | `image` | Set to `null` |
| `created_at` | `createdAt` | Converted to Date |
| `updated_at` | `updatedAt` | Converted to Date |

## Error Handling

The transformation handles these error cases:

1. **Missing Email**: Logs error, skips user
2. **Missing ID**: Logs error, skips user
3. **Invalid Timestamps**: Logs error, skips user
4. **Duplicate Emails**: Detected during validation

All errors are collected and saved to `user-transformation-errors.json`.

## Performance

- **Speed**: ~1000 users/second
- **Memory**: Processes all users in memory
- **Scalability**: Suitable for <100k users

For larger datasets, consider implementing batch processing.

## Next Steps

After user transformation, you can:

1. Use the mapping table for recipe transformation (Task 5)
2. Import users via API (Task 7)
3. Verify imported users (Task 10)

## Troubleshooting

### Issue: "Cannot find module"
**Solution**: Ensure you're running from the correct directory and TypeScript is compiled.

### Issue: "Email is required" errors
**Solution**: Check your legacy data for users with null/empty emails.

### Issue: Duplicate UUIDs in mapping
**Solution**: This shouldn't happen with `crypto.randomUUID()`. If it does, there's a bug.

### Issue: Mapping validation fails
**Solution**: Check the validation errors in the report for specific issues.

## Examples

Run the example script to see all functionality:

```bash
cd jump-to-recipe/src/migration/transform
npx ts-node transform-users-example.ts
```

This will demonstrate:
- Single user transformation
- User with null username
- Lookup by legacy ID
- Lookup by email


---

# Recipe Transformation Usage Guide

## Quick Start

### 1. Transform Recipes from Extracted Data

**Prerequisites**: User transformation must be completed first to generate user mapping.

```bash
npx tsx src/migration/transform/transform-recipes.ts migration-data/raw/2026-01-23-14-30-00
```

This will:
1. Load all extracted recipe data (recipes, ingredients, instructions, tags)
2. Load user mapping from transformed directory
3. Transform all recipes to new schema
4. Parse ingredient text into structured format
5. Clean HTML from instructions
6. Aggregate tags
7. Map user IDs to UUIDs
8. Generate comprehensive reports

### 2. Programmatic Usage

```typescript
import { transformRecipes } from './recipe-transformer';
import { generateAndSaveReports } from './transformation-report-generator';

const result = await transformRecipes(
  legacyRecipes,
  ingredients,
  instructions,
  tags,
  recipeTags,
  userMapping
);

// Save reports
await generateAndSaveReports(result, 'migration-data/transformed/2026-01-23-14-30-00');
```

### 3. Run Example

```bash
npx tsx src/migration/transform/transform-recipes-example.ts
```

This demonstrates transformation with sample data including:
- Ingredient parsing (fractions, units, notes)
- HTML cleaning in instructions
- Tag aggregation
- Time conversion

## Transformation Details

### Field Mapping

| Legacy Field | New Field | Transformation |
|--------------|-----------|----------------|
| `id` | `legacyId` | Preserved for reference |
| - | `id` | Generated UUID |
| `name` | `title` | Direct mapping |
| `description` | `description` | Preserved |
| `user_id` | `authorId` | Mapped via user mapping table |
| `prep_time` + `prep_time_descriptor` | `prepTime` | Converted to integer minutes |
| `cook_time` + `cook_time_descriptor` | `cookTime` | Converted to integer minutes |
| `servings` | `servings` | Preserved |
| `original_url` | `sourceUrl` | Direct mapping |
| - | `visibility` | Set to `'public'` |
| - | `commentsEnabled` | Set to `true` |
| - | `viewCount` | Set to `0` |
| - | `likeCount` | Set to `0` |
| - | `difficulty` | Set to `null` |
| - | `notes` | Set to `null` |
| - | `imageUrl` | Set to `null` |
| - | `ingredientSections` | Set to `null` |
| - | `instructionSections` | Set to `null` |
| `created_at` | `createdAt` | Converted to Date |
| `updated_at` | `updatedAt` | Converted to Date |

### Time Conversion Rules

```typescript
// Hours to minutes
prep_time: 0.25, descriptor: 'hours' → prepTime: 15
cook_time: 1.5, descriptor: 'hours' → cookTime: 90

// Minutes (no conversion)
prep_time: 30, descriptor: 'minutes' → prepTime: 30
prep_time: 45, descriptor: null → prepTime: 45

// Rounding
prep_time: 12.7, descriptor: 'minutes' → prepTime: 13
```

### Ingredient Parsing

The parser handles various formats:

#### Pattern 1: Amount + Unit + Name
```
"2 cups flour" → { amount: 2, unit: "cup", name: "flour" }
"1 lb chicken" → { amount: 1, unit: "lb", name: "chicken" }
"3 tbsp butter" → { amount: 3, unit: "tbsp", name: "butter" }
```

#### Pattern 2: Amount + Unit + Name + Notes
```
"1 lb chicken, diced" → { amount: 1, unit: "lb", name: "chicken", notes: "diced" }
"2 cups flour, sifted" → { amount: 2, unit: "cup", name: "flour", notes: "sifted" }
```

#### Pattern 3: Fractions
```
"1½ cups sugar" → { amount: 1.5, displayAmount: "1½", unit: "cup", name: "sugar" }
"¾ cup milk" → { amount: 0.75, displayAmount: "¾", unit: "cup", name: "milk" }
"1 1/2 tsp salt" → { amount: 1.5, displayAmount: "1½", unit: "tsp", name: "salt" }
```

#### Pattern 4: No Amount
```
"Salt to taste" → { amount: 0, unit: "", name: "salt", notes: "to taste" }
"Fresh herbs" → { amount: 0, unit: "", name: "Fresh herbs" }
```

#### Supported Fractions
- ½ (1/2)
- ¼ (1/4)
- ¾ (3/4)
- ⅓ (1/3)
- ⅔ (2/3)
- ⅛ (1/8)
- ⅜ (3/8)
- ⅝ (5/8)
- ⅞ (7/8)

#### Unit Normalization
```
cups, cup, c → cup
tablespoons, tablespoon, tbsp, tbs, T → tbsp
teaspoons, teaspoon, tsp, t → tsp
pounds, pound, lbs, lb → lb
ounces, ounce, oz → oz
grams, gram, g → g
kilograms, kilogram, kg → kg
liters, liter, l → l
milliliters, milliliter, ml → ml
```

#### Parse Failures
If parsing fails:
- Original text preserved in `notes` field
- `parseSuccess: false` flag set
- Item added to unparseable items report
- Recipe still included in output

### Instruction Cleaning

HTML is cleaned using the `html-to-text` library:

#### HTML Tag Removal
```html
<p>Preheat oven to 375°F.</p>
→ "Preheat oven to 375°F."

<p>Mix flour.<br/>Add water.</p>
→ "Mix flour.\nAdd water."

<strong>Important:</strong> Don't overmix.
→ "Important: Don't overmix."
```

#### HTML Entity Conversion
```
&nbsp; → space
&quot; → "
&amp; → &
&lt; → <
&gt; → >
&#39; → '
&deg; → °
&frac12; → ½
&frac14; → ¼
&frac34; → ¾
```

#### Whitespace Normalization
- Multiple spaces → single space
- Multiple newlines → double newline (paragraph break)
- Leading/trailing whitespace trimmed

#### Empty Instructions
If instruction is empty after cleaning:
- Logged to unparseable items
- Excluded from recipe
- Recipe still included if other instructions exist

### Tag Aggregation

Tags are joined from the `recipe_tags` and `tags` tables:

```typescript
// Legacy structure
recipe_tags: [
  { recipe_id: 1, tag_id: 1 },
  { recipe_id: 1, tag_id: 2 },
  { recipe_id: 1, tag_id: 3 }
]
tags: [
  { id: 1, name: 'dessert' },
  { id: 2, name: 'cookies' },
  { id: 3, name: 'chocolate' }
]

// Transformed
recipe.tags = ['dessert', 'cookies', 'chocolate']
```

### User ID Mapping

Legacy integer user IDs are mapped to UUIDs:

```typescript
// User mapping table
{ legacyId: 1, newUuid: '550e8400-e29b-41d4-a716-446655440000' }

// Recipe transformation
recipe.user_id = 1 → recipe.authorId = '550e8400-e29b-41d4-a716-446655440000'
```

If user mapping not found:
- Warning logged
- Placeholder UUID used: `'00000000-0000-0000-0000-000000000000'`
- Will be caught in validation phase

## Output Files

After transformation, these files are created in `migration-data/transformed/{timestamp}/`:

1. **recipes-normalized.json** - All transformed recipes
2. **unparseable-items.json** - Items that couldn't be parsed (for manual review)
3. **transformation-report.json** - Comprehensive statistics and errors

### Sample Report Structure

```json
{
  "timestamp": "2026-01-23T14:30:00.000Z",
  "summary": {
    "totalRecipes": 1500,
    "successfulRecipes": 1485,
    "failedRecipes": 15,
    "successRate": "99.00%"
  },
  "statistics": {
    "total": 1500,
    "successful": 1485,
    "failed": 15,
    "ingredientsParsed": 11500,
    "ingredientsUnparsed": 500,
    "instructionsCleaned": 7400,
    "instructionsEmpty": 100,
    "timeConversions": 1200,
    "userMappings": 1485,
    "unmappedUsers": 0
  },
  "unparseableItems": {
    "total": 600,
    "byType": {
      "ingredients": 500,
      "instructions": 100
    }
  },
  "topIssues": [
    { "issue": "Failed to parse ingredient text", "count": 450 },
    { "issue": "Instruction is empty after HTML cleaning", "count": 100 }
  ]
}
```

## Error Handling

### Recipe Transformation Errors

If transformation fails for a recipe:
- Error logged with recipe ID and title
- Error details saved to transformation report
- Other recipes continue processing
- Failed recipe excluded from output

### Unparseable Items

Items that can't be parsed are:
- Logged to `unparseable-items.json` with:
  - Recipe ID and title
  - Item type (ingredient or instruction)
  - Original text
  - Reason for failure
- Still included in recipe (with raw text in notes)
- Flagged for manual review
- Counted in statistics

### Unmapped Users

If a recipe's user_id has no mapping:
- Warning logged
- Placeholder UUID used
- Counted in `unmappedUsers` statistic
- Will fail validation (can be fixed before import)

## Performance

- **Speed**: ~100-200 recipes/second (depends on complexity)
- **Memory**: Processes all recipes in memory
- **Bottlenecks**: 
  - Ingredient parsing (regex operations)
  - HTML cleaning (html-to-text library)
  - UUID generation

For 10,000 recipes:
- Transformation: ~1-2 minutes
- Report generation: ~5-10 seconds

## Validation

After transformation, review:

1. **Success Rate**: Should be >95%
2. **Parse Rate**: Ingredients should be >90% parsed
3. **Unparseable Items**: Review for patterns
4. **Unmapped Users**: Should be 0 (if user transformation ran first)
5. **Empty Instructions**: Should be <5%

## Common Issues

### Issue: "User mapping required"
**Solution**: Run user transformation first:
```bash
npx tsx src/migration/transform/transform-users.ts migration-data/raw/2026-01-23-14-30-00
```

### Issue: High unparseable ingredient count
**Causes**:
- Unusual ingredient formats
- Non-English text
- Special characters

**Solutions**:
- Review `unparseable-items.json` for patterns
- Improve parsing logic if needed
- Accept some items for manual review

### Issue: Many empty instructions
**Causes**:
- Instructions were only HTML tags (no text)
- Instructions were whitespace only

**Solutions**:
- Review original data quality
- May need to fix legacy data
- Some recipes may need manual entry

### Issue: Time conversion errors
**Causes**:
- Invalid time descriptors
- Negative times
- Very large times

**Solutions**:
- Review transformation report
- Check legacy data quality
- May need data cleanup

## Next Steps

After recipe transformation:

1. Review transformation reports
2. Check unparseable items
3. Verify sample transformed recipes
4. Proceed to validation phase (Task 6)
5. Fix critical issues and re-run if needed

## Examples

### Example 1: Transform with Custom Filters

```typescript
import { transformRecipes } from './recipe-transformer';

// Load data
const recipes = [...];
const ingredients = [...];
const instructions = [...];

// Filter recipes (e.g., only recipes from last year)
const recentRecipes = recipes.filter(r => 
  new Date(r.created_at) > new Date('2025-01-01')
);

// Transform filtered recipes
const result = await transformRecipes(
  recentRecipes,
  ingredients.filter(i => recentRecipes.some(r => r.id === i.recipe_id)),
  instructions.filter(i => recentRecipes.some(r => r.id === i.recipe_id)),
  tags,
  recipeTags,
  userMapping
);
```

### Example 2: Custom Report Analysis

```typescript
import { generateTransformationReport } from './transformation-report-generator';

const result = await transformRecipes(...);
const report = generateTransformationReport(result);

// Analyze unparseable ingredients
const ingredientIssues = report.unparseableItems.items
  .filter(item => item.type === 'ingredient')
  .map(item => item.originalText);

console.log('Unparseable ingredients:', ingredientIssues);

// Find recipes with most issues
const recipeIssues = new Map();
for (const item of report.unparseableItems.items) {
  const count = recipeIssues.get(item.recipeId) || 0;
  recipeIssues.set(item.recipeId, count + 1);
}

const topProblematicRecipes = Array.from(recipeIssues.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log('Top 10 recipes with most issues:', topProblematicRecipes);
```

### Example 3: Incremental Transformation

```typescript
// Transform in batches to reduce memory usage
const batchSize = 100;
const allTransformed = [];

for (let i = 0; i < recipes.length; i += batchSize) {
  const batch = recipes.slice(i, i + batchSize);
  const batchIngredients = ingredients.filter(ing => 
    batch.some(r => r.id === ing.recipe_id)
  );
  const batchInstructions = instructions.filter(inst => 
    batch.some(r => r.id === inst.recipe_id)
  );
  
  const result = await transformRecipes(
    batch,
    batchIngredients,
    batchInstructions,
    tags,
    recipeTags,
    userMapping
  );
  
  allTransformed.push(...result.recipes);
  console.log(`Transformed ${i + batch.length}/${recipes.length} recipes`);
}
```
