/**
 * Utility functions for handling fractions in recipe ingredients
 */

// Convert text fractions to unicode for better display
export function formatFractionForDisplay(input: string): string {
  const fractionMap: { [key: string]: string } = {
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
  
  // Handle mixed numbers (e.g., "1 1/2" -> "1½")
  const mixedMatch = input.match(/^(\d+)\s+(\d+\/\d+)$/);
  if (mixedMatch) {
    const whole = mixedMatch[1];
    const fraction = mixedMatch[2];
    const unicodeFraction = fractionMap[fraction] || fraction;
    return whole + unicodeFraction;
  }
  
  // Handle simple fractions
  return fractionMap[input] || input;
}

// Convert fractions to decimal for calculations
export function fractionToDecimal(input: string): number {
  const fractionMap: { [key: string]: number } = {
    '½': 0.5, '¼': 0.25, '¾': 0.75,
    '⅓': 0.333, '⅔': 0.667,
    '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
    '1/2': 0.5, '1/4': 0.25, '3/4': 0.75,
    '1/3': 0.333, '2/3': 0.667,
    '1/8': 0.125, '3/8': 0.375, '5/8': 0.625, '7/8': 0.875,
  };
  
  // Handle mixed numbers (e.g., "1½" or "1 1/2")
  const mixedMatch = input.match(/^(\d+)[½¼¾⅓⅔⅛⅜⅝⅞]$/) ||
                     input.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    if (mixedMatch[2] && mixedMatch[3]) {
      // Generic "W N/D" — compute the fractional part directly so
      // uncommon denominators (e.g. "1 2/5") aren't silently dropped.
      const numerator = parseInt(mixedMatch[2]);
      const denominator = parseInt(mixedMatch[3]);
      return whole + numerator / denominator;
    }
    const fractionPart = input.slice(mixedMatch[1].length);
    const fractionValue = fractionMap[fractionPart] || 0;
    return whole + fractionValue;
  }
  
  // Handle simple fractions
  if (fractionMap[input]) {
    return fractionMap[input];
  }
  
  // Handle text fractions like "3/4"
  const fractionMatch = input.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1]);
    const denominator = parseInt(fractionMatch[2]);
    return numerator / denominator;
  }
  
  // Handle decimal numbers
  const decimal = parseFloat(input);
  return isNaN(decimal) ? 0 : decimal;
}

// Convert decimal back to fraction for display
export function decimalToFraction(decimal: number): string {
  const decimalToFraction: { [key: number]: string } = {
    0.5: '½',
    0.25: '¼',
    0.75: '¾',
    0.333: '⅓',
    0.667: '⅔',
    0.125: '⅛',
    0.375: '⅜',
    0.625: '⅝',
    0.875: '⅞',
  };
  
  // Check for close matches (within 0.01)
  for (const [dec, frac] of Object.entries(decimalToFraction)) {
    if (Math.abs(decimal - parseFloat(dec)) < 0.01) {
      return frac;
    }
  }
  
  // For mixed numbers with decimals (e.g., 1.5 -> 1½)
  const wholePart = Math.floor(decimal);
  const fractionalPart = decimal - wholePart;
  
  if (wholePart > 0 && fractionalPart > 0) {
    const fractionDisplay = decimalToFraction[Math.round(fractionalPart * 1000) / 1000];
    if (fractionDisplay) {
      return wholePart + fractionDisplay;
    }
  }
  
  // Return decimal as string if no fraction match
  return decimal.toString();
}

// Parse free-text quantity input (e.g. "1 3/4", "1/2", "2", "1.5") entered by
// a user into a canonical decimal amount plus a display string. Returns null
// for input that can't be parsed as a non-negative quantity.
export function parseQuantityInput(input: string): { amount: number; displayAmount: string } | null {
  const trimmed = input.trim();

  if (trimmed === '') {
    return { amount: 0, displayAmount: '' };
  }

  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  const simpleMatch = trimmed.match(/^(\d+)\/(\d+)$/);

  if (mixedMatch || simpleMatch) {
    const whole = mixedMatch ? parseInt(mixedMatch[1], 10) : 0;
    const numerator = parseInt((mixedMatch ? mixedMatch[2] : simpleMatch![1]), 10);
    const denominator = parseInt((mixedMatch ? mixedMatch[3] : simpleMatch![2]), 10);

    if (denominator === 0) {
      return null;
    }

    // Format only the fractional part so uncommon denominators (not in the
    // unicode map) stay as "1 2/5" instead of concatenating into "12/5".
    const fractionText = `${numerator}/${denominator}`;
    const formattedFraction = formatFractionForDisplay(fractionText);
    const isUnicodeGlyph = formattedFraction !== fractionText;
    const displayAmount = whole === 0
      ? formattedFraction
      : isUnicodeGlyph
        ? `${whole}${formattedFraction}`
        : `${whole} ${formattedFraction}`;

    return { amount: whole + numerator / denominator, displayAmount };
  }

  const plainNumberPattern = /^(\d+(\.\d+)?|\.\d+)$/;
  if (!plainNumberPattern.test(trimmed)) {
    return null;
  }

  const amount = parseFloat(trimmed);
  return isNaN(amount) ? null : { amount, displayAmount: trimmed };
}