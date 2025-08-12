import { describe, it } from 'node:test';
import assert from 'node:assert';

// Inline unit types for testing
type Unit = 'g' | 'kg' | 'ml' | 'l' | 'oz' | 'lb' | 'fl oz' | 'pint' | 'quart' | 'gallon' | 'tsp' | 'tbsp' | 'cup' | 'pinch' | '';

// Inline conversion factors
const CONVERSION_FACTORS = {
    g_to_oz: 0.03527396,
    oz_to_g: 28.3495,
    kg_to_lb: 2.20462,
    lb_to_kg: 0.453592,
    ml_to_floz: 0.033814,
    floz_to_ml: 29.5735,
    l_to_quart: 1.05669,
    quart_to_l: 0.946353,
    l_to_gallon: 0.264172,
    gallon_to_l: 3.78541,
    tsp_to_ml: 4.92892,
    tbsp_to_ml: 14.7868,
    cup_to_ml: 236.588,
};

// Inline unit categorization
const METRIC_UNITS = ['g', 'kg', 'ml', 'l'] as const;
const IMPERIAL_UNITS = ['oz', 'lb', 'fl oz', 'pint', 'quart', 'gallon'] as const;
const COMMON_UNITS = ['tsp', 'tbsp', 'cup', 'pinch', ''] as const;

// Inline functions to test
function isMetricUnit(unit: Unit): boolean {
    return (METRIC_UNITS as readonly string[]).includes(unit);
}

function isImperialUnit(unit: Unit): boolean {
    return (IMPERIAL_UNITS as readonly string[]).includes(unit);
}

function isCommonUnit(unit: Unit): boolean {
    return (COMMON_UNITS as readonly string[]).includes(unit);
}

function getUnitSystem(unit: Unit): 'metric' | 'imperial' | 'common' {
    if (isMetricUnit(unit)) return 'metric';
    if (isImperialUnit(unit)) return 'imperial';
    return 'common';
}

function convertUnit(value: number, fromUnit: Unit, toUnit: Unit): number | null {
    if (fromUnit === toUnit) return value;
    
    // Weight conversions
    if (fromUnit === 'g' && toUnit === 'oz') return value * CONVERSION_FACTORS.g_to_oz;
    if (fromUnit === 'oz' && toUnit === 'g') return value * CONVERSION_FACTORS.oz_to_g;
    if (fromUnit === 'kg' && toUnit === 'lb') return value * CONVERSION_FACTORS.kg_to_lb;
    if (fromUnit === 'lb' && toUnit === 'kg') return value * CONVERSION_FACTORS.lb_to_kg;

    // Volume conversions
    if (fromUnit === 'ml' && toUnit === 'fl oz') return value * CONVERSION_FACTORS.ml_to_floz;
    if (fromUnit === 'fl oz' && toUnit === 'ml') return value * CONVERSION_FACTORS.floz_to_ml;
    if (fromUnit === 'l' && toUnit === 'quart') return value * CONVERSION_FACTORS.l_to_quart;
    if (fromUnit === 'quart' && toUnit === 'l') return value * CONVERSION_FACTORS.quart_to_l;
    if (fromUnit === 'l' && toUnit === 'gallon') return value * CONVERSION_FACTORS.l_to_gallon;
    if (fromUnit === 'gallon' && toUnit === 'l') return value * CONVERSION_FACTORS.gallon_to_l;

    // Common cooking measurements to metric
    if (fromUnit === 'tsp' && toUnit === 'ml') return value * CONVERSION_FACTORS.tsp_to_ml;
    if (fromUnit === 'tbsp' && toUnit === 'ml') return value * CONVERSION_FACTORS.tbsp_to_ml;
    if (fromUnit === 'cup' && toUnit === 'ml') return value * CONVERSION_FACTORS.cup_to_ml;

    return null;
}

function formatMeasurement(value: number, unit: Unit): string {
    if (unit === '' as Unit) return value.toString();
    if (unit === 'pinch') return `${value} pinch${value !== 1 ? 'es' : ''}`;

    const formattedValue = value % 1 === 0 ? value.toString() : value.toFixed(2);
    return `${formattedValue} ${unit}${value !== 1 && unit !== ('' as Unit) ? 's' : ''}`;
}

