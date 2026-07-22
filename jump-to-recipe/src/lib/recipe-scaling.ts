/**
 * Non-destructive recipe scaling.
 *
 * Multiplies ingredient amounts by a factor (e.g. 0.5 to halve, 2 to double)
 * and re-renders them in human-friendly form: nice fractions plus sensible
 * unit promotion (3 tsp -> 1 tbsp, 16 oz -> 1 lb, 1000 g -> 1 kg).
 *
 * Reuses `suggestBetterUnit` (unit-conversion) for weight/volume promotion and
 * `decimalToFraction` (fraction-utils) for display. Promotion is only applied
 * when the recipe is actually scaled, so a 1x view is byte-for-byte the original.
 */

import type { Ingredient, Unit } from '@/types/recipe';
import { suggestBetterUnit } from './unit-conversion';
import { decimalToFraction } from './fraction-utils';

/**
 * Snaps a value to the nearest eighth when it's close, otherwise rounds to two
 * decimals. Keeps scaled amounts clean so `decimalToFraction` can map them
 * (e.g. 0.4999 -> 0.5 -> "½") without emitting long decimals.
 */
export function roundToNiceFraction(value: number): number {
  const step = 1 / 8;
  const nearestEighth = Math.round(value / step) * step;
  if (Math.abs(value - nearestEighth) < 0.02) {
    return nearestEighth;
  }
  return Math.round(value * 100) / 100;
}

/**
 * Promotes an amount to a larger, more readable unit where sensible.
 * Delegates weight/volume to `suggestBetterUnit` and adds the common-cooking
 * rule it doesn't cover: 3 tsp -> 1 tbsp.
 */
export function promoteUnit(amount: number, unit: Unit): { amount: number; unit: Unit } {
  let current = { amount, unit };

  // Common cooking promotion not handled by suggestBetterUnit.
  if (current.unit === 'tsp' && current.amount >= 3 && current.amount % 3 === 0) {
    current = { amount: current.amount / 3, unit: 'tbsp' };
  }

  // Weight/volume promotion (g->kg, oz->lb, ml->l, fl oz->quart->gallon).
  // Loop so multi-step promotions (fl oz -> quart -> gallon) settle; guard
  // against any accidental oscillation.
  for (let i = 0; i < 4; i++) {
    const better = suggestBetterUnit(current.amount, current.unit);
    if (!better) break;
    current = { amount: better.value, unit: better.unit };
  }

  return current;
}

/**
 * Formats a numeric amount as a display string using nice fractions.
 * Returns '' for non-positive amounts (e.g. "to taste" ingredients).
 */
export function formatAmountDisplay(amount: number): string {
  if (amount <= 0) return '';
  return decimalToFraction(roundToNiceFraction(amount));
}

/**
 * Returns a copy of the ingredient scaled by `factor`, with a recomputed
 * `displayAmount` and a possibly-promoted `unit`. `factor === 1` returns the
 * ingredient untouched so the original authored `displayAmount` is preserved.
 * Ingredients with no positive amount are returned unchanged.
 */
export function scaleIngredient(ingredient: Ingredient, factor: number): Ingredient {
  if (factor === 1 || ingredient.amount <= 0) {
    return ingredient;
  }

  const scaledAmount = ingredient.amount * factor;
  const promoted = promoteUnit(scaledAmount, ingredient.unit);

  return {
    ...ingredient,
    amount: promoted.amount,
    unit: promoted.unit,
    displayAmount: formatAmountDisplay(promoted.amount),
  };
}
