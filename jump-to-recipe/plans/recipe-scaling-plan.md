# Recipe Scaling (½ / 1× / 2×) — Implementation Plan

## Context
Users viewing a recipe want to quickly halve or double it without doing mental math. Today `recipe-display.tsx` renders each ingredient as `displayAmount || amount` with no multiplier applied — even though it already keeps a `servings` state. We'll add a non-destructive scale control that multiplies ingredient amounts, updates the servings label, and renders the results in human-friendly form (nice fractions + sensible unit promotion). Nothing is persisted; the original recipe is never modified, and reloading resets to 1×.

### Decisions (confirmed with user)
- **Controls:** three presets only — ½ / 1× / 2× (default 1×).
- **Readability:** round to nice fractions AND promote units when sensible (3 tsp → 1 tbsp, 16 oz → 1 lb, 1000 g → 1 kg).
- **Persistence:** display-only, resets on reload.
- **Scope:** ingredient amounts + the servings number only. Instruction text and prep/cook times are left untouched.

## Existing code to reuse
- `src/lib/unit-conversion.ts` — `suggestBetterUnit(value, unit)` (already promotes g→kg, oz→lb, ml→l, fl oz→quart→gallon), `isCommonUnit`.
- `src/lib/fraction-utils.ts` — `decimalToFraction(decimal)` produces `½`, `1½`, etc. (snaps within 0.01, else returns a decimal string).
- `src/types/recipe.ts` — `Ingredient { amount, unit, displayAmount?, ... }`, `Unit`.
- Ingredients render in `src/components/recipes/recipe-display.tsx` in **two branches**: sectioned (`recipe.ingredientSections[].items`) and flat (`recipe.ingredients`). Both must apply scaling.

## Changes

### 1. New util — `src/lib/recipe-scaling.ts`
Small, pure, well-tested. Exports:

- `roundToNiceFraction(value: number): number` — snap to the nearest common fraction step (eighths: `.125` increments) when close (within ~0.02), so scaled values format cleanly; otherwise round to 2 decimals. Prevents `0.1665`-style output that `decimalToFraction` can't map.
- `formatScaledAmount(amount: number, unit: Unit): { displayAmount: string; unit: Unit }`
  - If `amount <= 0` → return `{ displayAmount: '', unit }` (caller already hides zero amounts; covers "to taste").
  - Apply `suggestBetterUnit` **only when `factor !== 1`** — call it once, take the promoted `{ value, unit }` if returned.
  - Run the (possibly promoted) value through `roundToNiceFraction`, then `decimalToFraction` for the string.
  - Leave `unit === ''` and `pinch` un-promoted (still scale the number).
- `scaleIngredient(ingredient: Ingredient, factor: number): Ingredient`
  - `factor === 1` → return ingredient unchanged (preserves original `displayAmount`).
  - Else compute `newAmount = ingredient.amount * factor`, run `formatScaledAmount`, return a copy with the new numeric `amount`, recomputed `displayAmount`, and promoted `unit`. (We recompute `displayAmount` from the number and intentionally discard the stale original.)

Rationale: keeping the math in one pure module (not in the component) makes it unit-testable and reusable if we later scale in the editor or grocery-list generator.

### 2. New component — `src/components/recipes/recipe-scaler.tsx`
A tiny segmented button group (shadcn `Button` variants, matching existing style) with ½ / 1× / 2×. Props: `scale: number`, `onChange: (n: number) => void`. Highlights the active preset. ~40 lines, keeps `recipe-display.tsx` from growing.

### 3. `src/components/recipes/recipe-display.tsx`
- Add `const [scale, setScale] = useState(1)`.
- Render `<RecipeScaler>` in the Ingredients `CardHeader` (next to the `INGREDIENTS` title).
- Servings label (line ~168): show `Math.round((recipe.servings || 4) * scale)` when scale ≠ 1; keep base otherwise. (Note: the pre-existing `servings` state at line 34 is currently unused for display — replace that usage rather than add a parallel source of truth.)
- In **both** ingredient branches (sectioned ~line 216 and flat ~line 247), replace the inline `{ingredient.displayAmount || ingredient.amount} {ingredient.unit}` with values derived from `scaleIngredient(ingredient, scale)` — e.g. compute `const scaled = scaleIngredient(ingredient, scale)` per item and render `{scaled.displayAmount || scaled.amount} {scaled.unit}`. The existing `ingredient.amount > 0` guard stays (based on original amount).

### 4. Tests — `src/lib/__tests__/recipe-scaling.test.ts`
Cover: 2× and ½ of whole and fractional amounts; unit promotion (8 oz ×2 → 1 lb; 500 g ×2 → 1 kg; 2 tbsp ×½ → 1 tbsp stays tbsp); zero/`to taste` amounts unchanged; `factor === 1` returns the original object untouched; `''`/`pinch` units keep unit but scale number.

## Out of scope
Instruction-text rescaling, prep/cook time scaling, saving a scaled copy, arbitrary custom servings. (Custom-servings could reuse `scaleIngredient` later — the util is factor-based so it already supports it.)

## Verification
1. `npm run type-check` and `npm run lint` clean.
2. `npx jest src/lib/__tests__/recipe-scaling.test.ts` passes.
3. `npm run dev`, open a recipe with both whole and fractional ingredients (and ideally a sectioned recipe):
   - Click **2×** → amounts double, servings double, fractions read cleanly, `16 oz` shows as `1 lb`.
   - Click **½** → amounts halve (e.g. `1 cup` → `½ cup`), `to taste`/zero-amount items unchanged.
   - Click **1×** → returns to the exact original `displayAmount` values.
   - Reload → resets to 1×.
