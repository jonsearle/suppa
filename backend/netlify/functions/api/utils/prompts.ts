/**
 * LLM prompt utilities for inventory parsing, meal suggestions, and recipe generation
 * Uses OpenAI GPT-4o mini for all natural language processing
 *
 * Key pattern: Always request JSON-only responses from the LLM to avoid parsing confusion
 */

import OpenAI from 'openai';
import { InventoryItem, Recipe, RecipeDetail } from '../../shared/types';
import { convertToCanonical, cacheCanonicalUnit } from './units';

let openaiClient: OpenAI | null = null;

const PANTRY_STAPLE_CANONICALS = new Set([
  'salt',
  'pepper',
  'oil',
  'olive_oil',
  'vegetable_oil',
  'butter',
  'vinegar',
  'soy_sauce',
  'spice',
  'spices',
  'cumin',
  'cinnamon',
  'thyme',
  'oregano',
]);

function hasOpenAiApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function inferCanonicalName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
}

function isPantryStaple(item: Pick<InventoryItem, 'name' | 'canonical_name' | 'has_item'>): boolean {
  const canonical = (item.canonical_name || inferCanonicalName(item.name)).toLowerCase();
  const normalizedName = item.name.toLowerCase().trim();

  return (
    item.has_item === true ||
    PANTRY_STAPLE_CANONICALS.has(canonical) ||
    PANTRY_STAPLE_CANONICALS.has(normalizedName.replace(/\s+/g, '_'))
  );
}

function hasCookableIngredients(inventoryItems: InventoryItem[]): boolean {
  return inventoryItems.some((item) => !isPantryStaple(item));
}

async function parseInventoryInputLocally(
  userInput: string
): Promise<Omit<InventoryItem, 'id' | 'user_id' | 'date_added' | 'date_used'>[]> {
  const { getCanonicalName } = await import('./canonical-foods');
  const pantryStaples = new Set([
    'salt',
    'pepper',
    'oil',
    'olive oil',
    'butter',
    'vinegar',
    'soy sauce',
    'spice',
    'spices',
  ]);

  return userInput
    .split(/,| and /i)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const cleaned = part.replace(/^(i have|we have|got)\s+/i, '').trim();
      const qtyMatch = cleaned.match(
        /^(\d+(?:\.\d+)?)\s*(kg|g|ml|l|cups?|cup|tbsp|tsp|pieces?|piece|cloves?|bunch(?:es)?)?\s*(?:of\s+)?(.+)$/i
      );

      let name = cleaned;
      let quantity: number | undefined = undefined;
      let unit: string | undefined = undefined;
      let confidence: 'exact' | 'approximate' = 'approximate';
      let hasItem = false;

      if (qtyMatch) {
        quantity = Number(qtyMatch[1]);
        unit = qtyMatch[2] || undefined;
        name = qtyMatch[3].trim();
        confidence = 'exact';
      } else if (pantryStaples.has(cleaned.toLowerCase())) {
        hasItem = true;
        confidence = 'exact';
      } else if (/^(some|a little|a bit|a handful of|a bunch of)\s+/i.test(cleaned)) {
        name = cleaned.replace(/^(some|a little|a bit|a handful of|a bunch of)\s+/i, '').trim();
        quantity = 1;
      }

      const canonical = getCanonicalName(name) || inferCanonicalName(name);
      return {
        name,
        canonical_name: canonical,
        has_item: hasItem,
        quantity_approx: hasItem ? undefined : quantity,
        unit,
        confidence,
      };
    });
}

function suggestMealsLocally(
  inventoryItems: InventoryItem[],
  mealType: 'breakfast' | 'lunch' | 'dinner'
): Recipe[] {
  const names = inventoryItems.map((item) => item.name);
  const lead = names.slice(0, 3);
  const joined = lead.join(', ');

  return [
    {
      name: `${lead[0] || 'Pantry'} ${mealType === 'breakfast' ? 'Hash' : 'Skillet'}`,
      description: `A quick ${mealType} idea built from ${joined || 'what you have on hand'}.`,
      time_estimate_mins: mealType === 'breakfast' ? 10 : 15,
    },
    {
      name: `${lead[0] || 'Simple'} ${mealType === 'lunch' ? 'Bowl' : 'Saute'}`,
      description: `A simple ${mealType} using ${joined || 'your current inventory'}.`,
      time_estimate_mins: 15,
    },
    {
      name: `${mealType[0].toUpperCase()}${mealType.slice(1)} ${lead[1] || 'Kitchen'} Mix`,
      description: `A flexible dish combining ${joined || 'available ingredients'} with minimal prep.`,
      time_estimate_mins: 20,
    },
  ];
}

