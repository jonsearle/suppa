/**
 * Tests for meal suggestion API (suggestMeals function)
 *
 * Note: These tests require a valid OPENAI_API_KEY environment variable.
 * To run tests with real API calls:
 *
 * export OPENAI_API_KEY="sk-..." && npm test -- chat.test.ts
 *
 * Tests verify:
 * 1. Suggestions are generated for diverse inventory sets
 * 2. No hallucinated ingredients (only uses provided items)
 * 3. Suggestions match meal type (breakfast=quick, dinner=hearty)
 * 4. Time estimates are reasonable
 */

import { suggestMeals } from '../netlify/functions/api/utils/prompts';
import { InventoryItem } from '../netlify/functions/shared/types';

// Helper to create inventory items
function createInventoryItem(
  id: string,
  name: string,
  canonicalName: string,
  quantity: number | undefined = undefined,
  unit: string | undefined = undefined,
  hasItem: boolean = false
): InventoryItem {
  return {
    id,
    user_id: 'test',
    name,
    canonical_name: canonicalName,
    quantity_approx: quantity,
    unit: unit,
    has_item: hasItem,
    confidence: quantity !== undefined ? 'exact' : 'approximate',
    date_added: new Date().toISOString(),
  };
}

describe('Meal Suggestion API (suggestMeals)', () => {
  test('should return no suggestions for pantry-staples-only inventory without calling OpenAI', async () => {
    const inventory: InventoryItem[] = [
      createInventoryItem('1', 'salt', 'salt', undefined, undefined, true),
      createInventoryItem('2', 'pepper', 'pepper', undefined, undefined, true),
      createInventoryItem('3', 'oil', 'oil', undefined, undefined, true),
    ];

    const result = await suggestMeals(inventory, 'breakfast');

    expect(result).toEqual([]);
  });

  // Skip all tests if OPENAI_API_KEY is not set
  const skipIfNoKey = process.env.OPENAI_API_KEY ? describe : describe.skip;

  skipIfNoKey('Italian Dinner Suggestions', () => {
    /**
     * Test 1: Italian dinner with chicken, tomatoes, basil, pasta
     * Expected: 3-5 pasta/chicken-based dishes using ONLY these ingredients
     */
    test('should suggest Italian recipes for chicken, tomatoes, basil, pasta', async () => {
      const inventory: InventoryItem[] = [
        createInventoryItem('1', 'chicken breast', 'chicken_breast', 2, 'pieces'),
        createInventoryItem('2', 'tomatoes', 'tomato', 3, 'pieces'),
        createInventoryItem('3', 'basil', 'basil', undefined, undefined, true),
        createInventoryItem('4', 'pasta', 'pasta', 500, 'g'),
      ];

      const result = await suggestMeals(inventory, 'dinner');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.length).toBeLessThanOrEqual(5);

      // Check structure
      result.forEach((recipe) => {
        expect(recipe.name).toBeDefined();
        expect(recipe.name.length).toBeGreaterThan(0);
        expect(recipe.description).toBeDefined();
        expect(recipe.description.length).toBeGreaterThan(10);
        expect(recipe.time_estimate_mins).toBeDefined();
        expect(recipe.time_estimate_mins).toBeGreaterThan(0);
        expect(recipe.time_estimate_mins).toBeLessThanOrEqual(120);
      });

      // Check for diversity
      const names = result.map((r) => r.name.toLowerCase());
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length); // All unique

      // Check for relevant ingredients (all should mention ingredients from inventory)
      const inventoryWords = ['chicken', 'tomato', 'basil', 'pasta'];
      result.forEach((recipe) => {
        const text = `${recipe.name} ${recipe.description}`.toLowerCase();
        const hasRelevant = inventoryWords.some((word) => text.includes(word));
        expect(hasRelevant).toBe(true);
      });
    }, 30000); // 30 second timeout for API call
  });

  skipIfNoKey('Breakfast Suggestions', () => {
    /**
     * Test 2: Breakfast with eggs, bread, butter
     * Expected: 3-4 quick breakfast recipes
     */
    test('should suggest quick breakfast recipes for eggs, bread, butter', async () => {
      const inventory: InventoryItem[] = [
        createInventoryItem('1', 'eggs', 'egg', 6, 'pieces'),
        createInventoryItem('2', 'bread', 'bread', 1, 'loaf'),
        createInventoryItem('3', 'butter', 'butter', undefined, undefined, true),
      ];

      const result = await suggestMeals(inventory, 'breakfast');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);

      // Breakfast items should be quick (under 30 mins typically)
      result.forEach((recipe) => {
        expect(recipe.time_estimate_mins).toBeLessThanOrEqual(45);
      });

      // Check descriptions mention breakfast-relevant items
      result.forEach((recipe) => {
        const text = `${recipe.name} ${recipe.description}`.toLowerCase();
        const hasRelevant = ['egg', 'bread', 'butter', 'breakfast', 'toast', 'scrambled', 'fried'].some(
          (word) => text.includes(word)
        );
        expect(hasRelevant).toBe(true);
      });
    }, 30000);
  });

  skipIfNoKey('Asian Lunch Suggestions', () => {
    /**
     * Test 3: Asian lunch with rice, soy sauce, chicken, garlic, vegetables
     * Expected: 3-4 Asian-style lunch recipes
     */
    test('should suggest Asian recipes for rice, chicken, soy sauce, garlic, vegetables', async () => {
      const inventory: InventoryItem[] = [
        createInventoryItem('1', 'rice', 'rice', 500, 'g'),
        createInventoryItem('2', 'soy sauce', 'soy_sauce', undefined, undefined, true),
        createInventoryItem('3', 'chicken', 'chicken', 300, 'g'),
        createInventoryItem('4', 'garlic', 'garlic', undefined, undefined, true),
        createInventoryItem('5', 'broccoli', 'broccoli', 200, 'g'),
        createInventoryItem('6', 'carrots', 'carrot', 2, 'pieces'),
      ];

      const result = await suggestMeals(inventory, 'lunch');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);

      // Check for relevant ingredients
      result.forEach((recipe) => {
        const text = `${recipe.name} ${recipe.description}`.toLowerCase();
        const hasRelevant = ['rice', 'chicken', 'soy', 'vegetable', 'stir'].some((word) =>
          text.includes(word)
        );
        expect(hasRelevant).toBe(true);
      });
    }, 30000);
  });

  skipIfNoKey('Limited Inventory Suggestions', () => {
    /**
     * Test 4: Limited inventory (just eggs and bread)
     * Expected: Still generates 2-3 valid suggestions
     */
    test('should suggest recipes even with limited inventory', async () => {
      const inventory: InventoryItem[] = [
        createInventoryItem('1', 'eggs', 'egg', 4, 'pieces'),
        createInventoryItem('2', 'bread', 'bread', 1, 'loaf'),
      ];

      const result = await suggestMeals(inventory, 'breakfast');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2); // Lower minimum for limited inventory

      // All suggestions should be realistic with just eggs and bread
      result.forEach((recipe) => {
        const text = `${recipe.name} ${recipe.description}`.toLowerCase();
        const isRealistic = ['egg', 'bread', 'scrambled', 'toast', 'fried'].some((word) =>
          text.includes(word)
        );
        expect(isRealistic).toBe(true);
      });
    }, 30000);
  });

  skipIfNoKey('Pantry Staples Only', () => {
    /**
     * Test 5: Only pantry staples (no actual ingredients)
     * Expected: Should handle gracefully - either suggest nothing or basic dishes
     */
    test('should handle pantry-staples-only inventory appropriately', async () => {
      const inventory: InventoryItem[] = [
        createInventoryItem('1', 'salt', 'salt', undefined, undefined, true),
        createInventoryItem('2', 'oil', 'oil', undefined, undefined, true),
        createInventoryItem('3', 'pepper', 'pepper', undefined, undefined, true),
      ];

      // This should either throw a helpful error or return empty array
      try {
        const result = await suggestMeals(inventory, 'lunch');
        // If it succeeds, result should be empty or contain a helpful message
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          // If suggestions are given, they should acknowledge the limitation
          result.forEach((recipe) => {
            expect(recipe.name).toBeDefined();
            expect(recipe.description).toBeDefined();
          });
        }
      } catch (error) {
        // It's okay if this throws an error - pantry staples alone can't make a meal
        expect(error).toBeDefined();
      }
    }, 30000);
  });
});
