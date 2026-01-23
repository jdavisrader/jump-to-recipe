# Design Document

## Overview

This design document outlines the hardening of the Recipe Sections feature by implementing comprehensive validation rules, data integrity checks, and import normalization. The update transforms the current lenient validation approach into a strict, fail-fast system that prevents invalid recipe states while maintaining backward compatibility and providing excellent user experience through clear, actionable error messages.

The primary goals are to ensure data integrity, provide multi-user safety, normalize imported data, and create a shared validation schema between client and server that prevents invalid recipes from being saved.

## Architecture

### Current State

The existing implementation has:
- Basic Zod validation schemas for recipes and sections
- Soft validation with warnings for empty sections
- Transform-based fallbacks (e.g., empty names → "Untitled Section")
- Client-side validation only
- No import normalization
- Limited inline error feedback

### Target Architecture

The hardened architecture will:
- **Strict Validation**: Block saves when validation fails (no transforms)
- **Dual Validation**: Client-side (UX) + Server-side (security)
- **Shared Schema**: Single source of truth using Zod
- **Import Normalization**: Separate pipeline for external data
- **Inline Errors**: Field-level validation feedback
- **Position Management**: Automatic reindexing and conflict resolution

### Validation Flow

```
User Input
    ↓
Client-Side Validation (Zod Schema)
    ↓
[Valid] → Enable Save Button
[Invalid] → Show Inline Errors + Disable Save
    ↓
User Submits Form
    ↓
Server-Side Validation (Same Zod Schema)
    ↓
[Valid] → Save to Database
[Invalid] → Return 400 with Error Details
```

### Import Flow

```
External Recipe Data
    ↓
Import Normalization Pipeline
    ↓
- Assign missing section names
- Flatten empty sections
- Auto-assign positions
- Drop empty items
- Generate stable IDs
    ↓
Normalized Data
    ↓
Standard Validation (Zod Schema)
    ↓
Save to Database
```

## Components and Interfaces

### 1. Validation Schemas (Shared)

**Location**: `src/lib/validations/recipe-sections.ts` (new file)

```typescript
import { z } from 'zod';

// Strict validation - no transforms, hard failures
export const strictIngredientSchema = z.object({
  id: z.string().uuid('Invalid ingredient ID'),
  text: z.string()
    .min(1, 'Ingredient text cannot be empty')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Ingredient text cannot be only whitespace'),
  position: z.number().int().nonnegative('Position must be non-negative'),
});

export const strictInstructionStepSchema = z.object({
  id: z.string().uuid('Invalid step ID'),
  text: z.string()
    .min(1, 'Instruction text cannot be empty')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Instruction text cannot be only whitespace'),
  position: z.number().int().nonnegative('Position must be non-negative'),
});

export const strictIngredientSectionSchema = z.object({
  id: z.string().uuid('Invalid section ID'),
  name: z.string()
    .min(1, 'Section name is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Section name cannot be only whitespace'),
  position: z.number().int().nonnegative('Position must be non-negative'),
  items: z.array(strictIngredientSchema)
    .min(1, 'This section must contain at least one ingredient'),
});

export const strictInstructionSectionSchema = z.object({
  id: z.string().uuid('Invalid section ID'),
  name: z.string()
    .min(1, 'Section name is required')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Section name cannot be only whitespace'),
  position: z.number().int().nonnegative('Position must be non-negative'),
  items: z.array(strictInstructionStepSchema)
    .min(1, 'This section must contain at least one step'),
});

export const strictRecipeWithSectionsSchema = z.object({
  // ... other recipe fields
  ingredientSections: z.array(strictIngredientSectionSchema).optional(),
  instructionSections: z.array(strictInstructionSectionSchema).optional(),
  // Flat arrays for backward compatibility
  ingredients: z.array(strictIngredientSchema)
    .min(1, 'At least one ingredient is required'),
  instructions: z.array(strictInstructionStepSchema)
    .min(1, 'At least one instruction is required'),
}).refine(
  (data) => {
    // Ensure at least one ingredient exists (in sections or flat)
    const hasIngredients = data.ingredients.length > 0 ||
      (data.ingredientSections?.some(s => s.items.length > 0) ?? false);
    return hasIngredients;
  },
  { message: 'At least one ingredient is required for a recipe' }
);
```

### 2. Import Normalization

**Location**: `src/lib/recipe-import-normalizer.ts` (new file)

