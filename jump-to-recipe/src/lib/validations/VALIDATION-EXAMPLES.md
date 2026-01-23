# Validation Code Examples

This document provides practical code examples for common validation scenarios in the Recipe Sections Hardening feature.

## Table of Contents

1. [Basic Validation Setup](#basic-validation-setup)
2. [Client-Side Validation](#client-side-validation)
3. [Server-Side Validation](#server-side-validation)
4. [Import Normalization](#import-normalization)
5. [Error Display](#error-display)
6. [Accessibility](#accessibility)
7. [Testing](#testing)

## Basic Validation Setup

### Installing Dependencies

```bash
npm install zod uuid
npm install --save-dev @types/uuid
```

### Importing Validation Schemas

```typescript
import { 
  strictRecipeWithSectionsSchema,
  strictIngredientSectionSchema,
  strictInstructionSectionSchema,
  strictIngredientSchema,
  strictInstructionStepSchema
} from '@/lib/validations/recipe-sections';
```

## Client-Side Validation

### Using the Validation Hook

```typescript
import { useRecipeValidation } from '@/hooks/useRecipeValidation';
import { useState } from 'react';

function RecipeForm() {
  const { validate, getFieldError, isValid, errors, errorSummary } = useRecipeValidation();
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
  
  // Validate on blur
  const handleBlur = () => {
    const formData = form.getValues();
    const isFormValid = validate(formData);
    
    // Update validation errors map for section components
    const errorsMap = new Map<string, string>();
    errors.forEach(error => {
      const key = error.path.join('.');
      errorsMap.set(key, error.message);
    });
    setValidationErrors(errorsMap);
  };
  
  // Validate before submit
  const handleSubmit = async (data: any) => {
    if (!validate(data)) {
      // Focus first invalid field
      const firstInvalid = document.querySelector('[aria-invalid="true"]') as HTMLElement;
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Proceed with submission
    await saveRecipe(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Validating Individual Fields

```typescript
import { strictIngredientSchema } from '@/lib/validations/recipe-sections';

function validateIngredient(ingredient: any): boolean {
  const result = strictIngredientSchema.safeParse(ingredient);
  
  if (!result.success) {
    console.error('Ingredient validation failed:', result.error.issues);
    return false;
  }
  
  return true;
}

// Example usage
const ingredient = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  text: '2 cups flour',
  position: 0
};

if (validateIngredient(ingredient)) {
  console.log('Ingredient is valid');
}
```

### Validating Sections

```typescript
import { strictIngredientSectionSchema } from '@/lib/validations/recipe-sections';

function validateSection(section: any): { isValid: boolean; errors: string[] } {
  const result = strictIngredientSectionSchema.safeParse(section);
  
  if (!result.success) {
    const errors = result.error.issues.map(issue => issue.message);
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors: [] };
}

// Example usage
const section = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Dry Ingredients',
  position: 0,
  items: [
    {
      id: '223e4567-e89b-12d3-a456-426614174000',
      text: '2 cups flour',
      position: 0
    }
  ]
};

const { isValid, errors } = validateSection(section);
if (!isValid) {
  console.error('Section validation errors:', errors);
}
```

## Server-Side Validation

### API Route with Validation

```typescript
// app/api/recipes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { strictRecipeWithSectionsSchema } from '@/lib/validations/recipe-sections';
import { db } from '@/db';
import { recipes } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with strict schema
    const result = strictRecipeWithSectionsSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
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
    const [recipe] = await db.insert(recipes).values(result.data).returning();
    
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Update Route with Validation

```typescript
// app/api/recipes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { strictRecipeWithSectionsSchema } from '@/lib/validations/recipe-sections';
import { normalizeExistingRecipe } from '@/lib/recipe-import-normalizer';
import { db } from '@/db';
import { recipes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Apply normalization for backward compatibility
    const normalized = normalizeExistingRecipe(body);
    
    // Validate normalized data
    const result = strictRecipeWithSectionsSchema.safeParse(normalized);
    
    if (!result.success) {
      return NextResponse.json(
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
    
    // Update recipe
    const [updated] = await db
      .update(recipes)
      .set(result.data)
      .where(eq(recipes.id, params.id))
      .returning();
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Import Normalization

### Normalizing Imported Recipe Data

```typescript
import { normalizeImportedRecipe } from '@/lib/recipe-import-normalizer';
import { strictRecipeWithSectionsSchema } from '@/lib/validations/recipe-sections';

async function importRecipeFromUrl(url: string) {
  // Fetch recipe data from external source
  const externalData = await fetchRecipeFromUrl(url);
  
  // Normalize the imported data
  const normalized = normalizeImportedRecipe(externalData);
  
  // Validate normalized data
  const result = strictRecipeWithSectionsSchema.safeParse(normalized);
  
  if (!result.success) {
    throw new Error('Invalid recipe data after normalization');
  }
  
  // Save to database
  const recipe = await saveRecipe(result.data);
  
  return recipe;
}
```

### Handling Normalization Results

```typescript
import { normalizeImportedRecipe } from '@/lib/recipe-import-normalizer';

function RecipeImportForm() {
  const [normalizationSummary, setNormalizationSummary] = useState<string | null>(null);
  
  const handleImport = async (externalData: any) => {
    // Track what was normalized
    const originalSectionCount = externalData.ingredientSections?.length || 0;
    const originalItemCount = externalData.ingredientSections?.reduce(
      (sum: number, s: any) => sum + (s.items?.length || 0),
      0
    ) || 0;
    
    // Normalize
    const normalized = normalizeImportedRecipe(externalData);
    
    // Calculate changes
    const newSectionCount = normalized.ingredientSections?.length || 0;
    const newItemCount = normalized.ingredientSections?.reduce(
      (sum, s) => sum + s.items.length,
      0
    ) || 0;
    
    const removedSections = originalSectionCount - newSectionCount;
    const removedItems = originalItemCount - newItemCount;
    
    // Show summary to user
    const summary = [];
    if (removedSections > 0) {
      summary.push(`Removed ${removedSections} empty section(s)`);
    }
    if (removedItems > 0) {
      summary.push(`Removed ${removedItems} empty item(s)`);
    }
    if (summary.length > 0) {
      setNormalizationSummary(summary.join(', '));
    }
    
    // Proceed with save
    await saveRecipe(normalized);
  };
  
  return (
    <div>
      {normalizationSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-sm text-blue-800">
            Normalized imported data: {normalizationSummary}
          </p>
        </div>
      )}
      {/* Import form */}
    </div>
  );
}
```

## Error Display

### Error Summary Banner

```tsx
import { AlertCircle } from 'lucide-react';

function ErrorSummaryBanner({ errorSummary }: { errorSummary: { count: number; types: string[] } }) {
  return (
    <div 
      className="error-summary bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
      role="alert"
      aria-labelledby="error-summary-title"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 id="error-summary-title" className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
            {errorSummary.count} validation {errorSummary.count === 1 ? 'error' : 'errors'} must be fixed before saving
          </h3>
          <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
            {errorSummary.types.map((errorType, index) => (
              <li key={index}>{errorType}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

### Inline Field Error

```tsx
function FieldWithError({ 
  label, 
  value, 
  onChange, 
  error 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  error?: string;
}) {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${fieldId}-error`;
  
  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={fieldId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3 py-2 border rounded-md",
          error 
            ? "border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-950/20" 
            : "border-gray-300 focus:ring-blue-500"
        )}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <div 
          id={errorId}
          className="text-red-600 dark:text-red-400 text-sm mt-1"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}
```

### Section Error Display

```tsx
function SectionWithError({ 
  section, 
  sectionError, 
  itemsError 
}: { 
  section: any; 
  sectionError?: string; 
  itemsError?: string;
}) {
  const hasError = !!(sectionError || itemsError);
  
  return (
    <div
      className={cn(
        "border rounded-lg p-4",
        hasError 
          ? "border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/10"
          : "border-gray-200 dark:border-gray-700"
      )}
      aria-invalid={hasError}
    >
      {/* Section header */}
      <div className="mb-3">
        <input
          type="text"
          value={section.name}
          className={cn(
            "text-lg font-medium",
            sectionError && "text-red-700 dark:text-red-300"
          )}
        />
        {sectionError && (
          <div className="text-red-600 dark:text-red-400 text-sm mt-1" role="alert">
            {sectionError}
          </div>
        )}
      </div>
      
      {/* Section items */}
      <div className="space-y-2">
        {section.items.map((item: any) => (
          <div key={item.id}>{item.text}</div>
        ))}
      </div>
      
      {/* Empty section error */}
      {itemsError && (
        <div 
          className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded"
          role="alert"
        >
          <p className="text-sm text-red-700 dark:text-red-400">
            {itemsError}
          </p>
        </div>
      )}
    </div>
  );
}
```

## Accessibility

### ARIA Live Region for Validation

```tsx
function ValidationLiveRegion({ errorSummary, isValid }: { 
  errorSummary: { count: number } | null; 
  isValid: boolean;
}) {
  return (
    <div 
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
      className="sr-only"
    >
      {errorSummary && errorSummary.count > 0 && (
        `${errorSummary.count} validation ${errorSummary.count === 1 ? 'error' : 'errors'} found. Please review and fix the errors before saving.`
      )}
      {isValid && (
        'All validation errors have been resolved.'
      )}
    </div>
  );
}
```

### Focus Management on Submit

```typescript
function handleSubmitWithFocus(data: any, validate: (data: any) => boolean) {
  if (!validate(data)) {
    // Move focus to first invalid field
    setTimeout(() => {
      const firstInvalid = document.querySelector('[aria-invalid="true"]') as HTMLElement;
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
    return;
  }
  
  // Proceed with submission
  submitForm(data);
}
```

### Disabled Button with Tooltip

```tsx
function SubmitButton({ isValid, errorCount }: { isValid: boolean; errorCount: number }) {
  const tooltipText = !isValid 
    ? `Cannot save: ${errorCount} validation ${errorCount === 1 ? 'error' : 'errors'}` 
    : undefined;
  
  return (
    <button
      type="submit"
      disabled={!isValid}
      title={tooltipText}
      aria-label={tooltipText || 'Save recipe'}
      className={cn(
        "px-4 py-2 rounded-md font-medium",
        isValid 
          ? "bg-blue-600 text-white hover:bg-blue-700" 
          : "bg-gray-300 text-gray-500 cursor-not-allowed"
      )}
    >
      Save Recipe
    </button>
  );
}
```

## Testing

### Unit Test for Validation Schema

```typescript
import { strictIngredientSectionSchema } from '@/lib/validations/recipe-sections';

describe('strictIngredientSectionSchema', () => {
  it('should validate a valid section', () => {
    const validSection = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Dry Ingredients',
      position: 0,
      items: [
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          text: '2 cups flour',
          position: 0
        }
      ]
    };
    
    const result = strictIngredientSectionSchema.safeParse(validSection);
    expect(result.success).toBe(true);
  });
  
  it('should reject section with empty name', () => {
    const invalidSection = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: '',
      position: 0,
      items: [
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          text: '2 cups flour',
          position: 0
        }
      ]
    };
    
    const result = strictIngredientSectionSchema.safeParse(invalidSection);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Section name is required');
    }
  });
  
  it('should reject section with no items', () => {
    const invalidSection = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Empty Section',
      position: 0,
      items: []
    };
    
    const result = strictIngredientSectionSchema.safeParse(invalidSection);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('This section must contain at least one ingredient');
    }
  });
});
```

### Integration Test for Form Validation

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeForm } from '@/components/recipes/recipe-form';

describe('RecipeForm validation', () => {
  it('should disable save button when validation fails', async () => {
    const onSubmit = jest.fn();
    
    render(<RecipeForm onSubmit={onSubmit} />);
    
    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /save recipe/i });
    fireEvent.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/validation errors must be fixed/i)).toBeInTheDocument();
    });
    
    // Submit should not have been called
    expect(onSubmit).not.toHaveBeenCalled();
  });
  
  it('should show inline error for empty section name', async () => {
    const onSubmit = jest.fn();
    
    render(<RecipeForm onSubmit={onSubmit} />);
    
    // Add a section
    const addSectionButton = screen.getByRole('button', { name: /add.*section/i });
    fireEvent.click(addSectionButton);
    
    // Clear the section name
    const sectionNameInput = screen.getByLabelText(/section name/i);
    fireEvent.change(sectionNameInput, { target: { value: '' } });
    fireEvent.blur(sectionNameInput);
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/section name is required/i)).toBeInTheDocument();
    });
  });
});
```

## Related Documentation

- [Validation Architecture README](./README.md)
- [Import Normalization Examples](../recipe-import-normalizer.examples.md)
- [Duplicate Section Names](./DUPLICATE-SECTION-NAMES.md)
