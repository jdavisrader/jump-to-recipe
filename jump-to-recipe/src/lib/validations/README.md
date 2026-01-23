# Recipe Validation Architecture

This directory contains the validation schemas and utilities for the Recipe Sections Hardening feature. The validation system ensures data integrity, provides clear user feedback, and maintains consistency between client and server validation.

## Overview

The validation architecture follows these key principles:

1. **Shared Schema**: Single source of truth using Zod schemas
2. **Strict Validation**: Fail-fast approach with no automatic transforms
3. **Dual Validation**: Client-side (UX) + Server-side (security)
4. **Clear Feedback**: Field-level errors with actionable messages
5. **Import Normalization**: Separate pipeline for external data

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Input                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          Client-Side Validation (Zod Schema)                 │
│  - Real-time validation on blur                              │
│  - Inline error display                                      │
│  - Save button disabled when invalid                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
              [Valid] or [Invalid]
                     │
                     ├─[Invalid]─> Show Errors + Disable Save
                     │
                     └─[Valid]──> Enable Save Button
                                   │
                                   ▼
                     ┌─────────────────────────┐
                     │   User Submits Form     │
                     └────────────┬────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │ Server-Side Validation  │
                     │   (Same Zod Schema)     │
                     └────────────┬────────────┘
                                  │
                                  ▼
                           [Valid] or [Invalid]
                                  │
                                  ├─[Invalid]─> Return 400 + Error Details
                                  │
                                  └─[Valid]──> Save to Database
```

## Files

### `recipe-sections.ts`

The core validation schema file that defines strict validation rules for recipe sections.

**Key Schemas:**

- `strictIngredientSchema` - Validates individual ingredients
- `strictInstructionStepSchema` - Validates individual instruction steps
- `strictIngredientSectionSchema` - Validates ingredient sections
- `strictInstructionSectionSchema` - Validates instruction sections
- `strictRecipeWithSectionsSchema` - Validates complete recipes

**Validation Rules:**

1. **Section Names**: Required, non-empty, no whitespace-only
2. **Section Items**: Minimum 1 item per section
3. **Item Text**: Required, non-empty, no whitespace-only
4. **IDs**: Must be valid UUID v4
5. **Positions**: Non-negative integers
6. **Recipe Level**: At least one ingredient required

### `recipe.ts`

General recipe validation schemas for basic recipe data (title, description, etc.).

### `photo-validation.ts`

Validation schemas for recipe photo uploads and management.

### `admin-cookbook.ts`

Validation schemas for admin cookbook management operations.

### `cookbook-recipes.ts`

Validation schemas for cookbook-recipe relationships.

## Usage Examples

### Client-Side Validation

```typescript
import { useRecipeValidation } from '@/hooks/useRecipeValidation';

