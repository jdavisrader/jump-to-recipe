# Fraction-based ingredient quantities

## Context

Ingredient quantities can currently only be entered as decimals — the amount field in the ingredient form is a plain `type="number"` input. Recipes are naturally written with fractions ("½ tsp", "1¾ cups"), so users have to mentally convert to decimal to enter a recipe, which is unnatural and error-prone (especially for the non-technical family members this app is built for).

The data model already anticipates this: `Ingredient` (`src/types/recipe.ts:14-22`) has both `amount: number` (canonical decimal, used for math/scaling) and an optional `displayAmount?: string` (pre-formatted text shown instead of the decimal when present). The import-from-URL pipeline already populates both fields when scraping recipes that contain fraction text. What's missing is a way for a user to type a fraction directly into the manual add/edit ingredient form — that path only accepts decimals today.

Goal: let users type quantities like `1/2`, `1 3/4`, or `2` into the ingredient form and have them save/display correctly, while keeping `amount` as the decimal used everywhere else (scaling, math), matching the existing architecture.

Per discussion with the user:
- Store `amount` as the parsed decimal (existing pattern), `displayAmount` as the fraction text — no schema change needed.
- Input is a single plain text field, parsed on save (blur), not separate whole/fraction pickers.
- Only new/edited ingredients get fraction support — no backfill of existing decimal-only recipes.
- Also fix a related bug in grocery list scaling (found during investigation) that mishandles fraction `displayAmount` text.

## Existing pieces being reused

- `src/lib/fraction-utils.ts` — `formatFractionForDisplay`, `fractionToDecimal`, `decimalToFraction`. Already used by `src/lib/recipe-scaling.ts` for the ½×/1×/2× display scaling feature (PR #86).
- `Ingredient.displayAmount` (`src/types/recipe.ts:19`) and `ingredientSchema.displayAmount` (`src/lib/validations/recipe.ts:13`, unvalidated optional string) — already plumbed through display code:
  - `recipe-display.tsx:222-236, 256-270` — `{scaled.displayAmount || scaled.amount} {scaled.unit}`
  - `recipe-editor.tsx:567-576` — same fallback pattern
  - `grocery-list-display.tsx:85-90` — same fallback pattern
  No display-side changes needed — this plan only touches how the value gets *into* `displayAmount`/`amount` from manual entry.
- `setError`/`clearErrors` props already flow into `RecipeIngredientsWithSections` (`recipe-ingredients-with-sections.tsx:53-54`) and are already used for manual field-level errors elsewhere in that file — reuse the same pattern for quantity parse errors.

## Implementation

### 1. `src/lib/fraction-utils.ts` — add a single parse entry point, fix a bug

Add `parseQuantityInput(input: string): { amount: number; displayAmount: string } | null`:
- Empty/whitespace-only → `{ amount: 0, displayAmount: '' }`.
- Contains `/` → treat as fraction syntax. Support `W N/D` (mixed) and `N/D` (simple), any positive integer denominator (not just the fixed halves/quarters/eighths set). Compute `amount` by division. Compute `displayAmount` via `formatFractionForDisplay` (unicode glyph when the fraction is one of the recognized ones, otherwise keep the typed `W N/D` / `N/D` text as-is).
- Otherwise → parse as a plain number (`parseFloat`). `displayAmount` = the trimmed input as typed (no forced conversion to a fraction glyph — a user who types `1.5` keeps seeing `1.5`, not `1½`, so behavior for existing decimal users is unchanged).
- Reject (return `null`): non-numeric garbage, negative numbers, zero/invalid denominator. This drives a validation error in the form.

Fix existing bug while touching this file: `fractionToDecimal`'s mixed-number branch (`fraction-utils.ts:46-51`) looks up the fractional part *only* in the fixed `fractionMap`, so `"1 2/5"` silently computes as `1 + 0 = 1` (the `2/5` is dropped because it's not a recognized denominator). Confirmed via grep that `fractionToDecimal` has no other callers in the live app, so it's safe to fix in place — the mixed-number branch will compute the fractional part generically (`numerator/denominator`) instead of relying on the map lookup.

Add unit tests in `src/lib/__tests__/fraction-utils.test.ts` (new file) covering: whole numbers, simple fractions, mixed fractions (including uncommon denominators like `2/5`), decimals, empty input, and invalid input.

### 2. `src/components/recipes/recipe-ingredients-with-sections.tsx` — quantity input

Two near-identical ingredient rows need the same change: the sectioned row (`~729-753`, field `${fieldBaseName}.amount`) and the flat row (`~899-920`, field `ingredients.${index}.amount`).

For each:
- Change the visible `Input` from `type="number"` bound to `.amount` → `type="text"` bound to `.displayAmount`, placeholder e.g. `"e.g. 1 3/4"`.
- `onChange`: pass the raw typed text straight through to the `displayAmount` field.
- `onBlur`: run `parseQuantityInput(value)`.
  - Valid → `setValue(`${base}.amount`, result.amount)`, `setValue(`${base}.displayAmount`, result.displayAmount)`, `clearErrors(`${base}.amount`)`.
  - Invalid (`null`) → `setError(`${base}.amount`, { message: 'Enter a number or fraction, like 1/2 or 1 3/4' })`, leave the typed text in place, don't touch `amount`.
- Add `setValue: UseFormSetValue<any>` to `RecipeIngredientsWithSectionsProps` and thread it from `recipe-form.tsx` and `recipe-editor.tsx` (the two call sites), same pattern as existing `setError`/`clearErrors` props.
- `FormMessage` under the field already renders react-hook-form field errors.

No Zod schema change needed — `ingredientSchema.amount` stays `z.number().nonnegative()`, `displayAmount` stays an unvalidated optional string.

### 3. `src/lib/grocery-list-generator.ts` — fix scaling bug

`scaleIngredient` (lines 123-137) does `parseFloat(ingredient.displayAmount) * scaleFactor` when `displayAmount` is set. For a unicode fraction like `"½"` this returns `NaN`; for `"1½"` it truncates to `1`. Fix: scale from `ingredient.amount` (already correct) and format the result via `decimalToFraction`/`roundToNiceFraction` (reuse from `recipe-scaling.ts`) instead of re-parsing `displayAmount` text.

## Verification

- `npm run type-check` and `npm run lint`.
- `npx jest src/lib/__tests__/fraction-utils.test.ts`.
- Manual, via dev server + browser:
  1. Create a recipe, enter ingredient quantities as `1/2`, `1 3/4`, `2/5` (uncommon denominator), and a plain decimal `1.5` — confirm each saves and redisplays correctly on the recipe detail page.
  2. Edit an existing ingredient's quantity from decimal to a fraction and back — confirm round-trip.
  3. Type garbage (`"abc"`) into the quantity field, blur, confirm a validation error appears and blocks save.
  4. Use the ½×/1×/2× scaler on a recipe with fraction-entered ingredients — confirm scaled amounts look correct.
  5. Add a fraction-quantity recipe to a grocery list and adjust servings — confirm the generated grocery list quantity is correct.
