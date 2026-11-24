# Recipe Page & Editor UI Polish — Implementation Plan

## Context
A UI review of the recipe page and the edit form (code review plus a live check on :3001) found:
- **Recipe page:** the star button does nothing, and the ⋮ menu hides the only Edit / Add to Cookbook actions. When a recipe has no image, nothing is shown, not even for the owner.
- **Editor:**
  - Ingredient sections load in the wrong order.
  - Three different delete icons are used (🗑 section, ✕ ingredient, − step), and the step "−" sits far from the step text.
  - Drag and drop across sections lags after the drop.
  - The cover image is a half-width box buried in "Additional Information".
  - "Original Recipe Photos" shows two stacked dashed boxes when empty.
  - Update and Delete are two equal-weight full-width buttons, with no Cancel.
  - Section boxes are tinted blue, which clashes with the green theme.

### Decisions (confirmed with user)
- **Star:** removed (no favorites feature).
- **Recipe page actions:** the ⋮ menu is replaced by a row of labeled buttons under the author line: **Add to cookbook** (bookmark icon), **Edit** (owners/admins only), and **Original recipe ↗** (only when `sourceUrl` is set).
- **No image:**
  - Recipe cards keep `/recipe-placeholder.jpg`, since the grid needs a consistent shape.
  - The recipe page shows no placeholder. The title moves to the top.
  - Owners see a small "Add a photo" link that opens the editor.
- **Original photos:** relabelled **"Original recipe"**, with helper text "Photos or scans of the handwritten or printed recipe." The same name is used on the recipe page.
- **Delete:**
  - Stays on the edit page, at the very bottom, as a quiet text-style destructive button ("Delete this recipe").
  - Keeps the existing confirmation modal. The "Danger Zone" heading goes.
  - Save and Cancel live in a sticky bottom bar, so Delete is never next to Save.
- **Layout:** stays one page (no tabs, so validation errors stay visible). New order:
  1. Basics
  2. Photos
  3. Ingredients
  4. Instructions
  5. Notes
  6. Details (tags, source URL, visibility, admin owner assignment)
- **Scope note:** `RecipeForm` is shared by `/recipes/new` and `/recipes/[id]/edit`, so the layout changes apply to both. That is intended.

### Open questions (decide before the chunk that needs them)
- **Chunk 8:** should Cancel ask "Discard changes?" when the form has unsaved edits? Recommended: yes, only when the form is dirty.
- **Later:** an undo toast instead of the confirmation modal would need soft delete for recipes. Not in this plan.

## Approach
- No new dependencies. Reuse the existing shadcn `Button`, `ConfirmationModal`, `AddToCookbookModal`, the `@hello-pangea/dnd` setup, and the existing `ImageUpload` / `RecipePhotosManager`.
- New UI pieces go in new small files rather than growing `recipe-form.tsx` (already over 1,100 lines). Examples: `recipe-actions.tsx`, `recipe-photos-card.tsx`, `form-action-bar.tsx`.
- Verify each chunk in the running app on **:3001**, using the seeded demo account and a throwaway recipe that is deleted afterwards. Check desktop and mobile widths, and light and dark mode where styling changes.
- Run `npm run type-check`, `npm run lint` and the related Jest tests before each commit.

## Chunks
Each chunk is one commit and about 30 minutes or less.

1. **`fix: keep ingredient section order in the editor`**
   - Repro: create sections Dough (order 0) and Filling (order 1). The recipe page shows Dough first, but the editor shows Filling first. Instruction sections are not affected.
   - Find where `order` gets lost or reassigned. Candidates: `validateAndFixRecipePositions` in `src/app/api/recipes/route.ts`, the form normalizer in `recipe-form.tsx`, and `recipe-ingredients-with-sections.tsx`.
   - Check whether saving persists the swapped order.
   - Add a regression test.

2. **`feat: replace recipe page star and menu with labeled actions`**
   - In `recipe-display.tsx`, remove the `Star` button and the `DropdownMenu`.
   - Add a `RecipeActions` row (new file) with Add to cookbook, Edit, and Original recipe ↗.
   - The Add to Cookbook item no longer uses a star icon.

3. **`feat: show add-photo prompt instead of empty hero`**
   - When `imageUrl` is empty: owners see a compact "Add a photo" link to `/recipes/[id]/edit`; everyone else sees nothing.
   - Cards are unchanged.

4. **`style: calmer recipe page headings and timing row`**
   - Change "INGREDIENTS", "INSTRUCTIONS", "NOTES" and "COMMENTS" to sentence case.
   - Hide empty time and servings fields instead of showing "—".
   - Rename "Recipe Photos" to "Original recipe".

5. **`fix: consistent delete controls in the editor`**
   - Use one delete icon (ghost 🗑, with an `aria-label`) for sections, ingredients and steps.
   - Move the step delete into the step header line ("Step 2 · duration · 🗑").
   - Block deleting the last step in sectioned mode, as flat mode already does.

6. **`fix: smooth ingredient drag and drop`**
   - Make the ingredient `draggableId` stable (`ingredient.id` only, not `${sectionId}-${id}`), so a cross-section move doesn't remount the row mid-animation.
   - Replace `transition-all` with `transition-colors` on draggable rows.
   - Remove the `transform`/`scale` `!important` overrides in `drag-feedback.css`.
   - Run validation after the drop has finished instead of in the drop handler.
   - Verify that within-section and cross-section drops settle immediately.

7. **`feat: group cover image and original recipe photos in one card`**
   - New `RecipePhotosCard`, placed right after Basics.
   - Cover image: full width at 16:9, matching the recipe page hero.
   - "Original recipe" section: one dropzone, a thumbnail grid, and no second "No photos yet" box.
   - Remove the image field from Additional Information.
   - Reorder the remaining cards into Notes, then Details.

8. **`feat: sticky save bar and quiet delete on edit page`**
   - New `FormActionBar`, stuck to the bottom of the screen, with Cancel and Save changes (Create recipe on the new page).
   - It keeps the "fix N errors" hint and removes the leftover `console.log` on the submit button.
   - On the edit page, the Danger Zone block becomes a text-style "Delete this recipe" button at the bottom.
   - Check that the bar doesn't cover content on mobile.

9. **`style: match section containers to the theme`**
   - Replace the blue tint on ingredient and instruction section boxes with the theme's neutral or green tokens, in both light and dark mode.

## Out of scope
- Favorites, soft delete with undo, and drag and drop for instructions.
- **Follow-up: replace the drag-and-drop library.** After chunk 6, a drop still takes ~245ms to settle on the dev server: `@hello-pangea/dnd` holds `onDragEnd` until its own drop animation finishes, and the form then re-renders for ~100ms. Evaluate a library without that built-in delay (for example dnd-kit) for the ingredient editor.
- The other UX topics the user plans to raise next.
