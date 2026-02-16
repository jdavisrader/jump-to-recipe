# Explicit Position Persistence — Developer Guide

## Overview

Ingredients and instructions carry an explicit `position: number` property that defines their order within a container (section or flat list). Position is a first-class, persisted attribute — it flows unchanged through the UI, utilities, API, and database layers.

This replaces the previous approach where position was added temporarily during drag operations and stripped before saving.

## Architecture

```
UI Components ──▶ Position Utilities ──▶ Persistence (JSONB)
     │                    │                      │
  position is          no type               position stored
  always present       coercion needed       explicitly
```

Position is present at every layer. No layer adds or removes it.

---

## Type Definitions

### Core Types (`src/types/recipe.ts`)

```typescript
export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: Unit;
  displayAmount?: string;
  notes?: string;
  category?: string;
  position: number;  // required, non-negative integer
}

export interface Instruction {
  id: string;
  step: number;
  content: string;
  duration?: number;
  position: number;  // required, non-negative integer
}
```

### Section Types (`src/types/sections.ts`)

```typescript
export interface Section<T = any> {
  id: string;
  name: string;
  order: number;
  items: T[];
}

export interface IngredientSection extends Section<Ingredient> {}
export interface InstructionSection extends Section<Instruction> {}

// Extended types add optional sectionId; position is inherited
export interface ExtendedIngredient extends Ingredient {
  sectionId?: string;
}
export interface ExtendedInstruction extends Instruction {
  sectionId?: string;
}
```

### Utility Type Constraints (`src/lib/section-position-utils.ts`)

```typescript
type WithPosition = { id: string; position: number };
type SectionWithPosition<T extends WithPosition> = { id: string; position: number; items: T[] };
```

These generic constraints replace the old `PositionedItem` interface. All utility functions accept any type that satisfies `WithPosition`, so they work directly with `Ingredient` and `Instruction` without coercion.

---

## Position Validation Rules

Validation is enforced via Zod schemas in `src/lib/validations/recipe-sections.ts`.

### Ingredient Position

```typescript
position: z.number()
  .int('Position must be an integer')
  .nonnegative('Position must be non-negative')
```

### Instruction Position

Same rules as ingredient position.

### Rules Summary

| Rule | Constraint |
|------|-----------|
| Type | `number` (integer) |
| Minimum | `0` |
| Required | Yes — omission fails validation |
| Uniqueness | No two items in the same scope share a position |
| Sequentiality | Positions should be `0, 1, 2, …, N-1` with no gaps |

### Auto-Correction

When conflicts are detected (duplicates, gaps, negatives), the system auto-corrects by sorting items by their current position and reindexing sequentially from 0. See `normalizePositions()` and `autoCorrectPositions()` in the utilities.

---

## Position Scope

Position values are meaningful only within their container.

### In Sections

Each section has its own position space starting at 0:

```
Section "Dry Ingredients" (order: 0)
  ├── Flour      position: 0
  ├── Sugar      position: 1
  └── Salt       position: 2

Section "Wet Ingredients" (order: 1)
  ├── Milk       position: 0   ← resets per section
  └── Eggs       position: 1
```

### In Flat Lists

A single global position space:

```
Flat List
  ├── Flour      position: 0
  ├── Sugar      position: 1
  ├── Salt       position: 2
  ├── Milk       position: 3
  └── Eggs       position: 4
```

### Scope Transitions

| Operation | Position Behavior |
|-----------|------------------|
| Section → Flat list | Global reindex (0 to M-1) |
| Flat list → Sections | Per-section reindex (0 to N-1) |
| Move between sections | Source and destination both reindexed |
| Reorder within section | Affected section reindexed |

---

## Position Utility Functions

All functions live in `src/lib/section-position-utils.ts`.

### Item-Level

