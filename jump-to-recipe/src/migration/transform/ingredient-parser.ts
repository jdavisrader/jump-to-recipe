/**
 * Ingredient Parser Module
 * 
 * Parses unstructured ingredient text into structured format.
 * Leverages existing recipe-import-normalizer.ts functionality.
 * 
 * Requirements: 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

import { v4 as uuidv4 } from 'uuid';
import type { LegacyIngredient } from '../types/extraction';
import type { Ingredient, Unit } from '../../types/recipe';
import type { ParsedIngredient, UnparseableItem, TransformationStats } from './recipe-transformer';

// ============================================================================
// Ingredient Parsing
// ============================================================================

/**
 * Parse legacy ingredients into structured format
 * 
 * Requirements: 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 * 
 * @param ingredients - Legacy ingredients for a recipe (already sorted by order_number)
 * @param recipeId - Legacy recipe ID for error tracking
 * @param recipeTitle - Recipe title for error reporting
 * @param stats - Statistics tracker
 * @param unparseableItems - Array to collect unparseable items
 * @returns Array of parsed ingredients
 */
export async function parseIngredients(
  ingredients: LegacyIngredient[],
  recipeId: number,
  recipeTitle: string,
  stats: TransformationStats,
  unparseableItems: UnparseableItem[]
): Promise<Ingredient[]> {
  const parsed: Ingredient[] = [];

  for (const ingredient of ingredients) {
    try {
      const parsedIngredient = parseIngredientText(ingredient.ingredient, ingredient.order_number);

      if (parsedIngredient.parseSuccess) {
        stats.ingredientsParsed++;
        parsed.push(parsedIngredient);
      } else {
        stats.ingredientsUnparsed++;
        
        // Add to unparseable items for manual review (Requirement 3.6)
        unparseableItems.push({
          recipeId,
          recipeTitle,
          type: 'ingredient',
          originalText: ingredient.ingredient,
          reason: 'Failed to parse ingredient text',
        });

        // Still include the ingredient with raw text in notes (Requirement 3.6)
        parsed.push(parsedIngredient);
      }
    } catch (error) {
      stats.ingredientsUnparsed++;
      
      // Log error and add to unparseable items
      console.warn(`⚠ Failed to parse ingredient for recipe ${recipeId}: ${ingredient.ingredient}`);
      unparseableItems.push({
        recipeId,
        recipeTitle,
        type: 'ingredient',
        originalText: ingredient.ingredient,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });

      // Create a fallback ingredient with raw text
      parsed.push(createFallbackIngredient(ingredient.ingredient, ingredient.order_number));
    }
  }

  return parsed;
}

/**
 * Parse ingredient text into structured format
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8
 * 
 * Handles patterns like:
 * - "2 cups flour" → amount=2, unit="cup", name="flour"
 * - "1 lb chicken breast, diced" → amount=1, unit="lb", name="chicken breast", notes="diced"
 * - "1½ cups sugar" → amount=1.5, displayAmount="1½", unit="cup", name="sugar"
 * - "Salt to taste" → amount=0, unit="", name="salt", notes="to taste"
 */
export function parseIngredientText(text: string, orderNumber: number): ParsedIngredient {
  const originalText = text.trim();
  
  if (!originalText) {
    return createFallbackIngredient(originalText, orderNumber);
  }

  // Try to parse the ingredient text
  const parsed = parseIngredientPattern(originalText);

  if (parsed) {
    // Generate UUID (Requirement 3.7)
    const id = uuidv4();

    return {
      id,
      name: parsed.name,
      amount: parsed.amount,
      unit: parsed.unit as Unit,
      displayAmount: parsed.displayAmount,
      notes: parsed.notes,
      category: parsed.category,
      parseSuccess: true,
      originalText,
    };
  }

  // If parsing failed, create fallback (Requirement 3.6)
  return createFallbackIngredient(originalText, orderNumber);
}

/**
 * Parse ingredient text using pattern matching
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */
function parseIngredientPattern(text: string): {
  name: string;
  amount: number;
  unit: string;
  displayAmount?: string;
  notes?: string;
  category?: string;
} | null {
  // Normalize whitespace
  const normalized = text.trim().replace(/\s+/g, ' ');

  // Pattern 1: Amount + Unit + Name (+ optional notes after comma)
  // Examples: "2 cups flour", "1 lb chicken, diced", "1½ cups sugar"
  const pattern1 = /^([\d\s\/½¼¾⅓⅔⅛⅜⅝⅞.]+)\s*([a-zA-Z]+)?\s+([^,]+)(?:,\s*(.+))?$/;
  const match1 = normalized.match(pattern1);

  if (match1) {
    const [, amountStr, unit, name, notes] = match1;
    const { amount, displayAmount } = parseAmount(amountStr);

    return {
      name: name.trim(),
      amount,
      unit: unit ? normalizeUnit(unit.trim()) : '',
      displayAmount,
      notes: notes?.trim(),
      category: undefined,
    };
  }

  // Pattern 2: Name only (no amount/unit)
  // Examples: "Salt to taste", "Pepper", "Fresh herbs"
  const pattern2 = /^([^,]+)(?:,\s*(.+))?$/;
  const match2 = normalized.match(pattern2);

  if (match2) {
    const [, name, notes] = match2;

    // Check if this looks like it has a quantity (contains numbers)
    if (/\d/.test(name)) {
      // Try to extract amount from the name
      const amountMatch = name.match(/^([\d\s\/½¼¾⅓⅔⅛⅜⅝⅞.]+)\s*(.+)$/);
      if (amountMatch) {
        const [, amountStr, restOfName] = amountMatch;
        const { amount, displayAmount } = parseAmount(amountStr);

        return {
          name: restOfName.trim(),
          amount,
          unit: '',
          displayAmount,
          notes: notes?.trim(),
          category: undefined,
        };
      }
    }

    // No amount, just name
    return {
      name: name.trim(),
      amount: 0,
      unit: '',
      displayAmount: undefined,
      notes: notes?.trim(),
      category: undefined,
    };
  }

  return null;
}

