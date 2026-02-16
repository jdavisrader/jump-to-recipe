# Design Document

## Overview

This design addresses the architectural mismatch between runtime position tracking and persisted data in the Recipe Sections feature. The current implementation adds position properties temporarily during drag operations but strips them before saving, relying on implicit array order for persistence. This creates fragile code, type system mismatches, and semantic ambiguity.

The solution is to make position an explicit, persisted property of ingredients and instructions, aligning the type system with the data model and ensuring position is a first-class attribute throughout the application lifecycle.

## Architecture

### Current Architecture (Problematic)

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Component Layer                       │
│  - Position added temporarily during drag operations         │
│  - Position stripped before form state update                │
│  - Position NOT part of Ingredient/Instruction types         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Position Utilities Layer                   │
│  - Expects PositionedItem interface with position property   │
│  - Type mismatch with actual Ingredient/Instruction types    │
│  - Runtime type coercion required                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Persistence Layer                         │
│  - Position NOT stored in database                           │
│  - Order implicit in JSONB array sequence                    │
│  - Position reconstructed from array index on load           │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture (Corrected)

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Component Layer                       │
│  - Position is part of Ingredient/Instruction types          │
│  - Position maintained throughout component lifecycle        │
│  - Position updated during drag operations                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Position Utilities Layer                   │
│  - Works directly with Ingredient/Instruction types          │
│  - No type coercion needed                                   │
│  - Type-safe position operations                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Persistence Layer                         │
│  - Position explicitly stored in JSONB                       │
│  - Order defined by position property                        │
│  - Position loaded and saved with all other properties       │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Type Definitions

**Current (Incorrect)**:
```typescript
export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: Unit;
  displayAmount?: string;
  notes?: string;
  category?: string;
  // NO position property
}
```

**Target (Correct)**:
```typescript
export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: Unit;
  displayAmount?: string;
  notes?: string;
  category?: string;
  position: number;  // ADDED: Explicit position property
}

export interface Instruction {
  id: string;
  step: number;
  content: string;
  duration?: number;
  position: number;  // ADDED: Explicit position property
}
```

### Validation Schemas

**Current (Incorrect)**:
```typescript
export const strictIngredientItemSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{8}-...$/i),
  name: z.string().min(1),
  amount: z.number().nonnegative(),
  unit: z.string(),
  // NO position validation
});
```

**Target (Correct)**:
```typescript
export const strictIngredientItemSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{8}-...$/i),
  name: z.string().min(1),
  amount: z.number().nonnegative(),
  unit: z.string(),
  displayAmount: z.string().optional(),
  notes: z.string().optional(),
  category: z.string().optional(),
  position: z.number()
    .int('Position must be an integer')
    .nonnegative('Position must be non-negative'),  // ADDED
});

export const strictInstructionItemSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{8}-...$/i),
  step: z.number().int().positive(),
  content: z.string().min(1),
  duration: z.number().int().positive().optional(),
  position: z.number()
    .int('Position must be an integer')
    .nonnegative('Position must be non-negative'),  // ADDED
});
```

### Database Schema

**Current**:
```typescript
export const recipes = pgTable('recipes', {
  ingredients: jsonb('ingredients').notNull(),
  // Stored as: [{ id, name, amount, unit }, ...]
  // Position implicit in array order
});
```

**Target**:
```typescript
export const recipes = pgTable('recipes', {
  ingredients: jsonb('ingredients').notNull(),
  // Stored as: [{ id, name, amount, unit, position: 0 }, ...]
  // Position explicit in each object
});
```

## Data Models

### Ingredient with Position

```typescript
interface Ingredient {
  id: string;              // UUID
  name: string;            // Non-empty
  amount: number;          // >= 0
  unit: string;            // Unit of measurement
  displayAmount?: string;  // Display format (e.g., "1½")
  notes?: string;          // Optional notes
  category?: string;       // Optional category
  position: number;        // >= 0, unique within scope
}
```

### Section with Positioned Items

```typescript
interface IngredientSection {
  id: string;              // UUID
  name: string;            // Non-empty
  order: number;           // Section order (>= 0)
  items: Ingredient[];     // Each item has position 0 to N-1
}
```

### Position Scope

Position values are scoped to their container:

