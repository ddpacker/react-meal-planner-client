import type { UnitSystem } from '../types/user';

const GRAMS_PER_OUNCE = 28.3495;
const GRAMS_PER_POUND = 453.592;
const ML_PER_FL_OZ = 29.5735;
const ML_PER_CUP = 236.588;
const ML_PER_LITRE = 1000;

function roundDisplay(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function convertMetricToImperial(value: number, unit: string): string | null {
  const normalized = unit.trim().toLowerCase();

  switch (normalized) {
    case 'g':
    case 'gram':
    case 'grams':
      if (value >= GRAMS_PER_POUND) {
        return `${roundDisplay(value / GRAMS_PER_POUND)} lb`;
      }
      return `${roundDisplay(value / GRAMS_PER_OUNCE)} oz`;
    case 'kg':
    case 'kilogram':
    case 'kilograms':
      return `${roundDisplay(value * (1000 / GRAMS_PER_POUND))} lb`;
    case 'ml':
    case 'millilitre':
    case 'millilitres':
    case 'milliliter':
    case 'milliliters':
      if (value >= ML_PER_CUP) {
        return `${roundDisplay(value / ML_PER_CUP)} cup`;
      }
      return `${roundDisplay(value / ML_PER_FL_OZ)} fl oz`;
    case 'l':
    case 'litre':
    case 'litres':
    case 'liter':
    case 'liters':
      return `${roundDisplay((value * ML_PER_LITRE) / ML_PER_CUP)} cup`;
    default:
      return null;
  }
}

function displayUnit(unit: string): string {
  switch (unit.trim().toLowerCase()) {
    case 'gram':
    case 'grams':
      return 'g';
    case 'kilogram':
    case 'kilograms':
      return 'kg';
    case 'millilitre':
    case 'millilitres':
    case 'milliliter':
    case 'milliliters':
      return 'ml';
    case 'litre':
    case 'litres':
    case 'liter':
    case 'liters':
      return 'l';
    default:
      return unit;
  }
}

/**
 * Format a metric quantity for display. Imperial conversion is display-only —
 * never persist or submit the converted value.
 */
export function formatQuantity(
  value: number,
  unit: string,
  unitSystem: UnitSystem,
): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  if (unitSystem === 'imperial') {
    const converted = convertMetricToImperial(value, unit);
    if (converted) {
      return converted;
    }
  }
  return `${roundDisplay(value)} ${displayUnit(unit)}`;
}

type QuantityUnit = {
  quantity: number;
  unit: string;
};

/** Map form/abbreviated units to the API's canonical metric names. */
export function toApiUnit(unit: string): string {
  switch (unit.trim().toLowerCase()) {
    case 'g':
      return 'gram';
    case 'kg':
      return 'kilogram';
    case 'ml':
      return 'millilitre';
    case 'l':
      return 'litre';
    default:
      return unit;
  }
}

/** Map API unit names onto the metric form select values. */
export function toFormUnit(unit: string): string {
  return displayUnit(unit);
}

/**
 * Convert a user-entered quantity from their preferred unit system to metric
 * for API submission.
 */
export function toMetricQuantity(
  value: number,
  unit: string,
  unitSystem: UnitSystem,
): QuantityUnit {
  if (unitSystem === 'metric') {
    return { quantity: value, unit: toApiUnit(unit) };
  }

  const normalized = unit.trim().toLowerCase();

  switch (normalized) {
    case 'oz':
    case 'ounce':
    case 'ounces':
      return { quantity: value * GRAMS_PER_OUNCE, unit: 'gram' };
    case 'lb':
    case 'lbs':
    case 'pound':
    case 'pounds':
      return { quantity: value * GRAMS_PER_POUND, unit: 'gram' };
    case 'fl oz':
    case 'floz':
    case 'fluid ounce':
    case 'fluid ounces':
      return { quantity: value * ML_PER_FL_OZ, unit: 'millilitre' };
    case 'cup':
    case 'cups':
      return { quantity: value * ML_PER_CUP, unit: 'millilitre' };
    case 'g':
    case 'gram':
    case 'grams':
    case 'kg':
    case 'kilogram':
    case 'kilograms':
    case 'ml':
    case 'millilitre':
    case 'millilitres':
    case 'l':
    case 'litre':
    case 'litres':
      return { quantity: value, unit: toApiUnit(normalized) };
    default:
      return { quantity: value, unit };
  }
}

/**
 * Convert a metric API quantity into the user's preferred unit for form defaults.
 */
export function fromMetricQuantity(
  value: number,
  unit: string,
  unitSystem: UnitSystem,
): QuantityUnit {
  if (unitSystem === 'metric') {
    return { quantity: value, unit: toFormUnit(unit) };
  }

  const normalized = unit.trim().toLowerCase();

  switch (normalized) {
    case 'g':
    case 'gram':
    case 'grams':
      if (value >= GRAMS_PER_POUND) {
        return { quantity: value / GRAMS_PER_POUND, unit: 'lb' };
      }
      return { quantity: value / GRAMS_PER_OUNCE, unit: 'oz' };
    case 'kg':
    case 'kilogram':
    case 'kilograms':
      return { quantity: value * (1000 / GRAMS_PER_POUND), unit: 'lb' };
    case 'ml':
    case 'millilitre':
    case 'millilitres':
    case 'milliliter':
    case 'milliliters':
      if (value >= ML_PER_CUP) {
        return { quantity: value / ML_PER_CUP, unit: 'cup' };
      }
      return { quantity: value / ML_PER_FL_OZ, unit: 'fl oz' };
    case 'l':
    case 'litre':
    case 'litres':
    case 'liter':
    case 'liters':
      return { quantity: (value * ML_PER_LITRE) / ML_PER_CUP, unit: 'cup' };
    default:
      return { quantity: value, unit };
  }
}

export const METRIC_UNITS = ['g', 'kg', 'ml', 'l', 'piece', 'clove', 'pinch'] as const;
export const IMPERIAL_UNITS = ['oz', 'lb', 'fl oz', 'cup', 'piece', 'clove', 'pinch'] as const;

export const INGREDIENT_CATEGORIES = [
  'produce',
  'dairy',
  'meat',
  'seafood',
  'pantry',
  'spices',
  'bakery',
  'other',
] as const;
