# Recipe view / create / edit restyle

## Context
Rework the view, create and edit recipe flows to match the "Recipe app" design canvas (View / Create / Edit artboards). We take its **layout, structure and flow only**. We keep our own color scheme and fonts and use the existing theme tokens (`primary`, `muted`, `border`, `card`, `secondary`). The design's orange palette, Bricolage/Inter fonts and colored tag pills are out of scope. Every feature we have that the design dropped stays, placed where it fits best.

Decisions already made:
- Keep **Add to Cookbook**. No Save/bookmark.
- No **Save draft** button (no draft status).
- **Share** copies the link. **Print** is a print stylesheet + `window.print()` (the browser's "Save as PDF").
- Keep **"Servings"**, no yield unit.
- **Section reorder** uses up/down arrows. Drag-and-drop for items stays.
- The design's header is out of scope (we keep `components/navbar.tsx`).

Branch: `feat/recipe-restyle` off `master`. Each chunk below is one commit (~30 min) you can review on its own.

## Part A: View recipe (`/recipes/[id]`)

`recipe-display.tsx` (323 lines) gets split as we rewrite it, so each piece stays under 200 lines. It becomes a thin layout that composes the new components.

**A1. Hero header** (`feat: two-column recipe hero`)
- New `components/recipes/recipe-hero.tsx`:
  - Left column: title, description, author row, tags.
  - Right column: photo (`RecipeHeroImage`), which moves above the text on narrow screens.
- Description cut off at 4 lines (`line-clamp-4`) with a **Read more / Show less** button (`aria-expanded`). The button only shows when the text actually overflows.
- Author row:
  - Initials avatar, "By {name} · Updated {date}" (`updatedAt` is already passed in).
  - **Source** link moves here as a small external link (out of the actions row).
- No photo:
  - Owners: the existing "Add a photo" prompt becomes a placeholder tile in the right column.
  - Everyone else: the left column takes the full width (as today).

**A2. Stats grid + actions** (`feat: recipe stats grid and share/print actions`)
- `recipe-stats.tsx` becomes a bordered grid of cells with divider lines: Prep, Cook, Total, Servings (scaled), **Difficulty** (new on the view page; we already store it). Missing values are skipped, and the grid wraps to 2–3 columns on phones.
- `recipe-actions.tsx`, in this order:
  - **Edit recipe** as the primary button (owner/admin only, as today)
  - Add to Cookbook
  - **Share**: `navigator.clipboard.writeText(window.location.href)`, then a "Link copied" toast (existing `useToast`); an error toast if the clipboard is blocked
  - **Print**: `window.print()`
- Update `__tests__/recipe-actions.test.tsx`: share copies the link and shows the toast, print calls `window.print`.

**A3. Print stylesheet** (`feat: print-friendly recipe page`)
- Tailwind `print:` variants plus a small `@media print` block in `app/globals.css`:
  - Hide the navbar, actions, cook mode bar, jump-to chips, scaler, checkboxes, comments, original photos, and the Read more button (the description prints in full).
  - Black text on white, no card shadows or borders. Ingredients and method stack in one column; avoid page breaks inside a step.
  - Keep the hero photo small, or hide it. I'll pick whichever fits better on a page and show you.
- Add `print:hidden` to `components/navbar.tsx` (a one-line class change).

**A4. Jump-to chips + cook mode bar** (`feat: jump-to section chips`)
- New `components/recipes/recipe-jump-nav.tsx`:
  - One numbered chip per instruction section, linking to `#method-section-{n}`.
  - Only renders when there are 2 or more instruction sections.
- `cook-mode-toggle.tsx`: same row as the chips, restyled. When on, the hint reads "On · your screen will stay awake" and the background tints with `bg-primary/10`. It still hides on unsupported browsers.

**A5. Ingredients panel** (`feat: restyle ingredients panel`)
- New `components/recipes/recipe-ingredients-list.tsx`. It replaces the duplicated sectioned/flat markup in `recipe-display.tsx` by treating a flat list as a single section with no name.
- Header: "Ingredients" + `RecipeScaler`, and a line under it: "Serves {scaled servings}".
- Each group heading shows its item count ("11 items").
- Rows have dividers and a larger checkbox; a ticked row gets strikethrough and muted text (`peer-checked:`). **Ingredient notes** stay under the name in small muted text.
- Footer helper text: "Tick items off as you prep. Quantities follow the scale."
- Stays pinned on desktop (`lg:sticky`).

**A6. Method** (`feat: restyle method steps`)
- New `components/recipes/recipe-method.tsx`. The heading becomes **"Method"** (was "Instructions").
- Section header: "PART {n}" label + section name, with a strong bottom border; each section gets the `id` that A4 links to.
- Steps: outlined number circle and larger body text. **Step duration** stays as a small "⏱ X min" line under the step.
- Older flat recipes are treated as a single section with no name, with no "Part" label.

**A7. Lower sections** (`style: notes, photos and comments below method`)
- Below the main grid, in order: **Notes** (its own section, styled like Method), **Original recipe** photos (existing `RecipePhotosViewer` + lightbox), **Comments** (existing, including the owner's on/off switch).
- Visual restyle only; no change in behavior.

## Part B: Create & Edit forms (`/recipes/new`, `/recipes/[id]/edit`)

Both pages share `RecipeForm` (959 lines). The sections I rewrite get pulled into their own files (`recipe-form-basics.tsx`, `recipe-form-details.tsx`), which shrinks the form. I won't touch the validation, submit or empty-section logic.

**B1. Page shell + Basics** (`feat: form page shell and basics section`)
- New page: "← Back to recipes" link, "New recipe" title, intro "Add the basics, list what goes in, then walk through the steps."
- Edit page:
  - "← Back to recipe" link, "Edit recipe" title.
  - **Status badge**: "Public" or "Private" · "last saved {updatedAt}".
  - Line under it: "Changes go live when you save."
- **Basics** section: Recipe name, Short description, **Notes** (moved here from its own card), then the Photos area with Cover photo + **Original recipe photos** (the existing `RecipePhotosCard` content, restyled).
- Cover photo: add a **Replace** button next to Remove in `components/ui/image-upload.tsx` when a photo is set. It opens the same file picker. The drop zone hint becomes "JPG or PNG, up to 10 MB", which matches the existing `MAX_SELECTABLE_SIZE_MB`.
- Section headings become plain `h2`s inside bordered panels, replacing `CardTitle`s, to match the design's rhythm.

**B2. Details** (`feat: form details section`)
- Prep time, Cook time, Servings and Difficulty in a 4-column grid (2 columns on phones).
- Tags: keep our add-one-at-a-time chip input.
- **Source URL** and **Visibility** (private/public) move here from the old Details card, so this one section covers everything about the recipe itself.

**B3. Ingredients editor restyle** (`style: ingredient editor layout`)
- Section header:
  - "Ingredients" plus the helper text "Group ingredients when the recipe has parts, like the cake and the frosting. Groups here don't have to match the method sections."
  - A running total on the right: "14 items · 2 groups".
- Qty / Unit / Ingredient column labels above the rows (`aria-hidden`; the inputs keep their own labels).
- Kept as they are: drag handle, unit dropdown, **notes field** per row, the simple-list ↔ sections switch, validation.
- Button labels: "Add ingredient", "Add ingredient group".
- Files: `recipe-ingredients-with-sections.tsx`, `ingredient-row.tsx`, `components/sections/section-manager.tsx` (styling only).

**B4. Section reorder arrows** (`feat: move sections up and down`)
- `SectionManager`: add `handleSectionMove(sectionId, direction)`. It swaps a section with its neighbor and renumbers `order` from 0 (same pattern as `handleSectionDelete`).
- `SectionHeader`: up/down icon buttons (lucide `ChevronUp` / `ChevronDown`, 44px touch targets).
  - `aria-label="Move {name} up"`; Up is hidden on the first section and Down on the last.
  - Focus stays on the moved section's button after the swap.
- Works for both ingredient and method sections, since both use `SectionManager`.
- Tests in `components/sections/__tests__/`: moving changes the order, there are no arrows at either end, and the `order` values stay sequential.

**B5. Method editor restyle** (`style: method editor layout`)
- Section header: "Method" + "Split the steps into sections that read naturally while cooking." + a running total: "6 steps · 2 sections".
- Each step: a number badge, the textarea, and the delete button. **Duration** stays as a small field next to the step.
- Button labels: "Add step", "Add method section".
- File: `recipe-instructions-with-sections.tsx`.

**B6. Bottom of the form** (`feat: form footer and danger zone`)
- Edit only, in order: **Assign owner** (admins only, unchanged logic), then **Delete this recipe**, restyled as a danger panel with the text "It will be removed from your cookbook. This can't be undone." The existing confirmation modal stays.
- `FormActionBar` stays pinned to the bottom:
  - Create: "Cancel" / "Save recipe". No draft button. I'm using "Save recipe" rather than the design's "Publish", because the recipe may be private.
  - Edit: "Discard changes" / "Save changes".
  - Kept as they are: the error hint, the "Discard changes?" confirmation, the empty-section warning modal.
- Update `__tests__/form-action-bar.test.tsx` for the new labels.

## Verification (each chunk)
- `npm test -- <touched test files>`, then the full `npm test`, `npm run lint`, and `npx tsc --noEmit` at the end of each part.
- In the browser: use your already-running dev server at `http://localhost:3000` (I won't start a second one).
  - View a sectioned recipe, a flat recipe, one with no photo, one with notes and original photos. Check at desktop and phone width (375px).
  - Share copies the link; print preview fits a page; Read more toggles.
  - Create a recipe end to end with a photo, then edit it: reorder sections with the arrows, Replace the cover photo, check the status badge, try Discard and Delete.
- Screenshots of each screen as proof before each commit.