```typescript
import { v4 as uuidv4 } from 'uuid';

interface ImportedSection {
  id?: string;
  name?: string;
  position?: number;
  items?: Array<{ id?: string; text?: string; position?: number }>;
}

interface NormalizedSection {
  id: string;
  name: string;
  position: number;
  items: Array<{ id: string; text: string; position: number }>;
}

/**
 * Normalizes imported recipe data to meet validation requirements
 */
export function normalizeImportedRecipe(data: any): any {
  return {
    ...data,
    ingredientSections: normalizeImportedSections(
      data.ingredientSections,
      'ingredient'
    ),
    instructionSections: normalizeImportedSections(
      data.instructionSections,
      'instruction'
    ),
  };
}

/**
 * Normalizes a list of imported sections
 */
function normalizeImportedSections(
  sections: ImportedSection[] | undefined,
  type: 'ingredient' | 'instruction'
): NormalizedSection[] | undefined {
  if (!sections || sections.length === 0) {
    return undefined;
  }

  const normalized: NormalizedSection[] = [];
  const unsectionedItems: any[] = [];

  sections.forEach((section, sectionIndex) => {
    // Normalize section name
    const name = section.name?.trim() || 'Imported Section';

    // Normalize items
    const items = (section.items || [])
      .filter(item => item.text?.trim()) // Drop empty items
      .map((item, itemIndex) => ({
        id: item.id || uuidv4(),
        text: item.text!.trim(),
        position: item.position ?? itemIndex,
      }));

    // If section is empty after filtering, flatten items to unsectioned
    if (items.length === 0) {
      // Section is empty, skip it
      continue;
    }

    // Add normalized section
    normalized.push({
      id: section.id || uuidv4(),
      name,
      position: section.position ?? sectionIndex,
      items,
    });
  });

  // Reindex positions to ensure sequential order
  return normalized.map((section, index) => ({
    ...section,
    position: index,
    items: section.items.map((item, itemIndex) => ({
      ...item,
      position: itemIndex,
    })),
  }));
}

/**
 * Normalizes existing recipe data (for backward compatibility)
 */
export function normalizeExistingRecipe(data: any): any {
  // Similar logic but more lenient for existing data
  return normalizeImportedRecipe(data);
}
```

### 3. Validation Hook

**Location**: `src/hooks/useRecipeValidation.ts` (new file)

```typescript
import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { strictRecipeWithSectionsSchema } from '@/lib/validations/recipe-sections';

interface ValidationError {
  path: string[];
  message: string;
}

interface ValidationState {
  errors: ValidationError[];
  isValid: boolean;
  errorsByField: Map<string, string>;
}

export function useRecipeValidation() {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: [],
    isValid: true,
    errorsByField: new Map(),
  });

  const validate = useCallback((data: any): boolean => {
    const result = strictRecipeWithSectionsSchema.safeParse(data);

    if (result.success) {
      setValidationState({
        errors: [],
        isValid: true,
        errorsByField: new Map(),
      });
      return true;
    }

    const errors = result.error.issues.map(issue => ({
      path: issue.path.map(String),
      message: issue.message,
    }));

    const errorsByField = new Map<string, string>();
    errors.forEach(error => {
      const key = error.path.join('.');
      errorsByField.set(key, error.message);
    });

    setValidationState({
      errors,
      isValid: false,
      errorsByField,
    });

    return false;
  }, []);

  const getFieldError = useCallback((fieldPath: string): string | undefined => {
    return validationState.errorsByField.get(fieldPath);
  }, [validationState.errorsByField]);

  const errorSummary = useMemo(() => {
    if (validationState.errors.length === 0) return null;

    const errorTypes = new Set(validationState.errors.map(e => e.message));
    return {
      count: validationState.errors.length,
      types: Array.from(errorTypes),
    };
  }, [validationState.errors]);

  return {
    validate,
    getFieldError,
    isValid: validationState.isValid,
    errors: validationState.errors,
    errorSummary,
  };
}
```

### 4. Enhanced SectionManager Component

**Location**: `src/components/sections/section-manager.tsx` (modified)

**Changes**:
- Add validation error display
- Show inline errors for empty sections
- Show inline errors for empty section names
- Disable save when validation fails
- Real-time validation on blur

```typescript
interface SectionManagerProps<T> {
  // ... existing props
  validationErrors?: Map<string, string>; // NEW
  onValidate?: () => void; // NEW
}

// In render:
{validationErrors?.get(`ingredientSections.${sectionIndex}.name`) && (
  <div className="text-red-600 text-sm mt-1">
    {validationErrors.get(`ingredientSections.${sectionIndex}.name`)}
  </div>
)}

{validationErrors?.get(`ingredientSections.${sectionIndex}.items`) && (
  <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded">
    {validationErrors.get(`ingredientSections.${sectionIndex}.items`)}
  </div>
)}
```

### 5. Enhanced SectionHeader Component

**Location**: `src/components/sections/section-header.tsx` (modified)

**Changes**:
- Add error state styling
- Show validation error for section name
- Highlight invalid fields

