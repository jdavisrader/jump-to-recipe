# Recipe Import Normalizer - Usage Examples

This document provides examples of how to use the recipe import normalization functions.

## Basic Usage

### Normalizing Imported Recipe Data

```typescript
import { normalizeImportedRecipe, createNormalizationSummary } from '@/lib/recipe-import-normalizer';

// Create a summary to track changes
const summary = createNormalizationSummary();

// Import data from external source (may have missing/invalid fields)
const importedData = {
  title: 'Chocolate Chip Cookies',
  ingredientSections: [
    {
      // Missing name - will be assigned "Imported Section"
      items: [
        { name: 'Flour', amount: 2, unit: 'cups' },
        { name: '', amount: 1, unit: 'cup' }, // Empty - will be dropped
      ]
    },
    {
      name: 'Wet Ingredients',
      items: [] // Empty section - will be flattened
    }
  ]
};

// Normalize the data
const normalized = normalizeImportedRecipe(importedData, summary);

// Check what was fixed
console.log(formatNormalizationSummary(summary));
// Output: "Fixed: removed 1 empty section, renamed 1 section, dropped 1 empty item, generated 3 IDs, assigned 2 positions"
```

### Normalizing Existing Recipe Data

```typescript
import { normalizeExistingRecipe } from '@/lib/recipe-import-normalizer';

// Load existing recipe from database
const existingRecipe = await db.getRecipe(recipeId);

// Normalize for editing (fixes legacy data issues)
const normalized = normalizeExistingRecipe(existingRecipe);

// Now ready for editing with current validation rules
```

## Common Scenarios

### Scenario 1: Recipe with Missing Section Names

```typescript
const imported = {
  title: 'Pasta Carbonara',
  ingredientSections: [
    {
      // No name provided
      items: [
        { name: 'Spaghetti', amount: 400, unit: 'g' },
        { name: 'Eggs', amount: 4, unit: '' }
      ]
    }
  ]
};

const normalized = normalizeImportedRecipe(imported);

// Result:
// - Section name: "Imported Section"
// - All items preserved
// - IDs generated for section and items
// - Sequential positions assigned
```

### Scenario 2: Recipe with Empty Sections

```typescript
const imported = {
  title: 'Simple Salad',
  ingredientSections: [
    {
      name: 'Vegetables',
      items: [
        { name: 'Lettuce', amount: 1, unit: 'head' }
      ]
    },
    {
      name: 'Dressing',
      items: [] // Empty section
    }
  ]
};

const summary = createNormalizationSummary();
const normalized = normalizeImportedRecipe(imported, summary);

// Result:
// - Only "Vegetables" section remains
// - "Dressing" section removed
// - summary.sectionsFlattened === 1
```

### Scenario 3: Recipe with Empty Items

```typescript
const imported = {
  title: 'Smoothie',
  ingredientSections: [
    {
      name: 'Ingredients',
      items: [
        { name: 'Banana', amount: 1, unit: '' },
        { name: '', amount: 1, unit: 'cup' }, // Empty name
        { name: '   ', amount: 2, unit: 'tbsp' }, // Whitespace only
        { name: 'Milk', amount: 1, unit: 'cup' }
      ]
    }
  ]
};

const summary = createNormalizationSummary();
const normalized = normalizeImportedRecipe(imported, summary);

// Result:
// - Only "Banana" and "Milk" items remain
// - 2 empty items dropped
// - summary.itemsDropped === 2
```

### Scenario 4: Recipe with Missing IDs and Positions

```typescript
const imported = {
  title: 'Pancakes',
  ingredientSections: [
    {
      name: 'Dry Ingredients',
      // No order specified
      items: [
        { name: 'Flour', amount: 2, unit: 'cups' }, // No ID
        { name: 'Sugar', amount: 2, unit: 'tbsp' } // No ID
      ]
    },
    {
      name: 'Wet Ingredients',
      // No order specified
      items: [
        { name: 'Milk', amount: 1, unit: 'cup' } // No ID
      ]
    }
  ]
};

const summary = createNormalizationSummary();
const normalized = normalizeImportedRecipe(imported, summary);

// Result:
// - Section orders: 0, 1
// - All items have UUIDs
// - summary.idsGenerated === 5 (2 sections + 3 items)
// - summary.positionsAssigned === 2 (for sections)
```

