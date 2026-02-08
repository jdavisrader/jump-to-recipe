# Mode Conversion Examples

## Overview
This document demonstrates how ingredient order is preserved during mode conversion between flat and sectioned lists.

## Example 1: Flat to Sectioned Conversion

### Before (Flat List)
```
Ingredients:
  [0] Flour - 2 cups
  [1] Sugar - 1 cup
  [2] Eggs - 3 eggs
  [3] Butter - 1/2 cup
```

### After (Sectioned)
```
Section: "Ingredients" (order: 0)
  [position: 0] Flour - 2 cups
  [position: 1] Sugar - 1 cup
  [position: 2] Eggs - 3 eggs
  [position: 3] Butter - 1/2 cup
```

**Result**: ✅ Order preserved, positions explicitly assigned

## Example 2: Sectioned to Flat Conversion

### Before (Sectioned)
```
Section: "Dry Ingredients" (order: 0)
  [position: 0] Flour - 2 cups
  [position: 1] Sugar - 1 cup
  [position: 2] Baking Powder - 2 tsp

Section: "Wet Ingredients" (order: 1)
  [position: 0] Eggs - 3 eggs
  [position: 1] Milk - 1 cup
  [position: 2] Butter - 1/2 cup
```

### After (Flat List)
```
Ingredients:
  [0] Flour - 2 cups          (from Dry Ingredients, position 0)
  [1] Sugar - 1 cup           (from Dry Ingredients, position 1)
  [2] Baking Powder - 2 tsp   (from Dry Ingredients, position 2)
  [3] Eggs - 3 eggs           (from Wet Ingredients, position 0)
  [4] Milk - 1 cup            (from Wet Ingredients, position 1)
  [5] Butter - 1/2 cup        (from Wet Ingredients, position 2)
```

**Result**: ✅ Order preserved, sections flattened in order, positions removed

## Example 3: Non-Sequential Section Orders

### Before (Sectioned with gaps in order)
```
Section: "Garnish" (order: 10)
  [position: 0] Parsley - 2 tbsp

Section: "Base" (order: 1)
  [position: 0] Pasta - 1 lb
  [position: 1] Water - 4 cups

Section: "Sauce" (order: 5)
  [position: 0] Tomatoes - 2 cups
  [position: 1] Garlic - 3 cloves
```

### After (Flat List - sorted by section order)
```
Ingredients:
  [0] Pasta - 1 lb            (from Base, order 1, position 0)
  [1] Water - 4 cups          (from Base, order 1, position 1)
  [2] Tomatoes - 2 cups       (from Sauce, order 5, position 0)
  [3] Garlic - 3 cloves       (from Sauce, order 5, position 1)
  [4] Parsley - 2 tbsp        (from Garnish, order 10, position 0)
```

**Result**: ✅ Sections sorted by order value, then items by position

## Example 4: Round-Trip Conversion

### Start (Flat)
```
[0] Ingredient A
[1] Ingredient B
[2] Ingredient C
```

### Convert to Sectioned
```
Section: "Ingredients" (order: 0)
  [position: 0] Ingredient A
  [position: 1] Ingredient B
  [position: 2] Ingredient C
```

### Convert back to Flat
```
[0] Ingredient A
[1] Ingredient B
[2] Ingredient C
```

**Result**: ✅ Order perfectly preserved through round-trip

## Example 5: Non-Sequential Item Positions

### Before (Sectioned with gaps in positions)
```
Section: "Ingredients" (order: 0)
  [position: 1] Second Item
  [position: 5] Third Item
  [position: 10] Fourth Item
  [position: 0] First Item
```

### After (Flat List - sorted by position)
```
Ingredients:
  [0] First Item     (was position 0)
  [1] Second Item    (was position 1)
  [2] Third Item     (was position 5)
  [3] Fourth Item    (was position 10)
```

**Result**: ✅ Items sorted by position value, then reindexed sequentially

## Implementation Notes

### Position Assignment Rules
1. **Flat → Sectioned**: Array index becomes position value
2. **Sectioned → Flat**: Position values determine order, then removed
3. **Missing Positions**: Fall back to array index
4. **Non-Sequential**: Sorted by value, then reindexed

### Sorting Priority
1. **Section Level**: Sort by `order` property
2. **Item Level**: Sort by `position` property (or array index if missing)
3. **Stability**: Use ID for tie-breaking to ensure consistent results

### Data Integrity
- No data loss during conversion
- All ingredient properties preserved (name, amount, unit, notes)
- Only position metadata added/removed as needed
- Empty lists handled gracefully