**In Sections**:
```typescript
{
  ingredientSections: [
    {
      id: "section-1",
      name: "Dry Ingredients",
      order: 0,
      items: [
        { id: "ing-1", name: "Flour", position: 0 },
        { id: "ing-2", name: "Sugar", position: 1 },
        { id: "ing-3", name: "Salt", position: 2 }
      ]
    },
    {
      id: "section-2",
      name: "Wet Ingredients",
      order: 1,
      items: [
        { id: "ing-4", name: "Milk", position: 0 },    // Position resets per section
        { id: "ing-5", name: "Eggs", position: 1 }
      ]
    }
  ]
}
```

**In Flat List**:
```typescript
{
  ingredients: [
    { id: "ing-1", name: "Flour", position: 0 },
    { id: "ing-2", name: "Sugar", position: 1 },
    { id: "ing-3", name: "Salt", position: 2 },
    { id: "ing-4", name: "Milk", position: 3 },
    { id: "ing-5", name: "Eggs", position: 4 }
  ]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Position Presence

*For any* ingredient or instruction in the system, it must have a position property that is a non-negative integer.

**Validates: Requirements 1.1, 1.2, 2.1, 2.2**

### Property 2: Position Uniqueness Within Scope

*For any* collection of items within the same scope (section or flat list), no two items shall have the same position value.

**Validates: Requirements 3.5, 4.1, 4.2, 6.3**

### Property 3: Position Sequentiality

*For any* collection of N items within the same scope, when sorted by position, the position values shall be 0, 1, 2, ..., N-1 (sequential with no gaps).

**Validates: Requirements 3.5, 4.1, 4.2**

### Property 4: Position Persistence Round-Trip

*For any* recipe with positioned items, saving and then loading the recipe shall preserve the exact position values.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 5: Position Recalculation on Move

*For any* item moved between sections, the item's position shall be recalculated to be valid within the destination section's scope.

**Validates: Requirements 4.3**

### Property 6: Position Preservation on Reorder

*For any* drag-and-drop reorder operation, the final position values shall reflect the new visual order.

**Validates: Requirements 3.4**

### Property 7: Legacy Data Migration

*For any* recipe loaded without position properties, the system shall auto-assign positions based on array index before validation.

**Validates: Requirements 5.1, 5.2**

### Property 8: Type System Consistency

*For any* ingredient or instruction object, the TypeScript type system shall enforce the presence of the position property at compile time.

**Validates: Requirements 2.1, 2.2, 2.4**

## Error Handling

### Position Validation Errors

```typescript
enum PositionErrorType {
  MISSING_POSITION = 'MISSING_POSITION',
  NEGATIVE_POSITION = 'NEGATIVE_POSITION',
  NON_INTEGER_POSITION = 'NON_INTEGER_POSITION',
  DUPLICATE_POSITION = 'DUPLICATE_POSITION',
  POSITION_GAP = 'POSITION_GAP',
}