/**
 * Parse amount string to number and display format
 * 
 * Requirement 3.5: Convert fractions to decimal and preserve displayAmount
 * 
 * Examples:
 * - "2" → { amount: 2, displayAmount: undefined }
 * - "1½" → { amount: 1.5, displayAmount: "1½" }
 * - "1 1/2" → { amount: 1.5, displayAmount: "1½" }
 * - "3/4" → { amount: 0.75, displayAmount: "¾" }
 */
function parseAmount(amountStr: string): { amount: number; displayAmount?: string } {
  const normalized = amountStr.trim();

  // Handle Unicode fractions
  const fractionMap: Record<string, number> = {
    '½': 0.5,
    '¼': 0.25,
    '¾': 0.75,
    '⅓': 0.333,
    '⅔': 0.667,
    '⅛': 0.125,
    '⅜': 0.375,
    '⅝': 0.625,
    '⅞': 0.875,
  };

  // Check for Unicode fractions
  for (const [symbol, value] of Object.entries(fractionMap)) {
    if (normalized.includes(symbol)) {
      const wholeMatch = normalized.match(/^(\d+)/);
      const whole = wholeMatch ? parseInt(wholeMatch[1]) : 0;
      const amount = whole + value;
      return { amount, displayAmount: normalized };
    }
  }

  // Handle "1 1/2" format
  const mixedMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const numerator = parseInt(mixedMatch[2]);
    const denominator = parseInt(mixedMatch[3]);
    const amount = whole + numerator / denominator;
    const displayAmount = convertToUnicodeFraction(whole, numerator, denominator);
    return { amount, displayAmount };
  }

  // Handle "3/4" format
  const fractionMatch = normalized.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1]);
    const denominator = parseInt(fractionMatch[2]);
    const amount = numerator / denominator;
    const displayAmount = convertToUnicodeFraction(0, numerator, denominator);
    return { amount, displayAmount };
  }

  // Handle decimal
  const decimal = parseFloat(normalized);
  if (!isNaN(decimal)) {
    return { amount: decimal, displayAmount: undefined };
  }

  // Default to 0 if can't parse
  return { amount: 0, displayAmount: undefined };
}

/**
 * Convert fraction to Unicode symbol
 */
function convertToUnicodeFraction(whole: number, numerator: number, denominator: number): string {
  const fractionSymbols: Record<string, string> = {
    '1/2': '½',
    '1/4': '¼',
    '3/4': '¾',
    '1/3': '⅓',
    '2/3': '⅔',
    '1/8': '⅛',
    '3/8': '⅜',
    '5/8': '⅝',
    '7/8': '⅞',
  };

  const fractionKey = `${numerator}/${denominator}`;
  const symbol = fractionSymbols[fractionKey];

  if (symbol) {
    return whole > 0 ? `${whole}${symbol}` : symbol;
  }

  // Fallback to text format
  return whole > 0 ? `${whole} ${numerator}/${denominator}` : `${numerator}/${denominator}`;
}

/**
 * Normalize unit names to standard format
 */
function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    // Volume
    'cup': 'cup',
    'cups': 'cup',
    'c': 'cup',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'tbsp': 'tbsp',
    'tbs': 'tbsp',
    'T': 'tbsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'tsp': 'tsp',
    't': 'tsp',
    'liter': 'l',
    'liters': 'l',
    'l': 'l',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'ml': 'ml',
    'pint': 'pint',
    'pints': 'pint',
    'pt': 'pint',
    'quart': 'quart',
    'quarts': 'quart',
    'qt': 'quart',
    'gallon': 'gallon',
    'gallons': 'gallon',
    'gal': 'gallon',
    
    // Weight
    'pound': 'lb',
    'pounds': 'lb',
    'lb': 'lb',
    'lbs': 'lb',
    'ounce': 'oz',
    'ounces': 'oz',
    'oz': 'oz',
    'gram': 'g',
    'grams': 'g',
    'g': 'g',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'kg': 'kg',
    
    // Other
    'pinch': 'pinch',
    'pinches': 'pinch',
    'dash': 'dash',
    'dashes': 'dash',
  };

  const lower = unit.toLowerCase();
  return unitMap[lower] || unit;
}

/**
 * Create fallback ingredient when parsing fails
 * 
 * Requirement 3.6: Preserve raw text in notes
 */
function createFallbackIngredient(text: string, orderNumber: number): ParsedIngredient {
  return {
    id: uuidv4(),
    name: text.substring(0, 100), // Use first 100 chars as name
    amount: 0,
    unit: '',
    displayAmount: undefined,
    notes: `Original text: ${text}`,
    category: undefined,
    parseSuccess: false,
    originalText: text,
  };
}
