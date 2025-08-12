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

describe('Unit Conversion Utilities (Relative Imports)', () => {
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
    });

    it('should return null for impossible conversions', () => {
      assert.strictEqual(convertUnit(1, 'g', 'tsp'), null); // Weight to volume
      assert.strictEqual(convertUnit(1, 'ml', 'oz'), null); // Volume to weight
    });
  });

  describe('Measurement Formatting', () => {
    it('should format whole numbers without decimals', () => {
      assert.strictEqual(formatMeasurement(1, 'cup'), '1 cup');
      assert.strictEqual(formatMeasurement(2, 'tsp'), '2 tsps');
    });

    it('should handle singular vs plural correctly', () => {
      assert.strictEqual(formatMeasurement(1, 'cup'), '1 cup');
      assert.strictEqual(formatMeasurement(2, 'cup'), '2 cups');
    });
  });
});