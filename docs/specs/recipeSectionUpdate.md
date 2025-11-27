Feature Update: Remove Section Drag & Drop + Append-Only Section Creation
Overview
This update modifies the existing "Recipe Sections" functionality in the recipe editing and creation workflows. Previously, users could drag and drop sections (e.g., Ingredients, Instructions, custom sections) to reorder them. This update removes drag-and-drop ordering entirely. New sections will always be appended to the bottom of the recipe.
Users may still rename sections at any time, but reordering sections is no longer supported.

🎯 Goals
Simplify the UI and UX by removing drag-and-drop sorting.
Ensure the section order remains stable and predictable.
Preserve editing flexibility where needed (e.g., renaming sections).
Reduce accidental reordering issues.

🧩 Scope
In Scope
Remove drag-and-drop functionality from section lists.
Ensure “Add Section” always appends to bottom.
Maintain ability to rename any section.
Maintain ability to delete a section (which deletes its items).
Maintain ability to create ingredients/instructions inside a section.
Out of Scope
Nested sections.
Synchronizing names across Ingredients/Instructions sections.
Collapsible sections (still not supported).

🛠 Functional Requirements
1. Section Creation
When the user adds a new section:
It is automatically added to the bottom of the list.
The section appears with a default placeholder name like New Section or an empty field.
The user may rename the section immediately or later.
2. Section Ordering
Section drag-and-drop controls are completely removed.
Users cannot reorder sections manually.
The only ordering rule:
Order = creation order
New sections → always appended
3. Section Editing
Users may rename a section at any time.
Users may add or remove items (ingredients, instructions) within a section as before.
Users may delete a section:
Deleting a section deletes all associated items.
A confirmation step should appear (if already implemented).
4. Section Display
Sections are displayed in a vertical stack.
All sections remain fully expanded.
No collapsible UI.

🧪 Acceptance Criteria
AC1 — Drag & Drop Removed
Drag handles and reordering interactions are not rendered.
Attempting to reorder via keyboard or mouse must do nothing.
AC2 — Appending New Sections
Given I am editing a recipe
When I click “Add Section”
Then a new section appears at the bottom of the existing section list.
AC3 — Renaming Still Works
Given a section exists
When I change its name
Then the updated name is saved and reflected across the UI.
AC4 — Section Deletion Behaves Correctly
Given a section contains ingredients or instructions
When I delete the section
Then all child items are deleted
And the section is removed from the UI
And the ordering of remaining sections stays unchanged.
AC5 — Stable Order
Section order remains consistent across:
Editing session
Saving and reloading a recipe
Navigating between create/edit views

🔧 Technical Notes
UI Changes
Remove drag icons / drag UI.
Remove any @dnd-kit, react-beautiful-dnd, or custom drag logic.
Remove sorting metadata (if any).
Data Model
Preserve existing section IDs.
Order determined by array index — append only.