function generateRecipeDetailLocally(
  recipeName: string,
  recipeDescription: string,
  userInventory: InventoryItem[]
): RecipeDetail {
  const rawIngredients = userInventory.slice(0, 5).map((item) => ({
    name: item.name.toLowerCase(),
    quantity: item.quantity_approx ?? 1,
    unit: item.unit || (item.has_item ? 'to taste' : 'pieces'),
  }));

  // Normalize ingredient quantities to canonical units
  const ingredients = rawIngredients.map((ing) => {
    const result = convertToCanonical(ing.quantity, ing.unit, ing.name);
    cacheCanonicalUnit(ing.name, result.unit);
    return {
      name: ing.name,
      quantity: result.quantity,
      unit: result.unit,
    };
  });

  return {
    name: recipeName,
    description: recipeDescription,
    time_estimate_mins: Math.max(10, ingredients.length * 5),
    ingredients,
    instructions: [
      'Prepare the ingredients from your current inventory.',
      'Cook the main ingredients together over medium heat until tender.',
      'Adjust the texture and combine everything evenly.',
      'Serve immediately while warm.',
    ],
  };
}

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
  if (!hasOpenAiApiKey()) {
    return parseInventoryInputLocally(userInput);
  }

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
  if (!hasCookableIngredients(inventoryItems)) {
    return [];
  }

  if (!hasOpenAiApiKey()) {
    return suggestMealsLocally(inventoryItems, mealType);
  }

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
      temperature: 0,
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
  if (!hasOpenAiApiKey()) {
    return generateRecipeDetailLocally(
      recipeName,
      recipeDescription,
      userInventory
    );
  }

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

    // Normalize ingredient quantities to canonical units
    // e.g., 1 cup rice → 125g rice, 240ml milk → 240ml milk
    parsed.ingredients = parsed.ingredients.map((ing: any) => {
      const result = convertToCanonical(ing.quantity, ing.unit, ing.name);
      // Cache the canonical unit for this ingredient for future use
      cacheCanonicalUnit(ing.name, result.unit);
      return {
        name: ing.name,
        quantity: result.quantity,
        unit: result.unit,
      };
    });

    return parsed;
  } catch (error) {
    console.error('Error generating recipe detail:', error);
    throw new Error(
      `Failed to generate recipe detail: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Recipe adjustment types for conversational recipe modification (Task 7)
 * Allows users to adjust recipes before cooking
 */
export interface RecipeAdjustment {
  type: 'quantity' | 'removal' | 'substitution' | 'uncertain';
  ingredient: string;
  quantity?: number;
  unit?: string;
  substitute_with?: string;
  reason?: string;
  confidence?: 'exact' | 'approximate';
}

/**
 * Parse user input about recipe adjustments
 *
 * Converts natural language adjustments into structured data:
 * - Quantity adjustments: "I only have 300g flour"
 * - Removals: "The milk is gone off"
 * - Substitutions: "Can I use cod instead of chicken?"
 * - Multiple at once: "300g flour, milk is gone, 6 eggs"
 *
 * @param userInput - Free-form text describing adjustments
 * @param recipeContext - Current recipe ingredients to contextualize adjustments
 * @returns Array of RecipeAdjustment objects
 */
export async function parseRecipeAdjustments(
  userInput: string,
  recipeContext: { ingredients: Array<{ name: string; quantity: number; unit: string }> }
): Promise<RecipeAdjustment[]> {
  // If user input is just affirmation with no changes, return empty array
  if (/^(looks good|ready|no changes|sounds good|ok|all set|fine|good to go)$/i.test(userInput.trim())) {
    return [];
  }

  if (!hasOpenAiApiKey()) {
    // Fallback: parse locally without LLM
    return parseRecipeAdjustmentsLocally(userInput, recipeContext);
  }

  try {
    const client = getOpenAIClient();

    const recipeIngredients = recipeContext.ingredients
      .map((ing) => `- ${ing.name}: ${ing.quantity}${ing.unit}`)
      .join('\n');

    const systemPrompt = `Parse user input describing adjustments to a recipe. The user is describing what they actually have or want to change about the recipe ingredients.

Recipe ingredients being adjusted:
${recipeIngredients}

For each adjustment mentioned in user input, return:
- type: 'quantity' (user specifies how much they have), 'removal' (ingredient not available), 'substitution' (use different ingredient), 'uncertain' (can't parse)
- ingredient: which recipe ingredient they're adjusting (match against recipe ingredients above)
- quantity/unit: if quantity adjustment (e.g. "300g flour")
- substitute_with: if substitution (e.g. "cod" when replacing chicken)
- confidence: 'exact' if user specified precise amount, 'approximate' if vague ("about", "around", "some")
- reason: if removal (e.g. "gone off", "ran out", "don't have")

Examples:
"I only have 300g flour" → { type: 'quantity', ingredient: 'flour', quantity: 300, unit: 'g', confidence: 'exact' }
"milk is gone off" → { type: 'removal', ingredient: 'milk', reason: 'gone_off' }
"use cod instead of chicken" → { type: 'substitution', ingredient: 'chicken', substitute_with: 'cod', confidence: 'exact' }
"about 6 eggs" → { type: 'quantity', ingredient: 'eggs', quantity: 6, unit: 'pieces', confidence: 'approximate' }
"looks good" → {} (no adjustments - return empty array in response)

Return ONLY valid JSON array of adjustment objects. If no adjustments, return empty array [].
Never return JSON with extra text or markdown.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userInput,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Unexpected response type from LLM');
    }

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // If no JSON found, assume no adjustments
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing recipe adjustments:', error);
    // On error, try local parsing as fallback
    try {
      return parseRecipeAdjustmentsLocally(userInput, recipeContext);
    } catch {
      // If both fail, return empty array (safe default)
      return [];
    }
  }
}