```typescript
interface SectionHeaderProps {
  // ... existing props
  hasError?: boolean; // NEW
  errorMessage?: string; // NEW
}

// In render:
<EditableTitle
  // ... existing props
  className={cn(
    "...",
    hasError && "border-red-500 bg-red-50"
  )}
/>
{errorMessage && (
  <div className="text-red-600 text-sm mt-1">
    {errorMessage}
  </div>
)}
```

### 6. Server-Side Validation

**Location**: `src/app/api/recipes/route.ts` (modified)

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

## Data Models

### Section Data Structure (Enhanced)

```typescript
interface Section<T = any> {
  id: string;              // UUID v4
  name: string;            // Required, non-empty
  position: number;        // Sequential, 0-indexed
  items: T[];              // Required, min length 1
}

interface Ingredient {
  id: string;              // UUID v4
  text: string;            // Required, non-empty
  position: number;        // Sequential within section
}

interface InstructionStep {
  id: string;              // UUID v4
  text: string;            // Required, non-empty
  position: number;        // Sequential within section
}

interface Recipe {
  // ... other fields
  ingredientSections?: IngredientSection[];
  instructionSections?: InstructionSection[];
  ingredients: Ingredient[];  // Flattened for backward compat
  instructions: InstructionStep[];  // Flattened for backward compat
}
```

### Validation Error Structure

```typescript
interface ValidationError {
  path: string[];          // e.g., ['ingredientSections', '0', 'name']
  message: string;         // Human-readable error message
}

interface ValidationResponse {
  isValid: boolean;
  errors: ValidationError[];
  errorSummary?: {
    count: number;
    types: string[];
  };
}
```

## Error Handling

### Validation Error Types

| Error Type | Trigger | Message | UI Treatment |
|------------|---------|---------|--------------|
| Empty Section Name | Section name is empty or whitespace | "Section name is required" | Inline error below section header |
| Empty Section | Section has no items | "This section must contain at least one ingredient/step" | Warning box inside section |
| No Ingredients | Recipe has no ingredients | "At least one ingredient is required for a recipe" | Error banner at top of form |
| Empty Item Text | Item text is empty or whitespace | "Ingredient/Instruction text cannot be empty" | Inline error below item field |
| Invalid Position | Position is negative or duplicate | "Invalid position value" | Console warning (auto-fixed) |
| Invalid ID | ID is not a valid UUID | "Invalid ID format" | Console error (auto-fixed on save) |

### Error Display Strategy

1. **Inline Errors**: Show next to the invalid field
2. **Section Errors**: Show inside the section container
3. **Form Errors**: Show at the top of the form
4. **Save Button**: Disable with tooltip explaining why

### Error Recovery

- **Auto-fix**: Position conflicts, missing IDs
- **User Action Required**: Empty names, empty sections, empty items
- **Import Normalization**: Automatically fix imported data

## Testing Strategy

### Unit Tests

1. **Validation Schema Tests** (`recipe-sections-validation.test.ts`)
   - Test strict validation rules
   - Test error messages
   - Test edge cases (whitespace, special characters)
   - Test position validation
   - Test ID validation

2. **Import Normalization Tests** (`recipe-import-normalizer.test.ts`)
   - Test missing section names → "Imported Section"
   - Test empty sections → flattened
   - Test missing positions → auto-assigned
   - Test empty items → dropped
   - Test missing IDs → generated

3. **Validation Hook Tests** (`useRecipeValidation.test.ts`)
   - Test validation state management
   - Test error mapping
   - Test field-level error retrieval
   - Test error summary generation

### Integration Tests

1. **Recipe Form Validation** (`recipe-form-validation.test.tsx`)
   - Test save button disabled when invalid
   - Test inline error display
   - Test error clearing on fix
   - Test validation on blur
   - Test validation on submit

2. **Section Manager Validation** (`section-manager-validation.test.tsx`)
   - Test empty section error display
   - Test empty name error display
   - Test error styling
   - Test validation after section operations

3. **API Validation** (`api-recipe-validation.test.ts`)
   - Test server-side validation
   - Test 400 response on invalid data
   - Test error response format
   - Test successful save with valid data

### End-to-End Tests

1. **Recipe Creation Flow**
   - Create recipe with sections
   - Trigger validation errors
   - Fix errors
   - Successfully save

2. **Recipe Import Flow**
   - Import recipe with invalid data
   - Verify normalization
   - Verify valid state after import
   - Successfully save imported recipe

3. **Multi-User Scenario**
   - Two users edit same recipe
   - Concurrent saves
   - Verify position reindexing
   - Verify data integrity

## Implementation Phases

### Phase 1: Shared Validation Schema
- Create `recipe-sections.ts` validation file
- Define strict Zod schemas
- Add comprehensive error messages
- Write unit tests for schemas

### Phase 2: Import Normalization
- Create `recipe-import-normalizer.ts`
- Implement normalization functions
- Handle edge cases
- Write unit tests

