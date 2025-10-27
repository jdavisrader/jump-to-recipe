# Recipe Migration Utilities - Usage Examples

This document provides examples of how to use the recipe migration utilities to handle backward compatibility and optional conversion features.

## Basic Migration

### Converting a Flat Recipe to Sections

```typescript
import { RecipeMigrationUtils } from '@/lib/recipe-migration';

// Example flat recipe
const flatRecipe: Recipe = {
  id: '1',
  title: 'Chocolate Cake',
  ingredients: [
    { id: '1', name: 'Flour', amount: 2, unit: 'cup' },
    { id: '2', name: 'Sugar', amount: 1.5, unit: 'cup' },
    { id: '3', name: 'Cocoa powder', amount: 0.75, unit: 'cup' },
    { id: '4', name: 'Butter', amount: 0.5, unit: 'cup' },
    { id: '5', name: 'Eggs', amount: 2, unit: '' },
    { id: '6', name: 'Milk', amount: 1, unit: 'cup' }
  ],
  instructions: [
    { id: '1', step: 1, content: 'Preheat oven to 350°F' },
    { id: '2', step: 2, content: 'Mix dry ingredients' },
    { id: '3', step: 3, content: 'Cream butter and sugar' },
    { id: '4', step: 4, content: 'Add eggs one at a time' },
    { id: '5', step: 5, content: 'Alternate adding dry ingredients and milk' },
    { id: '6', step: 6, content: 'Bake for 30-35 minutes' }
  ],
  // ... other recipe properties
};

// Convert to sectioned format
const sectionedRecipe = RecipeMigrationUtils.convertFlatRecipeToSections(flatRecipe);

// Result will have:
// - ingredientSections: [{ id: 'uuid', name: 'Ingredients', order: 0, items: [...all ingredients] }]
// - instructionSections: [{ id: 'uuid', name: 'Instructions', order: 0, items: [...all instructions] }]
```

### Checking if Migration is Needed

```typescript
import { RecipeMigrationUtils } from '@/lib/recipe-migration';

const needsMigration = RecipeMigrationUtils.needsMigration(recipe);

if (needsMigration) {
  console.log('Recipe can be converted to use sections');
} else {
  console.log('Recipe already uses sections or is empty');
}
```

## Backward Compatibility

### Reading Recipes Safely

```typescript
import { RecipeCompatibilityLayer } from '@/lib/recipe-migration';

// This works with both flat and sectioned recipes
const ingredients = RecipeCompatibilityLayer.getIngredients(recipe);
const instructions = RecipeCompatibilityLayer.getInstructions(recipe);

// Always get sections (creates default section if needed)
const ingredientSections = RecipeCompatibilityLayer.getIngredientSections(recipe);
const instructionSections = RecipeCompatibilityLayer.getInstructionSections(recipe);
```

### Normalizing Recipe Data

```typescript
import { RecipeCompatibilityLayer } from '@/lib/recipe-migration';

// Ensures recipe has the sectioned structure
const normalizedRecipe = RecipeCompatibilityLayer.normalizeRecipe(recipe);

// Now you can safely access both flat and sectioned data
console.log(normalizedRecipe.ingredients); // Always an array
console.log(normalizedRecipe.ingredientSections); // May be undefined or array
```

## User-Facing Conversion

### Using the Migration Helper Component

```tsx
import { RecipeMigrationHelper } from '@/components/recipes';

function RecipeEditPage({ recipe }: { recipe: Recipe }) {
  const handleConvert = (convertedRecipe: RecipeWithSections) => {
    // Save the converted recipe
    updateRecipe(convertedRecipe);
  };

  return (
    <div>
      {/* Other recipe editing components */}
      
      <RecipeMigrationHelper 
        recipe={recipe}
        onConvert={handleConvert}
        className="mb-4"
      />
      
      {/* Recipe form */}
    </div>
  );
}
```

### Manual Conversion with Validation

