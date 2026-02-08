# Design Document

## Overview

The Ingredient Management Enhancements feature extends the existing recipe ingredient management system with drag-and-drop reordering capabilities, improved UI controls, and optimized input layouts. This design builds upon the current `RecipeIngredientsWithSections` component and integrates the `@hello-pangea/dnd` library (already installed) to provide intuitive ingredient reordering both within sections and across sections, as well as in flat ingredient lists.

The design maintains backward compatibility with existing recipes while adding powerful new interaction patterns that make ingredient management faster and more intuitive. Key improvements include visible drag handles, clear delete buttons with X icons, reordered input fields (Quantity → Unit → Name → Notes), and smooth drag-and-drop animations.

## Architecture

### Component Structure

The enhanced ingredient management system extends the existing component hierarchy:

```
RecipeIngredientsWithSections (enhanced)
├── DragDropContext (@hello-pangea/dnd)
│   ├── Droppable (section container or flat list)
│   │   └── Draggable (individual ingredients)
│   │       ├── DragHandle (GripVertical icon)
│   │       ├── IngredientFields (reordered: Quantity, Unit, Name, Notes)
│   │       └── DeleteButton (X icon)
│   └── SectionManager (if using sections)
│       └── Multiple Droppable sections
```

### Data Flow

1. **Drag Initiation**: User clicks drag handle → `onDragStart` captures ingredient and source location
2. **Drag Movement**: User drags → visual feedback shows ghost image and drop indicators
3. **Drop**: User releases → `onDragEnd` calculates new positions and updates form state
4. **Position Update**: System recalculates position values for all affected ingredients
5. **Persistence**: Form submission saves updated positions to database

### Integration Points

- **React Hook Form**: Manages form state and validation
- **@hello-pangea/dnd**: Provides drag-and-drop functionality
- **SectionManager**: Handles section-level operations
- **Database Schema**: Stores ingredient positions (existing `order` or new `position` field)

## Components and Interfaces

### Enhanced RecipeIngredientsWithSections

```typescript
interface RecipeIngredientsWithSectionsProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  errors?: FieldErrors<any>;
  setError?: UseFormSetError<any>;
  clearErrors?: UseFormClearErrors<any>;
  isLoading?: boolean;
  validationErrors?: Map<string, string>;
  onValidate?: () => void;
  onFieldChange?: () => void;
}

// Enhanced to include drag-and-drop handlers
interface DragHandlers {
  onDragStart: (result: DragStart) => void;
  onDragUpdate: (update: DragUpdate) => void;
  onDragEnd: (result: DropResult) => void;
}
```

### Ingredient with Position

```typescript
interface IngredientWithPosition extends Ingredient {
  position: number; // Explicit position within section or flat list
  sectionId?: string; // Optional section assignment
}
```

### Drag-and-Drop Types

```typescript
interface DragResult {
  draggableId: string; // Ingredient ID
  source: {
    droppableId: string; // Source section ID or 'flat-list'
    index: number; // Source position
  };
  destination?: {
    droppableId: string; // Target section ID or 'flat-list'
    index: number; // Target position
  };
}
```

### UI Component Interfaces

```typescript
interface DragHandleProps {
  isDragging: boolean;
  className?: string;
}

interface DeleteButtonProps {
  onDelete: () => void;
  disabled?: boolean;
  className?: string;
}

interface IngredientFieldsProps {
  control: Control<any>;
  fieldBaseName: string;
  onValidate?: () => void;
  onFieldChange?: () => void;
}
```

## Data Models

### Database Schema Enhancement

The existing ingredient structure needs to support explicit positioning:

```typescript
// Current Ingredient interface (from types/recipe.ts)
interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  displayAmount: string;
  notes: string;
}

// Enhanced with position tracking
interface IngredientWithPosition extends Ingredient {
  position: number; // 0-indexed position within section or flat list
  sectionId?: string; // Reference to parent section (if sectioned)
}
```

### Section Data Structure

```typescript
// Existing from types/sections.ts
interface IngredientSection {
  id: string;
  name: string;
  order: number;
  items: Ingredient[];
}

// Enhanced to ensure items have positions
interface IngredientSectionWithPositions {
  id: string;
  name: string;
  order: number;
  items: IngredientWithPosition[]; // Items with explicit positions
}
```

### Position Management

