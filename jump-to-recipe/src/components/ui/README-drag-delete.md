# DragHandle and DeleteButton Components

This document provides comprehensive usage examples for the `DragHandle` and `DeleteButton` UI components.

## Overview

These components are designed for use in drag-and-drop reorderable lists, particularly for ingredient and instruction management in recipes.

### DragHandle

A visual indicator for drag-and-drop operations with proper accessibility support.

**Features:**
- GripVertical icon (three horizontal lines)
- Hover state with cursor change (grab/grabbing)
- Disabled state support
- Full keyboard accessibility
- ARIA labels for screen readers

### DeleteButton

A button component for deleting items with clear visual feedback.

**Features:**
- X icon for clear delete action
- Multiple visual variants (outline, destructive, ghost)
- Hover state with visual feedback
- Disabled state support
- Full keyboard accessibility
- ARIA labels for screen readers

## Installation

These components are already installed in the project. Import them as needed:

```tsx
import { DragHandle } from '@/components/ui/drag-handle';
import { DeleteButton } from '@/components/ui/delete-button';
```

## Basic Usage

### DragHandle

```tsx
// Basic usage
<DragHandle ariaLabel="Drag to reorder ingredient" />

// With dragging state
<DragHandle 
  isDragging={isDragging}
  ariaLabel="Drag to reorder ingredient"
/>

// Disabled state
<DragHandle 
  disabled={true}
  ariaLabel="Drag to reorder ingredient"
/>

// With custom styling
<DragHandle 
  className="ml-2"
  ariaLabel="Drag to reorder ingredient"
/>
```

### DeleteButton

```tsx
// Basic usage
<DeleteButton 
  onDelete={() => handleDelete(id)}
  ariaLabel="Delete ingredient"
/>

// Destructive variant (red)
<DeleteButton 
  variant="destructive"
  onDelete={() => handleDelete(id)}
  ariaLabel="Delete recipe"
/>

// Ghost variant (subtle)
<DeleteButton 
  variant="ghost"
  onDelete={() => handleDelete(id)}
  ariaLabel="Delete item"
/>

// Disabled state
<DeleteButton 
  disabled={isLastItem}
  onDelete={() => handleDelete(id)}
  ariaLabel="Delete ingredient"
/>

// With custom styling
<DeleteButton 
  className="ml-auto"
  onDelete={() => handleDelete(id)}
  ariaLabel="Delete ingredient"
/>
```

## Integration with @hello-pangea/dnd

These components are designed to work seamlessly with the drag-and-drop library:

```tsx
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DragHandle } from '@/components/ui/drag-handle';
import { DeleteButton } from '@/components/ui/delete-button';

function IngredientList({ ingredients, onReorder, onDelete }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    onReorder(result.source.index, result.destination.index);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="ingredients">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {ingredients.map((ingredient, index) => (
              <Draggable
                key={ingredient.id}
                draggableId={ingredient.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="flex gap-2 items-center p-2 border rounded"
                  >
                    {/* Drag handle - only this area initiates drag */}
                    <div {...provided.dragHandleProps}>
                      <DragHandle
                        isDragging={snapshot.isDragging}
                        ariaLabel={`Drag to reorder ${ingredient.name}`}
                      />
                    </div>

                    {/* Ingredient fields */}
                    <Input value={ingredient.name} className="flex-1" />

                    {/* Delete button */}
                    <DeleteButton
                      onDelete={() => onDelete(ingredient.id)}
                      ariaLabel={`Delete ${ingredient.name}`}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

## Complete Ingredient Row Example

Here's a complete example of an ingredient row with all fields:

```tsx
<div className="flex gap-2 items-start">
  {/* Drag Handle */}
  <div {...provided.dragHandleProps}>
    <DragHandle
      isDragging={snapshot.isDragging}
      ariaLabel={`Drag to reorder ${ingredient.name}`}
    />
  </div>

  {/* Ingredient Fields */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
    {/* Amount */}
    <Input
      type="number"
      placeholder="Amount"
      value={ingredient.amount}
      onChange={(e) => handleAmountChange(e.target.value)}
    />

    {/* Unit */}
    <Select value={ingredient.unit} onValueChange={handleUnitChange}>
      <SelectTrigger>
        <SelectValue placeholder="Unit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="cup">cup</SelectItem>
        <SelectItem value="tbsp">tbsp</SelectItem>
        <SelectItem value="tsp">tsp</SelectItem>
      </SelectContent>
    </Select>

    {/* Name */}
    <Input
      placeholder="Ingredient name"
      value={ingredient.name}
      onChange={(e) => handleNameChange(e.target.value)}
    />

    {/* Notes */}
    <Input
      placeholder="Notes (optional)"
      value={ingredient.notes}
      onChange={(e) => handleNotesChange(e.target.value)}
    />
  </div>

  {/* Delete Button */}
  <DeleteButton
    onDelete={() => handleDelete(ingredient.id)}
    ariaLabel={`Delete ${ingredient.name}`}
    disabled={isLastIngredient}
  />
</div>
```

## Styling and Theming

Both components automatically adapt to light and dark modes using the design system's color tokens.

### DragHandle States

- **Default**: Gray icon with subtle appearance
- **Hover**: Darker color, cursor changes to "grab"
- **Dragging**: Cursor changes to "grabbing", icon becomes semi-transparent
- **Disabled**: Muted color, cursor shows "not-allowed"
- **Focus**: Ring indicator for keyboard navigation

### DeleteButton Variants

- **outline** (default): Subtle border with hover effect
- **destructive**: Red background for dangerous actions
- **ghost**: No background, only hover effect
- **secondary**: Secondary color scheme

### Custom Styling

Both components accept a `className` prop for custom styling:

```tsx
<DragHandle 
  className="ml-2 p-2" 
  ariaLabel="Drag to reorder"
/>

<DeleteButton 
  className="ml-auto hover:scale-110 transition-transform"
  onDelete={handleDelete}
  ariaLabel="Delete item"
/>
```

## Accessibility

Both components are fully accessible:

### Keyboard Navigation

- **Tab**: Move focus between elements
- **Enter/Space**: Activate buttons
- **Escape**: Cancel drag operation (when using with dnd library)

### Screen Reader Support

- Both components include proper ARIA labels
- Drag state changes are announced
- Button purposes are clearly communicated
- Focus indicators are visible

### Best Practices

1. **Always provide descriptive aria-label**:
   ```tsx
   <DragHandle ariaLabel={`Drag to reorder ${itemName}`} />
   <DeleteButton ariaLabel={`Delete ${itemName}`} />
   ```

2. **Disable when appropriate**:
   ```tsx
   <DeleteButton 
     disabled={isLastItem}
     ariaLabel="Delete ingredient (disabled - at least one required)"
   />
   ```

3. **Use semantic HTML**:
   - Components use proper button elements
   - Proper role attributes are included
   - Tab order is logical

## Testing

Both components include comprehensive test suites:

```bash
# Run DragHandle tests
npm test -- drag-handle.test.tsx

# Run DeleteButton tests
npm test -- delete-button.test.tsx
```

### Visual Testing

A demo component is available for visual testing:

```tsx
import { UIComponentsDemo } from '@/components/ui/__tests__/ui-components-demo';

// Use in a page to see components in action
export default function DemoPage() {
  return <UIComponentsDemo />;
}
```

## Requirements Validation

These components validate the following requirements:

### DragHandle
- **Requirement 4.2**: Displays three horizontal lines (hamburger menu icon) ✓
- **Requirement 4.3**: Cursor changes to indicate draggable element ✓
- **Requirement 4.4**: Provides visual feedback on hover ✓

### DeleteButton
- **Requirement 4.1**: Displays a clear "X" icon ✓
- **Requirement 4.4**: Provides visual feedback on hover ✓

## Troubleshooting

### Drag handle not working

Make sure you're using the `dragHandleProps` from @hello-pangea/dnd:

```tsx
<div {...provided.dragHandleProps}>
  <DragHandle ariaLabel="Drag to reorder" />
</div>
```

### Delete button not calling onDelete

Check that the button is not disabled and the handler is properly bound:

```tsx
<DeleteButton 
  onDelete={() => handleDelete(id)}  // Arrow function ensures proper binding
  disabled={false}
  ariaLabel="Delete item"
/>
```

### Styling not applying

Make sure Tailwind classes are not being purged. The components use standard design system classes that should be included by default.

## Related Components

- `Button` - Base button component
- `Input` - Form input component
- `Select` - Dropdown select component
- `SectionManager` - Section management component

## Further Reading

- [Requirements Document](.kiro/specs/ingredient-management-enhancements/requirements.md)
- [Design Document](.kiro/specs/ingredient-management-enhancements/design.md)
- [@hello-pangea/dnd Documentation](https://github.com/hello-pangea/dnd)
