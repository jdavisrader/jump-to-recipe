import { Unit } from '@/types/recipe';

// Conversion factors for common units
const CONVERSION_FACTORS = {
    // Weight conversions
    g_to_oz: 0.03527396,
    oz_to_g: 28.3495,
    kg_to_lb: 2.20462,
    lb_to_kg: 0.453592,

    // Volume conversions
    ml_to_floz: 0.033814,
    floz_to_ml: 29.5735,
    l_to_quart: 1.05669,
    quart_to_l: 0.946353,
    l_to_gallon: 0.264172,
    gallon_to_l: 3.78541,

    // Common cooking measurements
    tsp_to_ml: 4.92892,
    tbsp_to_ml: 14.7868,
    cup_to_ml: 236.588,
};

// Unit system categorization
const METRIC_UNITS = ['g', 'kg', 'ml', 'l'] as const;
const IMPERIAL_UNITS = ['oz', 'lb', 'fl oz', 'pint', 'quart', 'gallon'] as const;
const COMMON_UNITS = ['tsp', 'tbsp', 'cup', 'pinch', ''] as const;

/**
 * Determines if a unit is metric
 */
export function isMetricUnit(unit: Unit): boolean {
    return (METRIC_UNITS as readonly string[]).includes(unit);
}

/**
 * Determines if a unit is imperial
 */
export function isImperialUnit(unit: Unit): boolean {
    return (IMPERIAL_UNITS as readonly string[]).includes(unit);
}

/**
 * Determines if a unit is common to both systems
 */
export function isCommonUnit(unit: Unit): boolean {
    return (COMMON_UNITS as readonly string[]).includes(unit);
}

/**
 * Gets the system of a unit (metric, imperial, or common)
 */
export function getUnitSystem(unit: Unit): 'metric' | 'imperial' | 'common' {
    if (isMetricUnit(unit)) return 'metric';
    if (isImperialUnit(unit)) return 'imperial';
    return 'common';
}

/**
 * Converts a value from one unit to another
 * Returns null if conversion is not possible
 */
export function convertUnit(
    value: number,
    fromUnit: Unit,
    toUnit: Unit
): number | null {
    // Same unit, no conversion needed
    if (fromUnit === toUnit) return value;

    // Handle common units that don't need conversion
    if (isCommonUnit(fromUnit) && fromUnit === toUnit) return value;

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

    // Multi-step conversions
    if (fromUnit === 'g' && toUnit === 'lb') return convertUnit(convertUnit(value, 'g', 'oz')!, 'oz', 'lb')!;
    if (fromUnit === 'lb' && toUnit === 'g') return convertUnit(convertUnit(value, 'lb', 'kg')!, 'kg', 'g')!;
    if (fromUnit === 'ml' && toUnit === 'quart') return convertUnit(convertUnit(value, 'ml', 'fl oz')!, 'fl oz', 'quart')!;

    // Common cooking measurements to metric
    if (fromUnit === 'tsp' && toUnit === 'ml') return value * CONVERSION_FACTORS.tsp_to_ml;
    if (fromUnit === 'tbsp' && toUnit === 'ml') return value * CONVERSION_FACTORS.tbsp_to_ml;
    if (fromUnit === 'cup' && toUnit === 'ml') return value * CONVERSION_FACTORS.cup_to_ml;

    // If no conversion path is found
    return null;
}

/**
 * Formats a value with its unit for display
 */
export function formatMeasurement(value: number, unit: Unit): string {
    // Handle special cases
    if (unit === '' as Unit) return value.toString();
    if (unit === 'pinch') return `${value} pinch${value !== 1 ? 'es' : ''}`;

    // Format the number to avoid excessive decimal places
    const formattedValue = value % 1 === 0 ? value.toString() : value.toFixed(2);

    // Return formatted string
    return `${formattedValue} ${unit}${value !== 1 && unit !== ('' as Unit) ? 's' : ''}`;
}

/**
 * Suggests the best unit for a given value and current unit
 * (e.g., converts 1000g to 1kg)
 */
export function suggestBetterUnit(value: number, unit: Unit): { value: number; unit: Unit } | null {
    // Weight optimizations
    if (unit === 'g' && value >= 1000) return { value: value / 1000, unit: 'kg' };
    if (unit === 'kg' && value < 1) return { value: value * 1000, unit: 'g' };
    if (unit === 'oz' && value >= 16) return { value: value / 16, unit: 'lb' };
    if (unit === 'lb' && value < 0.1) return { value: value * 16, unit: 'oz' };

    // Volume optimizations
    if (unit === 'ml' && value >= 1000) return { value: value / 1000, unit: 'l' };
    if (unit === 'l' && value < 0.1) return { value: value * 1000, unit: 'ml' };
    if (unit === 'fl oz' && value >= 32) return { value: value / 32, unit: 'quart' };
    if (unit === 'quart' && value >= 4) return { value: value / 4, unit: 'gallon' };

    // No better unit found
    return null;
}