```typescript
interface PositionUpdate {
  ingredientId: string;
  oldPosition: number;
  newPosition: number;
  oldSectionId?: string;
  newSectionId?: string;
}

interface PositionManager {
  // Calculate new positions after reorder within section
  reorderWithinSection(
    items: IngredientWithPosition[],
    sourceIndex: number,
    destinationIndex: number
  ): IngredientWithPosition[];

  // Calculate new positions after move between sections
  moveBetweenSections(
    sourceItems: IngredientWithPosition[],
    destItems: IngredientWithPosition[],
    sourceIndex: number,
    destinationIndex: number
  ): {
    sourceItems: IngredientWithPosition[];
    destItems: IngredientWithPosition[];
  };

  // Ensure sequential positions (0, 1, 2, ...)
  normalizePositions(items: IngredientWithPosition[]): IngredientWithPosition[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Drag handle presence
*For any* ingredient in a section or flat list, the rendered component should include a visible drag handle element
**Validates: Requirements 1.1, 3.1**

### Property 2: Reorder within section preserves ingredient data
*For any* ingredient reordered within a section, all ingredient data (name, quantity, unit, notes) should remain unchanged, only the position should change
**Validates: Requirements 1.3, 1.4**

### Property 3: Position values are sequential after reorder
*For any* section after a reorder operation, ingredient positions should be sequential integers starting from 0 with no gaps
**Validates: Requirements 1.4, 3.3**

### Property 4: Reorder persistence round-trip
*For any* reordered ingredient list, saving and then loading the recipe should preserve the new ingredient order
**Validates: Requirements 1.5**

### Property 5: Cross-section move removes from source and adds to destination
*For any* ingredient moved from one section to another, the ingredient should no longer exist in the source section and should exist in the destination section
**Validates: Requirements 2.2**

### Property 6: Cross-section move preserves ingredient data
*For any* ingredient moved between sections, all ingredient data (name, quantity, unit, notes) should remain unchanged, only section assignment and position should change
**Validates: Requirements 2.4**

### Property 7: Section reordering preserves ingredient assignments
*For any* recipe where sections are reordered, each ingredient should remain assigned to the same section it was in before the reorder
**Validates: Requirements 2.5**

### Property 8: Flat list reorder updates positions
*For any* ingredient reordered in a flat list, the ingredient should move to the new position and all affected ingredients should have updated position values
**Validates: Requirements 3.2, 3.3**

### Property 9: Flat-to-sectioned conversion preserves order
*For any* recipe converted from flat to sectioned mode, the relative order of ingredients should be preserved in the default section
**Validates: Requirements 3.4**

### Property 10: Sectioned-to-flat conversion preserves order
*For any* recipe converted from sectioned to flat mode, the ingredient order should follow section order first, then ingredient position within each section
**Validates: Requirements 3.5**

### Property 11: Delete button displays X icon
*For any* rendered ingredient row, the delete button should contain an X icon element
**Validates: Requirements 4.1**

### Property 12: Drag handle displays grip icon
*For any* rendered ingredient row, the drag handle should contain a grip/hamburger icon element
**Validates: Requirements 4.2**

### Property 13: Drag only initiates from handle
*For any* ingredient, attempting to drag from elements other than the drag handle should not initiate a drag operation
**Validates: Requirements 4.5**

### Property 14: Field order is Quantity, Unit, Name, Notes
*For any* ingredient input form, the visual and DOM order of fields should be: Quantity, Unit, Ingredient Name, Notes
**Validates: Requirements 5.1**

### Property 15: Tab order follows visual order
*For any* ingredient form, pressing Tab should move focus through fields in the order: Quantity → Unit → Name → Notes
**Validates: Requirements 5.2**

### Property 16: Field order consistent across viewports
*For any* ingredient form rendered on different viewport sizes, the field order should remain Quantity, Unit, Name, Notes
**Validates: Requirements 5.5**

### Property 17: Reorder persists to database
*For any* reordered ingredient list that is saved, querying the database should return ingredients with the new position values
**Validates: Requirements 6.1**

### Property 18: Loaded ingredients are sorted by position
*For any* recipe loaded from the database, ingredients within each section should be displayed in ascending position order
**Validates: Requirements 6.2**

### Property 19: New ingredient gets max position plus one
*For any* section, adding a new ingredient should assign it a position value equal to the maximum existing position plus one
**Validates: Requirements 6.3**

### Property 20: Deletion reindexes positions
*For any* ingredient deleted from a section, the remaining ingredients should have sequential position values with no gaps
**Validates: Requirements 6.4**

### Property 21: Rapid reorders maintain data integrity
*For any* sequence of rapid drag-and-drop operations, all ingredient data should remain consistent with no data loss
**Validates: Requirements 8.3**

### Property 22: Reorder minimizes re-renders
*For any* ingredient reorder operation, only the affected ingredients and their containers should re-render, not unaffected components
**Validates: Requirements 8.5**

### Property 23: Touch drag follows touch point
*For any* touch drag operation, the dragged ingredient element should follow the touch point coordinates
**Validates: Requirements 9.2**

### Property 24: Touch and mouse have equivalent visual feedback
*For any* drag operation, the visual feedback (ghost image, drop indicators, placeholders) should be equivalent whether initiated by touch or mouse
**Validates: Requirements 9.4**

## Error Handling

### Validation Errors

```typescript
interface IngredientValidationError {
  ingredientId: string;
  sectionId?: string;
  field: 'name' | 'amount' | 'unit' | 'position';
  message: string;
}
```

### Error Scenarios

1. **Invalid Position Values**
   - Detection: Position values are not sequential or have gaps
   - Handling: Auto-normalize positions on load
   - User Feedback: Silent correction with console warning

2. **Drag Operation Failures**
   - Detection: `onDragEnd` receives invalid destination
   - Handling: Revert to original state
   - User Feedback: Toast notification "Unable to move ingredient"

3. **Cross-Section Move Failures**
   - Detection: Destination section not found
   - Handling: Cancel operation, maintain original state
   - User Feedback: Toast notification "Invalid drop target"

4. **Position Conflict**
   - Detection: Multiple ingredients with same position
   - Handling: Reindex all positions sequentially
   - User Feedback: Silent correction

5. **Database Save Failures**
   - Detection: API returns error on recipe save
   - Handling: Maintain UI state, show error
   - User Feedback: Error message with retry option

### Error Recovery

```typescript
interface ErrorRecovery {
  // Restore ingredient list to last known good state
  revertToSnapshot(snapshot: IngredientWithPosition[]): void;

