# Hardened Feature Design: Recipe Sections (Append-Only, Validated)
## Overview
This document defines the hardened data model and validation rules for the Recipe Sections feature. Sections allow users to group ingredients and instructions into logical blocks. Sections are optional, append-only, independently defined for ingredients and instructions, and strictly validated at save time.
This version removes drag-and-drop section reordering but ensures data integrity, import tolerance, and future extensibility.

## Core Principles
* Sections are optional
* Unsectioned items are allowed
* No empty sections allowed
* Hard validation with visible UI errors
* Append-only section ordering
* Forward-compatible with item reordering
* Safe for external imports
* Multi-user safe

## Canonical Data Model
### Recipe (simplified)
interface Recipe {
  id: string;
  ingredients: IngredientSection[];
  instructions: InstructionSection[];
}

### Ingredient Section
interface IngredientSection {
  id: string;
  name: string;              // required
  position: number;          // section order (append-only)
  ingredients: Ingredient[];
}

### Instruction Section
interface InstructionSection {
  id: string;
  name: string;              // required
  position: number;          // section order (append-only)
  steps: InstructionStep[];
}

### Ingredient (Forward-Compatible)
interface Ingredient {
  id: string;
  text: string;              // required
  position: number;          // order within section
}

### Instruction Step
interface InstructionStep {
  id: string;
  text: string;              // required
  position: number;          // order within section
}

## Ordering Rules
### Section Ordering
* Sections are ordered by position
* New sections:
** Always added at the highest position
* Deleting a section:
** Removes it and reindexes remaining sections
* No manual reordering

### Item Ordering (Ingredients / Steps)
* Items have a position field
* Position is authoritative
* Enables future drag-and-drop inside sections only

## Section Behavior Rules
| Rule                                           | Behavior                     |
| ---------------------------------------------- | ---------------------------- |
| Empty section name                             | ❌ Invalid                    |
| Duplicate section names                        | ✅ Allowed                    |
| Empty section (no items)                       | ❌ Invalid                    |
| Ingredient sections match instruction sections | ❌ Not required               |
| Delete section with items                      | ⚠️ Confirmation required     |
| Delete only section                            | Fallback to unsectioned mode |


## Validation Rules (Hard Validation)

### Recipe-Level Validation
| Rule                            | Type         |
| ------------------------------- | ------------ |
| At least 1 ingredient exists    | ❌ Block save |
| Ingredient text cannot be empty | ❌ Block save |

### Section-Level Validation
| Rule                          | Enforcement  |
| ----------------------------- | ------------ |
| Section name required         | ❌ Block save |
| Section must contain ≥ 1 item | ❌ Block save |
| Empty section name            | ❌ Block save |
| Empty ingredient/step text    | ❌ Block save |


### Item-Level Validation
| State              | Allowed      |
| ------------------ | ------------ |
| Empty while typing | ✅ Allowed    |
| Empty on save      | ❌ Invalid    |
| Empty on blur      | Auto-deleted |


## Validation UX Requirements
* Validation errors must:
** Appear inline near the invalid field
** Prevent save
** Clearly explain what must be fixed
### Example Errors
* “Section name is required”
* “This section must contain at least one ingredient”
* “At least one ingredient is required for a recipe”

## Import & External Data Handling
Imported recipes may violate constraints.
Import Normalization Rules
| Condition             | Handling                         |
| --------------------- | -------------------------------- |
| Missing section name  | Assign `"Imported Section"`      |
| Empty section         | Flatten into unsectioned items   |
| Missing positions     | Auto-assign sequential positions |
| Empty ingredient text | Drop item                        |
| No sections at all    | Treat as unsectioned recipe      |
⚠️ Imported data is normalized before validation

## Multi-User Considerations
Sections and items must have stable IDs
Ordering based on position, not array index
Concurrent edits should:
Respect last-write-wins on positions
Never produce duplicate positions within a section


## Section Deletion Rules
Scenario	Behavior
Delete section with items	Confirmation required
Delete empty section	Immediate
Delete last remaining section	Fall back to unsectioned mode

## Implementation Notes
### Storage
JSON blobs are acceptable
Positions must be persisted explicitly
Validation should occur:
Client-side (UX)
Server-side (data integrity)
### Recommended Validation Tooling
Zod / Yup / custom validator
Shared schema between FE and BE if possible

## Forward Compatibility
This model supports:
Ingredient reordering inside sections
Step reordering
Section notes
Timers
Optional move-up / move-down buttons (future)

## Acceptance Criteria Summary
❌ Cannot save recipe with empty section
❌ Cannot save recipe with empty section name
❌ Cannot save recipe without ingredients
✅ Imported recipes auto-normalize
✅ Sections append only
✅ Item ordering preserved
✅ Multi-user safe

## Final Notes
This hardened model intentionally favors data correctness over flexibility while remaining user-friendly and future-proof. It eliminates ambiguity, enforces clear invariants, and scales cleanly as the product grows.