/**
 * Unit Normalization Utilities
 * Maps ingredients to canonical storage units and converts user inputs
 */

// Cache of ingredient → canonical unit (populated by LLM on first add)
const canonicalUnitCache: Record<string, string> = {};

/**
 * Get canonical unit for an ingredient
 * Returns from cache if available, otherwise returns default based on category
 */
export function getCanonicalUnit(ingredientName: string): string {
  const lowerName = ingredientName.toLowerCase();

  // If we've cached it before, return cached value
  if (canonicalUnitCache[lowerName]) {
    return canonicalUnitCache[lowerName];
  }

  // Default fallbacks based on ingredient category
  if (lowerName.includes('milk') || lowerName.includes('water') ||
      lowerName.includes('stock') || lowerName.includes('oil') ||
      lowerName.includes('juice') || lowerName.includes('tomatoes')) {
    return 'ml';
  }

  if (lowerName.includes('egg') || lowerName.includes('tomato') ||
      lowerName.includes('onion') || lowerName.includes('potato') ||
      lowerName.includes('lemon') || lowerName.includes('clove') ||
      lowerName.includes('pepper')) {
    return 'pieces';
  }

  // Default to grams for everything else (flour, rice, sugar, salt, cheese, bread, etc.)
  return 'g';
}

/**
 * Cache the LLM-determined canonical unit for an ingredient
 */
export function cacheCanonicalUnit(ingredientName: string, unit: string): void {
  canonicalUnitCache[ingredientName.toLowerCase()] = unit;
}

export interface ConversionResult {
  quantity: number;
  unit: string;
  confidence: 'exact' | 'approximate';
}

/**
 * Convert quantity from user unit to canonical unit
 * e.g., 1 cup flour → 125g flour
 */
export function convertToCanonical(
  userQuantity: number | string,
  userUnit: string | null,
  ingredientName: string
): ConversionResult {
  const canonicalUnit = getCanonicalUnit(ingredientName);
  const qty = typeof userQuantity === 'string' ? parseFloat(userQuantity) : userQuantity;

  // If no user unit specified, assume it's already in canonical units
  if (!userUnit) {
    return {
      quantity: qty,
      unit: canonicalUnit,
      confidence: 'approximate'
    };
  }

  const userUnitLower = userUnit.toLowerCase().trim();

  // ===== VOLUME CONVERSIONS (to ml) =====
  if (canonicalUnit === 'ml') {
    if (userUnitLower === 'ml' || userUnitLower === 'milliliter' || userUnitLower === 'millilitres') {
      return { quantity: qty, unit: 'ml', confidence: 'exact' };
    }
    if (userUnitLower === 'l' || userUnitLower === 'liter' || userUnitLower === 'litre') {
      return { quantity: qty * 1000, unit: 'ml', confidence: 'exact' };
    }
    if (userUnitLower === 'cup' || userUnitLower === 'cups') {
      return { quantity: qty * 240, unit: 'ml', confidence: 'exact' };
    }
    if (userUnitLower === 'tbsp' || userUnitLower === 'tablespoon' || userUnitLower === 'tablespoons') {
      return { quantity: qty * 15, unit: 'ml', confidence: 'exact' };
    }
    if (userUnitLower === 'tsp' || userUnitLower === 'teaspoon' || userUnitLower === 'teaspoons') {
      return { quantity: qty * 5, unit: 'ml', confidence: 'exact' };
    }
    if (userUnitLower === 'pint' || userUnitLower === 'pints') {
      return { quantity: qty * 568, unit: 'ml', confidence: 'exact' }; // UK pint
    }
    if (userUnitLower === 'fl oz' || userUnitLower === 'floz' || userUnitLower === 'fluid ounce') {
      return { quantity: qty * 30, unit: 'ml', confidence: 'exact' };
    }
  }

  // ===== WEIGHT CONVERSIONS (to g) =====
  if (canonicalUnit === 'g') {
    if (userUnitLower === 'g' || userUnitLower === 'gram' || userUnitLower === 'grams') {
      return { quantity: qty, unit: 'g', confidence: 'exact' };
    }
    if (userUnitLower === 'kg' || userUnitLower === 'kilogram' || userUnitLower === 'kilograms') {
      return { quantity: qty * 1000, unit: 'g', confidence: 'exact' };
    }
    if (userUnitLower === 'oz' || userUnitLower === 'ounce' || userUnitLower === 'ounces') {
      return { quantity: qty * 28.35, unit: 'g', confidence: 'exact' };
    }
    if (userUnitLower === 'lb' || userUnitLower === 'lbs' || userUnitLower === 'pound' || userUnitLower === 'pounds') {
      return { quantity: qty * 454, unit: 'g', confidence: 'exact' };
    }
    // Cup conversions vary by ingredient, but these are reasonable defaults
    if (userUnitLower === 'cup' || userUnitLower === 'cups') {
      // Default cup for grains/flour: ~125g
      return { quantity: qty * 125, unit: 'g', confidence: 'exact' };
    }
    if (userUnitLower === 'tbsp' || userUnitLower === 'tablespoon' || userUnitLower === 'tablespoons') {
      return { quantity: qty * 15, unit: 'g', confidence: 'exact' };
    }
    if (userUnitLower === 'tsp' || userUnitLower === 'teaspoon' || userUnitLower === 'teaspoons') {
      return { quantity: qty * 5, unit: 'g', confidence: 'exact' };
    }
  }

  // ===== COUNT CONVERSIONS (pieces) =====
  if (canonicalUnit === 'pieces') {
    if (userUnitLower === 'pieces' || userUnitLower === 'piece' ||
        userUnitLower === 'count' || userUnitLower === 'clove' || userUnitLower === 'cloves') {
      return { quantity: qty, unit: 'pieces', confidence: 'exact' };
    }
  }

  // If unit doesn't match canonical, return as-is but mark approximate
  return { quantity: qty, unit: canonicalUnit, confidence: 'approximate' };
}

/**
 * Apply confidence rules for deduction
 * exact - exact = exact
 * approximate - anything = approximate
 */
export function deductWithConfidence(
  inventoryConfidence: 'exact' | 'approximate',
  deductionConfidence: 'exact' | 'approximate'
): 'exact' | 'approximate' {
  if (inventoryConfidence === 'exact' && deductionConfidence === 'exact') {
    return 'exact';
  }
  return 'approximate';
}

/**
 * Check if two units are compatible (both volume, both weight, or both count)
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const unit1Lower = unit1.toLowerCase();
  const unit2Lower = unit2.toLowerCase();

  const volumeUnits = ['ml', 'l', 'cup', 'cups', 'tbsp', 'tsp', 'pint', 'fl oz'];
  const weightUnits = ['g', 'kg', 'oz', 'lb', 'lbs'];
  const countUnits = ['pieces', 'piece', 'count', 'clove', 'cloves'];

  const isVolume1 = volumeUnits.some(u => unit1Lower.includes(u));
  const isVolume2 = volumeUnits.some(u => unit2Lower.includes(u));
  if (isVolume1 && isVolume2) return true;

  const isWeight1 = weightUnits.some(u => unit1Lower.includes(u));
  const isWeight2 = weightUnits.some(u => unit2Lower.includes(u));
  if (isWeight1 && isWeight2) return true;

  const isCount1 = countUnits.some(u => unit1Lower.includes(u));
  const isCount2 = countUnits.some(u => unit2Lower.includes(u));
  if (isCount1 && isCount2) return true;

  return false;
}