  // Fix position conflicts by reindexing
  normalizePositions(items: IngredientWithPosition[]): IngredientWithPosition[];

  // Validate ingredient data integrity
  validateIngredients(items: IngredientWithPosition[]): ValidationResult;
}
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific behaviors and edge cases:

1. **Position Management**
   - Adding ingredient assigns correct position
   - Deleting ingredient reindexes remaining positions
   - Position normalization fixes gaps and conflicts

2. **UI Component Rendering**
   - Drag handle renders with correct icon
   - Delete button renders with X icon
   - Fields render in correct order

3. **Form Integration**
   - Field values update correctly
   - Validation errors display properly
   - Form submission includes position data

### Property-Based Tests

Property-based tests will verify universal properties across many inputs using **fast-check** (JavaScript/TypeScript property testing library):

1. **Reorder Operations**
   - Property 2: Reorder within section preserves ingredient data
   - Property 3: Position values are sequential after reorder
   - Property 8: Flat list reorder updates positions

2. **Cross-Section Moves**
   - Property 5: Cross-section move removes from source and adds to destination
   - Property 6: Cross-section move preserves ingredient data
   - Property 7: Section reordering preserves ingredient assignments

3. **Conversion Operations**
   - Property 9: Flat-to-sectioned conversion preserves order
   - Property 10: Sectioned-to-flat conversion preserves order

4. **Persistence**
   - Property 4: Reorder persistence round-trip
   - Property 17: Reorder persists to database
   - Property 18: Loaded ingredients are sorted by position

5. **Data Integrity**
   - Property 20: Deletion reindexes positions
   - Property 21: Rapid reorders maintain data integrity

Each property-based test will run a minimum of 100 iterations with randomly generated ingredient lists, sections, and reorder operations.

### Integration Tests

1. **Drag-and-Drop Workflows**
   - Complete drag-and-drop within section
   - Complete drag-and-drop across sections
   - Complete drag-and-drop in flat list

2. **Mode Conversion**
   - Convert flat to sectioned and verify order
   - Convert sectioned to flat and verify order
   - Toggle between modes multiple times

3. **Form Submission**
   - Save recipe with reordered ingredients
   - Load recipe and verify order
   - Edit and re-save recipe

### Accessibility Tests

1. **Screen Reader Compatibility**
   - Drag handles have appropriate ARIA labels
   - Drag operations announce state changes
   - Drop targets are properly labeled

