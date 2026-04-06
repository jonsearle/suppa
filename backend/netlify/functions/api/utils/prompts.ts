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
 * - "3 chicken breasts, 2 tomatoes" -> [{name: "chicken breasts", quantity_approx: 3, unit: "pieces"}, ...]
 * - "some rice, a bunch of spinach" -> parsed with approximate quantities
 * - "200g beef, 2 cups flour" -> quantities and units extracted
 *
 * @param userInput - Free-form text like "3 chicken breasts, some tomatoes"
 * @returns Array of InventoryItem objects (without id, user_id, dates - added by DB)
 */
export async function parseInventoryInput(
  userInput: string
): Promise<Omit<InventoryItem, 'id' | 'user_id' | 'date_added' | 'date_used'>[]> {
  const client = getOpenAIClient();

  const systemPrompt = `You are a kitchen inventory parser. Your job is to extract food items from user input.

For each item, extract:
1. name: The food item (singular, normalized) - e.g., "chicken breast", "tomato", "basil"
2. quantity_approx: The quantity as a number. For approximate quantities like "some", "a bunch", "a little", use your best estimate:
   - "some" = 1
   - "a bunch" = 1-2
   - "a little" = 1
   - "a lot" = 3-5
3. unit: The unit of measurement. Use standard units like:
   - "pieces" or "count" for individual items
   - "g" for grams
   - "ml" for milliliters
   - "cup" for cups
   - "tbsp" for tablespoons
   - "bunch" for bunches
   - Leave blank if no unit applies

Return ONLY a JSON array, no other text. Example format:
[
  {"name": "chicken breast", "quantity_approx": 3, "unit": "pieces"},
  {"name": "tomato", "quantity_approx": 2, "unit": null},
  {"name": "basil", "quantity_approx": 1, "unit": "bunch"}
]

Handle edge cases:
- Ignore articles like "a", "an", "the"
- Normalize item names (e.g., "tomatoes" -> "tomato", "chickens" -> "chicken")
- Extract units from compound items (e.g., "2 tablespoons of oil" -> name: "oil", quantity_approx: 2, unit: "tbsp")`;

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
      quantity_approx: item.quantity_approx || null,
      unit: item.unit || null,
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
 * @returns Array of Recipe suggestions
 */
export async function suggestMeals(
  inventoryItems: InventoryItem[],
  mealType: 'breakfast' | 'lunch' | 'dinner'
): Promise<Recipe[]> {
  const client = getOpenAIClient();

  const inventoryList = inventoryItems
    .map((item) => {
      const qty = item.quantity_approx ? `${item.quantity_approx}${item.unit ? ' ' + item.unit : ''}` : 'some';
      return `- ${item.name} (${qty})`;
    })
    .join('\n');

  const systemPrompt = `You are a creative meal suggestion engine. Given a list of available ingredients, suggest 3-5 recipes that can be made.

For each recipe, provide:
1. name: Recipe name
2. time_estimate_mins: Estimated cooking time in minutes
3. key_ingredients: Array of main ingredients from the inventory that will be used
4. brief_method: Very brief 1-sentence cooking method

Return ONLY a JSON object with a "recipes" array, no other text. Example format:
{
  "recipes": [
    {
      "name": "Tomato Basil Chicken",
      "time_estimate_mins": 20,
      "key_ingredients": ["chicken breast", "tomato", "basil"],
      "brief_method": "Pan-fry chicken, add tomatoes and basil, simmer for 10 minutes"
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
    return parsed.recipes || [];
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
 * @param keyIngredients - Array of main ingredients from inventory
 * @param briefMethod - Brief cooking method from suggestion
 * @returns Full RecipeDetail with ingredients list and instructions
 */
export async function generateRecipeDetail(
  recipeName: string,
  keyIngredients: string[],
  briefMethod: string
): Promise<RecipeDetail> {
  const client = getOpenAIClient();

  const systemPrompt = `You are a detailed recipe writer. Given a recipe name, key ingredients, and brief method, expand it into a full recipe.

For the recipe, provide:
1. name: Recipe name
2. time_estimate_mins: Estimated total cooking time in minutes
3. key_ingredients: Array of the main ingredients (from the brief provided)
4. brief_method: The brief cooking method
5. ingredients: Full ingredients list with quantities and units. Example:
   [
     {"name": "chicken breast", "quantity": 2, "unit": "pieces"},
     {"name": "olive oil", "quantity": 2, "unit": "tbsp"}
   ]
6. instructions: Step-by-step cooking instructions as an array of strings

Return ONLY a JSON object, no other text. Example format:
{
  "name": "Tomato Basil Chicken",
  "time_estimate_mins": 25,
  "key_ingredients": ["chicken breast", "tomato", "basil"],
  "brief_method": "Pan-fry chicken, add tomatoes and basil, simmer for 10 minutes",
  "ingredients": [
    {"name": "chicken breast", "quantity": 2, "unit": "pieces"},
    {"name": "tomato", "quantity": 3, "unit": "pieces"},
    {"name": "basil", "quantity": 5, "unit": "leaves"},
    {"name": "olive oil", "quantity": 2, "unit": "tbsp"}
  ],
  "instructions": [
    "Heat oil in a pan over medium-high heat",
    "Add chicken breasts and cook for 5-6 minutes per side until golden",
    "Dice tomatoes and add to pan",
    "Tear basil leaves and sprinkle over",
    "Reduce heat and simmer for 5 minutes until sauce thickens",
    "Serve immediately"
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
          content: `Expand this recipe into a full detailed recipe:
Name: ${recipeName}
Key ingredients: ${keyIngredients.join(', ')}
Brief method: ${briefMethod}

Provide complete ingredients list and step-by-step instructions.`,
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

    const parsed = JSON.parse(jsonMatch[0]) as RecipeDetail;
    return parsed;
  } catch (error) {
    console.error('Error generating recipe detail:', error);
    throw new Error(
      `Failed to generate recipe detail: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
