/**
 * Canonical food name mappings for deduplication
 * Maps variations (plural, misspellings, aliases) to canonical form
 * Used by addInventoryItem() to merge duplicate items
 */

export const CANONICAL_FOODS: Record<string, string> = {
  // Potatoes
  'potato': 'potato',
  'potatoes': 'potato',
  'spuds': 'potato',

  // Tomatoes
  'tomato': 'tomato',
  'tomatoes': 'tomato',
  'cherry tomato': 'cherry_tomato',
  'cherry tomatoes': 'cherry_tomato',
  'sun-dried tomato': 'sun_dried_tomato',

  // Beans
  'bean': 'bean',
  'beans': 'bean',
  'green bean': 'green_bean',
  'green beans': 'green_bean',
  'baked bean': 'baked_bean',
  'baked beans': 'baked_bean',
  'chickpea': 'chickpea',
  'chickpeas': 'chickpea',

  // Vegetables
  'carrot': 'carrot',
  'carrots': 'carrot',
  'onion': 'onion',
  'onions': 'onion',
  'garlic': 'garlic',
  'broccoli': 'broccoli',
  'spinach': 'spinach',
  'lettuce': 'salad_leaves',
  'salad': 'salad_leaves',
  'salad leaves': 'salad_leaves',
  'mixed salad': 'salad_leaves',

  // Proteins
  'chicken': 'chicken',
  'chicken breast': 'chicken_breast',
  'chicken breasts': 'chicken_breast',
  'chicken thigh': 'chicken_thigh',
  'chicken thighs': 'chicken_thigh',
  'beef': 'beef',
  'egg': 'egg',
  'eggs': 'egg',

  // Grains
  'rice': 'rice',
  'white rice': 'rice',
  'brown rice': 'brown_rice',
  'pasta': 'pasta',
  'noodle': 'noodle',
  'noodles': 'noodle',
  'bread': 'bread',

  // Oils & Fats
  'oil': 'oil',
  'olive oil': 'olive_oil',
  'vegetable oil': 'vegetable_oil',
  'butter': 'butter',

  // Herbs & Spices (typically has_item=true)
  'salt': 'salt',
  'pepper': 'pepper',
  'basil': 'basil',
  'oregano': 'oregano',
  'cumin': 'cumin',
  'cinnamon': 'cinnamon',
  'thyme': 'thyme',

  // Dairy
  'milk': 'milk',
  'cheese': 'cheese',
  'yogurt': 'yogurt',
};

/**
 * Get canonical name for an ingredient
 * If not in mapping, returns lowercased original name
 */
export function getCanonicalName(itemName: string): string {
  const lowercased = itemName.toLowerCase().trim();
  return CANONICAL_FOODS[lowercased] || lowercased;
}