### Phase 3: Client-Side Validation
- Create `useRecipeValidation` hook
- Integrate with recipe forms
- Add inline error display
- Update SectionManager component
- Update SectionHeader component

### Phase 4: Server-Side Validation
- Update API routes
- Add validation middleware
- Return structured error responses
- Write API tests

### Phase 5: UI Polish
- Add error styling
- Add validation error summary
- Add save button tooltip
- Add loading states

### Phase 6: Testing & Documentation
- Write integration tests
- Write E2E tests
- Update component documentation
- Create migration guide

## Technical Considerations

### Performance

**Validation Performance**:
- Zod validation is fast (~1ms for typical recipe)
- Memoize validation results
- Debounce real-time validation (300ms)
- Only validate changed sections

**Rendering Performance**:
- Memoize error maps
- Use React.memo for section components
- Avoid re-rendering unchanged sections

### Accessibility

**Error Announcements**:
- Use ARIA live regions for validation errors
- Announce error count changes
- Focus first invalid field on submit

**Keyboard Navigation**:
- Tab through error messages
- Enter to fix and continue
- Escape to dismiss inline errors

**Screen Reader Support**:
- Associate errors with fields using aria-describedby
- Announce validation state changes
- Provide clear error messages

### Browser Compatibility

- Zod works in all modern browsers
- UUID generation uses crypto.randomUUID() with fallback
- No special browser requirements

### Security

**Input Sanitization**:
- Trim all text inputs
- Validate string lengths
- Prevent XSS in error messages
- Sanitize imported data

**Server-Side Validation**:
- Never trust client data
- Validate all inputs
- Rate limit API endpoints
- Log validation failures

## Migration Strategy

### Backward Compatibility

**Existing Recipes**:
- Load existing recipes without modification
- Apply normalization on first edit
- Save normalized data on next save
- No forced migration

**API Compatibility**:
- Accept both old and new formats
- Normalize on server before validation
- Return normalized format
- Maintain flat arrays for compatibility

### Rollout Plan

1. **Phase 1: Deploy Validation (Read-Only)**
   - Deploy validation code
   - Log validation failures
   - Don't block saves yet
   - Monitor error rates

2. **Phase 2: Enable Client Validation**
   - Enable client-side validation
   - Show errors but allow save
   - Collect user feedback
   - Fix UX issues

3. **Phase 3: Enable Server Validation**
   - Enable server-side blocking
   - Block invalid saves
   - Monitor error rates
   - Provide support for users

4. **Phase 4: Normalize Existing Data**
   - Run background job to normalize
   - Fix invalid recipes
   - Notify affected users
   - Complete migration

### Rollback Plan

- Feature flag for validation
- Disable server-side validation
- Disable client-side validation
- Revert to soft warnings
- No data loss

## Dependencies

### New Dependencies

```json
{
  "uuid": "^9.0.0",
  "@types/uuid": "^9.0.0"
}
```

### Existing Dependencies

- `zod`: ^3.22.0 (already installed)
- `react-hook-form`: For form integration
- `@radix-ui/*`: For UI components

## Performance Metrics

### Validation Performance

- **Target**: < 5ms for typical recipe validation
- **Monitor**: Validation execution time
- **Alert**: If > 50ms consistently

### User Experience Metrics

- **Target**: < 100ms for inline error display
- **Monitor**: Time from blur to error display
- **Alert**: If > 500ms

### API Performance

- **Target**: < 50ms for server validation
- **Monitor**: API response time
- **Alert**: If > 200ms

### Error Rates

- **Monitor**: Validation failure rate
- **Target**: < 5% of save attempts
- **Alert**: If > 20%

## CSS and Styling

### Error Styling

```css
/* Validation error text */
.validation-error {
  @apply text-red-600 dark:text-red-400 text-sm mt-1;
}

/* Invalid field border */
.field-invalid {
  @apply border-red-500 focus:ring-red-500;
}

/* Invalid field background */
.field-invalid-bg {
  @apply bg-red-50 dark:bg-red-950/20;
}

/* Error summary banner */
.error-summary {
  @apply bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4;
}

/* Empty section warning */
.section-empty-error {
  @apply border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 rounded-lg p-3 text-red-700 dark:text-red-300;
}
```

### Animation

```css
/* Error fade-in */
@keyframes error-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.validation-error {
  animation: error-fade-in 200ms ease-out;
}
```

## API Changes

### Request Format (Unchanged)

```json
{
  "title": "Recipe Title",
  "ingredientSections": [
    {
      "id": "uuid",
      "name": "Section Name",
      "position": 0,
      "items": [
        {
          "id": "uuid",
          "text": "Ingredient text",
          "position": 0
        }
      ]
    }
  ]
}
```

### Error Response Format (New)

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

### Success Response (Unchanged)

```json
{
  "id": "uuid",
  "title": "Recipe Title",
  // ... full recipe data
}
```