### Scenario 5: Complex Import with Multiple Issues

```typescript
const imported = {
  title: 'Complex Recipe',
  ingredientSections: [
    {
      // Missing name
      items: [
        { name: 'Flour', amount: 2, unit: 'cups' }
      ]
    },
    {
      name: '   ', // Whitespace name
      items: [
        { name: 'Sugar', amount: 1, unit: 'cup' },
        { name: '', amount: 1, unit: 'tsp' } // Empty item
      ]
    },
    {
      name: 'Empty Section',
      items: [] // Will be removed
    }
  ]
};

const summary = createNormalizationSummary();
const normalized = normalizeImportedRecipe(imported, summary);

console.log(formatNormalizationSummary(summary));
// Output: "Fixed: removed 1 empty section, renamed 2 sections, dropped 1 empty item, generated 5 IDs, assigned 2 positions"

// Result:
// - 2 sections remain (empty one removed)
// - Both sections named "Imported Section"
// - 2 valid items total
// - All IDs and positions assigned
```

## Integration Examples

### In Recipe Import Form Component

```typescript
import { normalizeImportedRecipe, formatNormalizationSummary } from '@/lib/recipe-import-normalizer';
import { validateRecipeStrict } from '@/lib/validations/recipe-sections';

async function handleImport(externalData: any) {
  // Step 1: Normalize the imported data
  const summary = createNormalizationSummary();
  const normalized = normalizeImportedRecipe(externalData, summary);
  
  // Step 2: Show user what was fixed
  if (summary.sectionsRenamed > 0 || summary.itemsDropped > 0) {
    toast.info(formatNormalizationSummary(summary));
  }
  
  // Step 3: Validate the normalized data
  const validation = validateRecipeStrict(normalized);
  
  if (!validation.success) {
    toast.error('Recipe validation failed');
    return;
  }
  
  // Step 4: Save to database
  await saveRecipe(validation.data);
  toast.success('Recipe imported successfully');
}
```

### In Recipe Editor Component

```typescript
import { normalizeExistingRecipe } from '@/lib/recipe-import-normalizer';

async function loadRecipeForEditing(recipeId: string) {
  // Load from database
  const recipe = await db.getRecipe(recipeId);
  
  // Normalize to fix any legacy data issues
  const normalized = normalizeExistingRecipe(recipe);
  
  // Set form data
  setFormData(normalized);
}
```

### In API Route

```typescript
import { normalizeImportedRecipe } from '@/lib/recipe-import-normalizer';
import { validateRecipeStrict } from '@/lib/validations/recipe-sections';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Normalize imported data
  const normalized = normalizeImportedRecipe(body);
  
  // Validate
  const validation = validateRecipeStrict(normalized);
  
  if (!validation.success) {
    return Response.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 }
    );
  }
  
  // Save to database
  const recipe = await db.insert(recipes).values(validation.data);
  
  return Response.json(recipe);
}
```

## Best Practices

1. **Always track normalization changes**: Use the summary parameter to track what was fixed
2. **Show user feedback**: Display normalization summary to users so they know what was changed
3. **Validate after normalization**: Always validate normalized data before saving
4. **Handle edge cases**: Check for undefined/empty sections and items
5. **Preserve valid data**: Normalization only fixes invalid data, valid data is preserved

## Error Handling

```typescript
try {
  const normalized = normalizeImportedRecipe(importedData);
  const validation = validateRecipeStrict(normalized);
  
  if (!validation.success) {
    // Handle validation errors
    console.error('Validation errors:', validation.errors);
    return;
  }
  
  // Proceed with save
  await saveRecipe(validation.data);
} catch (error) {
  console.error('Normalization failed:', error);
  // Handle unexpected errors
}
```

## Testing

```typescript
import { normalizeImportedRecipe, createNormalizationSummary } from '@/lib/recipe-import-normalizer';

describe('Recipe Import', () => {
  it('should normalize imported recipe', () => {
    const summary = createNormalizationSummary();
    const imported = {
      title: 'Test Recipe',
      ingredientSections: [
        {
          items: [{ name: 'Flour', amount: 2, unit: 'cups' }]
        }
      ]
    };
    
    const result = normalizeImportedRecipe(imported, summary);
    
    expect(result.ingredientSections[0].name).toBe('Imported Section');
    expect(summary.sectionsRenamed).toBe(1);
  });
});
```
