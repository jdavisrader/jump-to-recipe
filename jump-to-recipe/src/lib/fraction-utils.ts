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
                     input.match(/^(\d+)\s+(\d+\/\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const fractionPart = mixedMatch[2] || input.slice(mixedMatch[1].length);
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