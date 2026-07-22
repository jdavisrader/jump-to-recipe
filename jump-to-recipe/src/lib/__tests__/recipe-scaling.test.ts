import {
  roundToNiceFraction,
  promoteUnit,
  formatAmountDisplay,
  scaleIngredient,
} from '../recipe-scaling';
import type { Ingredient } from '@/types/recipe';

function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: '1',
    name: 'flour',
    amount: 1,
    unit: 'cup',
    position: 0,
    ...overrides,
  };
}

describe('roundToNiceFraction', () => {
  it('snaps near-eighth values to the exact eighth', () => {
    expect(roundToNiceFraction(0.4999)).toBe(0.5);
    expect(roundToNiceFraction(0.751)).toBe(0.75);
  });

  it('rounds non-fraction values to two decimals', () => {
    expect(roundToNiceFraction(0.167)).toBeCloseTo(0.17, 5);
  });
});

describe('promoteUnit', () => {
  it('promotes 3 tsp to 1 tbsp', () => {
    expect(promoteUnit(3, 'tsp')).toEqual({ amount: 1, unit: 'tbsp' });
  });

  it('promotes 16 oz to 1 lb', () => {
    expect(promoteUnit(16, 'oz')).toEqual({ amount: 1, unit: 'lb' });
  });

  it('promotes 1000 g to 1 kg', () => {
    expect(promoteUnit(1000, 'g')).toEqual({ amount: 1, unit: 'kg' });
  });

  it('leaves amounts that do not cross a threshold unchanged', () => {
    expect(promoteUnit(2, 'tbsp')).toEqual({ amount: 2, unit: 'tbsp' });
    expect(promoteUnit(4, 'oz')).toEqual({ amount: 4, unit: 'oz' });
  });
});

describe('formatAmountDisplay', () => {
  it('formats whole and fractional amounts', () => {
    expect(formatAmountDisplay(2)).toBe('2');
    expect(formatAmountDisplay(0.5)).toBe('½');
    expect(formatAmountDisplay(1.5)).toBe('1½');
  });

  it('returns empty string for non-positive amounts', () => {
    expect(formatAmountDisplay(0)).toBe('');
    expect(formatAmountDisplay(-1)).toBe('');
  });
});

describe('scaleIngredient', () => {
  it('returns the original object untouched at factor 1', () => {
    const ing = makeIngredient({ amount: 1, unit: 'cup', displayAmount: '1' });
    expect(scaleIngredient(ing, 1)).toBe(ing);
  });

  it('doubles a whole amount', () => {
    const scaled = scaleIngredient(makeIngredient({ amount: 2, unit: 'cup' }), 2);
    expect(scaled.amount).toBe(4);
    expect(scaled.displayAmount).toBe('4');
    expect(scaled.unit).toBe('cup');
  });

  it('halves to a clean fraction', () => {
    const scaled = scaleIngredient(makeIngredient({ amount: 1, unit: 'cup' }), 0.5);
    expect(scaled.amount).toBe(0.5);
    expect(scaled.displayAmount).toBe('½');
  });

  it('promotes units when doubling (8 oz -> 1 lb)', () => {
    const scaled = scaleIngredient(makeIngredient({ amount: 8, unit: 'oz' }), 2);
    expect(scaled.unit).toBe('lb');
    expect(scaled.displayAmount).toBe('1');
  });

  it('promotes 500 g -> 1 kg when doubling', () => {
    const scaled = scaleIngredient(makeIngredient({ amount: 500, unit: 'g' }), 2);
    expect(scaled.unit).toBe('kg');
    expect(scaled.displayAmount).toBe('1');
  });

  it('leaves "to taste" (zero amount) ingredients unchanged', () => {
    const ing = makeIngredient({ amount: 0, unit: '', name: 'salt' });
    expect(scaleIngredient(ing, 2)).toBe(ing);
  });

  it('scales the number but keeps unitless amounts', () => {
    const scaled = scaleIngredient(makeIngredient({ amount: 2, unit: '' }), 0.5);
    expect(scaled.amount).toBe(1);
    expect(scaled.unit).toBe('');
    expect(scaled.displayAmount).toBe('1');
  });
});
