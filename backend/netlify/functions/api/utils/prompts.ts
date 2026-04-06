/**
 * LLM prompt utilities for inventory parsing, meal suggestions, and recipe generation
 * Uses OpenAI GPT-4o mini for all natural language processing
 *
 * Key pattern: Always request JSON-only responses from the LLM to avoid parsing confusion
 */

import OpenAI from 'openai';
import { InventoryItem, Recipe, RecipeDetail } from '../../../shared/types';

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client
 * Uses OPENAI_API_KEY from environment
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY must be set in environment');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Parse free-form inventory input into structured items
 *
 * Examples:
 * - "3 chicken breasts, 2 tomatoes" -> [{name: "chicken breasts", canonical_name: "chicken_breast", quantity_approx: 3, unit: "pieces"}, ...]
 * - "some rice, a bunch of spinach" -> parsed with approximate quantities
 * - "200g beef, 2 cups flour" -> quantities and units extracted
 * - "salt and pepper" -> has_item: true, confidence: "exact"
 *
 * @param userInput - Free-form text like "3 chicken breasts, some tomatoes"
 * @returns Array of InventoryItem objects (without id, user_id, dates - added by DB)
 */
export async function parseInventoryInput(
  userInput: string
): Promise<Omit<InventoryItem, 'id' | 'user_id' | 'date_added' | 'date_used'>[]> {
  const client = getOpenAIClient();
  const { getCanonicalName } = await import('./canonical-foods');

  const systemPrompt = `You are a kitchen inventory parser. Your job is to extract food items from user input.

For each item, extract:
1. name: The food item (what user said, e.g., "chicken breasts", "some salad")
2. canonical_name: Normalized version (e.g., "chicken_breast", "salad_leaves") - you'll compute this from name
3. has_item: boolean. True ONLY for pantry staples where quantity doesn't matter (salt, spices, oils, condiments)
4. quantity_approx: The quantity as a number. For approximate quantities, use best judgment:
   - "some" / "a little" / "a bit" = 1
   - "a bunch" / "handful" / "quite a bit" = 2
   - "lots" / "a lot" / "plenty" = 4
   - Fractions: parse literally ("half" = 0.5, "1/3" = 0.33)
   - For has_item=true items, quantity_approx = null
5. unit: The unit of measurement. Use standard units:
   - "pieces" or "count" for individual items
   - "g" for grams
   - "ml" for milliliters
   - "cup" for cups
   - "tbsp" for tablespoons
   - "bunch" for bunches
   - Leave blank if no unit applies
6. confidence: "exact" if user specified quantity precisely, "approximate" if estimated

Return ONLY a JSON array, no other text. Example format:
[
  {"name": "chicken breast", "canonical_name": "chicken_breast", "quantity_approx": 3, "unit": "pieces", "confidence": "exact"},
  {"name": "salt", "canonical_name": "salt", "has_item": true, "quantity_approx": null, "unit": null, "confidence": "exact"},
  {"name": "some salad", "canonical_name": "salad_leaves", "quantity_approx": 1, "unit": null, "confidence": "approximate"}
]

Categories:
1. Pantry staples (salt, spices, oils): has_item=true, confidence="exact"
2. Exact quantities (500g beef, 3 apples): confidence="exact"
3. Exact counts (2 chicken breasts): unit="pieces", confidence="exact"
4. Rough quantities (some salad, lots of carrots): confidence="approximate"

Handle edge cases:
- Ignore articles like "a", "an", "the"
- Normalize item names (e.g., "tomatoes" → "tomato")
- Extract units from compound items (e.g., "2 tablespoons of oil" → name: "oil", quantity_approx: 2, unit: "tbsp")`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Parse this inventory input: "${userInput}"`,
        },
      ],
    });

    // Extract text from response
    const message = response.choices[0].message;
    if (!message.content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse JSON from response
    const jsonMatch = message.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON array in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    return parsed.map((item: any) => ({
      name: item.name || '',
      canonical_name: item.canonical_name || getCanonicalName(item.name || ''),
      has_item: item.has_item || false,
      quantity_approx: item.quantity_approx || null,
      unit: item.unit || null,
      confidence: item.confidence || 'approximate',
    }));
  } catch (error) {
    console.error('Error parsing inventory input:', error);
    throw new Error(
      `Failed to parse inventory: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Suggest meals based on current inventory and meal type
 *
 * @param inventoryItems - Array of items in user's inventory
 * @param mealType - Type of meal: 'breakfast', 'lunch', or 'dinner'
 * @returns Array of Recipe suggestions (name, description, time_estimate_mins)
 */
export async function suggestMeals(
  inventoryItems: InventoryItem[],
  mealType: 'breakfast' | 'lunch' | 'dinner'
): Promise<Recipe[]> {
  const client = getOpenAIClient();

  const inventoryList = inventoryItems
    .map((item) => {
      if (item.has_item) {
        return `- ${item.name} (available)`;
      }
      const qty = item.quantity_approx ? `${item.quantity_approx}${item.unit ? ' ' + item.unit : ''}` : 'some';
      return `- ${item.name} (${qty})`;
    })
    .join('\n');

  const systemPrompt = `You are a creative meal suggestion engine. Given a list of available ingredients, suggest 3-5 recipes that can be made.

CRITICAL CONSTRAINT: You can ONLY suggest meals using ONLY these ingredients:
${inventoryList}

Do NOT suggest any meals that require ingredients not in this list.
Do NOT assume the user has salt, oil, butter, spices, water, or any pantry items.
Do NOT add, assume, or suggest any other ingredients.

For each recipe, provide:
1. name: Recipe name
2. description: Menu-style description with health/character notes. Example: "Pan-seared chicken with fresh tomatoes and basil. Light, protein-rich, and naturally fresh."
3. time_estimate_mins: Estimated cooking time in minutes

Return ONLY a JSON object with a "recipes" array, no other text. Example format:
{
  "recipes": [
    {
      "name": "Tomato Basil Salad",
      "description": "Fresh tomatoes and basil. Simple, light, and naturally fresh.",
      "time_estimate_mins": 5
    }
  ]
}

Focus on recipes that:
- Use ingredients from the inventory (prioritize using multiple items)
- Are realistic for a home cook
- Match the meal type (breakfast = quick/light, lunch = balanced, dinner = hearty)`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Available inventory for ${mealType}:\n${inventoryList}\n\nSuggest 3-4 ${mealType} recipes I can make.`,
        },
      ],
    });

    const message = response.choices[0].message;
    if (!message.content) {
      throw new Error('Empty response from OpenAI');
    }

    const jsonMatch = message.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON object in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!Array.isArray(parsed.recipes)) {
      throw new Error('Response recipes is not an array');
    }

    parsed.recipes.forEach((recipe: any) => {
      if (!recipe.name || !recipe.description || recipe.time_estimate_mins === undefined) {
        throw new Error(`Invalid recipe structure: ${JSON.stringify(recipe)}`);
      }
    });

    return parsed.recipes;
  } catch (error) {
    console.error('Error suggesting meals:', error);
    throw new Error(
      `Failed to suggest meals: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate detailed recipe with full ingredients list and step-by-step instructions
 *
 * @param recipeName - Name of the recipe (e.g., "Tomato Basil Chicken")
 * @param recipeDescription - Menu-style description from meal suggestion
 * @param userInventory - Array of items in user's inventory
 * @returns Full RecipeDetail with ingredients list and instructions
 */
export async function generateRecipeDetail(
  recipeName: string,
  recipeDescription: string,
  userInventory: InventoryItem[]
): Promise<RecipeDetail> {
  const client = getOpenAIClient();

  const inventoryNames = userInventory.map(i => i.name).join(', ');
  const inventorySet = new Set(
    userInventory.flatMap(i => [
      i.name.toLowerCase(),
      i.canonical_name?.toLowerCase() || i.name.toLowerCase(),
    ])
  );

  const systemPrompt = `You are a detailed recipe writer. Given a recipe name, description, and available ingredients, expand it into a full recipe.

CRITICAL: You can ONLY use these ingredients:
${inventoryNames}

Do NOT add salt, oil, butter, water, spices, or any ingredients not listed above.
Every single ingredient in your recipe must be from the list above.
If you cannot create a valid recipe using ONLY these ingredients, say so.

Recipe: ${recipeName}
Description: ${recipeDescription}

For the recipe, provide:
1. name: Recipe name
2. description: The description provided
3. time_estimate_mins: Estimated total cooking time in minutes
4. ingredients: Full ingredients list with quantities and units. Example:
   [
     {"name": "chicken", "quantity": 2, "unit": "pieces"},
     {"name": "tomato", "quantity": 3, "unit": "pieces"}
   ]
5. instructions: Step-by-step cooking instructions as an array of strings

Return ONLY a JSON object, no other text. Example format:
{
  "name": "Tomato Basil Chicken",
  "description": "Pan-seared chicken with fresh tomatoes and basil. Light and fresh.",
  "time_estimate_mins": 25,
  "ingredients": [
    {"name": "chicken", "quantity": 2, "unit": "pieces"},
    {"name": "tomato", "quantity": 3, "unit": "pieces"},
    {"name": "basil", "quantity": 5, "unit": "leaves"}
  ],
  "instructions": [
    "Heat a pan over medium-high heat",
    "Add chicken and cook for 5-6 minutes per side",
    "Dice tomatoes and add to pan",
    "Tear basil and sprinkle over",
    "Simmer for 5 minutes",
    "Serve"
  ]
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Expand this recipe into full details using ONLY available ingredients:\nName: ${recipeName}\nDescription: ${recipeDescription}`,
        },
      ],
    });

    const message = response.choices[0].message;
    if (!message.content) {
      throw new Error('Empty response from OpenAI');
    }

    const jsonMatch = message.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON object in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // POST-VALIDATION: Check that every ingredient is in user's inventory
    const invalidIngredients: string[] = [];
    parsed.ingredients.forEach((ing: any) => {
      const ingName = ing.name.toLowerCase();
      if (!inventorySet.has(ingName)) {
        invalidIngredients.push(ing.name);
      }
    });

    if (invalidIngredients.length > 0) {
      throw new Error(
        `Recipe suggests unavailable ingredients: ${invalidIngredients.join(', ')}. ` +
        `Available: ${inventoryNames}`
      );
    }

    return parsed;
  } catch (error) {
    console.error('Error generating recipe detail:', error);
    throw new Error(
      `Failed to generate recipe detail: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