describe('Unit Conversion Utilities (Standalone)', () => {
  describe('Unit System Detection', () => {
    it('should identify metric units correctly', () => {
      assert.strictEqual(isMetricUnit('g'), true);
      assert.strictEqual(isMetricUnit('kg'), true);
      assert.strictEqual(isMetricUnit('ml'), true);
      assert.strictEqual(isMetricUnit('l'), true);
    });

    it('should return false for non-metric units', () => {
      assert.strictEqual(isMetricUnit('oz'), false);
      assert.strictEqual(isMetricUnit('lb'), false);
      assert.strictEqual(isMetricUnit('cup'), false);
      assert.strictEqual(isMetricUnit('tsp'), false);
    });

    it('should identify imperial units correctly', () => {
      assert.strictEqual(isImperialUnit('oz'), true);
      assert.strictEqual(isImperialUnit('lb'), true);
      assert.strictEqual(isImperialUnit('fl oz'), true);
      assert.strictEqual(isImperialUnit('pint'), true);
      assert.strictEqual(isImperialUnit('quart'), true);
      assert.strictEqual(isImperialUnit('gallon'), true);
    });

    it('should identify common units correctly', () => {
      assert.strictEqual(isCommonUnit('tsp'), true);
      assert.strictEqual(isCommonUnit('tbsp'), true);
      assert.strictEqual(isCommonUnit('cup'), true);
      assert.strictEqual(isCommonUnit('pinch'), true);
      assert.strictEqual(isCommonUnit('' as Unit), true);
    });

    it('should return correct system for each unit type', () => {
      assert.strictEqual(getUnitSystem('g'), 'metric');
      assert.strictEqual(getUnitSystem('kg'), 'metric');
      assert.strictEqual(getUnitSystem('oz'), 'imperial');
      assert.strictEqual(getUnitSystem('lb'), 'imperial');
      assert.strictEqual(getUnitSystem('cup'), 'common');
      assert.strictEqual(getUnitSystem('tsp'), 'common');
    });
  });

  describe('Unit Conversion', () => {
    it('should return same value for identical units', () => {
      assert.strictEqual(convertUnit(5, 'g', 'g'), 5);
      assert.strictEqual(convertUnit(2.5, 'cup', 'cup'), 2.5);
    });

    it('should convert weight units correctly', () => {
      // Grams to ounces
      const gToOz = convertUnit(100, 'g', 'oz');
      assert.ok(gToOz !== null && Math.abs(gToOz - 3.527) < 0.01);
      
      // Ounces to grams
      const ozToG = convertUnit(1, 'oz', 'g');
      assert.ok(ozToG !== null && Math.abs(ozToG - 28.35) < 0.01);
      
      // Kilograms to pounds
      const kgToLb = convertUnit(1, 'kg', 'lb');
      assert.ok(kgToLb !== null && Math.abs(kgToLb - 2.205) < 0.01);
      
      // Pounds to kilograms
      const lbToKg = convertUnit(1, 'lb', 'kg');
      assert.ok(lbToKg !== null && Math.abs(lbToKg - 0.454) < 0.01);
    });

    it('should convert volume units correctly', () => {
      // Milliliters to fluid ounces
      const mlToFlOz = convertUnit(100, 'ml', 'fl oz');
      assert.ok(mlToFlOz !== null && Math.abs(mlToFlOz - 3.381) < 0.01);
      
      // Fluid ounces to milliliters
      const flOzToMl = convertUnit(1, 'fl oz', 'ml');
      assert.ok(flOzToMl !== null && Math.abs(flOzToMl - 29.57) < 0.01);
      
      // Liters to quarts
      const lToQuart = convertUnit(1, 'l', 'quart');
      assert.ok(lToQuart !== null && Math.abs(lToQuart - 1.057) < 0.01);
      
      // Quarts to liters
      const quartToL = convertUnit(1, 'quart', 'l');
      assert.ok(quartToL !== null && Math.abs(quartToL - 0.946) < 0.01);
    });

    it('should convert cooking measurements to metric', () => {
      // Teaspoons to milliliters
      const tspToMl = convertUnit(1, 'tsp', 'ml');
      assert.ok(tspToMl !== null && Math.abs(tspToMl - 4.929) < 0.01);
      
      // Tablespoons to milliliters
      const tbspToMl = convertUnit(1, 'tbsp', 'ml');
      assert.ok(tbspToMl !== null && Math.abs(tbspToMl - 14.787) < 0.01);
      
      // Cups to milliliters
      const cupToMl = convertUnit(1, 'cup', 'ml');
      assert.ok(cupToMl !== null && Math.abs(cupToMl - 236.588) < 0.01);
    });

    it('should return null for impossible conversions', () => {
      assert.strictEqual(convertUnit(1, 'g', 'tsp'), null); // Weight to volume
      assert.strictEqual(convertUnit(1, 'ml', 'oz'), null); // Volume to weight
      assert.strictEqual(convertUnit(1, 'cup', 'lb'), null); // Volume to weight
    });
  });

  describe('Measurement Formatting', () => {
    it('should format whole numbers without decimals', () => {
      assert.strictEqual(formatMeasurement(1, 'cup'), '1 cup');
      assert.strictEqual(formatMeasurement(2, 'tsp'), '2 tsps');
      assert.strictEqual(formatMeasurement(5, 'g'), '5 gs');
    });

    it('should format decimal numbers with appropriate precision', () => {
      assert.strictEqual(formatMeasurement(1.5, 'cup'), '1.50 cups');
      assert.strictEqual(formatMeasurement(0.25, 'tsp'), '0.25 tsps');
      assert.strictEqual(formatMeasurement(2.33333, 'ml'), '2.33 mls');
    });

    it('should handle singular vs plural correctly', () => {
      assert.strictEqual(formatMeasurement(1, 'cup'), '1 cup');
      assert.strictEqual(formatMeasurement(2, 'cup'), '2 cups');
      assert.strictEqual(formatMeasurement(0.5, 'tsp'), '0.50 tsps');
    });

    it('should handle special cases', () => {
      assert.strictEqual(formatMeasurement(1, '' as Unit), '1');
      assert.strictEqual(formatMeasurement(2, '' as Unit), '2');
      assert.strictEqual(formatMeasurement(1, 'pinch'), '1 pinch');
      assert.strictEqual(formatMeasurement(2, 'pinch'), '2 pinches');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      assert.strictEqual(convertUnit(0, 'g', 'oz'), 0);
      assert.strictEqual(formatMeasurement(0, 'cup'), '0 cups');
    });

    it('should handle negative values', () => {
      const negativeConversion = convertUnit(-5, 'g', 'oz');
      assert.ok(negativeConversion !== null && Math.abs(negativeConversion - (-0.176)) < 0.01);
      assert.strictEqual(formatMeasurement(-1, 'cup'), '-1 cups');
    });

    it('should handle very small values', () => {
      assert.strictEqual(convertUnit(0.001, 'kg', 'g'), null); // This conversion isn't implemented in our simple version
      assert.strictEqual(formatMeasurement(0.001, 'tsp'), '0.00 tsps');
    });
  });
});