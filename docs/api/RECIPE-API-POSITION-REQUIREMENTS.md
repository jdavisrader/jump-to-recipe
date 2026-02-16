# Recipe API - Position Requirements Documentation

## Overview

This document describes the position property requirements for the Recipe API endpoints. As of the explicit position persistence implementation, all ingredients and instructions must include a `position` property that defines their order within their container (section or flat list).

## Position Property Specification

### Definition

The `position` property is a **required** field on all ingredient and instruction objects that defines the explicit order of items.

### Type and Constraints

- **Type**: `number` (integer)
- **Required**: Yes (all items must have a position)
- **Minimum Value**: `0` (non-negative)
- **Uniqueness**: Must be unique within the same scope (section or flat list)
- **Sequentiality**: Should be sequential (0, 1, 2, ..., N-1) with no gaps

### Position Scope

Position values are scoped to their container:

- **In Sections**: Position is scoped to the section (each section has positions 0 to N-1)
- **In Flat Lists**: Position is scoped to the entire list (positions 0 to M-1)

## API Endpoints

### POST /api/recipes

Creates a new recipe with strict validation.

#### Request Body

All ingredients and instructions must include the `position` property.

**Example: Recipe with Flat Lists**

```json
{
  "title": "Chocolate Chip Cookies",
  "description": "Classic homemade cookies",
  "ingredients": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Flour",
      "amount": 2,
      "unit": "cups",
      "position": 0
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Sugar",
      "amount": 1,
      "unit": "cup",
      "position": 1
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "name": "Butter",
      "amount": 0.5,
      "unit": "cup",
      "position": 2
    }
  ],
  "instructions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "step": 1,
      "content": "Preheat oven to 350°F",
      "position": 0
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "step": 2,
      "content": "Mix dry ingredients",
      "position": 1
    }
  ]
}
```

**Example: Recipe with Sections**

```json
{
  "title": "Layered Cake",
  "description": "A delicious multi-layer cake",
  "ingredientSections": [
    {
      "id": "section-dry",
      "name": "Dry Ingredients",
      "order": 0,
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "name": "Flour",
          "amount": 3,
          "unit": "cups",
          "position": 0
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "name": "Baking Powder",
          "amount": 2,
          "unit": "tsp",
          "position": 1
        }
      ]
    },
    {
      "id": "section-wet",
      "name": "Wet Ingredients",
      "order": 1,
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440003",
          "name": "Milk",
          "amount": 1,
          "unit": "cup",
          "position": 0
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440004",
          "name": "Eggs",
          "amount": 2,
          "unit": "whole",
          "position": 1
        }
      ]
    }
  ]
}
```

#### Response

**Success (201 Created)**

Returns the created recipe with all position values preserved:

```json
{
  "id": "recipe-123",
  "title": "Chocolate Chip Cookies",
  "ingredients": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Flour",
      "amount": 2,
      "unit": "cups",
      "position": 0
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Sugar",
      "amount": 1,
      "unit": "cup",
      "position": 1
    }
  ],
  "createdAt": "2026-02-12T10:30:00Z",
  "updatedAt": "2026-02-12T10:30:00Z"
}
```

**Error (400 Bad Request) - Missing Position**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "ingredients.0.position",
      "message": "Position is required and must be a non-negative integer"
    }
  ]
}
```

**Error (400 Bad Request) - Invalid Position**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "ingredients.1.position",
      "message": "Position must be a non-negative integer"
    }
  ]
}
```

**Error (400 Bad Request) - Duplicate Position (Auto-Corrected)**

When duplicate positions are detected, the API automatically corrects them to sequential values:

```json
{
  "id": "recipe-123",
  "title": "Chocolate Chip Cookies",
  "ingredients": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Flour",
      "position": 0
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Sugar",
      "position": 1
    }
  ]
}
```

Note: The API logs a warning when auto-correction occurs but does not return an error.

### PUT /api/recipes/[id]

Updates an existing recipe with strict validation.

#### Request Body

Same requirements as POST - all ingredients and instructions must include the `position` property.

**Example: Updating Item Order**

```json
{
  "id": "recipe-123",
  "title": "Chocolate Chip Cookies",
  "ingredients": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Sugar",
      "amount": 1,
      "unit": "cup",
      "position": 0
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Flour",
      "amount": 2,
      "unit": "cups",
      "position": 1
    }
  ]
}
```

#### Response

**Success (200 OK)**

Returns the updated recipe with all position values preserved:

```json
{
  "id": "recipe-123",
  "title": "Chocolate Chip Cookies",
  "ingredients": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Sugar",
      "position": 0
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Flour",
      "position": 1
    }
  ],
  "updatedAt": "2026-02-12T11:00:00Z",
  "message": "Recipe updated successfully"
}
```

**Error Responses**: Same as POST endpoint

### GET /api/recipes

Retrieves a paginated list of recipes.

#### Response

