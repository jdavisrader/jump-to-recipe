import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isMetricUnit,
  isImperialUnit,
  isCommonUnit,
  getUnitSystem,
  convertUnit,
  formatMeasurement,
  suggestBetterUnit,
} from '../../lib/unit-conversion';
import { Unit } from '../../types/recipe';

describe('Unit Conversion Utilities', () => {
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

    it('should return false for non-imperial units', () => {
      assert.strictEqual(isImperialUnit('g'), false);
      assert.strictEqual(isImperialUnit('kg'), false);
      assert.strictEqual(isImperialUnit('cup'), false);
      assert.strictEqual(isImperialUnit('tsp'), false);
    });

    it('should identify common units correctly', () => {
      assert.strictEqual(isCommonUnit('tsp'), true);
      assert.strictEqual(isCommonUnit('tbsp'), true);
      assert.strictEqual(isCommonUnit('cup'), true);
      assert.strictEqual(isCommonUnit('pinch'), true);
      assert.strictEqual(isCommonUnit('' as Unit), true);
    });

    it('should return false for system-specific units', () => {
      assert.strictEqual(isCommonUnit('g'), false);
      assert.strictEqual(isCommonUnit('oz'), false);
      assert.strictEqual(isCommonUnit('ml'), false);
      assert.strictEqual(isCommonUnit('fl oz'), false);
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
      
      // Liters to gallons
      const lToGallon = convertUnit(1, 'l', 'gallon');
      assert.ok(lToGallon !== null && Math.abs(lToGallon - 0.264) < 0.01);
      
      // Gallons to liters
      const gallonToL = convertUnit(1, 'gallon', 'l');
      assert.ok(gallonToL !== null && Math.abs(gallonToL - 3.785) < 0.01);
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

    it('should handle multi-step conversions', () => {
      // Grams to pounds (g -> oz -> lb)
      const result = convertUnit(1000, 'g', 'lb');
      assert.ok(result !== null && Math.abs(result - 2.205) < 0.01);
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

  describe('Unit Optimization', () => {
    it('should suggest better weight units', () => {
      // Large grams to kilograms
      assert.deepStrictEqual(suggestBetterUnit(1000, 'g'), { value: 1, unit: 'kg' });
      assert.deepStrictEqual(suggestBetterUnit(2500, 'g'), { value: 2.5, unit: 'kg' });
      
      // Small kilograms to grams
      assert.deepStrictEqual(suggestBetterUnit(0.5, 'kg'), { value: 500, unit: 'g' });
      
      // Large ounces to pounds
      assert.deepStrictEqual(suggestBetterUnit(16, 'oz'), { value: 1, unit: 'lb' });
      assert.deepStrictEqual(suggestBetterUnit(32, 'oz'), { value: 2, unit: 'lb' });
      
      // Small pounds to ounces
      assert.deepStrictEqual(suggestBetterUnit(0.05, 'lb'), { value: 0.8, unit: 'oz' });
    });

    it('should suggest better volume units', () => {
      // Large milliliters to liters
      assert.deepStrictEqual(suggestBetterUnit(1000, 'ml'), { value: 1, unit: 'l' });
      assert.deepStrictEqual(suggestBetterUnit(1500, 'ml'), { value: 1.5, unit: 'l' });
      
      // Small liters to milliliters
      assert.deepStrictEqual(suggestBetterUnit(0.05, 'l'), { value: 50, unit: 'ml' });
      
      // Large fluid ounces to quarts
      assert.deepStrictEqual(suggestBetterUnit(32, 'fl oz'), { value: 1, unit: 'quart' });
      
      // Large quarts to gallons
      assert.deepStrictEqual(suggestBetterUnit(4, 'quart'), { value: 1, unit: 'gallon' });
    });

    it('should return null when no better unit is available', () => {
      assert.strictEqual(suggestBetterUnit(500, 'g'), null); // Not large enough for kg
      assert.strictEqual(suggestBetterUnit(2, 'kg'), null); // Not small enough for g
      assert.strictEqual(suggestBetterUnit(8, 'oz'), null); // Not large enough for lb
      assert.strictEqual(suggestBetterUnit(2, 'lb'), null); // Not small enough for oz
      assert.strictEqual(suggestBetterUnit(500, 'ml'), null); // Not large enough for l
      assert.strictEqual(suggestBetterUnit(2, 'l'), null); // Not small enough for ml
      assert.strictEqual(suggestBetterUnit(1, 'cup'), null); // No optimization for cups
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      assert.strictEqual(convertUnit(0, 'g', 'oz'), 0);
      assert.strictEqual(formatMeasurement(0, 'cup'), '0 cups');
      assert.strictEqual(suggestBetterUnit(0, 'g'), null);
    });

    it('should handle negative values', () => {
      const negativeConversion = convertUnit(-5, 'g', 'oz');
      assert.ok(negativeConversion !== null && Math.abs(negativeConversion - (-0.176)) < 0.01);
      assert.strictEqual(formatMeasurement(-1, 'cup'), '-1 cups');
    });

    it('should handle very small values', () => {
      assert.strictEqual(convertUnit(0.001, 'kg', 'g'), null); // This conversion isn't implemented
      assert.strictEqual(formatMeasurement(0.001, 'tsp'), '0.00 tsps');
    });

    it('should handle very large values', () => {
      assert.strictEqual(convertUnit(10000, 'g', 'kg'), null); // This conversion isn't implemented
      assert.deepStrictEqual(suggestBetterUnit(10000, 'g'), { value: 10, unit: 'kg' });
    });
  });
});