interface PositionValidationError {
  type: PositionErrorType;
  message: string;
  context: {
    itemId?: string;
    position?: number;
    scope?: string;  // section ID or 'flat-list'
  };
}
```

### Auto-Correction Strategy

When position conflicts are detected:

1. **Duplicate Positions**: Reindex all items sequentially
2. **Missing Positions**: Assign based on array index
3. **Negative Positions**: Reindex all items sequentially
4. **Non-Integer Positions**: Round to nearest integer, then reindex
5. **Position Gaps**: Reindex to eliminate gaps

```typescript
function autoCorrectPositions<T extends { position: number }>(
  items: T[]
): T[] {
  // Sort by current position (or array index if position invalid)
  const sorted = [...items].sort((a, b) => {
    const posA = Number.isInteger(a.position) && a.position >= 0 
      ? a.position 
      : items.indexOf(a);
    const posB = Number.isInteger(b.position) && b.position >= 0 
      ? b.position 
      : items.indexOf(b);
    return posA - posB;
  });
  
  // Assign sequential positions
  return sorted.map((item, index) => ({
    ...item,
    position: index,
  }));
}
```

## Testing Strategy

### Unit Tests

1. **Type Definition Tests**: Verify position is required in types
2. **Validation Schema Tests**: Verify position validation rules
3. **Position Utility Tests**: Verify reindexing, validation, conflict resolution
4. **Component Tests**: Verify position maintained during drag operations

### Property-Based Tests

Configure each property test to run 100+ iterations with random data.

**Property Test 1: Position Presence**
```typescript
// Feature: explicit-position-persistence, Property 1: Position Presence
test('all items have valid position property', () => {
  fc.assert(
    fc.property(
      fc.array(arbitraryIngredient()),
      (ingredients) => {
        ingredients.forEach(ing => {
          expect(ing).toHaveProperty('position');
          expect(typeof ing.position).toBe('number');
          expect(Number.isInteger(ing.position)).toBe(true);
          expect(ing.position).toBeGreaterThanOrEqual(0);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 2: Position Uniqueness**
```typescript
// Feature: explicit-position-persistence, Property 2: Position Uniqueness Within Scope
test('no duplicate positions within scope', () => {
  fc.assert(
    fc.property(
      fc.array(arbitraryIngredient()),
      (ingredients) => {
        const positions = ingredients.map(ing => ing.position);
        const uniquePositions = new Set(positions);
        expect(positions.length).toBe(uniquePositions.size);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 3: Position Sequentiality**
```typescript
// Feature: explicit-position-persistence, Property 3: Position Sequentiality
test('positions are sequential with no gaps', () => {
  fc.assert(
    fc.property(
      fc.array(arbitraryIngredient(), { minLength: 1 }),
      (ingredients) => {
        const sorted = [...ingredients].sort((a, b) => a.position - b.position);
        sorted.forEach((ing, index) => {
          expect(ing.position).toBe(index);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 4: Round-Trip Persistence**
```typescript
// Feature: explicit-position-persistence, Property 4: Position Persistence Round-Trip
test('position preserved through save/load cycle', async () => {
  fc.assert(
    fc.asyncProperty(
      arbitraryRecipe(),
      async (recipe) => {
        // Save recipe
        const saved = await saveRecipe(recipe);
        
        // Load recipe
        const loaded = await loadRecipe(saved.id);
        
        // Verify positions match
        loaded.ingredients.forEach((ing, index) => {
          expect(ing.position).toBe(recipe.ingredients[index].position);
        });
      }
    ),
    { numRuns: 50 }  // Fewer runs for async tests
  );
});
```

**Property Test 5: Position Recalculation on Move**
```typescript
// Feature: explicit-position-persistence, Property 5: Position Recalculation on Move
test('position recalculated when moving between sections', () => {
  fc.assert(
    fc.property(
      fc.array(arbitraryIngredient(), { minLength: 2 }),
      fc.array(arbitraryIngredient(), { minLength: 1 }),
      fc.nat(),
      fc.nat(),
      (sourceItems, destItems, sourceIdx, destIdx) => {
        // Constrain indices
        const validSourceIdx = sourceIdx % sourceItems.length;
        const validDestIdx = destIdx % (destItems.length + 1);
        
        const result = moveBetweenSections(
          sourceItems,
          destItems,
          validSourceIdx,
          validDestIdx
        );
        
        // Verify destination positions are sequential
        result.destItems.forEach((item, index) => {
          expect(item.position).toBe(index);
        });
        
        // Verify source positions are sequential
        result.sourceItems.forEach((item, index) => {
          expect(item.position).toBe(index);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests

1. **Drag-and-Drop Tests**: Verify position updates during UI interactions
2. **API Tests**: Verify position in request/response payloads
3. **Migration Tests**: Verify legacy data transformed correctly
4. **End-to-End Tests**: Verify position preserved across full user workflows

### Migration Tests

```typescript
describe('Legacy Data Migration', () => {
  test('adds position to ingredients without position', () => {
    const legacyRecipe = {
      ingredients: [
        { id: 'ing-1', name: 'Flour', amount: 2, unit: 'cups' },
        { id: 'ing-2', name: 'Sugar', amount: 1, unit: 'cup' },
      ]
    };
    
    const migrated = migrateRecipe(legacyRecipe);
    
    expect(migrated.ingredients[0].position).toBe(0);
    expect(migrated.ingredients[1].position).toBe(1);
  });
  
  test('preserves existing positions if valid', () => {
    const recipeWithPositions = {
      ingredients: [
        { id: 'ing-1', name: 'Flour', amount: 2, unit: 'cups', position: 0 },
        { id: 'ing-2', name: 'Sugar', amount: 1, unit: 'cup', position: 1 },
      ]
    };
    
    const migrated = migrateRecipe(recipeWithPositions);
    
    expect(migrated.ingredients[0].position).toBe(0);
    expect(migrated.ingredients[1].position).toBe(1);
  });
});
```

## Migration Strategy

### Phase 1: Type System Updates

1. Update `Ingredient` and `Instruction` interfaces to include `position: number`
2. Update validation schemas to require position
3. Fix TypeScript compilation errors
4. Update tests to include position in test data

### Phase 2: Component Updates

1. Remove position stripping logic from drag handlers
2. Ensure position maintained throughout component lifecycle
3. Update position assignment logic for new items
4. Verify drag-and-drop still works correctly

### Phase 3: Normalization Updates

1. Update `normalizeImportedRecipe` to ensure position always present
2. Update `normalizeExistingRecipe` to add position if missing
3. Add position to all item creation functions
4. Update API handlers to validate position

### Phase 4: Database Migration

1. Create migration script to add position to existing recipes
2. Run migration on staging environment
3. Verify all recipes have valid positions
4. Run migration on production environment
5. Monitor for errors and rollback if needed

### Migration Script

```typescript
async function migrateRecipesToExplicitPositions() {
  const recipes = await db.query.recipes.findMany();
  
  let processed = 0;
  let updated = 0;
  let errors = 0;
  
  for (const recipe of recipes) {
    try {
      let needsUpdate = false;
      
      // Migrate flat ingredients
      const ingredients = (recipe.ingredients as any[]).map((ing, index) => {
        if (typeof ing.position !== 'number') {
          needsUpdate = true;
          return { ...ing, position: index };
        }
        return ing;
      });
      
      // Migrate flat instructions
      const instructions = (recipe.instructions as any[]).map((inst, index) => {
        if (typeof inst.position !== 'number') {
          needsUpdate = true;
          return { ...inst, position: index };
        }
        return inst;
      });
      
      // Migrate ingredient sections
      const ingredientSections = recipe.ingredientSections 
        ? (recipe.ingredientSections as any[]).map(section => ({
            ...section,
            items: section.items.map((item: any, index: number) => {
              if (typeof item.position !== 'number') {
                needsUpdate = true;
                return { ...item, position: index };
              }
              return item;
            })
          }))
        : undefined;
      
      // Migrate instruction sections
      const instructionSections = recipe.instructionSections
        ? (recipe.instructionSections as any[]).map(section => ({
            ...section,
            items: section.items.map((item: any, index: number) => {
              if (typeof item.position !== 'number') {
                needsUpdate = true;
                return { ...item, position: index };
              }
              return item;
            })
          }))
        : undefined;
      
      if (needsUpdate) {
        await db.update(recipes)
          .set({
            ingredients,
            instructions,
            ingredientSections,
            instructionSections,
            updatedAt: new Date(),
          })
          .where(eq(recipes.id, recipe.id));
        
        updated++;
      }
      
      processed++;
      
      if (processed % 100 === 0) {
        console.log(`Processed ${processed} recipes, updated ${updated}`);
      }
    } catch (error) {
      console.error(`Error migrating recipe ${recipe.id}:`, error);
      errors++;
    }
  }
  
  return { processed, updated, errors };
}
```

## Rollout Plan

### Stage 1: Development (Week 1)
- Implement type system changes
- Update validation schemas
- Fix compilation errors
- Update unit tests

### Stage 2: Component Updates (Week 1-2)
- Remove position stripping logic
- Update drag handlers
- Update position utilities
- Add property-based tests

### Stage 3: Testing (Week 2)
- Run full test suite
- Manual testing of drag-and-drop
- Test migration script on sample data
- Performance testing

### Stage 4: Staging Deployment (Week 3)
- Deploy to staging environment
- Run migration script
- Verify all recipes load correctly
- Test drag-and-drop functionality
- Monitor for errors

### Stage 5: Production Deployment (Week 3-4)
- Deploy to production during low-traffic period
- Run migration script
- Monitor error rates
- Verify user workflows
- Rollback plan ready if needed

## Success Metrics

1. **Type Safety**: Zero TypeScript errors related to position
2. **Test Coverage**: 100% coverage of position-related code
3. **Migration Success**: 100% of recipes migrated successfully
4. **Performance**: No regression in drag-and-drop performance
5. **Data Integrity**: Zero position conflicts in production
6. **User Experience**: No user-reported issues with recipe ordering