All recipes include position values in their ingredients and instructions:

```json
{
  "recipes": [
    {
      "id": "recipe-123",
      "title": "Chocolate Chip Cookies",
      "ingredients": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "name": "Flour",
          "position": 0
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "name": "Sugar",
          "position": 1
        }
      ]
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### GET /api/recipes/[id]

Retrieves a single recipe by ID.

#### Response

**Success (200 OK)**

Returns the recipe with all position values:

```json
{
  "id": "recipe-123",
  "title": "Chocolate Chip Cookies",
  "ingredients": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Flour",
      "amount": 2,
      "unit": "cups",
      "position": 0
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Sugar",
      "amount": 1,
      "unit": "cup",
      "position": 1
    }
  ],
  "instructions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "step": 1,
      "content": "Preheat oven",
      "position": 0
    }
  ]
}
```

## Position Validation Rules

### Rule 1: Position is Required

All ingredients and instructions must have a `position` property.

**Invalid:**
```json
{
  "id": "ing-1",
  "name": "Flour",
  "amount": 2,
  "unit": "cups"
  // Missing position property
}
```

**Valid:**
```json
{
  "id": "ing-1",
  "name": "Flour",
  "amount": 2,
  "unit": "cups",
  "position": 0
}
```

### Rule 2: Position Must Be Non-Negative Integer

Position must be a whole number >= 0.

**Invalid:**
```json
{ "position": -1 }      // Negative
{ "position": 1.5 }     // Not an integer
{ "position": "0" }     // String instead of number
{ "position": null }    // Null value
```

**Valid:**
```json
{ "position": 0 }
{ "position": 1 }
{ "position": 42 }
```

### Rule 3: Position Must Be Unique Within Scope

No two items in the same scope can have the same position.

**Invalid (Flat List):**
```json
{
  "ingredients": [
    { "id": "ing-1", "position": 0 },
    { "id": "ing-2", "position": 0 }  // Duplicate!
  ]
}
```

**Invalid (Within Section):**
```json
{
  "ingredientSections": [
    {
      "id": "section-1",
      "items": [
        { "id": "ing-1", "position": 0 },
        { "id": "ing-2", "position": 0 }  // Duplicate!
      ]
    }
  ]
}
```

**Valid (Different Sections):**
```json
{
  "ingredientSections": [
    {
      "id": "section-1",
      "items": [
        { "id": "ing-1", "position": 0 }  // OK - different scope
      ]
    },
    {
      "id": "section-2",
      "items": [
        { "id": "ing-2", "position": 0 }  // OK - different scope
      ]
    }
  ]
}
```

### Rule 4: Position Should Be Sequential

Positions should be sequential (0, 1, 2, ..., N-1) with no gaps.

**Suboptimal (Has Gaps):**
```json
{
  "ingredients": [
    { "id": "ing-1", "position": 0 },
    { "id": "ing-2", "position": 2 },  // Gap at position 1
    { "id": "ing-3", "position": 5 }   // Gap at positions 3, 4
  ]
}
```

**Optimal:**
```json
{
  "ingredients": [
    { "id": "ing-1", "position": 0 },
    { "id": "ing-2", "position": 1 },
    { "id": "ing-3", "position": 2 }
  ]
}
```

Note: The API does not reject non-sequential positions, but they may be reindexed during auto-correction.

## Auto-Correction Behavior

The API automatically corrects position conflicts to ensure data integrity. This happens transparently without returning an error.

### When Auto-Correction Occurs

1. **Duplicate Positions**: When multiple items have the same position
2. **Missing Positions**: When items are missing position properties (legacy data)
3. **Negative Positions**: When positions are negative
4. **Non-Integer Positions**: When positions are not whole numbers
5. **Position Gaps**: When there are gaps in the sequence

### Auto-Correction Algorithm

1. Sort items by their current position (or array index if position is invalid)
2. Assign sequential positions starting from 0
3. Log a warning about the correction
4. Return the corrected data

### Example: Duplicate Position Correction

**Request:**
```json
{
  "ingredients": [
    { "id": "ing-1", "name": "Flour", "position": 0 },
    { "id": "ing-2", "name": "Sugar", "position": 0 },
    { "id": "ing-3", "name": "Butter", "position": 1 }
  ]
}
```

**Auto-Corrected Response:**
```json
{
  "ingredients": [
    { "id": "ing-1", "name": "Flour", "position": 0 },
    { "id": "ing-2", "name": "Sugar", "position": 1 },
    { "id": "ing-3", "name": "Butter", "position": 2 }
  ]
}
```

**Server Log:**
```
⚠️ Position conflicts detected in ingredient sections, auto-fixing: 
  - Duplicate position 0 found in 2 items
  - Reindexed all items to sequential positions
