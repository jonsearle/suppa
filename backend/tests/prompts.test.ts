import { parseInventoryInput, generateRecipeDetail } from '../netlify/functions/api/utils/prompts';
import { getCanonicalUnit } from '../netlify/functions/api/utils/units';

describe('parseInventoryInput - Canonical Unit Caching', () => {
  beforeEach(() => {
    // Clear cache before each test
    jest.clearAllMocks();
  });

  test('should cache canonical unit when parsing inventory', async () => {
    const input = '500g rice';
    await parseInventoryInput(input);

    // After parsing, canonical unit for rice should be cached
    const cachedUnit = getCanonicalUnit('rice');
    expect(cachedUnit).toBe('g');
  });

  test('should cache unit for different ingredient types', async () => {
    await parseInventoryInput('240ml milk');
    expect(getCanonicalUnit('milk')).toBe('ml');

    await parseInventoryInput('3 eggs');
    expect(getCanonicalUnit('eggs')).toBe('pieces');
  });
});

describe('generateRecipeDetail - Unit Validation', () => {
  test('should require all recipe ingredients to have units', async () => {
    const mockInventory = [
      { id: '1', name: 'rice', quantity_approx: 500, unit: 'g', confidence: 'exact' as const, user_id: 'test', date_added: new Date().toISOString() },
      { id: '2', name: 'eggs', quantity_approx: 3, unit: 'pieces', confidence: 'exact' as const, user_id: 'test', date_added: new Date().toISOString() }
    ];

    // This should throw if any ingredient lacks a unit
    const recipe = await generateRecipeDetail(
      'Egg Fried Rice',
      'Simple rice with eggs',
      mockInventory
    );

    // Verify all ingredients have units
    recipe.ingredients.forEach((ing: any) => {
      expect(ing.unit).toBeDefined();
      expect(ing.unit).not.toBeNull();
      expect(ing.unit).not.toBe('');
    });
  });
});
