/**
 * TDD tests for inventory parsing API
 *
 * Tests the ability of the LLM to parse free-form inventory input
 * into structured items with quantities, units, and names.
 */

import { parseInventoryInput } from '../netlify/functions/api/utils/prompts';

describe('Inventory Parsing', () => {
  /**
   * Test 1: Simple inventory parsing with quantities
   * Input: "3 chicken breasts, 2 tomatoes, 1 bunch of basil"
   * Expected: 3 items with correct quantities extracted
   */
  test('should parse simple inventory items with quantities', async () => {
    const input = '3 chicken breasts, 2 tomatoes, 1 bunch of basil';

    const result = await parseInventoryInput(input);

    expect(result).toHaveLength(3);

    // Check chicken breasts
    expect(result[0].name).toMatch(/chicken/i);
    expect(result[0].quantity_approx).toBe(3);
    expect(result[0].unit).toBe('pieces'); // or 'count' or similar

    // Check tomatoes
    expect(result[1].name).toMatch(/tomato/i);
    expect(result[1].quantity_approx).toBe(2);

    // Check basil
    expect(result[2].name).toMatch(/basil/i);
    expect(result[2].quantity_approx).toBe(1);
    expect(result[2].unit).toMatch(/bunch/i);
  });

  /**
   * Test 2: Approximate quantities
   * Input: "some rice, a bunch of spinach, a little garlic"
   * Expected: Items parsed with approximate quantities recognized
   */
  test('should parse approximate quantities like "some" and "a bunch"', async () => {
    const input = 'some rice, a bunch of spinach, a little garlic';

    const result = await parseInventoryInput(input);

    expect(result).toHaveLength(3);

    // Check rice - "some" should be recognized
    expect(result[0].name).toMatch(/rice/i);
    // "some" is an approximate quantity - should be captured somehow
    expect(result[0].quantity_approx).toBeDefined();

    // Check spinach - "a bunch" should extract unit properly
    expect(result[1].name).toMatch(/spinach/i);
    expect(result[1].unit).toMatch(/bunch/i);

    // Check garlic - "a little" should be recognized
    expect(result[2].name).toMatch(/garlic/i);
  });

  /**
   * Test 3: Unit extraction
   * Input: "200g beef, 2 cups flour, 500ml milk, 3 tablespoons oil"
   * Expected: Quantities and units properly extracted
   */
  test('should extract units correctly (grams, cups, ml, tablespoons)', async () => {
    const input = '200g beef, 2 cups flour, 500ml milk, 3 tablespoons oil';

    const result = await parseInventoryInput(input);

    expect(result).toHaveLength(4);

    // Check beef with grams
    expect(result[0].name).toMatch(/beef/i);
    expect(result[0].quantity_approx).toBe(200);
    expect(result[0].unit).toMatch(/g|gram/i);

    // Check flour with cups
    expect(result[1].name).toMatch(/flour/i);
    expect(result[1].quantity_approx).toBe(2);
    expect(result[1].unit).toMatch(/cup/i);

    // Check milk with ml
    expect(result[2].name).toMatch(/milk/i);
    expect(result[2].quantity_approx).toBe(500);
    expect(result[2].unit).toMatch(/ml|milliliter/i);

    // Check oil with tablespoons
    expect(result[3].name).toMatch(/oil/i);
    expect(result[3].quantity_approx).toBe(3);
    expect(result[3].unit).toMatch(/tablespoon|tbsp/i);
  });
});