| Function | Purpose |
|----------|---------|
| `reindexItemPositions(items)` | Sorts by position, assigns 0…N-1 |
| `validatePositions(items)` | Returns `{ isValid, errors, duplicates, invalid }` |
| `resolvePositionConflicts(existing, incoming)` | Merges two lists, deduplicates, reindexes |
| `reorderWithinSection(items, srcIdx, destIdx)` | Moves item within array, reindexes |
| `moveBetweenSections(src, dest, srcIdx, destIdx)` | Cross-section move, reindexes both |
| `normalizePositions(items)` | Sorts and reindexes (alias for common pattern) |
| `getNextPosition(items)` | Returns `max(positions) + 1` or `0` if empty |

### Section-Level

| Function | Purpose |
|----------|---------|
| `reindexSectionPositions(sections)` | Sorts sections by position, assigns 0…N-1 |
| `resolveSectionConflicts(existing, incoming)` | Merges section lists |
| `validateAndFixRecipePositions(sections)` | Validates all items in all sections, auto-fixes |

### Performance

All operations are O(n log n) due to sorting. No nested loops over items × sections.

---

## Normalization & Legacy Data

The normalizer (`src/lib/recipe-import-normalizer.ts`) ensures position is always present:

1. If `position` exists and is a valid non-negative integer → keep it
2. If `position` is missing or invalid → assign based on array index
3. After filtering (e.g., dropping empty items) → reindex to eliminate gaps

This runs on:
- Imported recipes (URL import, image OCR)
- Existing recipes loaded from the database (backward compatibility)
- Any data entering the system through the API

---

## Database Storage

Position is stored inline in the JSONB columns (`ingredients`, `instructions`, `ingredientSections`, `instructionSections`):

```json
{
  "ingredients": [
    { "id": "...", "name": "Flour", "amount": 2, "unit": "cups", "position": 0 },
    { "id": "...", "name": "Sugar", "amount": 1, "unit": "cup", "position": 1 }
  ]
}
```

### Migration

The migration script (`src/db/migrations/migrate-explicit-positions.ts`) adds position to all existing recipes:

- Processes flat ingredients, flat instructions, ingredient sections, and instruction sections
- Assigns position based on array index for items missing it
- Idempotent — safe to run multiple times
- Logs progress every 100 recipes
- Generates a summary report with statistics

---

## API Contract

Position is required on all ingredient and instruction objects in API requests and responses. See `docs/api/RECIPE-API-POSITION-REQUIREMENTS.md` for full endpoint documentation.

Key points:
- `POST /api/recipes` — position required on all items
- `PUT /api/recipes/[id]` — position required on all items
- `GET /api/recipes/[id]` — position included in response
- Missing positions trigger auto-correction with a warning in the response
- Invalid positions (negative, non-integer, duplicate) are auto-corrected

---

## Correctness Properties

These properties hold for all valid states of the system:

| # | Property | Invariant |
|---|----------|-----------|
| 1 | Position Presence | Every item has `position: number` where `Number.isInteger(position) && position >= 0` |
| 2 | Position Uniqueness | No two items in the same scope share a position value |
| 3 | Position Sequentiality | N items in a scope have positions `0, 1, 2, …, N-1` |
| 4 | Round-Trip Persistence | Save then load preserves exact position values |
| 5 | Recalculation on Move | Cross-section moves produce valid positions in both source and destination |
| 6 | Preservation on Reorder | Drag-and-drop reorder produces positions matching the new visual order |
| 7 | Legacy Migration | Items without position get it assigned from array index |
| 8 | Type Consistency | TypeScript enforces position at compile time — no runtime coercion |

---

## Key Files

| File | Role |
|------|------|
| `src/types/recipe.ts` | `Ingredient`, `Instruction` type definitions |
| `src/types/sections.ts` | `Section`, `IngredientSection`, `InstructionSection` types |
| `src/lib/section-position-utils.ts` | All position utility functions |
| `src/lib/validations/recipe-sections.ts` | Zod validation schemas |
| `src/lib/recipe-import-normalizer.ts` | Normalization for imported/legacy data |
| `src/db/migrations/migrate-explicit-positions.ts` | Database migration script |
| `docs/api/RECIPE-API-POSITION-REQUIREMENTS.md` | API contract documentation |