```typescript
import { RecipeConversionUtils, RecipeMigrationUtils } from '@/lib/recipe-migration';

// Check if conversion is recommended
const isRecommended = RecipeConversionUtils.isConversionRecommended(recipe);

if (isRecommended) {
  // Get benefits to show user
  const benefits = RecipeConversionUtils.getConversionBenefits(recipe);
  
  // Show preview
  const preview = RecipeMigrationUtils.createMigrationPreview(recipe);
  
  // Convert
  const converted = RecipeConversionUtils.convertToSections(recipe);
  
  // Validate
  const validation = RecipeMigrationUtils.validateMigration(recipe, converted);
  
  if (validation.isValid) {
    // Save converted recipe
    saveRecipe(converted);
  } else {
    console.error('Migration failed:', validation.errors);
  }
}
```

## Batch Migration

### Migrating Multiple Recipes

```typescript
import { RecipeMigrationUtils } from '@/lib/recipe-migration';

const recipes: Recipe[] = await fetchAllRecipes();

// Batch migrate
const migratedRecipes = RecipeMigrationUtils.batchMigrateRecipes(recipes);

// Validate each migration
const results = recipes.map((original, index) => {
  const migrated = migratedRecipes[index];
  return RecipeMigrationUtils.validateMigration(original, migrated);
});

// Check for any failures
const failures = results.filter(result => !result.isValid);
if (failures.length > 0) {
  console.error('Some migrations failed:', failures);
}
```

## Error Handling

### Safe Migration with Fallback

```typescript
import { RecipeMigrationUtils } from '@/lib/recipe-migration';

try {
  const migrated = RecipeMigrationUtils.safeMigrateRecipe(recipe);
  
  // Validate the result
  const validation = RecipeMigrationUtils.validateMigration(recipe, migrated);
  
  if (!validation.isValid) {
    console.warn('Migration warnings:', validation.warnings);
    console.error('Migration errors:', validation.errors);
  }
  
  return migrated;
} catch (error) {
  console.error('Migration failed completely:', error);
  
  // Fallback to original recipe
  return recipe;
}
```

### Creating Rollback Plans

```typescript
import { RecipeMigrationUtils } from '@/lib/recipe-migration';

// Before migrating, create a rollback plan
const rollbackPlan = RecipeMigrationUtils.createRollbackPlan(migratedRecipe);

if (rollbackPlan) {
  // Store rollback plan for potential reversion
  storeRollbackPlan(recipe.id, rollbackPlan);
}

// Later, if user wants to revert
const originalRecipe = getRollbackPlan(recipe.id);
if (originalRecipe) {
  updateRecipe(originalRecipe);
}
```

## Integration with Forms

### Recipe Form with Migration Support

```tsx
import { RecipeForm } from '@/components/recipes';
import { RecipeMigrationHelper } from '@/components/recipes';
import { RecipeCompatibilityLayer } from '@/lib/recipe-migration';

function EditRecipePage({ recipe }: { recipe: Recipe | RecipeWithSections }) {
  // Normalize recipe for consistent handling
  const normalizedRecipe = RecipeCompatibilityLayer.normalizeRecipe(recipe);
  
  const handleSave = (updatedRecipe: RecipeWithSections) => {
    // Save the recipe (it's already in the correct format)
    saveRecipe(updatedRecipe);
  };

  const handleConvert = (convertedRecipe: RecipeWithSections) => {
    // Update the recipe to use sections
    setRecipe(convertedRecipe);
  };

  return (
    <div>
      <RecipeMigrationHelper 
        recipe={recipe as Recipe}
        onConvert={handleConvert}
      />
      
      <RecipeForm 
        recipe={normalizedRecipe}
        onSave={handleSave}
      />
    </div>
  );
}
```

## Best Practices

1. **Always use the compatibility layer** when reading recipe data to ensure it works with both formats
2. **Validate migrations** before saving to catch any data loss
3. **Provide user choice** - don't force migration, make it optional
4. **Show benefits** to users to encourage adoption of sections
5. **Handle errors gracefully** with fallbacks to original data
6. **Test edge cases** like empty recipes, recipes with null data, etc.
7. **Create rollback plans** for important migrations
8. **Use batch operations** for migrating multiple recipes efficiently