/**
 * Local fallback for recipe adjustment parsing (no LLM required)
 * Uses regex patterns to detect adjustments
 */
function parseRecipeAdjustmentsLocally(
  userInput: string,
  recipeContext: { ingredients: Array<{ name: string; quantity: number; unit: string }> }
): RecipeAdjustment[] {
  const adjustments: RecipeAdjustment[] = [];
  const input = userInput.toLowerCase();

  // Build a set of ingredient names for matching
  const ingredientMap = new Map(
    recipeContext.ingredients.map((ing) => [ing.name.toLowerCase(), ing])
  );

  // Match quantity adjustments: "X unit ingredient"
  // Examples: "300g flour", "6 eggs", "1 cup milk"
  const qtyPattern = /(\d+(?:\.\d+)?)\s*(g|ml|cups?|tbsp|tsp|pieces?|cloves?)?(?:\s+of)?\s+(\w+)/gi;
  let match;
  while ((match = qtyPattern.exec(input)) !== null) {
    const quantity = parseFloat(match[1]);
    const unit = match[2] || 'pieces';
    const ingredient = match[3];

    // Find matching ingredient in recipe
    for (const [ingKey, ingValue] of ingredientMap) {
      if (ingKey.includes(ingredient) || ingredient.includes(ingKey.split('_')[0])) {
        adjustments.push({
          type: 'quantity',
          ingredient: ingValue.name,
          quantity,
          unit,
          confidence: 'exact',
        });
        break;
      }
    }
  }

  // Match removals: "gone", "ran out", "don't have"
  ingredientMap.forEach((ing) => {
    const ingPattern = new RegExp(`(${ing.name}|${ing.name.split(' ')[0]}).*?(gone|ran out|don't have|do not have|missing|no longer)`, 'i');
    if (ingPattern.test(userInput)) {
      // Only add if not already added as quantity adjustment
      if (!adjustments.some((adj) => adj.ingredient === ing.name && adj.type === 'quantity')) {
        adjustments.push({
          type: 'removal',
          ingredient: ing.name,
          reason: 'gone_off',
        });
      }
    }
  });

  // Match substitutions: "use X instead of Y"
  const substPattern = /use\s+(\w+)\s+instead of\s+(\w+)/i;
  if ((match = substPattern.exec(userInput)) !== null) {
    const substitution = match[1];
    const original = match[2];

    // Find matching ingredient in recipe
    for (const [ingKey, ingValue] of ingredientMap) {
      if (ingKey.includes(original.toLowerCase()) || original.toLowerCase().includes(ingKey.split('_')[0])) {
        adjustments.push({
          type: 'substitution',
          ingredient: ingValue.name,
          substitute_with: substitution,
          confidence: 'exact',
        });
        break;
      }
    }
  }

  return adjustments;
}
