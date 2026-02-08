# Cross-Section Drag-and-Drop User Guide

## Overview
The cross-section drag-and-drop feature allows you to move ingredients between different sections in your recipe by simply dragging and dropping them. This makes it easy to reorganize your recipe structure without manually copying and deleting ingredients.

## How to Use

### Moving an Ingredient Between Sections

1. **Locate the ingredient** you want to move in its current section
2. **Click and hold** the drag handle (three horizontal lines) on the left side of the ingredient
3. **Drag** the ingredient over the target section
4. **Watch for visual feedback**: The target section will highlight to show it can accept the drop
5. **Release** the mouse button to drop the ingredient in the new section

### Visual Feedback

When dragging an ingredient:
- **Dragging ingredient**: Becomes semi-transparent with a shadow
- **Target section**: Highlights with a light background color
- **Drop position**: A gap appears where the ingredient will be inserted

### What Gets Preserved

When you move an ingredient between sections, all data is preserved:
- ✅ Ingredient name
- ✅ Quantity (amount)
- ✅ Unit of measurement
- ✅ Notes
- ✅ Display amount

Only the section assignment and position within the section change.

### Position Management

The system automatically manages positions:
- **Source section**: Remaining ingredients are reindexed (0, 1, 2, ...)
- **Destination section**: All ingredients are reindexed to include the new one
- **Sequential positions**: Positions are always sequential with no gaps

## Examples

### Example 1: Moving "Vanilla Extract" from Wet Ingredients to Dry Ingredients

**Before:**
```
Dry Ingredients:
  0. Flour - 2 cups
  1. Sugar - 1 cup
  2. Baking Powder - 2 tsp

Wet Ingredients:
  0. Milk - 1 cup
  1. Vanilla Extract - 2 tsp  ← Moving this
  2. Eggs - 2
```

**After dragging Vanilla Extract to position 2 in Dry Ingredients:**
```
Dry Ingredients:
  0. Flour - 2 cups
  1. Sugar - 1 cup
  2. Vanilla Extract - 2 tsp  ← Moved here
  3. Baking Powder - 2 tsp

Wet Ingredients:
  0. Milk - 1 cup
  1. Eggs - 2  ← Reindexed from position 2 to 1
```

### Example 2: Moving to an Empty Section

**Before:**
```
Main Ingredients:
  0. Chicken - 1 lb
  1. Rice - 2 cups

Garnish:
  (empty)
```

**After dragging Rice to Garnish:**
```
Main Ingredients:
  0. Chicken - 1 lb

Garnish:
  0. Rice - 2 cups  ← Moved here
```

### Example 3: Moving Multiple Ingredients

You can move ingredients one at a time to reorganize your recipe:

**Before:**
```
Section A:
  0. Item 1
  1. Item 2
  2. Item 3

Section B:
  0. Item 4
```

**After moving Item 1 and Item 3 to Section B:**
```
Section A:
  0. Item 2

Section B:
  0. Item 4
  1. Item 1
  2. Item 3
```

## Tips and Best Practices

### 1. Plan Your Section Structure
Before moving ingredients, think about how you want to organize your recipe:
- Group by ingredient type (dry, wet, proteins, etc.)
- Group by preparation stage (base, filling, topping)
- Group by cooking method (baked, sautéed, raw)

### 2. Use Descriptive Section Names
Clear section names make it easier to know where to move ingredients:
- ✅ "Dry Ingredients" instead of "Section 1"
- ✅ "Marinade" instead of "Wet"
- ✅ "Garnish" instead of "Extras"

### 3. Move Related Ingredients Together
If several ingredients belong together, move them to the same section:
- All spices to a "Spices" section
- All dairy to a "Dairy" section
- All vegetables to a "Vegetables" section

### 4. Save Frequently
After reorganizing your recipe, save your changes to persist the new structure.

## Keyboard Accessibility

For keyboard users:
- **Tab**: Navigate to the drag handle
- **Space/Enter**: Activate drag mode (future enhancement)
- **Arrow keys**: Move ingredient (future enhancement)
- **Escape**: Cancel drag operation (future enhancement)

*Note: Full keyboard support is planned for a future update.*

## Mobile Support

On touch devices:
- **Long-press** the drag handle to initiate drag
- **Drag** your finger to move the ingredient
- **Release** to drop the ingredient
- Visual feedback is the same as on desktop

## Troubleshooting

### Ingredient Won't Move
- Ensure you're dragging from the drag handle (three horizontal lines)
- Check that you're dropping over a valid section
- Try refreshing the page if the interface becomes unresponsive

### Ingredient Appears in Wrong Position
- The ingredient will be inserted at the position where you drop it
- If it's not where you want, you can drag it again to adjust
- Positions are automatically reindexed, so there are no gaps

### Changes Not Saving
- Make sure to click the "Save" button after reorganizing
- Check for validation errors that might prevent saving
- Ensure all required fields are filled in

### Visual Feedback Not Showing
- Ensure your browser supports modern CSS features
- Try disabling browser extensions that might interfere
- Check that JavaScript is enabled

## Technical Details

### How It Works
1. **Drag Start**: System captures the ingredient and its source section
2. **Drag Over**: Target sections highlight to show valid drop zones
3. **Drop**: System removes ingredient from source, adds to destination
4. **Reindex**: Both sections have their positions updated (0, 1, 2, ...)
5. **Update**: Form state is updated atomically to prevent race conditions

### Data Integrity
- All ingredient data is preserved during moves
- Positions are automatically managed
- No data loss occurs during drag operations
- Validation runs after each move

### Performance
- Optimized for lists with 20+ ingredients
- Minimal re-renders (only affected sections update)
- Smooth animations on modern browsers
- Works efficiently even with complex recipes

## Related Features

- **Within-Section Reordering**: Drag ingredients within the same section
- **Flat List Reordering**: Drag ingredients in recipes without sections
- **Section Management**: Add, rename, and delete sections
- **Mode Switching**: Convert between sectioned and flat list modes

## Future Enhancements

Planned improvements:
- Multi-select for moving multiple ingredients at once
- Undo/redo support for drag operations
- Keyboard shortcuts for power users
- Batch operations for reorganizing entire sections
- Copy ingredient to another section (instead of move)

## Feedback

If you encounter issues or have suggestions for improving cross-section drag-and-drop, please let us know!