2. **Visual Feedback**
   - Drag ghost image is visible
   - Drop indicators are clear
   - Hover states are distinct

3. **Touch Interactions**
   - Long-press initiates drag on touch devices
   - Touch drag provides equivalent feedback to mouse
   - Touch drag can be cancelled

## Implementation Notes

### Drag-and-Drop Library Configuration

```typescript
// Configure @hello-pangea/dnd for ingredient reordering
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="ingredients" type="INGREDIENT">
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className={snapshot.isDraggingOver ? 'drag-over' : ''}
      >
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
                className={snapshot.isDragging ? 'dragging' : ''}
              >
                <div {...provided.dragHandleProps}>
                  <GripVertical className="drag-handle" />
                </div>
                {/* Ingredient fields */}
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

### Position Calculation Algorithm

```typescript
function reorderIngredients(
  items: IngredientWithPosition[],
  sourceIndex: number,
  destinationIndex: number
): IngredientWithPosition[] {
  const result = Array.from(items);
  const [removed] = result.splice(sourceIndex, 1);
  result.splice(destinationIndex, 0, removed);
  
  // Reindex positions
  return result.map((item, index) => ({
    ...item,
    position: index
  }));
}

function moveBetweenSections(
  sourceItems: IngredientWithPosition[],
  destItems: IngredientWithPosition[],
  sourceIndex: number,
  destinationIndex: number,
  destSectionId: string
): {
  sourceItems: IngredientWithPosition[];
  destItems: IngredientWithPosition[];
} {
  const sourceResult = Array.from(sourceItems);
  const [removed] = sourceResult.splice(sourceIndex, 1);
  
  const destResult = Array.from(destItems);
  destResult.splice(destinationIndex, 0, {
    ...removed,
    sectionId: destSectionId
  });
  
  return {
    sourceItems: sourceResult.map((item, index) => ({ ...item, position: index })),
    destItems: destResult.map((item, index) => ({ ...item, position: index }))
  };
}
```

### Performance Optimizations

1. **Memoization**: Use `React.memo` for ingredient row components
2. **Virtual Scrolling**: Consider for lists with >50 ingredients (future enhancement)
3. **Debounced Updates**: Batch position updates during rapid operations
4. **Selective Re-renders**: Only update affected sections/ingredients

### Accessibility Enhancements

```typescript
// ARIA labels for drag handles
<div
  {...provided.dragHandleProps}
  role="button"
  aria-label={`Drag to reorder ${ingredient.name}`}
  tabIndex={0}
>
  <GripVertical />
</div>

// Announce drag operations to screen readers
<div role="status" aria-live="polite" className="sr-only">
  {isDragging && `Dragging ${ingredient.name}`}
  {dropResult && `Moved ${ingredient.name} to position ${newPosition}`}
</div>
```

### Mobile Touch Handling

```typescript
// Configure touch delay for better mobile experience
<Draggable
  draggableId={ingredient.id}
  index={index}
  // Add touch delay to prevent accidental drags
  disableInteractiveElementBlocking={false}
>
  {/* ... */}
</Draggable>

// Custom touch handlers for better feedback
const handleTouchStart = (e: TouchEvent) => {
  // Show visual feedback on long-press
  const timer = setTimeout(() => {
    setShowDragFeedback(true);
  }, 200);
  
  return () => clearTimeout(timer);
};
```

## Migration Strategy

### Backward Compatibility

Existing recipes without explicit position values will be automatically migrated:

```typescript
function migrateIngredients(ingredients: Ingredient[]): IngredientWithPosition[] {
  return ingredients.map((ingredient, index) => ({
    ...ingredient,
    position: index
  }));
}
```

### Database Migration

```sql
-- Add position column to ingredients (if stored separately)
-- Note: Current implementation stores ingredients as JSONB, so no schema change needed
-- Position will be added to the JSON structure

-- Example for future normalized schema:
ALTER TABLE ingredients ADD COLUMN position INTEGER DEFAULT 0;

-- Backfill positions based on current order
UPDATE ingredients
SET position = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY recipe_id, section_id ORDER BY id) as row_num
  FROM ingredients
) AS subquery
WHERE ingredients.id = subquery.id;
```

### Gradual Rollout

1. **Phase 1**: Deploy with feature flag disabled
2. **Phase 2**: Enable for new recipes only
3. **Phase 3**: Auto-migrate existing recipes on first edit
4. **Phase 4**: Enable for all recipes

This gradual approach ensures data integrity and allows for rollback if issues arise.
