Feature Design Document: Recipe Sections
Overview
This feature allows users to optionally divide their recipes into independent sections (e.g., “Cake Batter” and “Crumble Topping”), each containing its own set of ingredients and instructions. Sections improve clarity for complex recipes while remaining optional for simpler ones.

🎯 Goals
Let users organize ingredients and instructions into named sections.
Allow independent section creation for ingredients and instructions (no syncing).
Maintain intuitive, inline editing within a single scrolling recipe creation form.
Support reordering, renaming, and deleting sections easily.

🧭 User Flow
1. Recipe Creation
User begins creating a new recipe.
Ingredients and Instructions are shown as two editable areas in a single scrolling form.
Each area starts empty or with a default “Main” list (if no sections are added).
2. Adding a Section
The user clicks “+ Add Section” in the Ingredients or Instructions area.
A new section appears inline with a default name (e.g., “New Section”).
The section includes:
Editable title field (rename inline)
Drag handle (for reordering)
Delete icon
“+ Add Ingredient” or “+ Add Step” button
3. Managing Sections
Action	Behavior
Rename	Inline edit the section title; saves automatically on blur or Enter.
Reorder	Drag handle ⋮ moves the entire section up/down within its area.
Delete	Confirmation modal: “Delete this section and all its contents?”
Add Ingredient/Step	Adds new line item under that section.
4. Default (No Sections)
If no sections are added, users can input ingredients or instructions as a simple list.
The app should not force sections to exist unless desired.

Rules
Deleting a section removes all its child items.
Reordering updates the order property.
Sections are independent across ingredients and instructions.
Validation:
Sections may temporarily have no items during creation.
On publish, prompt user if a section is empty.

🧠 UI Layout
Ingredients Area
🧂 Ingredients
────────────────────────────
[ + Add Section ]

▼ Section: Cake Batter
[✏️ Rename]  [⋮ Drag]  [🗑️ Delete]
• 2 cups flour
• 1 cup sugar
[ + Add Ingredient ]

▼ Section: Crumble Topping
[✏️ Rename]  [⋮ Drag]  [🗑️ Delete]
• ½ cup butter
• ½ cup brown sugar
[ + Add Ingredient ]

────────────────────────────
[ + Add Section ]
Instructions Area
🧾 Instructions
────────────────────────────
[ + Add Section ]

▼ Section: Cake Batter
[✏️ Rename]  [⋮ Drag]  [🗑️ Delete]
1. Preheat oven to 350°F.
2. Mix ingredients.
[ + Add Step ]

▼ Section: Crumble Topping
[✏️ Rename]  [⋮ Drag]  [🗑️ Delete]
1. Combine butter and sugar.
2. Sprinkle over batter.
[ + Add Step ]
⚙️ Implementation Notes
Frontend
Framework: Next.js + React
Drag-and-drop: Use dnd-kit or react-beautiful-dnd
Inline editing: Controlled input field that swaps with static text on blur
State management: React state or form library (e.g., React Hook Form with nested arrays)
Deletion confirmation: Modal or toast confirmation
Backend
Store sections as arrays under both ingredients and instructions.
Maintain order field for deterministic rendering.
No sync logic between ingredient and instruction sections.
🧭 Edge Cases
✅ Section renamed to empty string → fallback to “Untitled Section.”
✅ Section deleted → remove all children.
✅ Dragging sections reorders correctly even with empty sections.
✅ Switching from “no sections” → “with sections” should not erase existing items (they can be moved manually).

✅ Summary
This feature gives users a flexible yet structured way to manage multi-part recipes.
By keeping the UI inline, non-synced, and reorderable, it supports both simple and advanced recipes without complicating the editing experience.