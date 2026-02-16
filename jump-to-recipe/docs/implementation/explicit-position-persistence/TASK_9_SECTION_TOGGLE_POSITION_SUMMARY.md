# Task 9: Section Toggle Logic - Position Management

## Overview
This document summarizes the implementation and verification of Task 9 from the explicit-position-persistence spec, which ensures position is properly preserved and recalculated when converting between flat list and sectioned modes.

## Requirements Addressed
- **Requirement 4.4**: When sections are converted to flat list, the system SHALL recalculate global positions
- **Requirement 4.5**: When flat list is converted to sections, the system SHALL recalculate section-scoped positions

## Implementation Details

### Converting Flat List to Sections (Requirement 4.5)
When converting from flat list to sections, the `handleToggleSections` function:

1. Creates a default section named "Ingredients"
2. Maps all flat ingredients into the section
3. **Assigns section-scoped positions** based on array index (0 to N-1)
4. Preserves all other ingredient properties

```typescript
items: ingredients.map((ingredient: Ingredient, index: number) => ({
  ...ingredient,
  position: index, // Section-scoped position
}))
```

### Converting Sections to Flat List (Requirement 4.4)
When converting from sections to flat list, the `handleToggleSections` function:

1. Sorts sections by their `order` property
2. Within each section, sorts items by their `position` property
3. Flattens all items into a single array
4. **Recalculates global positions** sequentially (0 to M-1)
5. Preserves all other ingredient properties

```typescript
// Reindex positions for flat list (global scope)
const reindexedIngredients = allIngredients.map((item: any, index: number) => ({
  ...item,
  position: index, // Global position
}));
```

## Position Scope Management

### Section-Scoped Positions
When in sectioned mode:
- Each section has its own position scope
- Items within a section have positions 0 to N-1
- Different sections can have items with the same position value (scoped to their section)

Example:
```typescript
Section 1 (order: 0):
  - Item A (position: 0)
  - Item B (position: 1)

Section 2 (order: 1):
  - Item C (position: 0)  // Same position as Item A, but different scope
  - Item D (position: 1)
```

### Global Positions
When in flat list mode:
- All items share a single position scope
- Items have unique positions 0 to M-1
- Position values are sequential with no gaps

Example:
```typescript
Flat List:
  - Item A (position: 0)
  - Item B (position: 1)
  - Item C (position: 2)
  - Item D (position: 3)
```

## Test Coverage

### Existing Tests (recipe-ingredients-mode-conversion.test.tsx)
The following tests verify the section toggle logic:

1. **Flat to Sectioned Conversion**
   - ✅ Preserves ingredient order when converting
   - ✅ Creates default section named "Ingredients"
   - ✅ Handles empty ingredient list

2. **Sectioned to Flat Conversion**
   - ✅ Preserves ingredient order when converting
   - ✅ Respects section order when flattening
   - ✅ Respects item position within sections
   - ✅ Handles empty sections

3. **Round-trip Conversion**
   - ✅ Preserves order through flat → sectioned → flat

4. **Position Management** (Added in this task)
   - ✅ Recalculates positions to global scope when converting sections to flat (Requirement 4.4)
   - ✅ Assigns section-scoped positions when converting flat to sections (Requirement 4.5)
   - ✅ Maintains position integrity through multiple conversions

### Test Results
All 11 tests pass successfully:
```
Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

## Changes Made

### 1. Fixed Test Expectations
**File**: `src/components/recipes/__tests__/recipe-ingredients-mode-conversion.test.tsx`

**Change**: Updated test expectation to verify position is recalculated (not removed) when converting to flat mode.

**Before**:
```typescript
// Verify position property is removed in flat mode
expect(capturedFormData.ingredients[0].position).toBeUndefined();
```

**After**:
```typescript
// Verify position property is recalculated for flat mode (Requirement 4.4)
expect(capturedFormData.ingredients[0].position).toBe(0);
expect(capturedFormData.ingredients[1].position).toBe(1);
expect(capturedFormData.ingredients[2].position).toBe(2);
expect(capturedFormData.ingredients[3].position).toBe(3);
```

### 2. Added Comprehensive Position Tests
Added three new tests to verify position management during mode conversion:

1. **Recalculates positions to global scope** (Requirement 4.4)
   - Tests conversion from multiple sections to flat list
   - Verifies positions change from section-scoped (0,1 in each section) to global (0,1,2,3)

2. **Assigns section-scoped positions** (Requirement 4.5)
   - Tests conversion from flat list to sections
   - Verifies positions are assigned based on array order

3. **Maintains position integrity through multiple conversions**
   - Tests flat → sections → flat → sections
   - Verifies positions remain correct through multiple transformations

## Verification

### Implementation Verification
✅ Position is explicitly assigned when converting flat to sections
✅ Position is recalculated when converting sections to flat
✅ Section order is respected during conversion
✅ Item position within sections is respected during conversion
✅ Empty lists are handled correctly
✅ All ingredient properties are preserved during conversion

### Test Verification
✅ All existing tests pass
✅ New position-specific tests added and passing
✅ Requirements 4.4 and 4.5 are fully covered by tests
✅ Edge cases (empty lists, multiple sections, multiple conversions) are tested

## Conclusion

Task 9 is complete. The `handleToggleSections` function correctly:
- Preserves position when converting between modes
- Recalculates position scope appropriately (section-scoped vs global)
- Maintains ingredient order through conversions
- Handles edge cases properly

All requirements (4.4 and 4.5) are met and verified by comprehensive tests.
