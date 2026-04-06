/**
 * TDD tests for inventory parsing API
 *
 * Tests the ability of the LLM to parse free-form inventory input
 * into structured items with quantities, units, canonical names, and confidence levels.
 */

import { parseInventoryInput } from '../netlify/functions/api/utils/prompts';

describe('Inventory Parsing', () => {
  /**
   * Test 1: Simple inventory parsing with quantities and canonical names
   * Input: "3 chicken breasts, 2 tomatoes, 1 bunch of basil"
   * Expected: 3 items with correct quantities, units, and canonical names
   */
  test('should parse simple inventory items with quantities and canonical names', async () => {
    const input = '3 chicken breasts, 2 tomatoes, 1 bunch of basil';

    const result = await parseInventoryInput(input);

    expect(result).toHaveLength(3);

    // Check chicken breasts
    expect(result[0].name).toMatch(/chicken/i);
    expect(result[0].canonical_name).toBe('chicken_breast');
    expect(result[0].quantity_approx).toBe(3);
    expect(result[0].unit).toBe('pieces'); // or 'count' or similar
    expect(result[0].confidence).toBe('exact');
    expect(result[0].has_item).toBe(false);

    // Check tomatoes
    expect(result[1].name).toMatch(/tomato/i);
    expect(result[1].canonical_name).toBe('tomato');
    expect(result[1].quantity_approx).toBe(2);
    expect(result[1].confidence).toBe('exact');

    // Check basil
    expect(result[2].name).toMatch(/basil/i);
    expect(result[2].canonical_name).toBe('basil');
    expect(result[2].quantity_approx).toBe(1);
    expect(result[2].unit).toMatch(/bunch/i);
    expect(result[2].has_item).toBe(true); // pantry staple
    expect(result[2].confidence).toBe('exact');
  });

  /**
   * Test 2: Approximate quantities with confidence tracking
   * Input: "some rice, a bunch of spinach, a little garlic"
   * Expected: Items parsed with approximate quantities and confidence='approximate'
   */
  test('should parse approximate quantities like "some" and "a bunch" with confidence', async () => {
    const input = 'some rice, a bunch of spinach, a little garlic';

    const result = await parseInventoryInput(input);

    expect(result).toHaveLength(3);

    // Check rice - "some" should be recognized as approximate
    expect(result[0].name).toMatch(/rice/i);
    expect(result[0].canonical_name).toBe('rice');
    expect(result[0].quantity_approx).toBeDefined();
    expect(result[0].confidence).toBe('approximate');

    // Check spinach - "a bunch" should extract unit properly
    expect(result[1].name).toMatch(/spinach/i);
    expect(result[1].canonical_name).toBe('spinach');
    expect(result[1].unit).toMatch(/bunch/i);
    expect(result[1].confidence).toBe('approximate');

    // Check garlic - "a little" should be recognized
    expect(result[2].name).toMatch(/garlic/i);
    expect(result[2].canonical_name).toBe('garlic');
    expect(result[2].has_item).toBe(true); // pantry staple
    expect(result[2].confidence).toBe('exact');
  });

  /**
   * Test 3: Unit extraction with canonical names and confidence
   * Input: "200g beef, 2 cups flour, 500ml milk, 3 tablespoons oil"
   * Expected: Quantities, units, canonical names, and confidence properly extracted
   */
  test('should extract units correctly with canonical names and confidence', async () => {
    const input = '200g beef, 2 cups flour, 500ml milk, 3 tablespoons oil';

    const result = await parseInventoryInput(input);

    expect(result).toHaveLength(4);

    // Check beef with grams - exact quantity
    expect(result[0].name).toMatch(/beef/i);
    expect(result[0].canonical_name).toBe('beef');
    expect(result[0].quantity_approx).toBe(200);
    expect(result[0].unit).toMatch(/g|gram/i);
    expect(result[0].confidence).toBe('exact');
    expect(result[0].has_item).toBe(false);

    // Check flour with cups - exact quantity
    expect(result[1].name).toMatch(/flour/i);
    expect(result[1].quantity_approx).toBe(2);
    expect(result[1].unit).toMatch(/cup/i);
    expect(result[1].confidence).toBe('exact');

    // Check milk with ml - exact quantity
    expect(result[2].name).toMatch(/milk/i);
    expect(result[2].canonical_name).toBe('milk');
    expect(result[2].quantity_approx).toBe(500);
    expect(result[2].unit).toMatch(/ml|milliliter/i);
    expect(result[2].confidence).toBe('exact');

    // Check oil with tablespoons - pantry staple
    expect(result[3].name).toMatch(/oil/i);
    expect(result[3].canonical_name).toBe('oil');
    expect(result[3].quantity_approx).toBe(3);
    expect(result[3].unit).toMatch(/tablespoon|tbsp/i);
    expect(result[3].has_item).toBe(true); // pantry staple
    expect(result[3].confidence).toBe('exact');
  });
});