function RecipeForm() {
  const { validate, getFieldError, isValid, errorSummary } = useRecipeValidation();
  
  const handleBlur = () => {
    const formData = form.getValues();
    validate(formData);
  };
  
  const handleSubmit = async (data: any) => {
    if (!validate(data)) {
      // Show errors, focus first invalid field
      return;
    }
    
    // Proceed with submission
    await saveRecipe(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Error Summary */}
      {errorSummary && (
        <div className="error-summary">
          {errorSummary.count} validation errors must be fixed
        </div>
      )}
      
      {/* Field with validation */}
      <input
        name="sectionName"
        onBlur={handleBlur}
        aria-invalid={!!getFieldError('ingredientSections.0.name')}
      />
      {getFieldError('ingredientSections.0.name') && (
        <span className="validation-error">
          {getFieldError('ingredientSections.0.name')}
        </span>
      )}
    </form>
  );
}
```

### Server-Side Validation

```typescript
import { strictRecipeWithSectionsSchema } from '@/lib/validations/recipe-sections';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate with strict schema
  const result = strictRecipeWithSectionsSchema.safeParse(body);
  
  if (!result.success) {
    return Response.json(
      {
        error: 'Validation failed',
        details: result.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }
  
  // Save validated data
  const recipe = await db.insert(recipes).values(result.data);
  return Response.json(recipe);
}
```

### Import Normalization

```typescript
import { normalizeImportedRecipe } from '@/lib/recipe-import-normalizer';
import { strictRecipeWithSectionsSchema } from '@/lib/validations/recipe-sections';

async function importRecipe(externalData: any) {
  // Step 1: Normalize imported data
  const normalized = normalizeImportedRecipe(externalData);
  
  // Step 2: Validate normalized data
  const result = strictRecipeWithSectionsSchema.safeParse(normalized);
  
  if (!result.success) {
    throw new Error('Invalid recipe data after normalization');
  }
  
  // Step 3: Save to database
  return await saveRecipe(result.data);
}
```

## Validation Error Types

| Error Type | Trigger | Message | UI Treatment |
|------------|---------|---------|--------------|
| Empty Section Name | Section name is empty or whitespace | "Section name is required" | Inline error below section header |
| Empty Section | Section has no items | "This section must contain at least one ingredient/step" | Warning box inside section |
| No Ingredients | Recipe has no ingredients | "At least one ingredient is required for a recipe" | Error banner at top of form |
| Empty Item Text | Item text is empty or whitespace | "Ingredient/Instruction text cannot be empty" | Inline error below item field |
| Invalid Position | Position is negative or duplicate | "Invalid position value" | Console warning (auto-fixed) |
| Invalid ID | ID is not a valid UUID | "Invalid ID format" | Console error (auto-fixed on save) |

## Error Response Format

### Client-Side Error State

```typescript
interface ValidationError {
  path: string[];          // e.g., ['ingredientSections', '0', 'name']
  message: string;         // Human-readable error message
}

interface ValidationState {
  errors: ValidationError[];
  isValid: boolean;
  errorsByField: Map<string, string>;
  errorSummary: {
    count: number;
    types: string[];
  } | null;
}
```

### Server-Side Error Response

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "ingredientSections.0.name",
      "message": "Section name is required"
    },
    {
      "path": "ingredientSections.1.items",
      "message": "This section must contain at least one ingredient"
    }
  ]
}
```

## Import Normalization Process

The import normalization pipeline handles external recipe data that may not meet validation requirements:

### Normalization Steps

1. **Missing Section Names** → Assign "Imported Section"
2. **Empty Sections** → Flatten items to unsectioned
3. **Missing Positions** → Auto-assign sequential positions
4. **Empty Items** → Drop from the list
5. **Missing IDs** → Generate UUID v4
6. **No Sections** → Treat as unsectioned recipe

### Example

**Before Normalization:**
```json
{
  "ingredientSections": [
    {
      "name": "",
      "items": [
        { "text": "2 cups flour" },
        { "text": "" }
      ]
    },
    {
      "name": "Wet Ingredients",
      "items": []
    }
  ]
}
```

**After Normalization:**
```json
{
  "ingredientSections": [
    {
      "id": "uuid-1",
      "name": "Imported Section",
      "position": 0,
      "items": [
        {
          "id": "uuid-2",
          "text": "2 cups flour",
          "position": 0
        }
      ]
    }
  ]
}
```

## Backward Compatibility

### Existing Recipes

The validation system maintains backward compatibility with existing recipes:

1. **Load Without Modification**: Existing recipes load as-is
2. **Normalize on Edit**: Apply normalization when user edits
3. **Save Normalized Data**: Persist corrected data on save
4. **No Forced Migration**: Users aren't forced to update

### Migration Strategy

```typescript
import { normalizeExistingRecipe } from '@/lib/recipe-import-normalizer';

function RecipeEditor({ recipeId }: { recipeId: string }) {
  const recipe = await loadRecipe(recipeId);
  
  // Normalize existing recipe data silently
  const normalized = normalizeExistingRecipe(recipe);
  
  // Display normalized data in form
  return <RecipeForm initialData={normalized} />;
}
```

## Accessibility Features

### ARIA Live Regions

```tsx
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {errorSummary && errorSummary.count > 0 && (
    `${errorSummary.count} validation errors found. Please review and fix.`
  )}
</div>
```

### Field Association

```tsx
<input
  id="section-name"
  aria-invalid={hasError}
  aria-describedby={hasError ? "section-name-error" : undefined}
/>
{hasError && (
  <div id="section-name-error" role="alert">
    Section name is required
  </div>
)}
```

### Focus Management

```typescript
const handleSubmit = async () => {
  if (!validate()) {
    // Move focus to first invalid field
    const firstInvalid = document.querySelector('[aria-invalid="true"]');
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};
```

## Testing

### Unit Tests

- `recipe-sections-validation.test.ts` - Schema validation tests
- `recipe-import-normalizer.test.ts` - Normalization logic tests
- `useRecipeValidation.test.ts` - Validation hook tests

### Integration Tests

- `recipe-form-validation.test.tsx` - Form validation flow
- `section-manager-validation.test.tsx` - Section validation UI
- `validation.test.ts` - API validation tests

### Test Coverage

All validation schemas and normalization functions have 100% code coverage.

## Performance Considerations

### Validation Performance

- **Target**: < 5ms for typical recipe validation
- **Optimization**: Memoize validation results
- **Debouncing**: 300ms debounce for real-time validation

### Rendering Performance

- **Memoization**: Use React.memo for section components
- **Error Maps**: Memoize error field lookups
- **Selective Re-render**: Only re-render changed sections

## Security

### Input Sanitization

- Trim all text inputs
- Validate string lengths
- Prevent XSS in error messages
- Sanitize imported data

### Server-Side Validation

- Never trust client data
- Validate all inputs
- Rate limit API endpoints
- Log validation failures

## Related Documentation

- [Import Normalization Examples](../recipe-import-normalizer.examples.md)
- [Duplicate Section Names](./DUPLICATE-SECTION-NAMES.md)
- [Recipe Migration Guide](../../../docs/RECIPE-SECTIONS-MIGRATION.md) (to be created)

## Requirements Mapping

This validation architecture satisfies the following requirements:

- **1.1-1.5**: Section Name Validation
- **2.1-2.5**: Empty Section Prevention
- **3.1-3.5**: Recipe-Level Validation
- **4.1-4.5**: Item-Level Validation
- **5.1-5.5**: Inline Validation Feedback
- **6.1-6.5**: Import Normalization
- **7.1-7.5**: Server-Side Validation
- **13.1-13.5**: Validation Schema Sharing
- **14.1-14.5**: Validation Error Summary
