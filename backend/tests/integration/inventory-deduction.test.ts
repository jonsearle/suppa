import { parseInventoryInput } from '../../netlify/functions/api/utils/prompts';
import { getCanonicalUnit } from '../../netlify/functions/api/utils/units';
import { generateRecipeDetail } from '../../netlify/functions/api/utils/prompts';
import { parseRecipeAdjustments } from '../../netlify/functions/api/utils/prompts';

describe('Full Inventory Deduction Flow', () => {
  test('should cache canonical unit and use it for recipe deduction', async () => {
    // Step 1: User adds "500g rice"
    const parsedInventory = await parseInventoryInput('500 grams of rice');
    expect(parsedInventory[0].quantity_approx).toBe(500);
    expect(parsedInventory[0].unit).toBe('g');

    // Step 2: Canonical unit should be cached
    const cachedUnit = getCanonicalUnit('rice');
    expect(cachedUnit).toBe('g');

    // Step 3: Generate recipe with 1 cup rice
    const mockInventory = [
      {
        id: '1',
        user_id: 'test-user-1',
        name: 'rice',
        quantity_approx: 500,
        unit: 'g',
        confidence: 'exact' as const,
        date_added: '2026-04-11'
      }
    ];

    const recipe = await generateRecipeDetail(
      'Fried Rice',
      'Simple rice with oil',
      mockInventory
    );

    // Recipe should have converted 1 cup to 125g using cached unit
    const riceIngredient = recipe.ingredients.find(i => i.name === 'rice');
    expect(riceIngredient).toBeDefined();
    expect(riceIngredient?.unit).toBe('g');
    expect(riceIngredient?.quantity).toBeGreaterThan(0);
  });

  test('should handle quantity adjustments correctly', async () => {
    const recipeContext = {
      ingredients: [
        { name: 'rice', quantity: 500, unit: 'g' },
        { name: 'milk', quantity: 240, unit: 'ml' }
      ]
    };

    // User says they only have 300g rice
    const adjustments = await parseRecipeAdjustments(
      'I only have 300g rice',
      recipeContext
    );

    expect(adjustments.length).toBeGreaterThan(0);
    expect(adjustments[0].type).toBe('quantity');
    expect(adjustments[0].ingredient).toBe('rice');
    expect(adjustments[0].quantity).toBe(300);
  });
});
