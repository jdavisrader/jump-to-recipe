# Duplicate Section Names Support

## Overview

The recipe sections validation system explicitly allows and supports duplicate section names. This design decision enables users to organize complex recipes in the way that makes most sense to them, without artificial constraints on naming.

## Why Allow Duplicates?

Users may want to use the same section name multiple times for various reasons:

1. **Recipe Structure**: A recipe might have multiple "Sauce" sections for different sauces
2. **Preparation Phases**: Multiple "Preparation" sections for different components
3. **Ingredient Categories**: Multiple "Toppings" sections for different types of toppings
4. **Flexibility**: Users shouldn't be forced to create artificial unique names like "Sauce 1", "Sauce 2"

## How Sections Are Distinguished

Even when sections have the same name, they are uniquely identified by:

1. **Unique ID**: Each section has a UUID that never changes
2. **Position/Order**: Sections are ordered by their `order` field
3. **Content**: Each section has its own independent list of items

## Example

```typescript
const recipe = {
  title: "Pizza",
  ingredientSections: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Toppings",
      order: 0,
      items: [
        { id: "...", name: "Cheese", amount: 1, unit: "cup" }
      ]
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Toppings",
      order: 1,
      items: [
        { id: "...", name: "Pepperoni", amount: 10, unit: "slices" }
      ]
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      name: "Toppings",
      order: 2,
      items: [
        { id: "...", name: "Mushrooms", amount: 0.5, unit: "cup" }
      ]
    }
  ]
}
```

In this example, all three sections are named "Toppings", but they are:
- Distinguished by their unique IDs
- Ordered by their `order` field (0, 1, 2)
- Each contains different ingredients

## Validation Rules

All validation rules apply independently to each section, regardless of whether names are duplicated:

- ✅ Section names must be non-empty
- ✅ Section names cannot be only whitespace
- ✅ Each section must contain at least one item
- ✅ All items within a section must have valid data
- ✅ Duplicate section names are allowed

## UI Considerations

When displaying sections with duplicate names in the UI:

1. **Visual Distinction**: Sections are displayed in order, making them visually distinct
2. **Position Indicators**: The order/position helps users understand which section is which
3. **Content Context**: The items within each section provide context
4. **Edit Operations**: Users can edit, delete, or reorder sections independently

## Testing

Comprehensive tests verify that duplicate section names work correctly:

- Multiple sections with the same name validate successfully
- Sections with duplicate names can be saved and loaded
- All validation rules apply independently to each section
- Sections are properly distinguished by ID and order

See `src/lib/validations/__tests__/duplicate-section-names.test.ts` for test cases.

## API Behavior

The server accepts and stores recipes with duplicate section names without error:

- ✅ POST `/api/recipes` - Accepts duplicate names
- ✅ PUT/PATCH `/api/recipes/[id]` - Accepts duplicate names
- ✅ GET `/api/recipes/[id]` - Returns sections with duplicate names

## Migration Notes

This feature has been supported since the initial implementation of recipe sections. No migration is needed for existing recipes.

## Related Requirements

This feature satisfies the following requirements from the Recipe Sections Hardening spec:

- **Requirement 9.1**: Allow duplicate section names without warning
- **Requirement 9.2**: Distinguish sections by position
- **Requirement 9.3**: Allow renaming to match existing names
- **Requirement 9.4**: Apply validation rules independently
- **Requirement 9.5**: Server accepts duplicate names without error
