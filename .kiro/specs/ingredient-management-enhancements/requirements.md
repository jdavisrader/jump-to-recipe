# Requirements Document

## Introduction

The Ingredient Management Enhancements feature improves the usability and flexibility of ingredient management within recipes. Users can reorder ingredients through drag-and-drop interactions, both within sections and across sections, while benefiting from clearer UI controls and a more intuitive input layout. This feature builds upon the existing recipe sections functionality to provide a more powerful and user-friendly ingredient management experience.

## Glossary

- **Ingredient**: A component of a recipe consisting of quantity, unit, name, and optional notes
- **Section**: A named grouping of ingredients or instructions within a recipe
- **Drag Handle**: A visual indicator (typically three horizontal lines) that users can grab to initiate drag-and-drop operations
- **Position**: The numerical order of an ingredient within its section or within the flat ingredient list
- **Flat List**: A recipe ingredient list without sections, where all ingredients exist in a single ordered list
- **Sectioned List**: A recipe ingredient list organized into named sections, where each section contains its own ordered list of ingredients

## Requirements

### Requirement 1

**User Story:** As a user creating or editing a recipe, I want to drag and drop ingredients to reorder them within a section, so that I can arrange ingredients in the order that makes sense for my recipe preparation.

#### Acceptance Criteria

1. WHEN a user views ingredients within a section THEN each ingredient SHALL display a visible drag handle icon
2. WHEN a user clicks and drags an ingredient by its handle THEN the ingredient SHALL move with the cursor and show visual feedback
3. WHEN a user drags an ingredient to a new position within the same section THEN the ingredient SHALL be inserted at that position
4. WHEN an ingredient is reordered within a section THEN the system SHALL update the position values for all affected ingredients
5. WHEN an ingredient is dropped at a new position THEN the new order SHALL persist when the recipe is saved

### Requirement 2

**User Story:** As a user organizing complex recipes with multiple sections, I want to drag ingredients from one section to another, so that I can reorganize my recipe structure without manually copying and deleting ingredients.

#### Acceptance Criteria

1. WHEN a user drags an ingredient over a different section THEN the target section SHALL provide visual feedback indicating it can accept the drop
2. WHEN a user drops an ingredient into a different section THEN the ingredient SHALL be removed from the source section and added to the target section
3. WHEN an ingredient is moved to a different section THEN the system SHALL update position values in both the source and target sections
4. WHEN an ingredient is moved between sections THEN the ingredient data SHALL remain unchanged except for its section assignment and position
5. WHEN sections are reordered THEN ingredients SHALL remain within their assigned sections

### Requirement 3

**User Story:** As a user working with simple recipes without sections, I want to drag and drop ingredients in a flat list, so that I can reorder ingredients even when I don't need the complexity of sections.

#### Acceptance Criteria

1. WHEN a user views a recipe without sections THEN each ingredient SHALL display a drag handle
2. WHEN a user drags an ingredient in a flat list THEN the ingredient SHALL move to the new position in the list
3. WHEN an ingredient is reordered in a flat list THEN the system SHALL update position values for all affected ingredients
4. WHEN a recipe is converted from flat to sectioned THEN the ingredient order SHALL be preserved in the default section
5. WHEN a recipe is converted from sectioned to flat THEN the ingredient order SHALL be preserved based on section order and ingredient position within sections

### Requirement 4

**User Story:** As a user managing ingredients, I want clear and intuitive UI controls, so that I can quickly understand how to delete and reorder ingredients without confusion.

#### Acceptance Criteria

1. WHEN a user views an ingredient row THEN the delete button SHALL display a clear "X" icon
2. WHEN a user views an ingredient row THEN the drag handle SHALL display three horizontal lines (hamburger menu icon)
3. WHEN a user hovers over the drag handle THEN the cursor SHALL change to indicate the element is draggable
4. WHEN a user hovers over the delete button THEN the button SHALL provide visual feedback
5. WHEN a user attempts to drag an ingredient from anywhere other than the drag handle THEN the drag operation SHALL NOT initiate

### Requirement 5

**User Story:** As a user entering ingredient data, I want an efficient and logical input layout, so that I can quickly add ingredients with structured information.

#### Acceptance Criteria

1. WHEN a user views the ingredient input form THEN the fields SHALL be ordered: Quantity, Unit, Ingredient Name, Notes
2. WHEN a user tabs through ingredient fields THEN the focus order SHALL follow the visual field order
3. WHEN a user enters a quantity THEN the Unit field SHALL be immediately accessible
4. WHEN a user completes the Ingredient Name field THEN the Notes field SHALL be available as the final optional input
5. WHEN the ingredient form is displayed on mobile devices THEN the field order SHALL remain consistent with desktop

### Requirement 6

**User Story:** As a user managing ingredients, I want the system to maintain correct ingredient positions in the database, so that my ingredient order is reliably saved and displayed.

#### Acceptance Criteria

1. WHEN ingredients are reordered THEN the system SHALL persist the new position values to the database
2. WHEN a recipe is loaded THEN ingredients SHALL be displayed in ascending position order within each section
3. WHEN an ingredient is added to a section THEN it SHALL be assigned a position value one greater than the highest existing position in that section
4. WHEN an ingredient is deleted THEN the system SHALL update position values for subsequent ingredients to maintain sequential ordering
5. WHEN multiple ingredients are reordered in a single operation THEN all position updates SHALL be saved atomically

### Requirement 7

**User Story:** As a user performing drag-and-drop operations, I want clear visual feedback, so that I understand what will happen when I drop an ingredient.

#### Acceptance Criteria

1. WHEN a user drags an ingredient THEN a ghost image or placeholder SHALL follow the cursor
2. WHEN a dragged ingredient hovers over a valid drop target THEN the target area SHALL highlight or show an insertion indicator
3. WHEN a dragged ingredient hovers over an invalid drop target THEN the cursor SHALL indicate the drop is not allowed
4. WHEN an ingredient is being dragged THEN the original position SHALL show a placeholder or gap
5. WHEN a drag operation completes THEN the ingredient SHALL animate smoothly to its new position

### Requirement 8

**User Story:** As a user managing large ingredient lists, I want drag-and-drop to remain responsive, so that I can efficiently reorder ingredients even in complex recipes.

#### Acceptance Criteria

1. WHEN a user drags an ingredient in a list with more than 20 ingredients THEN the drag operation SHALL remain smooth without lag
2. WHEN a user drags an ingredient across sections THEN the interface SHALL update without noticeable delay
3. WHEN multiple rapid drag operations occur THEN the system SHALL handle each operation correctly without data loss
4. WHEN a drag operation is in progress THEN other UI interactions SHALL remain responsive
5. WHEN ingredients are reordered THEN the system SHALL avoid unnecessary re-renders of unaffected components

### Requirement 9

**User Story:** As a user on a mobile device, I want to reorder ingredients using touch gestures, so that I can manage my recipes on any device.

#### Acceptance Criteria

1. WHEN a user long-presses a drag handle on a touch device THEN the ingredient SHALL enter drag mode
2. WHEN a user drags an ingredient with touch THEN the ingredient SHALL follow the touch point
3. WHEN a user lifts their finger during a touch drag THEN the ingredient SHALL drop at the current position
4. WHEN touch drag operations occur THEN visual feedback SHALL be equivalent to mouse-based drag operations
5. WHEN a user accidentally initiates a drag on mobile THEN they SHALL be able to cancel by dragging outside the valid drop area