```

### Example: Missing Position Correction

**Request (Legacy Data):**
```json
{
  "ingredients": [
    { "id": "ing-1", "name": "Flour" },
    { "id": "ing-2", "name": "Sugar" },
    { "id": "ing-3", "name": "Butter" }
  ]
}
```

**Auto-Corrected Response:**
```json
{
  "ingredients": [
    { "id": "ing-1", "name": "Flour", "position": 0 },
    { "id": "ing-2", "name": "Sugar", "position": 1 },
    { "id": "ing-3", "name": "Butter", "position": 2 }
  ]
}
```

## Migration from Legacy Data

### Legacy Data Format

Older recipes may not have position properties. The API handles this automatically.

**Legacy Recipe (No Positions):**
```json
{
  "ingredients": [
    { "id": "ing-1", "name": "Flour", "amount": 2, "unit": "cups" },
    { "id": "ing-2", "name": "Sugar", "amount": 1, "unit": "cup" }
  ]
}
```

### Automatic Migration

When legacy data is loaded or updated:

1. The normalization layer detects missing positions
2. Positions are assigned based on array index
3. The recipe is validated with positions included
4. The updated recipe is saved with positions

**After Migration:**
```json
{
  "ingredients": [
    { "id": "ing-1", "name": "Flour", "amount": 2, "unit": "cups", "position": 0 },
    { "id": "ing-2", "name": "Sugar", "amount": 1, "unit": "cup", "position": 1 }
  ]
}
```

### Client Responsibilities

Clients should:

1. Always include `position` in new recipes
2. Preserve `position` when updating recipes
3. Update `position` when reordering items
4. Handle auto-corrected positions in responses

## Best Practices

### Creating New Items

When adding a new item to a list or section:

1. Get the current maximum position in the scope
2. Assign `position = maxPosition + 1`
3. Include the position in the API request

```typescript
// Example: Adding a new ingredient
const maxPosition = Math.max(...ingredients.map(i => i.position), -1);
const newIngredient = {
  id: generateId(),
  name: "Salt",
  amount: 1,
  unit: "tsp",
  position: maxPosition + 1
};
```

### Reordering Items

When reordering items via drag-and-drop:

1. Update the position values to reflect the new order
2. Ensure positions are sequential (0, 1, 2, ...)
3. Send the updated recipe to the API

```typescript
// Example: Reordering after drag-and-drop
const reorderedIngredients = ingredients.map((item, index) => ({
  ...item,
  position: index
}));
```

### Moving Items Between Sections

When moving an item from one section to another:

1. Remove the item from the source section
2. Reindex the source section (0, 1, 2, ...)
3. Insert the item into the destination section
4. Reindex the destination section (0, 1, 2, ...)

```typescript
// Example: Moving item between sections
const sourceItems = sourceSection.items
  .filter(item => item.id !== movedItemId)
  .map((item, index) => ({ ...item, position: index }));

const destItems = [
  ...destSection.items.slice(0, insertIndex),
  { ...movedItem, position: insertIndex },
  ...destSection.items.slice(insertIndex)
].map((item, index) => ({ ...item, position: index }));
```

### Converting Between Modes

When converting between flat list and sections:

1. **Flat to Sections**: Recalculate positions within each section
2. **Sections to Flat**: Recalculate global positions

```typescript
// Example: Converting sections to flat list
const flatIngredients = ingredientSections
  .flatMap(section => section.items)
  .map((item, index) => ({ ...item, position: index }));
```

## Error Handling

### Client-Side Validation

Clients should validate position before sending requests:

```typescript
function validatePositions(items: Item[]): boolean {
  // Check all items have position
  if (items.some(item => typeof item.position !== 'number')) {
    return false;
  }
  
  // Check all positions are non-negative integers
  if (items.some(item => item.position < 0 || !Number.isInteger(item.position))) {
    return false;
  }
  
  // Check for duplicates
  const positions = items.map(item => item.position);
  const uniquePositions = new Set(positions);
  if (positions.length !== uniquePositions.size) {
    return false;
  }
  
  return true;
}
```

### Handling API Errors

When the API returns validation errors:

```typescript
try {
  const response = await fetch('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(recipe)
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (error.error === 'Validation failed') {
      // Handle validation errors
      error.details.forEach(detail => {
        console.error(`${detail.path}: ${detail.message}`);
      });
    }
  }
} catch (error) {
  console.error('Failed to create recipe:', error);
}
```

## Summary

- **Position is required** on all ingredients and instructions
- **Position must be** a non-negative integer
- **Position must be unique** within its scope (section or flat list)
- **Position should be sequential** (0, 1, 2, ..., N-1)
- **Auto-correction** handles conflicts transparently
- **Legacy data** is automatically migrated
- **Clients should** always include and maintain position values

For implementation details, see:
- Type definitions: `src/types/recipe.ts`
- Validation schemas: `src/lib/validations/recipe-sections.ts`
- Position utilities: `src/lib/section-position-utils.ts`
- API routes: `src/app/api/recipes/route.ts` and `src/app/api/recipes/[id]/route.ts`
