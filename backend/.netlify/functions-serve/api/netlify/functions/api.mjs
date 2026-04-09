
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);

var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// netlify/functions/api/utils/canonical-foods.ts
var canonical_foods_exports = {};
__export(canonical_foods_exports, {
  CANONICAL_FOODS: () => CANONICAL_FOODS,
  getCanonicalName: () => getCanonicalName
});
function getCanonicalName(itemName) {
  const lowercased = itemName.toLowerCase().trim();
  return CANONICAL_FOODS[lowercased] || lowercased;
}
var CANONICAL_FOODS;
var init_canonical_foods = __esm({
  "netlify/functions/api/utils/canonical-foods.ts"() {
    "use strict";
    CANONICAL_FOODS = {
      // Potatoes
      "potato": "potato",
      "potatoes": "potato",
      "spuds": "potato",
      // Tomatoes
      "tomato": "tomato",
      "tomatoes": "tomato",
      "cherry tomato": "cherry_tomato",
      "cherry tomatoes": "cherry_tomato",
      "sun-dried tomato": "sun_dried_tomato",
      // Beans
      "bean": "bean",
      "beans": "bean",
      "green bean": "green_bean",
      "green beans": "green_bean",
      "baked bean": "baked_bean",
      "baked beans": "baked_bean",
      "chickpea": "chickpea",
      "chickpeas": "chickpea",
      // Vegetables
      "carrot": "carrot",
      "carrots": "carrot",
      "onion": "onion",
      "onions": "onion",
      "garlic": "garlic",
      "broccoli": "broccoli",
      "spinach": "spinach",
      "lettuce": "salad_leaves",
      "salad": "salad_leaves",
      "salad leaves": "salad_leaves",
      "mixed salad": "salad_leaves",
      // Proteins
      "chicken": "chicken",
      "chicken breast": "chicken_breast",
      "chicken breasts": "chicken_breast",
      "chicken thigh": "chicken_thigh",
      "chicken thighs": "chicken_thigh",
      "beef": "beef",
      "egg": "egg",
      "eggs": "egg",
      // Grains
      "rice": "rice",
      "white rice": "rice",
      "brown rice": "brown_rice",
      "pasta": "pasta",
      "noodle": "noodle",
      "noodles": "noodle",
      "bread": "bread",
      // Oils & Fats
      "oil": "oil",
      "olive oil": "olive_oil",
      "vegetable oil": "vegetable_oil",
      "butter": "butter",
      // Herbs & Spices (typically has_item=true)
      "salt": "salt",
      "pepper": "pepper",
      "basil": "basil",
      "oregano": "oregano",
      "cumin": "cumin",
      "cinnamon": "cinnamon",
      "thyme": "thyme",
      // Dairy
      "milk": "milk",
      "cheese": "cheese",
      "yogurt": "yogurt"
    };
  }
});

// netlify/functions/api.ts
import express from "express";
import cors from "cors";
import "dotenv/config";

// netlify/functions/api/inventory.ts
import { Router } from "express";

// netlify/functions/api/utils/prompts.ts
import OpenAI from "openai";
var openaiClient = null;
function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY must be set in environment");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}
async function parseInventoryInput(userInput) {
  const client = getOpenAIClient();
  const { getCanonicalName: getCanonicalName2 } = await Promise.resolve().then(() => (init_canonical_foods(), canonical_foods_exports));
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
- Normalize item names (e.g., "tomatoes" \u2192 "tomato")
- Extract units from compound items (e.g., "2 tablespoons of oil" \u2192 name: "oil", quantity_approx: 2, unit: "tbsp")`;
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Parse this inventory input: "${userInput}"`
        }
      ]
    });
    const message = response.choices[0].message;
    if (!message.content) {
      throw new Error("Empty response from OpenAI");
    }
    const jsonMatch = message.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON array in response");
    }
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }
    return parsed.map((item) => ({
      name: item.name || "",
      canonical_name: item.canonical_name || getCanonicalName2(item.name || ""),
      has_item: item.has_item || false,
      quantity_approx: item.quantity_approx || null,
      unit: item.unit || null,
      confidence: item.confidence || "approximate"
    }));
  } catch (error) {
    console.error("Error parsing inventory input:", error);
    throw new Error(
      `Failed to parse inventory: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
async function suggestMeals(inventoryItems, mealType) {
  const client = getOpenAIClient();
  const inventoryList = inventoryItems.map((item) => {
    if (item.has_item) {
      return `- ${item.name} (available)`;
    }
    const qty = item.quantity_approx ? `${item.quantity_approx}${item.unit ? " " + item.unit : ""}` : "some";
    return `- ${item.name} (${qty})`;
  }).join("\n");
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
      model: "gpt-4o-mini",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Available inventory for ${mealType}:
${inventoryList}

Suggest 3-4 ${mealType} recipes I can make.`
        }
      ]
    });
    const message = response.choices[0].message;
    if (!message.content) {
      throw new Error("Empty response from OpenAI");
    }
    const jsonMatch = message.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON object in response");
    }
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.recipes)) {
      throw new Error("Response recipes is not an array");
    }
    parsed.recipes.forEach((recipe) => {
      if (!recipe.name || !recipe.description || recipe.time_estimate_mins === void 0) {
        throw new Error(`Invalid recipe structure: ${JSON.stringify(recipe)}`);
      }
    });
    return parsed.recipes;
  } catch (error) {
    console.error("Error suggesting meals:", error);
    throw new Error(
      `Failed to suggest meals: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
async function generateRecipeDetail(recipeName, recipeDescription, userInventory) {
  const client = getOpenAIClient();
  const inventoryNames = userInventory.map((i) => i.name).join(", ");
  const inventorySet = new Set(
    userInventory.flatMap((i) => [
      i.name.toLowerCase(),
      i.canonical_name?.toLowerCase() || i.name.toLowerCase()
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
      model: "gpt-4o-mini",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Expand this recipe into full details using ONLY available ingredients:
Name: ${recipeName}
Description: ${recipeDescription}`
        }
      ]
    });
    const message = response.choices[0].message;
    if (!message.content) {
      throw new Error("Empty response from OpenAI");
    }
    const jsonMatch = message.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON object in response");
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const invalidIngredients = [];
    parsed.ingredients.forEach((ing) => {
      const ingName = ing.name.toLowerCase();
      if (!inventorySet.has(ingName)) {
        invalidIngredients.push(ing.name);
      }
    });
    if (invalidIngredients.length > 0) {
      throw new Error(
        `Recipe suggests unavailable ingredients: ${invalidIngredients.join(", ")}. Available: ${inventoryNames}`
      );
    }
    return parsed;
  } catch (error) {
    console.error("Error generating recipe detail:", error);
    throw new Error(
      `Failed to generate recipe detail: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// netlify/functions/api/utils/db.ts
function getPocketBaseUrl() {
  const url = process.env.POCKETBASE_URL;
  if (!url) {
    throw new Error("POCKETBASE_URL must be set in environment");
  }
  return url.replace(/\/$/, "");
}
async function pocketbaseFetch(path, options = {}) {
  const url = `${getPocketBaseUrl()}/api${path}`;
  const method = options.method || "GET";
  try {
    const response = await fetch(url, {
      ...options,
      method,
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `PocketBase request failed (${response.status}): ${errorData.message || response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`PocketBase request failed: ${String(error)}`);
  }
}
function getUserId() {
  const userId = process.env.USER_ID;
  if (!userId) {
    throw new Error("USER_ID must be set in environment");
  }
  return userId;
}
async function getInventory() {
  const userId = getUserId();
  const filter = encodeURIComponent(`(user_id="${userId}"&&date_used=null)`);
  const sort = encodeURIComponent("-date_added");
  const response = await pocketbaseFetch(
    `/collections/inventory_items/records?filter=${filter}&sort=${sort}`
  );
  const items = response.items || (Array.isArray(response) ? response : []);
  return items;
}
async function addInventoryItem(item) {
  const userId = getUserId();
  const { getCanonicalName: getCanonicalName2 } = await Promise.resolve().then(() => (init_canonical_foods(), canonical_foods_exports));
  const canonicalName = item.canonical_name || getCanonicalName2(item.name);
  const filter = encodeURIComponent(
    `(user_id="${userId}"&&canonical_name="${canonicalName}"&&date_used=null)`
  );
  const existingResponse = await pocketbaseFetch(
    `/collections/inventory_items/records?filter=${filter}&limit=1`
  );
  const existingItems = existingResponse.items || (Array.isArray(existingResponse) ? existingResponse : []);
  const existing = existingItems[0];
  if (existing) {
    const updatedItem = await pocketbaseFetch(
      `/collections/inventory_items/records/${existing.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name: item.name || existing.name,
          quantity_approx: item.quantity_approx !== void 0 ? item.quantity_approx : existing.quantity_approx,
          unit: item.unit || existing.unit,
          confidence: item.confidence || existing.confidence,
          has_item: item.has_item !== void 0 ? item.has_item : existing.has_item,
          date_added: (/* @__PURE__ */ new Date()).toISOString()
        })
      }
    );
    return updatedItem;
  }
  const newItem = await pocketbaseFetch(
    `/collections/inventory_items/records`,
    {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        name: item.name,
        canonical_name: canonicalName,
        has_item: item.has_item || false,
        quantity_approx: item.quantity_approx || null,
        unit: item.unit || null,
        confidence: item.confidence || "approximate"
      })
    }
  );
  return newItem;
}
async function deductInventoryQuantity(itemId, quantityToDeduct) {
  const userId = getUserId();
  const item = await pocketbaseFetch(
    `/collections/inventory_items/records/${itemId}`
  );
  if (item.has_item === true && quantityToDeduct === void 0) {
    const deductedItem2 = await pocketbaseFetch(
      `/collections/inventory_items/records/${itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ date_used: (/* @__PURE__ */ new Date()).toISOString() })
      }
    );
    return { deducted_item: deductedItem2 };
  }
  if (quantityToDeduct !== void 0 && item.quantity_approx !== null) {
    const available = item.quantity_approx;
    if (available < quantityToDeduct) {
      throw new Error(
        `Insufficient quantity: need ${quantityToDeduct} ${item.unit || "units"}, have ${available}. User must review recipe or add more inventory.`
      );
    }
    if (Math.abs(available - quantityToDeduct) < 0.01) {
      const deductedItem3 = await pocketbaseFetch(
        `/collections/inventory_items/records/${itemId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ date_used: (/* @__PURE__ */ new Date()).toISOString() })
        }
      );
      return { deducted_item: deductedItem3 };
    }
    const remainder = available - quantityToDeduct;
    const remainderItem = await pocketbaseFetch(
      `/collections/inventory_items/records`,
      {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          name: item.name,
          canonical_name: item.canonical_name,
          quantity_approx: remainder,
          unit: item.unit,
          confidence: item.confidence,
          has_item: false,
          date_added: (/* @__PURE__ */ new Date()).toISOString()
        })
      }
    );
    const deductedItem2 = await pocketbaseFetch(
      `/collections/inventory_items/records/${itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ date_used: (/* @__PURE__ */ new Date()).toISOString() })
      }
    );
    return {
      deducted_item: deductedItem2,
      remainder_item_id: remainderItem.id
    };
  }
  const deductedItem = await pocketbaseFetch(
    `/collections/inventory_items/records/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ date_used: (/* @__PURE__ */ new Date()).toISOString() })
    }
  );
  return { deducted_item: deductedItem };
}

// netlify/functions/api/inventory.ts
var router = Router();
router.post("/", async (req, res) => {
  try {
    const { user_input } = req.body;
    if (!user_input || typeof user_input !== "string" || !user_input.trim()) {
      return res.status(400).json({
        error: "Missing or invalid user_input field",
        details: "user_input must be a non-empty string"
      });
    }
    const parsedItems = await parseInventoryInput(user_input.trim());
    const storedItems = [];
    for (const item of parsedItems) {
      try {
        const stored = await addInventoryItem(item);
        storedItems.push(stored);
      } catch (error) {
        console.error(`Failed to store item ${item.name}:`, error);
      }
    }
    res.status(201).json({
      data: storedItems,
      count: storedItems.length,
      message: `Parsed and stored ${storedItems.length} inventory items`
    });
  } catch (error) {
    console.error("Error in POST /api/inventory:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("SUPABASE") || errorMsg.includes("OPENAI")) {
      return res.status(500).json({
        error: "Service configuration error",
        details: errorMsg
      });
    }
    res.status(400).json({
      error: "Failed to parse inventory",
      details: errorMsg
    });
  }
});
router.get("/", async (req, res) => {
  try {
    const items = await getInventory();
    res.status(200).json({
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error("Error in GET /api/inventory:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: "Failed to fetch inventory",
      details: errorMsg
    });
  }
});
var inventory_default = router;

// netlify/functions/api/chat.ts
import { Router as Router2 } from "express";
var router2 = Router2();
router2.post("/", async (req, res) => {
  try {
    const { meal_type } = req.body;
    if (!meal_type || !["breakfast", "lunch", "dinner"].includes(meal_type)) {
      return res.status(400).json({
        error: "Missing or invalid meal_type field",
        details: "meal_type must be one of: breakfast, lunch, dinner"
      });
    }
    const inventory = await getInventory();
    if (inventory.length === 0) {
      return res.status(400).json({
        error: "No inventory items found",
        details: "Add items to your inventory before requesting meal suggestions"
      });
    }
    const recipes = await suggestMeals(inventory, meal_type);
    res.status(200).json({
      recipes,
      message: `Here are ${recipes.length} ${meal_type} suggestions for you!`
    });
  } catch (error) {
    console.error("Error in POST /api/chat:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("SUPABASE") || errorMsg.includes("OPENAI")) {
      return res.status(500).json({
        error: "Service configuration error",
        details: errorMsg
      });
    }
    res.status(400).json({
      error: "Failed to suggest meals",
      details: errorMsg
    });
  }
});
var chat_default = router2;

// netlify/functions/api/cooking.ts
import { Router as Router3 } from "express";
var router3 = Router3();
router3.post("/detail", async (req, res) => {
  try {
    const { recipe_name, recipe_description, recipe_time_mins } = req.body;
    if (!recipe_name || typeof recipe_name !== "string" || !recipe_name.trim()) {
      return res.status(400).json({
        error: "Missing or invalid recipe_name field",
        details: "recipe_name must be a non-empty string"
      });
    }
    if (!recipe_description || typeof recipe_description !== "string" || !recipe_description.trim()) {
      return res.status(400).json({
        error: "Missing or invalid recipe_description field",
        details: "recipe_description must be a non-empty string"
      });
    }
    if (recipe_time_mins === void 0 || typeof recipe_time_mins !== "number") {
      return res.status(400).json({
        error: "Missing or invalid recipe_time_mins field",
        details: "recipe_time_mins must be a number (in minutes)"
      });
    }
    const currentInventory = await getInventory();
    if (currentInventory.length === 0) {
      return res.status(400).json({
        error: "Cannot generate recipe with empty inventory",
        details: "Add items to your inventory before requesting recipe details"
      });
    }
    const recipeDetail = await generateRecipeDetail(
      recipe_name.trim(),
      recipe_description.trim(),
      currentInventory
    );
    res.status(200).json({
      data: recipeDetail,
      message: "Recipe details generated successfully"
    });
  } catch (error) {
    console.error("Error in POST /api/cooking/detail:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("SUPABASE") || errorMsg.includes("OPENAI")) {
      return res.status(500).json({
        error: "Service configuration error",
        details: errorMsg
      });
    }
    res.status(400).json({
      error: "Failed to generate recipe details",
      details: errorMsg
    });
  }
});
var cookingSessions = {};
router3.post("/start", async (req, res) => {
  try {
    const { recipe_name, recipe_description, recipe_time_mins } = req.body;
    if (!recipe_name || typeof recipe_name !== "string" || !recipe_name.trim()) {
      return res.status(400).json({
        error: "Missing or invalid recipe_name field",
        details: "recipe_name must be a non-empty string"
      });
    }
    if (!recipe_description || typeof recipe_description !== "string" || !recipe_description.trim()) {
      return res.status(400).json({
        error: "Missing or invalid recipe_description field",
        details: "recipe_description must be a non-empty string"
      });
    }
    if (recipe_time_mins === void 0 || typeof recipe_time_mins !== "number") {
      return res.status(400).json({
        error: "Missing or invalid recipe_time_mins field",
        details: "recipe_time_mins must be a number (in minutes)"
      });
    }
    const currentInventory = await getInventory();
    if (currentInventory.length === 0) {
      return res.status(400).json({
        error: "Cannot generate recipe with empty inventory",
        details: "Add items to your inventory before starting a recipe"
      });
    }
    const recipeDetail = await generateRecipeDetail(
      recipe_name.trim(),
      recipe_description.trim(),
      currentInventory
    );
    const ingredientsToDeduct = recipeDetail.ingredients.map((ingredient) => {
      const inventoryItem = currentInventory.find(
        (item) => item.name.toLowerCase() === ingredient.name.toLowerCase() || item.canonical_name?.toLowerCase() === ingredient.name.toLowerCase()
      );
      if (!inventoryItem) {
        throw new Error(
          `Recipe ingredient "${ingredient.name}" not found in inventory. This should not happen - recipe generation failed to validate against inventory.`
        );
      }
      return {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        inventory_item_id: inventoryItem.id,
        confidence: inventoryItem.confidence
      };
    });
    const sessionId = `cooking-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    cookingSessions[sessionId] = {
      recipe: recipeDetail,
      inventory_before: currentInventory,
      ingredients_to_deduct: ingredientsToDeduct,
      started_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.status(201).json({
      data: {
        session_id: sessionId,
        recipe: recipeDetail,
        ingredients_to_deduct: ingredientsToDeduct
      },
      message: "Recipe ready! Review ingredients and confirm when cooking is complete."
    });
  } catch (error) {
    console.error("Error in POST /api/cooking/start:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("SUPABASE") || errorMsg.includes("OPENAI")) {
      return res.status(500).json({
        error: "Service configuration error",
        details: errorMsg
      });
    }
    if (errorMsg.includes("not found in inventory")) {
      return res.status(400).json({
        error: "Recipe validation failed",
        details: errorMsg
      });
    }
    res.status(400).json({
      error: "Failed to start cooking",
      details: errorMsg
    });
  }
});
router3.post("/complete", async (req, res) => {
  try {
    const { session_id, deduction_confirmed } = req.body;
    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({
        error: "Missing or invalid session_id field",
        details: "session_id must be a string"
      });
    }
    if (deduction_confirmed !== true) {
      return res.status(400).json({
        error: "Deduction not confirmed",
        details: "deduction_confirmed must be true to proceed with inventory deduction"
      });
    }
    const session = cookingSessions[session_id];
    if (!session) {
      return res.status(404).json({
        error: "Cooking session not found",
        details: `Session ${session_id} does not exist or has expired`
      });
    }
    const deductedItems = [];
    let successCount = 0;
    for (const ingredient of session.ingredients_to_deduct) {
      try {
        const result = await deductInventoryQuantity(
          ingredient.inventory_item_id,
          ingredient.quantity
        );
        deductedItems.push({
          inventory_item_id: ingredient.inventory_item_id,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          success: true,
          remainder_item_id: result.remainder_item_id
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to deduct ingredient ${ingredient.name}:`, error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        const isInsufficientQuantity = errorMsg.includes("Insufficient quantity");
        deductedItems.push({
          inventory_item_id: ingredient.inventory_item_id,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          success: false,
          reason: errorMsg,
          error_type: isInsufficientQuantity ? "insufficient_quantity" : "system_error"
        });
      }
    }
    const inventoryAfter = await getInventory();
    delete cookingSessions[session_id];
    res.status(200).json({
      data: {
        recipe_name: session.recipe.name,
        deducted_items: deductedItems,
        inventory_after: inventoryAfter
      },
      message: `Great job! ${successCount} ingredient(s) deducted from inventory.`
    });
  } catch (error) {
    console.error("Error in POST /api/cooking/complete:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("SUPABASE")) {
      return res.status(500).json({
        error: "Database error",
        details: errorMsg
      });
    }
    res.status(400).json({
      error: "Failed to complete cooking",
      details: errorMsg
    });
  }
});
var cooking_default = router3;

// netlify/functions/api.ts
var app = express();
app.use(cors());
app.use(express.json());
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use("/api/inventory", inventory_default);
app.use("/api/chat", chat_default);
app.use("/api/cooking", cooking_default);
app.use((err, req, res) => {
  console.error(err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message
  });
});
var api_default = app;
export {
  api_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvYXBpL3V0aWxzL2Nhbm9uaWNhbC1mb29kcy50cyIsICJuZXRsaWZ5L2Z1bmN0aW9ucy9hcGkudHMiLCAibmV0bGlmeS9mdW5jdGlvbnMvYXBpL2ludmVudG9yeS50cyIsICJuZXRsaWZ5L2Z1bmN0aW9ucy9hcGkvdXRpbHMvcHJvbXB0cy50cyIsICJuZXRsaWZ5L2Z1bmN0aW9ucy9hcGkvdXRpbHMvZGIudHMiLCAibmV0bGlmeS9mdW5jdGlvbnMvYXBpL2NoYXQudHMiLCAibmV0bGlmeS9mdW5jdGlvbnMvYXBpL2Nvb2tpbmcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogQ2Fub25pY2FsIGZvb2QgbmFtZSBtYXBwaW5ncyBmb3IgZGVkdXBsaWNhdGlvblxuICogTWFwcyB2YXJpYXRpb25zIChwbHVyYWwsIG1pc3NwZWxsaW5ncywgYWxpYXNlcykgdG8gY2Fub25pY2FsIGZvcm1cbiAqIFVzZWQgYnkgYWRkSW52ZW50b3J5SXRlbSgpIHRvIG1lcmdlIGR1cGxpY2F0ZSBpdGVtc1xuICovXG5cbmV4cG9ydCBjb25zdCBDQU5PTklDQUxfRk9PRFM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIC8vIFBvdGF0b2VzXG4gICdwb3RhdG8nOiAncG90YXRvJyxcbiAgJ3BvdGF0b2VzJzogJ3BvdGF0bycsXG4gICdzcHVkcyc6ICdwb3RhdG8nLFxuXG4gIC8vIFRvbWF0b2VzXG4gICd0b21hdG8nOiAndG9tYXRvJyxcbiAgJ3RvbWF0b2VzJzogJ3RvbWF0bycsXG4gICdjaGVycnkgdG9tYXRvJzogJ2NoZXJyeV90b21hdG8nLFxuICAnY2hlcnJ5IHRvbWF0b2VzJzogJ2NoZXJyeV90b21hdG8nLFxuICAnc3VuLWRyaWVkIHRvbWF0byc6ICdzdW5fZHJpZWRfdG9tYXRvJyxcblxuICAvLyBCZWFuc1xuICAnYmVhbic6ICdiZWFuJyxcbiAgJ2JlYW5zJzogJ2JlYW4nLFxuICAnZ3JlZW4gYmVhbic6ICdncmVlbl9iZWFuJyxcbiAgJ2dyZWVuIGJlYW5zJzogJ2dyZWVuX2JlYW4nLFxuICAnYmFrZWQgYmVhbic6ICdiYWtlZF9iZWFuJyxcbiAgJ2Jha2VkIGJlYW5zJzogJ2Jha2VkX2JlYW4nLFxuICAnY2hpY2twZWEnOiAnY2hpY2twZWEnLFxuICAnY2hpY2twZWFzJzogJ2NoaWNrcGVhJyxcblxuICAvLyBWZWdldGFibGVzXG4gICdjYXJyb3QnOiAnY2Fycm90JyxcbiAgJ2NhcnJvdHMnOiAnY2Fycm90JyxcbiAgJ29uaW9uJzogJ29uaW9uJyxcbiAgJ29uaW9ucyc6ICdvbmlvbicsXG4gICdnYXJsaWMnOiAnZ2FybGljJyxcbiAgJ2Jyb2Njb2xpJzogJ2Jyb2Njb2xpJyxcbiAgJ3NwaW5hY2gnOiAnc3BpbmFjaCcsXG4gICdsZXR0dWNlJzogJ3NhbGFkX2xlYXZlcycsXG4gICdzYWxhZCc6ICdzYWxhZF9sZWF2ZXMnLFxuICAnc2FsYWQgbGVhdmVzJzogJ3NhbGFkX2xlYXZlcycsXG4gICdtaXhlZCBzYWxhZCc6ICdzYWxhZF9sZWF2ZXMnLFxuXG4gIC8vIFByb3RlaW5zXG4gICdjaGlja2VuJzogJ2NoaWNrZW4nLFxuICAnY2hpY2tlbiBicmVhc3QnOiAnY2hpY2tlbl9icmVhc3QnLFxuICAnY2hpY2tlbiBicmVhc3RzJzogJ2NoaWNrZW5fYnJlYXN0JyxcbiAgJ2NoaWNrZW4gdGhpZ2gnOiAnY2hpY2tlbl90aGlnaCcsXG4gICdjaGlja2VuIHRoaWdocyc6ICdjaGlja2VuX3RoaWdoJyxcbiAgJ2JlZWYnOiAnYmVlZicsXG4gICdlZ2cnOiAnZWdnJyxcbiAgJ2VnZ3MnOiAnZWdnJyxcblxuICAvLyBHcmFpbnNcbiAgJ3JpY2UnOiAncmljZScsXG4gICd3aGl0ZSByaWNlJzogJ3JpY2UnLFxuICAnYnJvd24gcmljZSc6ICdicm93bl9yaWNlJyxcbiAgJ3Bhc3RhJzogJ3Bhc3RhJyxcbiAgJ25vb2RsZSc6ICdub29kbGUnLFxuICAnbm9vZGxlcyc6ICdub29kbGUnLFxuICAnYnJlYWQnOiAnYnJlYWQnLFxuXG4gIC8vIE9pbHMgJiBGYXRzXG4gICdvaWwnOiAnb2lsJyxcbiAgJ29saXZlIG9pbCc6ICdvbGl2ZV9vaWwnLFxuICAndmVnZXRhYmxlIG9pbCc6ICd2ZWdldGFibGVfb2lsJyxcbiAgJ2J1dHRlcic6ICdidXR0ZXInLFxuXG4gIC8vIEhlcmJzICYgU3BpY2VzICh0eXBpY2FsbHkgaGFzX2l0ZW09dHJ1ZSlcbiAgJ3NhbHQnOiAnc2FsdCcsXG4gICdwZXBwZXInOiAncGVwcGVyJyxcbiAgJ2Jhc2lsJzogJ2Jhc2lsJyxcbiAgJ29yZWdhbm8nOiAnb3JlZ2FubycsXG4gICdjdW1pbic6ICdjdW1pbicsXG4gICdjaW5uYW1vbic6ICdjaW5uYW1vbicsXG4gICd0aHltZSc6ICd0aHltZScsXG5cbiAgLy8gRGFpcnlcbiAgJ21pbGsnOiAnbWlsaycsXG4gICdjaGVlc2UnOiAnY2hlZXNlJyxcbiAgJ3lvZ3VydCc6ICd5b2d1cnQnLFxufTtcblxuLyoqXG4gKiBHZXQgY2Fub25pY2FsIG5hbWUgZm9yIGFuIGluZ3JlZGllbnRcbiAqIElmIG5vdCBpbiBtYXBwaW5nLCByZXR1cm5zIGxvd2VyY2FzZWQgb3JpZ2luYWwgbmFtZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2Fub25pY2FsTmFtZShpdGVtTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbG93ZXJjYXNlZCA9IGl0ZW1OYW1lLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICByZXR1cm4gQ0FOT05JQ0FMX0ZPT0RTW2xvd2VyY2FzZWRdIHx8IGxvd2VyY2FzZWQ7XG59XG4iLCAiLyoqXG4gKiBNYWluIEV4cHJlc3Mgc2VydmVyIGZvciBTdXBwYSBiYWNrZW5kXG4gKiBSdW5zIG9uIE5ldGxpZnkgRnVuY3Rpb25zXG4gKlxuICogRW5kcG9pbnRzOlxuICogLSBQT1NUIC9hcGkvaW52ZW50b3J5IC0gQWRkIGludmVudG9yeSBpdGVtcyBmcm9tIHVzZXIgaW5wdXRcbiAqIC0gR0VUIC9hcGkvaW52ZW50b3J5IC0gR2V0IGN1cnJlbnQgYWN0aXZlIGludmVudG9yeVxuICogLSBQT1NUIC9hcGkvY2hhdCAtIFNlbmQgY2hhdCBtZXNzYWdlLCBnZXQgc3VnZ2VzdGlvbnMvcmVzcG9uc2VzXG4gKiAtIFBPU1QgL2FwaS9jb29raW5nL3N0YXJ0IC0gTWFyayByZWNpcGUgYXMgY29va2luZ1xuICogLSBQT1NUIC9hcGkvY29va2luZy9jb21wbGV0ZSAtIE1hcmsgY29va2luZyBhcyBjb21wbGV0ZSwgZGVkdWN0IGluZ3JlZGllbnRzXG4gKi9cblxuaW1wb3J0IGV4cHJlc3MsIHsgRXhwcmVzcywgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcbmltcG9ydCBjb3JzIGZyb20gJ2NvcnMnO1xuaW1wb3J0ICdkb3RlbnYvY29uZmlnJztcbmltcG9ydCBpbnZlbnRvcnlSb3V0ZXIgZnJvbSAnLi9hcGkvaW52ZW50b3J5JztcbmltcG9ydCBjaGF0Um91dGVyIGZyb20gJy4vYXBpL2NoYXQnO1xuaW1wb3J0IGNvb2tpbmdSb3V0ZXIgZnJvbSAnLi9hcGkvY29va2luZyc7XG5cbmNvbnN0IGFwcDogRXhwcmVzcyA9IGV4cHJlc3MoKTtcblxuLy8gTWlkZGxld2FyZVxuYXBwLnVzZShjb3JzKCkpO1xuYXBwLnVzZShleHByZXNzLmpzb24oKSk7XG5cbi8vIEhlYWx0aCBjaGVjayBlbmRwb2ludFxuYXBwLmdldCgnL2FwaS9oZWFsdGgnLCAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIHJlcy5qc29uKHsgc3RhdHVzOiAnb2snLCB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9KTtcbn0pO1xuXG4vLyBNb3VudCByb3V0ZXJzXG5hcHAudXNlKCcvYXBpL2ludmVudG9yeScsIGludmVudG9yeVJvdXRlcik7XG5hcHAudXNlKCcvYXBpL2NoYXQnLCBjaGF0Um91dGVyKTtcbmFwcC51c2UoJy9hcGkvY29va2luZycsIGNvb2tpbmdSb3V0ZXIpO1xuXG4vLyBFcnJvciBoYW5kbGluZyBtaWRkbGV3YXJlXG5hcHAudXNlKChlcnI6IGFueSwgcmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgIGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgfSk7XG59KTtcblxuZXhwb3J0IGRlZmF1bHQgYXBwO1xuIiwgIi8qKlxuICogSW52ZW50b3J5IEFQSSBlbmRwb2ludHNcbiAqXG4gKiBQT1NUIC9hcGkvaW52ZW50b3J5IC0gQWNjZXB0IGZyZWUtZm9ybSB1c2VyIGlucHV0LCBwYXJzZSB3aXRoIExMTSwgc3RvcmUgaXRlbXNcbiAqIEdFVCAvYXBpL2ludmVudG9yeSAtIEZldGNoIGFsbCBhY3RpdmUgaW52ZW50b3J5IGl0ZW1zIGZvciBjdXJyZW50IHVzZXJcbiAqL1xuXG5pbXBvcnQgeyBSb3V0ZXIsIFJlcXVlc3QsIFJlc3BvbnNlIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBwYXJzZUludmVudG9yeUlucHV0IH0gZnJvbSAnLi91dGlscy9wcm9tcHRzJztcbmltcG9ydCB7IGdldEludmVudG9yeSwgYWRkSW52ZW50b3J5SXRlbSB9IGZyb20gJy4vdXRpbHMvZGInO1xuaW1wb3J0IHsgSW52ZW50b3J5SXRlbSB9IGZyb20gJy4uL3NoYXJlZC90eXBlcyc7XG5cbmNvbnN0IHJvdXRlciA9IFJvdXRlcigpO1xuXG4vKipcbiAqIFBPU1QgL2FwaS9pbnZlbnRvcnlcbiAqIEFjY2VwdCBmcmVlLWZvcm0gaW52ZW50b3J5IGlucHV0IGFuZCBwYXJzZSBpdCB1c2luZyBMTE1cbiAqXG4gKiBSZXF1ZXN0IGJvZHk6XG4gKiB7XG4gKiAgIFwidXNlcl9pbnB1dFwiOiBcIjMgY2hpY2tlbiBicmVhc3RzLCAyIHRvbWF0b2VzLCBzb21lIGJhc2lsXCJcbiAqIH1cbiAqXG4gKiBSZXNwb25zZTpcbiAqIHtcbiAqICAgXCJkYXRhXCI6IFtcbiAqICAgICB7XCJpZFwiOiBcIi4uLlwiLCBcIm5hbWVcIjogXCJjaGlja2VuIGJyZWFzdFwiLCBcInF1YW50aXR5X2FwcHJveFwiOiAzLCBcInVuaXRcIjogXCJwaWVjZXNcIiwgLi4ufSxcbiAqICAgICAuLi5cbiAqICAgXVxuICogfVxuICovXG5yb3V0ZXIucG9zdCgnLycsIGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHVzZXJfaW5wdXQgfSA9IHJlcS5ib2R5O1xuXG4gICAgaWYgKCF1c2VyX2lucHV0IHx8IHR5cGVvZiB1c2VyX2lucHV0ICE9PSAnc3RyaW5nJyB8fCAhdXNlcl9pbnB1dC50cmltKCkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnTWlzc2luZyBvciBpbnZhbGlkIHVzZXJfaW5wdXQgZmllbGQnLFxuICAgICAgICBkZXRhaWxzOiAndXNlcl9pbnB1dCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZycsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBQYXJzZSB0aGUgdXNlciBpbnB1dCB1c2luZyBMTE1cbiAgICBjb25zdCBwYXJzZWRJdGVtcyA9IGF3YWl0IHBhcnNlSW52ZW50b3J5SW5wdXQodXNlcl9pbnB1dC50cmltKCkpO1xuXG4gICAgLy8gU3RvcmUgZWFjaCBwYXJzZWQgaXRlbSBpbiBkYXRhYmFzZSAod2l0aCBtZXJnZS1vbi1hZGQgZGVkdXBsaWNhdGlvbilcbiAgICBjb25zdCBzdG9yZWRJdGVtczogSW52ZW50b3J5SXRlbVtdID0gW107XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHBhcnNlZEl0ZW1zKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzdG9yZWQgPSBhd2FpdCBhZGRJbnZlbnRvcnlJdGVtKGl0ZW0pO1xuICAgICAgICBzdG9yZWRJdGVtcy5wdXNoKHN0b3JlZCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gc3RvcmUgaXRlbSAke2l0ZW0ubmFtZX06YCwgZXJyb3IpO1xuICAgICAgICAvLyBDb250aW51ZSB3aXRoIG5leHQgaXRlbSBpbnN0ZWFkIG9mIGZhaWxpbmcgZW50aXJlIHJlcXVlc3RcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXMuc3RhdHVzKDIwMSkuanNvbih7XG4gICAgICBkYXRhOiBzdG9yZWRJdGVtcyxcbiAgICAgIGNvdW50OiBzdG9yZWRJdGVtcy5sZW5ndGgsXG4gICAgICBtZXNzYWdlOiBgUGFyc2VkIGFuZCBzdG9yZWQgJHtzdG9yZWRJdGVtcy5sZW5ndGh9IGludmVudG9yeSBpdGVtc2AsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gUE9TVCAvYXBpL2ludmVudG9yeTonLCBlcnJvcik7XG5cbiAgICBjb25zdCBlcnJvck1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcblxuICAgIGlmIChlcnJvck1zZy5pbmNsdWRlcygnU1VQQUJBU0UnKSB8fCBlcnJvck1zZy5pbmNsdWRlcygnT1BFTkFJJykpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnU2VydmljZSBjb25maWd1cmF0aW9uIGVycm9yJyxcbiAgICAgICAgZGV0YWlsczogZXJyb3JNc2csXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICBlcnJvcjogJ0ZhaWxlZCB0byBwYXJzZSBpbnZlbnRvcnknLFxuICAgICAgZGV0YWlsczogZXJyb3JNc2csXG4gICAgfSk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIEdFVCAvYXBpL2ludmVudG9yeVxuICogRmV0Y2ggYWxsIGFjdGl2ZSBpbnZlbnRvcnkgaXRlbXMgZm9yIHRoZSBjdXJyZW50IHVzZXJcbiAqXG4gKiBRdWVyeSBwYXJhbWV0ZXJzOlxuICogLSBsaW1pdCAob3B0aW9uYWwpOiBNYXggbnVtYmVyIG9mIGl0ZW1zIHRvIHJldHVybiAoZGVmYXVsdDogMTAwKVxuICpcbiAqIFJlc3BvbnNlOlxuICoge1xuICogICBcImRhdGFcIjogW1xuICogICAgIHtcImlkXCI6IFwiLi4uXCIsIFwibmFtZVwiOiBcImNoaWNrZW4gYnJlYXN0XCIsIFwicXVhbnRpdHlfYXBwcm94XCI6IDMsIFwidW5pdFwiOiBcInBpZWNlc1wiLCAuLi59LFxuICogICAgIC4uLlxuICogICBdLFxuICogICBcImNvdW50XCI6IDVcbiAqIH1cbiAqL1xucm91dGVyLmdldCgnLycsIGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBpdGVtcyA9IGF3YWl0IGdldEludmVudG9yeSgpO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgZGF0YTogaXRlbXMsXG4gICAgICBjb3VudDogaXRlbXMubGVuZ3RoLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIEdFVCAvYXBpL2ludmVudG9yeTonLCBlcnJvcik7XG5cbiAgICBjb25zdCBlcnJvck1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcblxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIGVycm9yOiAnRmFpbGVkIHRvIGZldGNoIGludmVudG9yeScsXG4gICAgICBkZXRhaWxzOiBlcnJvck1zZyxcbiAgICB9KTtcbiAgfVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjtcbiIsICIvKipcbiAqIExMTSBwcm9tcHQgdXRpbGl0aWVzIGZvciBpbnZlbnRvcnkgcGFyc2luZywgbWVhbCBzdWdnZXN0aW9ucywgYW5kIHJlY2lwZSBnZW5lcmF0aW9uXG4gKiBVc2VzIE9wZW5BSSBHUFQtNG8gbWluaSBmb3IgYWxsIG5hdHVyYWwgbGFuZ3VhZ2UgcHJvY2Vzc2luZ1xuICpcbiAqIEtleSBwYXR0ZXJuOiBBbHdheXMgcmVxdWVzdCBKU09OLW9ubHkgcmVzcG9uc2VzIGZyb20gdGhlIExMTSB0byBhdm9pZCBwYXJzaW5nIGNvbmZ1c2lvblxuICovXG5cbmltcG9ydCBPcGVuQUkgZnJvbSAnb3BlbmFpJztcbmltcG9ydCB7IEludmVudG9yeUl0ZW0sIFJlY2lwZSwgUmVjaXBlRGV0YWlsIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcblxubGV0IG9wZW5haUNsaWVudDogT3BlbkFJIHwgbnVsbCA9IG51bGw7XG5cbi8qKlxuICogR2V0IG9yIGNyZWF0ZSBPcGVuQUkgY2xpZW50XG4gKiBVc2VzIE9QRU5BSV9BUElfS0VZIGZyb20gZW52aXJvbm1lbnRcbiAqL1xuZnVuY3Rpb24gZ2V0T3BlbkFJQ2xpZW50KCk6IE9wZW5BSSB7XG4gIGlmICghb3BlbmFpQ2xpZW50KSB7XG4gICAgY29uc3QgYXBpS2V5ID0gcHJvY2Vzcy5lbnYuT1BFTkFJX0FQSV9LRVk7XG4gICAgaWYgKCFhcGlLZXkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT1BFTkFJX0FQSV9LRVkgbXVzdCBiZSBzZXQgaW4gZW52aXJvbm1lbnQnKTtcbiAgICB9XG4gICAgb3BlbmFpQ2xpZW50ID0gbmV3IE9wZW5BSSh7IGFwaUtleSB9KTtcbiAgfVxuICByZXR1cm4gb3BlbmFpQ2xpZW50O1xufVxuXG4vKipcbiAqIFBhcnNlIGZyZWUtZm9ybSBpbnZlbnRvcnkgaW5wdXQgaW50byBzdHJ1Y3R1cmVkIGl0ZW1zXG4gKlxuICogRXhhbXBsZXM6XG4gKiAtIFwiMyBjaGlja2VuIGJyZWFzdHMsIDIgdG9tYXRvZXNcIiAtPiBbe25hbWU6IFwiY2hpY2tlbiBicmVhc3RzXCIsIGNhbm9uaWNhbF9uYW1lOiBcImNoaWNrZW5fYnJlYXN0XCIsIHF1YW50aXR5X2FwcHJveDogMywgdW5pdDogXCJwaWVjZXNcIn0sIC4uLl1cbiAqIC0gXCJzb21lIHJpY2UsIGEgYnVuY2ggb2Ygc3BpbmFjaFwiIC0+IHBhcnNlZCB3aXRoIGFwcHJveGltYXRlIHF1YW50aXRpZXNcbiAqIC0gXCIyMDBnIGJlZWYsIDIgY3VwcyBmbG91clwiIC0+IHF1YW50aXRpZXMgYW5kIHVuaXRzIGV4dHJhY3RlZFxuICogLSBcInNhbHQgYW5kIHBlcHBlclwiIC0+IGhhc19pdGVtOiB0cnVlLCBjb25maWRlbmNlOiBcImV4YWN0XCJcbiAqXG4gKiBAcGFyYW0gdXNlcklucHV0IC0gRnJlZS1mb3JtIHRleHQgbGlrZSBcIjMgY2hpY2tlbiBicmVhc3RzLCBzb21lIHRvbWF0b2VzXCJcbiAqIEByZXR1cm5zIEFycmF5IG9mIEludmVudG9yeUl0ZW0gb2JqZWN0cyAod2l0aG91dCBpZCwgdXNlcl9pZCwgZGF0ZXMgLSBhZGRlZCBieSBEQilcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlSW52ZW50b3J5SW5wdXQoXG4gIHVzZXJJbnB1dDogc3RyaW5nXG4pOiBQcm9taXNlPE9taXQ8SW52ZW50b3J5SXRlbSwgJ2lkJyB8ICd1c2VyX2lkJyB8ICdkYXRlX2FkZGVkJyB8ICdkYXRlX3VzZWQnPltdPiB7XG4gIGNvbnN0IGNsaWVudCA9IGdldE9wZW5BSUNsaWVudCgpO1xuICBjb25zdCB7IGdldENhbm9uaWNhbE5hbWUgfSA9IGF3YWl0IGltcG9ydCgnLi9jYW5vbmljYWwtZm9vZHMnKTtcblxuICBjb25zdCBzeXN0ZW1Qcm9tcHQgPSBgWW91IGFyZSBhIGtpdGNoZW4gaW52ZW50b3J5IHBhcnNlci4gWW91ciBqb2IgaXMgdG8gZXh0cmFjdCBmb29kIGl0ZW1zIGZyb20gdXNlciBpbnB1dC5cblxuRm9yIGVhY2ggaXRlbSwgZXh0cmFjdDpcbjEuIG5hbWU6IFRoZSBmb29kIGl0ZW0gKHdoYXQgdXNlciBzYWlkLCBlLmcuLCBcImNoaWNrZW4gYnJlYXN0c1wiLCBcInNvbWUgc2FsYWRcIilcbjIuIGNhbm9uaWNhbF9uYW1lOiBOb3JtYWxpemVkIHZlcnNpb24gKGUuZy4sIFwiY2hpY2tlbl9icmVhc3RcIiwgXCJzYWxhZF9sZWF2ZXNcIikgLSB5b3UnbGwgY29tcHV0ZSB0aGlzIGZyb20gbmFtZVxuMy4gaGFzX2l0ZW06IGJvb2xlYW4uIFRydWUgT05MWSBmb3IgcGFudHJ5IHN0YXBsZXMgd2hlcmUgcXVhbnRpdHkgZG9lc24ndCBtYXR0ZXIgKHNhbHQsIHNwaWNlcywgb2lscywgY29uZGltZW50cylcbjQuIHF1YW50aXR5X2FwcHJveDogVGhlIHF1YW50aXR5IGFzIGEgbnVtYmVyLiBGb3IgYXBwcm94aW1hdGUgcXVhbnRpdGllcywgdXNlIGJlc3QganVkZ21lbnQ6XG4gICAtIFwic29tZVwiIC8gXCJhIGxpdHRsZVwiIC8gXCJhIGJpdFwiID0gMVxuICAgLSBcImEgYnVuY2hcIiAvIFwiaGFuZGZ1bFwiIC8gXCJxdWl0ZSBhIGJpdFwiID0gMlxuICAgLSBcImxvdHNcIiAvIFwiYSBsb3RcIiAvIFwicGxlbnR5XCIgPSA0XG4gICAtIEZyYWN0aW9uczogcGFyc2UgbGl0ZXJhbGx5IChcImhhbGZcIiA9IDAuNSwgXCIxLzNcIiA9IDAuMzMpXG4gICAtIEZvciBoYXNfaXRlbT10cnVlIGl0ZW1zLCBxdWFudGl0eV9hcHByb3ggPSBudWxsXG41LiB1bml0OiBUaGUgdW5pdCBvZiBtZWFzdXJlbWVudC4gVXNlIHN0YW5kYXJkIHVuaXRzOlxuICAgLSBcInBpZWNlc1wiIG9yIFwiY291bnRcIiBmb3IgaW5kaXZpZHVhbCBpdGVtc1xuICAgLSBcImdcIiBmb3IgZ3JhbXNcbiAgIC0gXCJtbFwiIGZvciBtaWxsaWxpdGVyc1xuICAgLSBcImN1cFwiIGZvciBjdXBzXG4gICAtIFwidGJzcFwiIGZvciB0YWJsZXNwb29uc1xuICAgLSBcImJ1bmNoXCIgZm9yIGJ1bmNoZXNcbiAgIC0gTGVhdmUgYmxhbmsgaWYgbm8gdW5pdCBhcHBsaWVzXG42LiBjb25maWRlbmNlOiBcImV4YWN0XCIgaWYgdXNlciBzcGVjaWZpZWQgcXVhbnRpdHkgcHJlY2lzZWx5LCBcImFwcHJveGltYXRlXCIgaWYgZXN0aW1hdGVkXG5cblJldHVybiBPTkxZIGEgSlNPTiBhcnJheSwgbm8gb3RoZXIgdGV4dC4gRXhhbXBsZSBmb3JtYXQ6XG5bXG4gIHtcIm5hbWVcIjogXCJjaGlja2VuIGJyZWFzdFwiLCBcImNhbm9uaWNhbF9uYW1lXCI6IFwiY2hpY2tlbl9icmVhc3RcIiwgXCJxdWFudGl0eV9hcHByb3hcIjogMywgXCJ1bml0XCI6IFwicGllY2VzXCIsIFwiY29uZmlkZW5jZVwiOiBcImV4YWN0XCJ9LFxuICB7XCJuYW1lXCI6IFwic2FsdFwiLCBcImNhbm9uaWNhbF9uYW1lXCI6IFwic2FsdFwiLCBcImhhc19pdGVtXCI6IHRydWUsIFwicXVhbnRpdHlfYXBwcm94XCI6IG51bGwsIFwidW5pdFwiOiBudWxsLCBcImNvbmZpZGVuY2VcIjogXCJleGFjdFwifSxcbiAge1wibmFtZVwiOiBcInNvbWUgc2FsYWRcIiwgXCJjYW5vbmljYWxfbmFtZVwiOiBcInNhbGFkX2xlYXZlc1wiLCBcInF1YW50aXR5X2FwcHJveFwiOiAxLCBcInVuaXRcIjogbnVsbCwgXCJjb25maWRlbmNlXCI6IFwiYXBwcm94aW1hdGVcIn1cbl1cblxuQ2F0ZWdvcmllczpcbjEuIFBhbnRyeSBzdGFwbGVzIChzYWx0LCBzcGljZXMsIG9pbHMpOiBoYXNfaXRlbT10cnVlLCBjb25maWRlbmNlPVwiZXhhY3RcIlxuMi4gRXhhY3QgcXVhbnRpdGllcyAoNTAwZyBiZWVmLCAzIGFwcGxlcyk6IGNvbmZpZGVuY2U9XCJleGFjdFwiXG4zLiBFeGFjdCBjb3VudHMgKDIgY2hpY2tlbiBicmVhc3RzKTogdW5pdD1cInBpZWNlc1wiLCBjb25maWRlbmNlPVwiZXhhY3RcIlxuNC4gUm91Z2ggcXVhbnRpdGllcyAoc29tZSBzYWxhZCwgbG90cyBvZiBjYXJyb3RzKTogY29uZmlkZW5jZT1cImFwcHJveGltYXRlXCJcblxuSGFuZGxlIGVkZ2UgY2FzZXM6XG4tIElnbm9yZSBhcnRpY2xlcyBsaWtlIFwiYVwiLCBcImFuXCIsIFwidGhlXCJcbi0gTm9ybWFsaXplIGl0ZW0gbmFtZXMgKGUuZy4sIFwidG9tYXRvZXNcIiBcdTIxOTIgXCJ0b21hdG9cIilcbi0gRXh0cmFjdCB1bml0cyBmcm9tIGNvbXBvdW5kIGl0ZW1zIChlLmcuLCBcIjIgdGFibGVzcG9vbnMgb2Ygb2lsXCIgXHUyMTkyIG5hbWU6IFwib2lsXCIsIHF1YW50aXR5X2FwcHJveDogMiwgdW5pdDogXCJ0YnNwXCIpYDtcblxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2xpZW50LmNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgIG1vZGVsOiAnZ3B0LTRvLW1pbmknLFxuICAgICAgbWF4X3Rva2VuczogMTAyNCxcbiAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICBjb250ZW50OiBzeXN0ZW1Qcm9tcHQsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgY29udGVudDogYFBhcnNlIHRoaXMgaW52ZW50b3J5IGlucHV0OiBcIiR7dXNlcklucHV0fVwiYCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBFeHRyYWN0IHRleHQgZnJvbSByZXNwb25zZVxuICAgIGNvbnN0IG1lc3NhZ2UgPSByZXNwb25zZS5jaG9pY2VzWzBdLm1lc3NhZ2U7XG4gICAgaWYgKCFtZXNzYWdlLmNvbnRlbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRW1wdHkgcmVzcG9uc2UgZnJvbSBPcGVuQUknKTtcbiAgICB9XG5cbiAgICAvLyBQYXJzZSBKU09OIGZyb20gcmVzcG9uc2VcbiAgICBjb25zdCBqc29uTWF0Y2ggPSBtZXNzYWdlLmNvbnRlbnQubWF0Y2goL1xcW1tcXHNcXFNdKlxcXS8pO1xuICAgIGlmICghanNvbk1hdGNoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBmaW5kIEpTT04gYXJyYXkgaW4gcmVzcG9uc2UnKTtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25NYXRjaFswXSk7XG5cbiAgICAvLyBWYWxpZGF0ZSBzdHJ1Y3R1cmVcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocGFyc2VkKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZXNwb25zZSBpcyBub3QgYW4gYXJyYXknKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyc2VkLm1hcCgoaXRlbTogYW55KSA9PiAoe1xuICAgICAgbmFtZTogaXRlbS5uYW1lIHx8ICcnLFxuICAgICAgY2Fub25pY2FsX25hbWU6IGl0ZW0uY2Fub25pY2FsX25hbWUgfHwgZ2V0Q2Fub25pY2FsTmFtZShpdGVtLm5hbWUgfHwgJycpLFxuICAgICAgaGFzX2l0ZW06IGl0ZW0uaGFzX2l0ZW0gfHwgZmFsc2UsXG4gICAgICBxdWFudGl0eV9hcHByb3g6IGl0ZW0ucXVhbnRpdHlfYXBwcm94IHx8IG51bGwsXG4gICAgICB1bml0OiBpdGVtLnVuaXQgfHwgbnVsbCxcbiAgICAgIGNvbmZpZGVuY2U6IGl0ZW0uY29uZmlkZW5jZSB8fCAnYXBwcm94aW1hdGUnLFxuICAgIH0pKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwYXJzaW5nIGludmVudG9yeSBpbnB1dDonLCBlcnJvcik7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEZhaWxlZCB0byBwYXJzZSBpbnZlbnRvcnk6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWBcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogU3VnZ2VzdCBtZWFscyBiYXNlZCBvbiBjdXJyZW50IGludmVudG9yeSBhbmQgbWVhbCB0eXBlXG4gKlxuICogQHBhcmFtIGludmVudG9yeUl0ZW1zIC0gQXJyYXkgb2YgaXRlbXMgaW4gdXNlcidzIGludmVudG9yeVxuICogQHBhcmFtIG1lYWxUeXBlIC0gVHlwZSBvZiBtZWFsOiAnYnJlYWtmYXN0JywgJ2x1bmNoJywgb3IgJ2Rpbm5lcidcbiAqIEByZXR1cm5zIEFycmF5IG9mIFJlY2lwZSBzdWdnZXN0aW9ucyAobmFtZSwgZGVzY3JpcHRpb24sIHRpbWVfZXN0aW1hdGVfbWlucylcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN1Z2dlc3RNZWFscyhcbiAgaW52ZW50b3J5SXRlbXM6IEludmVudG9yeUl0ZW1bXSxcbiAgbWVhbFR5cGU6ICdicmVha2Zhc3QnIHwgJ2x1bmNoJyB8ICdkaW5uZXInXG4pOiBQcm9taXNlPFJlY2lwZVtdPiB7XG4gIGNvbnN0IGNsaWVudCA9IGdldE9wZW5BSUNsaWVudCgpO1xuXG4gIGNvbnN0IGludmVudG9yeUxpc3QgPSBpbnZlbnRvcnlJdGVtc1xuICAgIC5tYXAoKGl0ZW0pID0+IHtcbiAgICAgIGlmIChpdGVtLmhhc19pdGVtKSB7XG4gICAgICAgIHJldHVybiBgLSAke2l0ZW0ubmFtZX0gKGF2YWlsYWJsZSlgO1xuICAgICAgfVxuICAgICAgY29uc3QgcXR5ID0gaXRlbS5xdWFudGl0eV9hcHByb3ggPyBgJHtpdGVtLnF1YW50aXR5X2FwcHJveH0ke2l0ZW0udW5pdCA/ICcgJyArIGl0ZW0udW5pdCA6ICcnfWAgOiAnc29tZSc7XG4gICAgICByZXR1cm4gYC0gJHtpdGVtLm5hbWV9ICgke3F0eX0pYDtcbiAgICB9KVxuICAgIC5qb2luKCdcXG4nKTtcblxuICBjb25zdCBzeXN0ZW1Qcm9tcHQgPSBgWW91IGFyZSBhIGNyZWF0aXZlIG1lYWwgc3VnZ2VzdGlvbiBlbmdpbmUuIEdpdmVuIGEgbGlzdCBvZiBhdmFpbGFibGUgaW5ncmVkaWVudHMsIHN1Z2dlc3QgMy01IHJlY2lwZXMgdGhhdCBjYW4gYmUgbWFkZS5cblxuQ1JJVElDQUwgQ09OU1RSQUlOVDogWW91IGNhbiBPTkxZIHN1Z2dlc3QgbWVhbHMgdXNpbmcgT05MWSB0aGVzZSBpbmdyZWRpZW50czpcbiR7aW52ZW50b3J5TGlzdH1cblxuRG8gTk9UIHN1Z2dlc3QgYW55IG1lYWxzIHRoYXQgcmVxdWlyZSBpbmdyZWRpZW50cyBub3QgaW4gdGhpcyBsaXN0LlxuRG8gTk9UIGFzc3VtZSB0aGUgdXNlciBoYXMgc2FsdCwgb2lsLCBidXR0ZXIsIHNwaWNlcywgd2F0ZXIsIG9yIGFueSBwYW50cnkgaXRlbXMuXG5EbyBOT1QgYWRkLCBhc3N1bWUsIG9yIHN1Z2dlc3QgYW55IG90aGVyIGluZ3JlZGllbnRzLlxuXG5Gb3IgZWFjaCByZWNpcGUsIHByb3ZpZGU6XG4xLiBuYW1lOiBSZWNpcGUgbmFtZVxuMi4gZGVzY3JpcHRpb246IE1lbnUtc3R5bGUgZGVzY3JpcHRpb24gd2l0aCBoZWFsdGgvY2hhcmFjdGVyIG5vdGVzLiBFeGFtcGxlOiBcIlBhbi1zZWFyZWQgY2hpY2tlbiB3aXRoIGZyZXNoIHRvbWF0b2VzIGFuZCBiYXNpbC4gTGlnaHQsIHByb3RlaW4tcmljaCwgYW5kIG5hdHVyYWxseSBmcmVzaC5cIlxuMy4gdGltZV9lc3RpbWF0ZV9taW5zOiBFc3RpbWF0ZWQgY29va2luZyB0aW1lIGluIG1pbnV0ZXNcblxuUmV0dXJuIE9OTFkgYSBKU09OIG9iamVjdCB3aXRoIGEgXCJyZWNpcGVzXCIgYXJyYXksIG5vIG90aGVyIHRleHQuIEV4YW1wbGUgZm9ybWF0Olxue1xuICBcInJlY2lwZXNcIjogW1xuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcIlRvbWF0byBCYXNpbCBTYWxhZFwiLFxuICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZyZXNoIHRvbWF0b2VzIGFuZCBiYXNpbC4gU2ltcGxlLCBsaWdodCwgYW5kIG5hdHVyYWxseSBmcmVzaC5cIixcbiAgICAgIFwidGltZV9lc3RpbWF0ZV9taW5zXCI6IDVcbiAgICB9XG4gIF1cbn1cblxuRm9jdXMgb24gcmVjaXBlcyB0aGF0OlxuLSBVc2UgaW5ncmVkaWVudHMgZnJvbSB0aGUgaW52ZW50b3J5IChwcmlvcml0aXplIHVzaW5nIG11bHRpcGxlIGl0ZW1zKVxuLSBBcmUgcmVhbGlzdGljIGZvciBhIGhvbWUgY29va1xuLSBNYXRjaCB0aGUgbWVhbCB0eXBlIChicmVha2Zhc3QgPSBxdWljay9saWdodCwgbHVuY2ggPSBiYWxhbmNlZCwgZGlubmVyID0gaGVhcnR5KWA7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsaWVudC5jaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgIG1heF90b2tlbnM6IDIwNDgsXG4gICAgICBtZXNzYWdlczogW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgY29udGVudDogc3lzdGVtUHJvbXB0LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgIGNvbnRlbnQ6IGBBdmFpbGFibGUgaW52ZW50b3J5IGZvciAke21lYWxUeXBlfTpcXG4ke2ludmVudG9yeUxpc3R9XFxuXFxuU3VnZ2VzdCAzLTQgJHttZWFsVHlwZX0gcmVjaXBlcyBJIGNhbiBtYWtlLmAsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbWVzc2FnZSA9IHJlc3BvbnNlLmNob2ljZXNbMF0ubWVzc2FnZTtcbiAgICBpZiAoIW1lc3NhZ2UuY29udGVudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFbXB0eSByZXNwb25zZSBmcm9tIE9wZW5BSScpO1xuICAgIH1cblxuICAgIGNvbnN0IGpzb25NYXRjaCA9IG1lc3NhZ2UuY29udGVudC5tYXRjaCgvXFx7W1xcc1xcU10qXFx9Lyk7XG4gICAgaWYgKCFqc29uTWF0Y2gpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGZpbmQgSlNPTiBvYmplY3QgaW4gcmVzcG9uc2UnKTtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25NYXRjaFswXSk7XG5cbiAgICAvLyBWYWxpZGF0ZSBzdHJ1Y3R1cmVcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocGFyc2VkLnJlY2lwZXMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jlc3BvbnNlIHJlY2lwZXMgaXMgbm90IGFuIGFycmF5Jyk7XG4gICAgfVxuXG4gICAgcGFyc2VkLnJlY2lwZXMuZm9yRWFjaCgocmVjaXBlOiBhbnkpID0+IHtcbiAgICAgIGlmICghcmVjaXBlLm5hbWUgfHwgIXJlY2lwZS5kZXNjcmlwdGlvbiB8fCByZWNpcGUudGltZV9lc3RpbWF0ZV9taW5zID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHJlY2lwZSBzdHJ1Y3R1cmU6ICR7SlNPTi5zdHJpbmdpZnkocmVjaXBlKX1gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBwYXJzZWQucmVjaXBlcztcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzdWdnZXN0aW5nIG1lYWxzOicsIGVycm9yKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRmFpbGVkIHRvIHN1Z2dlc3QgbWVhbHM6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWBcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGUgZGV0YWlsZWQgcmVjaXBlIHdpdGggZnVsbCBpbmdyZWRpZW50cyBsaXN0IGFuZCBzdGVwLWJ5LXN0ZXAgaW5zdHJ1Y3Rpb25zXG4gKlxuICogQHBhcmFtIHJlY2lwZU5hbWUgLSBOYW1lIG9mIHRoZSByZWNpcGUgKGUuZy4sIFwiVG9tYXRvIEJhc2lsIENoaWNrZW5cIilcbiAqIEBwYXJhbSByZWNpcGVEZXNjcmlwdGlvbiAtIE1lbnUtc3R5bGUgZGVzY3JpcHRpb24gZnJvbSBtZWFsIHN1Z2dlc3Rpb25cbiAqIEBwYXJhbSB1c2VySW52ZW50b3J5IC0gQXJyYXkgb2YgaXRlbXMgaW4gdXNlcidzIGludmVudG9yeVxuICogQHJldHVybnMgRnVsbCBSZWNpcGVEZXRhaWwgd2l0aCBpbmdyZWRpZW50cyBsaXN0IGFuZCBpbnN0cnVjdGlvbnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlUmVjaXBlRGV0YWlsKFxuICByZWNpcGVOYW1lOiBzdHJpbmcsXG4gIHJlY2lwZURlc2NyaXB0aW9uOiBzdHJpbmcsXG4gIHVzZXJJbnZlbnRvcnk6IEludmVudG9yeUl0ZW1bXVxuKTogUHJvbWlzZTxSZWNpcGVEZXRhaWw+IHtcbiAgY29uc3QgY2xpZW50ID0gZ2V0T3BlbkFJQ2xpZW50KCk7XG5cbiAgY29uc3QgaW52ZW50b3J5TmFtZXMgPSB1c2VySW52ZW50b3J5Lm1hcChpID0+IGkubmFtZSkuam9pbignLCAnKTtcbiAgY29uc3QgaW52ZW50b3J5U2V0ID0gbmV3IFNldChcbiAgICB1c2VySW52ZW50b3J5LmZsYXRNYXAoaSA9PiBbXG4gICAgICBpLm5hbWUudG9Mb3dlckNhc2UoKSxcbiAgICAgIGkuY2Fub25pY2FsX25hbWU/LnRvTG93ZXJDYXNlKCkgfHwgaS5uYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgXSlcbiAgKTtcblxuICBjb25zdCBzeXN0ZW1Qcm9tcHQgPSBgWW91IGFyZSBhIGRldGFpbGVkIHJlY2lwZSB3cml0ZXIuIEdpdmVuIGEgcmVjaXBlIG5hbWUsIGRlc2NyaXB0aW9uLCBhbmQgYXZhaWxhYmxlIGluZ3JlZGllbnRzLCBleHBhbmQgaXQgaW50byBhIGZ1bGwgcmVjaXBlLlxuXG5DUklUSUNBTDogWW91IGNhbiBPTkxZIHVzZSB0aGVzZSBpbmdyZWRpZW50czpcbiR7aW52ZW50b3J5TmFtZXN9XG5cbkRvIE5PVCBhZGQgc2FsdCwgb2lsLCBidXR0ZXIsIHdhdGVyLCBzcGljZXMsIG9yIGFueSBpbmdyZWRpZW50cyBub3QgbGlzdGVkIGFib3ZlLlxuRXZlcnkgc2luZ2xlIGluZ3JlZGllbnQgaW4geW91ciByZWNpcGUgbXVzdCBiZSBmcm9tIHRoZSBsaXN0IGFib3ZlLlxuSWYgeW91IGNhbm5vdCBjcmVhdGUgYSB2YWxpZCByZWNpcGUgdXNpbmcgT05MWSB0aGVzZSBpbmdyZWRpZW50cywgc2F5IHNvLlxuXG5SZWNpcGU6ICR7cmVjaXBlTmFtZX1cbkRlc2NyaXB0aW9uOiAke3JlY2lwZURlc2NyaXB0aW9ufVxuXG5Gb3IgdGhlIHJlY2lwZSwgcHJvdmlkZTpcbjEuIG5hbWU6IFJlY2lwZSBuYW1lXG4yLiBkZXNjcmlwdGlvbjogVGhlIGRlc2NyaXB0aW9uIHByb3ZpZGVkXG4zLiB0aW1lX2VzdGltYXRlX21pbnM6IEVzdGltYXRlZCB0b3RhbCBjb29raW5nIHRpbWUgaW4gbWludXRlc1xuNC4gaW5ncmVkaWVudHM6IEZ1bGwgaW5ncmVkaWVudHMgbGlzdCB3aXRoIHF1YW50aXRpZXMgYW5kIHVuaXRzLiBFeGFtcGxlOlxuICAgW1xuICAgICB7XCJuYW1lXCI6IFwiY2hpY2tlblwiLCBcInF1YW50aXR5XCI6IDIsIFwidW5pdFwiOiBcInBpZWNlc1wifSxcbiAgICAge1wibmFtZVwiOiBcInRvbWF0b1wiLCBcInF1YW50aXR5XCI6IDMsIFwidW5pdFwiOiBcInBpZWNlc1wifVxuICAgXVxuNS4gaW5zdHJ1Y3Rpb25zOiBTdGVwLWJ5LXN0ZXAgY29va2luZyBpbnN0cnVjdGlvbnMgYXMgYW4gYXJyYXkgb2Ygc3RyaW5nc1xuXG5SZXR1cm4gT05MWSBhIEpTT04gb2JqZWN0LCBubyBvdGhlciB0ZXh0LiBFeGFtcGxlIGZvcm1hdDpcbntcbiAgXCJuYW1lXCI6IFwiVG9tYXRvIEJhc2lsIENoaWNrZW5cIixcbiAgXCJkZXNjcmlwdGlvblwiOiBcIlBhbi1zZWFyZWQgY2hpY2tlbiB3aXRoIGZyZXNoIHRvbWF0b2VzIGFuZCBiYXNpbC4gTGlnaHQgYW5kIGZyZXNoLlwiLFxuICBcInRpbWVfZXN0aW1hdGVfbWluc1wiOiAyNSxcbiAgXCJpbmdyZWRpZW50c1wiOiBbXG4gICAge1wibmFtZVwiOiBcImNoaWNrZW5cIiwgXCJxdWFudGl0eVwiOiAyLCBcInVuaXRcIjogXCJwaWVjZXNcIn0sXG4gICAge1wibmFtZVwiOiBcInRvbWF0b1wiLCBcInF1YW50aXR5XCI6IDMsIFwidW5pdFwiOiBcInBpZWNlc1wifSxcbiAgICB7XCJuYW1lXCI6IFwiYmFzaWxcIiwgXCJxdWFudGl0eVwiOiA1LCBcInVuaXRcIjogXCJsZWF2ZXNcIn1cbiAgXSxcbiAgXCJpbnN0cnVjdGlvbnNcIjogW1xuICAgIFwiSGVhdCBhIHBhbiBvdmVyIG1lZGl1bS1oaWdoIGhlYXRcIixcbiAgICBcIkFkZCBjaGlja2VuIGFuZCBjb29rIGZvciA1LTYgbWludXRlcyBwZXIgc2lkZVwiLFxuICAgIFwiRGljZSB0b21hdG9lcyBhbmQgYWRkIHRvIHBhblwiLFxuICAgIFwiVGVhciBiYXNpbCBhbmQgc3ByaW5rbGUgb3ZlclwiLFxuICAgIFwiU2ltbWVyIGZvciA1IG1pbnV0ZXNcIixcbiAgICBcIlNlcnZlXCJcbiAgXVxufWA7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsaWVudC5jaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgIG1heF90b2tlbnM6IDIwNDgsXG4gICAgICBtZXNzYWdlczogW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgY29udGVudDogc3lzdGVtUHJvbXB0LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgIGNvbnRlbnQ6IGBFeHBhbmQgdGhpcyByZWNpcGUgaW50byBmdWxsIGRldGFpbHMgdXNpbmcgT05MWSBhdmFpbGFibGUgaW5ncmVkaWVudHM6XFxuTmFtZTogJHtyZWNpcGVOYW1lfVxcbkRlc2NyaXB0aW9uOiAke3JlY2lwZURlc2NyaXB0aW9ufWAsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbWVzc2FnZSA9IHJlc3BvbnNlLmNob2ljZXNbMF0ubWVzc2FnZTtcbiAgICBpZiAoIW1lc3NhZ2UuY29udGVudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFbXB0eSByZXNwb25zZSBmcm9tIE9wZW5BSScpO1xuICAgIH1cblxuICAgIGNvbnN0IGpzb25NYXRjaCA9IG1lc3NhZ2UuY29udGVudC5tYXRjaCgvXFx7W1xcc1xcU10qXFx9Lyk7XG4gICAgaWYgKCFqc29uTWF0Y2gpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGZpbmQgSlNPTiBvYmplY3QgaW4gcmVzcG9uc2UnKTtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25NYXRjaFswXSk7XG5cbiAgICAvLyBQT1NULVZBTElEQVRJT046IENoZWNrIHRoYXQgZXZlcnkgaW5ncmVkaWVudCBpcyBpbiB1c2VyJ3MgaW52ZW50b3J5XG4gICAgY29uc3QgaW52YWxpZEluZ3JlZGllbnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIHBhcnNlZC5pbmdyZWRpZW50cy5mb3JFYWNoKChpbmc6IGFueSkgPT4ge1xuICAgICAgY29uc3QgaW5nTmFtZSA9IGluZy5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAoIWludmVudG9yeVNldC5oYXMoaW5nTmFtZSkpIHtcbiAgICAgICAgaW52YWxpZEluZ3JlZGllbnRzLnB1c2goaW5nLm5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGludmFsaWRJbmdyZWRpZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBSZWNpcGUgc3VnZ2VzdHMgdW5hdmFpbGFibGUgaW5ncmVkaWVudHM6ICR7aW52YWxpZEluZ3JlZGllbnRzLmpvaW4oJywgJyl9LiBgICtcbiAgICAgICAgYEF2YWlsYWJsZTogJHtpbnZlbnRvcnlOYW1lc31gXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJzZWQ7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyByZWNpcGUgZGV0YWlsOicsIGVycm9yKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRmFpbGVkIHRvIGdlbmVyYXRlIHJlY2lwZSBkZXRhaWw6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWBcbiAgICApO1xuICB9XG59XG4iLCAiLyoqXG4gKiBQb2NrZXRCYXNlIGRhdGFiYXNlIGhlbHBlciBmdW5jdGlvbnNcbiAqIEhhbmRsZXMgYWxsIGRhdGFiYXNlIG9wZXJhdGlvbnMgZm9yIGludmVudG9yeSBhbmQgY2hhdCBoaXN0b3J5XG4gKiBVc2VzIFBvY2tldEJhc2UgUkVTVCBBUEkgaW5zdGVhZCBvZiBTdXBhYmFzZSBTREtcbiAqL1xuXG5pbXBvcnQgeyBJbnZlbnRvcnlJdGVtLCBDaGF0TWVzc2FnZSB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5cbi8qKlxuICogR2V0IFBvY2tldEJhc2UgVVJMIGZyb20gZW52aXJvbm1lbnRcbiAqIE11c3QgYmUgc2V0IHRvIGxvY2FsIChodHRwOi8vbG9jYWxob3N0OjgwOTApIG9yIGRlcGxveW1lbnQgVVJMXG4gKi9cbmZ1bmN0aW9uIGdldFBvY2tldEJhc2VVcmwoKTogc3RyaW5nIHtcbiAgY29uc3QgdXJsID0gcHJvY2Vzcy5lbnYuUE9DS0VUQkFTRV9VUkw7XG4gIGlmICghdXJsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQT0NLRVRCQVNFX1VSTCBtdXN0IGJlIHNldCBpbiBlbnZpcm9ubWVudCcpO1xuICB9XG4gIHJldHVybiB1cmwucmVwbGFjZSgvXFwvJC8sICcnKTsgLy8gUmVtb3ZlIHRyYWlsaW5nIHNsYXNoIGlmIHByZXNlbnRcbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gbWFrZSBhdXRoZW50aWNhdGVkIGZldGNoIHJlcXVlc3RzIHRvIFBvY2tldEJhc2UgQVBJXG4gKiBQb2NrZXRCYXNlIFJFU1QgQVBJIGJhc2U6IC9hcGkvY29sbGVjdGlvbnMve2NvbGxlY3Rpb259L3JlY29yZHNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcG9ja2V0YmFzZUZldGNoKFxuICBwYXRoOiBzdHJpbmcsXG4gIG9wdGlvbnM6IFJlcXVlc3RJbml0ICYgeyBtZXRob2Q/OiBzdHJpbmcgfSA9IHt9XG4pOiBQcm9taXNlPGFueT4ge1xuICBjb25zdCB1cmwgPSBgJHtnZXRQb2NrZXRCYXNlVXJsKCl9L2FwaSR7cGF0aH1gO1xuICBjb25zdCBtZXRob2QgPSBvcHRpb25zLm1ldGhvZCB8fCAnR0VUJztcblxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgbWV0aG9kLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAuLi5vcHRpb25zLmhlYWRlcnMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgY29uc3QgZXJyb3JEYXRhID0gKGF3YWl0IHJlc3BvbnNlLmpzb24oKS5jYXRjaCgoKSA9PiAoe30pKSkgYXMgYW55O1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgUG9ja2V0QmFzZSByZXF1ZXN0IGZhaWxlZCAoJHtyZXNwb25zZS5zdGF0dXN9KTogJHtcbiAgICAgICAgICBlcnJvckRhdGEubWVzc2FnZSB8fCByZXNwb25zZS5zdGF0dXNUZXh0XG4gICAgICAgIH1gXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoYFBvY2tldEJhc2UgcmVxdWVzdCBmYWlsZWQ6ICR7U3RyaW5nKGVycm9yKX1gKTtcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgdXNlciBJRCBmcm9tIGVudmlyb25tZW50XG4gKiBGb3IgTVZQLCB3ZSB1c2UgYSBoYXJkY29kZWQgdXNlciBJRDsgbGF0ZXIgdGhpcyB3aWxsIGNvbWUgZnJvbSBKV1RcbiAqL1xuZnVuY3Rpb24gZ2V0VXNlcklkKCk6IHN0cmluZyB7XG4gIGNvbnN0IHVzZXJJZCA9IHByb2Nlc3MuZW52LlVTRVJfSUQ7XG4gIGlmICghdXNlcklkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVU0VSX0lEIG11c3QgYmUgc2V0IGluIGVudmlyb25tZW50Jyk7XG4gIH1cbiAgcmV0dXJuIHVzZXJJZDtcbn1cblxuLyoqXG4gKiBGZXRjaCBhbGwgYWN0aXZlIGludmVudG9yeSBpdGVtcyBmb3IgdGhlIGN1cnJlbnQgdXNlclxuICogUmV0dXJucyBpdGVtcyB3aGVyZSBkYXRlX3VzZWQgSVMgTlVMTCAobm90IHlldCBjb25zdW1lZClcbiAqIFBvY2tldEJhc2UgZmlsdGVyIHN5bnRheDogP2ZpbHRlcj0oZmllbGQ9XCJ2YWx1ZVwiJiZmaWVsZDI9bnVsbClcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEludmVudG9yeSgpOiBQcm9taXNlPEludmVudG9yeUl0ZW1bXT4ge1xuICBjb25zdCB1c2VySWQgPSBnZXRVc2VySWQoKTtcblxuICAvLyBQb2NrZXRCYXNlIGZpbHRlcjogdXNlcl9pZCBtYXRjaGVzIEFORCBkYXRlX3VzZWQgaXMgbnVsbFxuICAvLyBTb3J0IGJ5IGRhdGVfYWRkZWQgZGVzY2VuZGluZyAobW9zdCByZWNlbnQgZmlyc3QpXG4gIGNvbnN0IGZpbHRlciA9IGVuY29kZVVSSUNvbXBvbmVudChgKHVzZXJfaWQ9XCIke3VzZXJJZH1cIiYmZGF0ZV91c2VkPW51bGwpYCk7XG4gIGNvbnN0IHNvcnQgPSBlbmNvZGVVUklDb21wb25lbnQoJy1kYXRlX2FkZGVkJyk7XG5cbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgYC9jb2xsZWN0aW9ucy9pbnZlbnRvcnlfaXRlbXMvcmVjb3Jkcz9maWx0ZXI9JHtmaWx0ZXJ9JnNvcnQ9JHtzb3J0fWBcbiAgKTtcblxuICAvLyBQb2NrZXRCYXNlIHJldHVybnMgeyBpdGVtczogWy4uLl0gfSBvciBqdXN0IGFycmF5IGRlcGVuZGluZyBvbiB2ZXJzaW9uXG4gIGNvbnN0IGl0ZW1zID0gcmVzcG9uc2UuaXRlbXMgfHwgKEFycmF5LmlzQXJyYXkocmVzcG9uc2UpID8gcmVzcG9uc2UgOiBbXSk7XG4gIHJldHVybiBpdGVtcyBhcyBJbnZlbnRvcnlJdGVtW107XG59XG5cbi8qKlxuICogQWRkIGEgc2luZ2xlIGludmVudG9yeSBpdGVtIHdpdGggbWVyZ2Utb24tYWRkIGRlZHVwbGljYXRpb25cbiAqIElmIGFuIGl0ZW0gd2l0aCB0aGUgc2FtZSBjYW5vbmljYWxfbmFtZSBleGlzdHMsIG1lcmdlIGJ5IHVwZGF0aW5nIHF1YW50aXR5XG4gKiBPdGhlcndpc2UsIGNyZWF0ZSBuZXcgaXRlbVxuICogUmV0dXJucyB0aGUgaXRlbSAoZWl0aGVyIG5ld2x5IGNyZWF0ZWQgb3IgdXBkYXRlZCB2aWEgbWVyZ2UpXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRJbnZlbnRvcnlJdGVtKFxuICBpdGVtOiBPbWl0PEludmVudG9yeUl0ZW0sICdpZCcgfCAndXNlcl9pZCcgfCAnZGF0ZV9hZGRlZCcgfCAnZGF0ZV91c2VkJz5cbik6IFByb21pc2U8SW52ZW50b3J5SXRlbT4ge1xuICBjb25zdCB1c2VySWQgPSBnZXRVc2VySWQoKTtcbiAgY29uc3QgeyBnZXRDYW5vbmljYWxOYW1lIH0gPSBhd2FpdCBpbXBvcnQoJy4vY2Fub25pY2FsLWZvb2RzJyk7XG5cbiAgY29uc3QgY2Fub25pY2FsTmFtZSA9IGl0ZW0uY2Fub25pY2FsX25hbWUgfHwgZ2V0Q2Fub25pY2FsTmFtZShpdGVtLm5hbWUpO1xuXG4gIC8vIENoZWNrIGlmIGl0ZW0gd2l0aCBzYW1lIGNhbm9uaWNhbF9uYW1lIGFscmVhZHkgZXhpc3RzIGZvciB0aGlzIHVzZXJcbiAgLy8gUG9ja2V0QmFzZSBmaWx0ZXI6IHVzZXJfaWQgbWF0Y2hlcyBBTkQgY2Fub25pY2FsX25hbWUgbWF0Y2hlcyBBTkQgZGF0ZV91c2VkIGlzIG51bGxcbiAgY29uc3QgZmlsdGVyID0gZW5jb2RlVVJJQ29tcG9uZW50KFxuICAgIGAodXNlcl9pZD1cIiR7dXNlcklkfVwiJiZjYW5vbmljYWxfbmFtZT1cIiR7Y2Fub25pY2FsTmFtZX1cIiYmZGF0ZV91c2VkPW51bGwpYFxuICApO1xuXG4gIGNvbnN0IGV4aXN0aW5nUmVzcG9uc2UgPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgYC9jb2xsZWN0aW9ucy9pbnZlbnRvcnlfaXRlbXMvcmVjb3Jkcz9maWx0ZXI9JHtmaWx0ZXJ9JmxpbWl0PTFgXG4gICk7XG5cbiAgY29uc3QgZXhpc3RpbmdJdGVtcyA9IGV4aXN0aW5nUmVzcG9uc2UuaXRlbXMgfHwgKEFycmF5LmlzQXJyYXkoZXhpc3RpbmdSZXNwb25zZSkgPyBleGlzdGluZ1Jlc3BvbnNlIDogW10pO1xuICBjb25zdCBleGlzdGluZyA9IGV4aXN0aW5nSXRlbXNbMF07XG5cbiAgaWYgKGV4aXN0aW5nKSB7XG4gICAgLy8gTWVyZ2U6IHVwZGF0ZSBxdWFudGl0eSBhbmQgdW5pdCwga2VlcCBtb3N0IHJlY2VudCBuYW1lXG4gICAgLy8gUG9ja2V0QmFzZSBQQVRDSDogL2FwaS9jb2xsZWN0aW9ucy97Y29sbGVjdGlvbn0vcmVjb3Jkcy97aWR9XG4gICAgY29uc3QgdXBkYXRlZEl0ZW0gPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgICBgL2NvbGxlY3Rpb25zL2ludmVudG9yeV9pdGVtcy9yZWNvcmRzLyR7ZXhpc3RpbmcuaWR9YCxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgbmFtZTogaXRlbS5uYW1lIHx8IGV4aXN0aW5nLm5hbWUsXG4gICAgICAgICAgcXVhbnRpdHlfYXBwcm94OlxuICAgICAgICAgICAgaXRlbS5xdWFudGl0eV9hcHByb3ggIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICA/IGl0ZW0ucXVhbnRpdHlfYXBwcm94XG4gICAgICAgICAgICAgIDogZXhpc3RpbmcucXVhbnRpdHlfYXBwcm94LFxuICAgICAgICAgIHVuaXQ6IGl0ZW0udW5pdCB8fCBleGlzdGluZy51bml0LFxuICAgICAgICAgIGNvbmZpZGVuY2U6IGl0ZW0uY29uZmlkZW5jZSB8fCBleGlzdGluZy5jb25maWRlbmNlLFxuICAgICAgICAgIGhhc19pdGVtOlxuICAgICAgICAgICAgaXRlbS5oYXNfaXRlbSAhPT0gdW5kZWZpbmVkID8gaXRlbS5oYXNfaXRlbSA6IGV4aXN0aW5nLmhhc19pdGVtLFxuICAgICAgICAgIGRhdGVfYWRkZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfSksXG4gICAgICB9XG4gICAgKTtcblxuICAgIHJldHVybiB1cGRhdGVkSXRlbSBhcyBJbnZlbnRvcnlJdGVtO1xuICB9XG5cbiAgLy8gTm8gZXhpc3RpbmcgaXRlbTogY3JlYXRlIG5ld1xuICAvLyBQb2NrZXRCYXNlIFBPU1Q6IC9hcGkvY29sbGVjdGlvbnMve2NvbGxlY3Rpb259L3JlY29yZHNcbiAgY29uc3QgbmV3SXRlbSA9IGF3YWl0IHBvY2tldGJhc2VGZXRjaChcbiAgICBgL2NvbGxlY3Rpb25zL2ludmVudG9yeV9pdGVtcy9yZWNvcmRzYCxcbiAgICB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgdXNlcl9pZDogdXNlcklkLFxuICAgICAgICBuYW1lOiBpdGVtLm5hbWUsXG4gICAgICAgIGNhbm9uaWNhbF9uYW1lOiBjYW5vbmljYWxOYW1lLFxuICAgICAgICBoYXNfaXRlbTogaXRlbS5oYXNfaXRlbSB8fCBmYWxzZSxcbiAgICAgICAgcXVhbnRpdHlfYXBwcm94OiBpdGVtLnF1YW50aXR5X2FwcHJveCB8fCBudWxsLFxuICAgICAgICB1bml0OiBpdGVtLnVuaXQgfHwgbnVsbCxcbiAgICAgICAgY29uZmlkZW5jZTogaXRlbS5jb25maWRlbmNlIHx8ICdhcHByb3hpbWF0ZScsXG4gICAgICB9KSxcbiAgICB9XG4gICk7XG5cbiAgcmV0dXJuIG5ld0l0ZW0gYXMgSW52ZW50b3J5SXRlbTtcbn1cblxuLyoqXG4gKiBNYXJrIGFuIGludmVudG9yeSBpdGVtIGFzIHVzZWQgKHNvZnQgZGVsZXRlKVxuICogU2V0cyBkYXRlX3VzZWQgdG8gY3VycmVudCB0aW1lc3RhbXAgaW5zdGVhZCBvZiBhY3R1YWxseSBkZWxldGluZyB0aGUgcm93XG4gKiBUaGlzIHByZXNlcnZlcyBhdWRpdCB0cmFpbFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVkdWN0SW52ZW50b3J5KGl0ZW1JZDogc3RyaW5nKTogUHJvbWlzZTxJbnZlbnRvcnlJdGVtPiB7XG4gIC8vIFBvY2tldEJhc2UgUEFUQ0g6IC9hcGkvY29sbGVjdGlvbnMve2NvbGxlY3Rpb259L3JlY29yZHMve2lkfVxuICBjb25zdCB1cGRhdGVkSXRlbSA9IGF3YWl0IHBvY2tldGJhc2VGZXRjaChcbiAgICBgL2NvbGxlY3Rpb25zL2ludmVudG9yeV9pdGVtcy9yZWNvcmRzLyR7aXRlbUlkfWAsXG4gICAge1xuICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBkYXRlX3VzZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIH0pLFxuICAgIH1cbiAgKTtcblxuICByZXR1cm4gdXBkYXRlZEl0ZW0gYXMgSW52ZW50b3J5SXRlbTtcbn1cblxuLyoqXG4gKiBEZWR1Y3QgYSBzcGVjaWZpYyBxdWFudGl0eSBmcm9tIGFuIGludmVudG9yeSBpdGVtIChUQVNLIDg6IEZpeClcbiAqIEhhbmRsZXMgcGFydGlhbCBkZWR1Y3Rpb25zIHByb3Blcmx5OlxuICogLSBJZiBpdGVtIGlzIGJvb2xlYW4gKGhhc19pdGVtPXRydWUpOiBNYXJrIGVudGlyZSBpdGVtIGFzIHVzZWRcbiAqIC0gSWYgZGVkdWN0aW5nIGV4YWN0IGFtb3VudDogTWFyayBpdGVtIGFzIHVzZWRcbiAqIC0gSWYgZGVkdWN0aW5nIHBhcnRpYWwgYW1vdW50OiBDcmVhdGUgbmV3IGl0ZW0gd2l0aCByZW1haW5kZXIsIG1hcmsgb3JpZ2luYWwgYXMgdXNlZFxuICogLSBJZiBpbnN1ZmZpY2llbnQgcXVhbnRpdHk6IFRocm93IGVycm9yIChwcmV2ZW50IGRlZHVjdGlvbilcbiAqXG4gKiBSZXR1cm5zIHsgZGVkdWN0ZWRfaXRlbSwgcmVtYWluZGVyX2l0ZW1faWQgfSB3aGVyZSByZW1haW5kZXIgaXMgbnVsbCBpZiBmdWxseSBjb25zdW1lZFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVkdWN0SW52ZW50b3J5UXVhbnRpdHkoXG4gIGl0ZW1JZDogc3RyaW5nLFxuICBxdWFudGl0eVRvRGVkdWN0PzogbnVtYmVyXG4pOiBQcm9taXNlPHsgZGVkdWN0ZWRfaXRlbTogSW52ZW50b3J5SXRlbTsgcmVtYWluZGVyX2l0ZW1faWQ/OiBzdHJpbmcgfT4ge1xuICBjb25zdCB1c2VySWQgPSBnZXRVc2VySWQoKTtcblxuICAvLyBGZXRjaCB0aGUgaXRlbSB0byBjaGVjayBxdWFudGl0eVxuICAvLyBQb2NrZXRCYXNlIEdFVDogL2FwaS9jb2xsZWN0aW9ucy97Y29sbGVjdGlvbn0vcmVjb3Jkcy97aWR9XG4gIGNvbnN0IGl0ZW0gPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgYC9jb2xsZWN0aW9ucy9pbnZlbnRvcnlfaXRlbXMvcmVjb3Jkcy8ke2l0ZW1JZH1gXG4gICk7XG5cbiAgLy8gQm9vbGVhbiBpdGVtcyAoc2FsdCwgc3BpY2VzLCBvaWxzKToganVzdCBtYXJrIGFzIHVzZWQsIG5vIHF1YW50aXR5IGNoZWNrXG4gIGlmIChpdGVtLmhhc19pdGVtID09PSB0cnVlICYmIHF1YW50aXR5VG9EZWR1Y3QgPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGRlZHVjdGVkSXRlbSA9IGF3YWl0IHBvY2tldGJhc2VGZXRjaChcbiAgICAgIGAvY29sbGVjdGlvbnMvaW52ZW50b3J5X2l0ZW1zL3JlY29yZHMvJHtpdGVtSWR9YCxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGRhdGVfdXNlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pLFxuICAgICAgfVxuICAgICk7XG5cbiAgICByZXR1cm4geyBkZWR1Y3RlZF9pdGVtOiBkZWR1Y3RlZEl0ZW0gYXMgSW52ZW50b3J5SXRlbSB9O1xuICB9XG5cbiAgLy8gUXVhbnRpdHktYmFzZWQgaXRlbXM6IGNoZWNrIGlmIHN1ZmZpY2llbnQgcXVhbnRpdHkgZXhpc3RzXG4gIGlmIChxdWFudGl0eVRvRGVkdWN0ICE9PSB1bmRlZmluZWQgJiYgaXRlbS5xdWFudGl0eV9hcHByb3ggIT09IG51bGwpIHtcbiAgICBjb25zdCBhdmFpbGFibGUgPSBpdGVtLnF1YW50aXR5X2FwcHJveDtcblxuICAgIC8vIENSSVRJQ0FMIEZJWDogQmxvY2sgZGVkdWN0aW9uIGlmIGluc3VmZmljaWVudCBxdWFudGl0eVxuICAgIGlmIChhdmFpbGFibGUgPCBxdWFudGl0eVRvRGVkdWN0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBJbnN1ZmZpY2llbnQgcXVhbnRpdHk6IG5lZWQgJHtxdWFudGl0eVRvRGVkdWN0fSAke2l0ZW0udW5pdCB8fCAndW5pdHMnfSwgYCArXG4gICAgICAgICAgYGhhdmUgJHthdmFpbGFibGV9LiBVc2VyIG11c3QgcmV2aWV3IHJlY2lwZSBvciBhZGQgbW9yZSBpbnZlbnRvcnkuYFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBFeGFjdCBtYXRjaCBvciB2ZXJ5IGNsb3NlOiBtYXJrIGVudGlyZSBpdGVtIGFzIHVzZWRcbiAgICBpZiAoTWF0aC5hYnMoYXZhaWxhYmxlIC0gcXVhbnRpdHlUb0RlZHVjdCkgPCAwLjAxKSB7XG4gICAgICBjb25zdCBkZWR1Y3RlZEl0ZW0gPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgICAgIGAvY29sbGVjdGlvbnMvaW52ZW50b3J5X2l0ZW1zL3JlY29yZHMvJHtpdGVtSWR9YCxcbiAgICAgICAge1xuICAgICAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGRhdGVfdXNlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pLFxuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgICByZXR1cm4geyBkZWR1Y3RlZF9pdGVtOiBkZWR1Y3RlZEl0ZW0gYXMgSW52ZW50b3J5SXRlbSB9O1xuICAgIH1cblxuICAgIC8vIFBhcnRpYWwgZGVkdWN0aW9uOiBjcmVhdGUgcmVtYWluZGVyIGl0ZW0sIG1hcmsgb3JpZ2luYWwgYXMgdXNlZFxuICAgIGNvbnN0IHJlbWFpbmRlciA9IGF2YWlsYWJsZSAtIHF1YW50aXR5VG9EZWR1Y3Q7XG5cbiAgICAvLyBDcmVhdGUgbmV3IGl0ZW0gZm9yIHJlbWFpbmRlclxuICAgIC8vIFBvY2tldEJhc2UgUE9TVDogL2FwaS9jb2xsZWN0aW9ucy97Y29sbGVjdGlvbn0vcmVjb3Jkc1xuICAgIGNvbnN0IHJlbWFpbmRlckl0ZW0gPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgICBgL2NvbGxlY3Rpb25zL2ludmVudG9yeV9pdGVtcy9yZWNvcmRzYCxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICB1c2VyX2lkOiB1c2VySWQsXG4gICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgIGNhbm9uaWNhbF9uYW1lOiBpdGVtLmNhbm9uaWNhbF9uYW1lLFxuICAgICAgICAgIHF1YW50aXR5X2FwcHJveDogcmVtYWluZGVyLFxuICAgICAgICAgIHVuaXQ6IGl0ZW0udW5pdCxcbiAgICAgICAgICBjb25maWRlbmNlOiBpdGVtLmNvbmZpZGVuY2UsXG4gICAgICAgICAgaGFzX2l0ZW06IGZhbHNlLFxuICAgICAgICAgIGRhdGVfYWRkZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfSksXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIE1hcmsgb3JpZ2luYWwgYXMgdXNlZFxuICAgIGNvbnN0IGRlZHVjdGVkSXRlbSA9IGF3YWl0IHBvY2tldGJhc2VGZXRjaChcbiAgICAgIGAvY29sbGVjdGlvbnMvaW52ZW50b3J5X2l0ZW1zL3JlY29yZHMvJHtpdGVtSWR9YCxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGRhdGVfdXNlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pLFxuICAgICAgfVxuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZGVkdWN0ZWRfaXRlbTogZGVkdWN0ZWRJdGVtIGFzIEludmVudG9yeUl0ZW0sXG4gICAgICByZW1haW5kZXJfaXRlbV9pZDogcmVtYWluZGVySXRlbS5pZCxcbiAgICB9O1xuICB9XG5cbiAgLy8gTm8gcXVhbnRpdHkgc3BlY2lmaWVkIGFuZCBubyBxdWFudGl0eSBpbiBpdGVtOiBqdXN0IG1hcmsgYXMgdXNlZFxuICBjb25zdCBkZWR1Y3RlZEl0ZW0gPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgYC9jb2xsZWN0aW9ucy9pbnZlbnRvcnlfaXRlbXMvcmVjb3Jkcy8ke2l0ZW1JZH1gLFxuICAgIHtcbiAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZGF0ZV91c2VkOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSksXG4gICAgfVxuICApO1xuXG4gIHJldHVybiB7IGRlZHVjdGVkX2l0ZW06IGRlZHVjdGVkSXRlbSBhcyBJbnZlbnRvcnlJdGVtIH07XG59XG5cbi8qKlxuICogRmV0Y2ggcmVjZW50IGNoYXQgaGlzdG9yeSBmb3IgdGhlIGN1cnJlbnQgdXNlclxuICogUmV0dXJucyBtZXNzYWdlcyBpbiBjaHJvbm9sb2dpY2FsIG9yZGVyIChvbGRlc3QgZmlyc3QpXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDaGF0SGlzdG9yeShsaW1pdDogbnVtYmVyID0gMjApOiBQcm9taXNlPENoYXRNZXNzYWdlW10+IHtcbiAgY29uc3QgdXNlcklkID0gZ2V0VXNlcklkKCk7XG5cbiAgLy8gUG9ja2V0QmFzZSBmaWx0ZXI6IHVzZXJfaWQgbWF0Y2hlc1xuICAvLyBTb3J0IGJ5IHRpbWVzdGFtcCBhc2NlbmRpbmcgKG9sZGVzdCBmaXJzdClcbiAgY29uc3QgZmlsdGVyID0gZW5jb2RlVVJJQ29tcG9uZW50KGAodXNlcl9pZD1cIiR7dXNlcklkfVwiKWApO1xuICBjb25zdCBzb3J0ID0gZW5jb2RlVVJJQ29tcG9uZW50KCd0aW1lc3RhbXAnKTtcblxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHBvY2tldGJhc2VGZXRjaChcbiAgICBgL2NvbGxlY3Rpb25zL2NoYXRfbWVzc2FnZXMvcmVjb3Jkcz9maWx0ZXI9JHtmaWx0ZXJ9JnNvcnQ9JHtzb3J0fSZsaW1pdD0ke2xpbWl0fWBcbiAgKTtcblxuICAvLyBQb2NrZXRCYXNlIHJldHVybnMgeyBpdGVtczogWy4uLl0gfSBvciBhcnJheSBkZXBlbmRpbmcgb24gdmVyc2lvblxuICBjb25zdCBtZXNzYWdlcyA9IHJlc3BvbnNlLml0ZW1zIHx8IChBcnJheS5pc0FycmF5KHJlc3BvbnNlKSA/IHJlc3BvbnNlIDogW10pO1xuICByZXR1cm4gbWVzc2FnZXMgYXMgQ2hhdE1lc3NhZ2VbXTtcbn1cblxuLyoqXG4gKiBBZGQgYSBjaGF0IG1lc3NhZ2UgdG8gaGlzdG9yeVxuICogUm9sZSBtdXN0IGJlICd1c2VyJyBvciAnYXNzaXN0YW50J1xuICogUmV0dXJucyB0aGUgbmV3bHkgY3JlYXRlZCBtZXNzYWdlXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRDaGF0TWVzc2FnZShcbiAgbWVzc2FnZTogc3RyaW5nLFxuICByb2xlOiAndXNlcicgfCAnYXNzaXN0YW50J1xuKTogUHJvbWlzZTxDaGF0TWVzc2FnZT4ge1xuICBjb25zdCB1c2VySWQgPSBnZXRVc2VySWQoKTtcblxuICAvLyBQb2NrZXRCYXNlIFBPU1Q6IC9hcGkvY29sbGVjdGlvbnMve2NvbGxlY3Rpb259L3JlY29yZHNcbiAgY29uc3QgbmV3TWVzc2FnZSA9IGF3YWl0IHBvY2tldGJhc2VGZXRjaChcbiAgICBgL2NvbGxlY3Rpb25zL2NoYXRfbWVzc2FnZXMvcmVjb3Jkc2AsXG4gICAge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgcm9sZSxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICB9KSxcbiAgICB9XG4gICk7XG5cbiAgcmV0dXJuIG5ld01lc3NhZ2UgYXMgQ2hhdE1lc3NhZ2U7XG59XG4iLCAiLyoqXG4gKiBDaGF0L01lYWwgU3VnZ2VzdGlvbiBBUEkgZW5kcG9pbnRcbiAqXG4gKiBQT1NUIC9hcGkvY2hhdCAtIEdldCBtZWFsIHN1Z2dlc3Rpb25zIGZvciBjdXJyZW50IGludmVudG9yeSBhbmQgbWVhbCB0eXBlXG4gKiBUaGlzIGVuZHBvaW50IGhhbmRsZXMgdGhlIFwiU3VnZ2VzdGlvbnNcIiB0YWIgZmxvd1xuICovXG5cbmltcG9ydCB7IFJvdXRlciwgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IHN1Z2dlc3RNZWFscyB9IGZyb20gJy4vdXRpbHMvcHJvbXB0cyc7XG5pbXBvcnQgeyBnZXRJbnZlbnRvcnkgfSBmcm9tICcuL3V0aWxzL2RiJztcblxuY29uc3Qgcm91dGVyID0gUm91dGVyKCk7XG5cbi8qKlxuICogUE9TVCAvYXBpL2NoYXRcbiAqIEdldCBtZWFsIHN1Z2dlc3Rpb25zIGJhc2VkIG9uIGN1cnJlbnQgaW52ZW50b3J5IGFuZCBtZWFsIHR5cGVcbiAqXG4gKiBSZXF1ZXN0IGJvZHk6XG4gKiB7XG4gKiAgIFwibWVzc2FnZVwiOiBcIlN1Z2dlc3QgYnJlYWtmYXN0IG1lYWxzXCIsXG4gKiAgIFwibWVhbF90eXBlXCI6IFwiYnJlYWtmYXN0XCIgfCBcImx1bmNoXCIgfCBcImRpbm5lclwiXG4gKiB9XG4gKlxuICogUmVzcG9uc2U6XG4gKiB7XG4gKiAgIFwicmVjaXBlc1wiOiBbXG4gKiAgICAge1xuICogICAgICAgXCJuYW1lXCI6IFwiU2NyYW1ibGVkIEVnZ3Mgd2l0aCBUb21hdG9lc1wiLFxuICogICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZsdWZmeSBzY3JhbWJsZWQgZWdncyB3aXRoIGZyZXNoIGRpY2VkIHRvbWF0b2VzLiBMaWdodCBhbmQgcHJvdGVpbi1yaWNoLlwiLFxuICogICAgICAgXCJ0aW1lX2VzdGltYXRlX21pbnNcIjogMTBcbiAqICAgICB9LFxuICogICAgIC4uLlxuICogICBdXG4gKiB9XG4gKi9cbnJvdXRlci5wb3N0KCcvJywgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgbWVhbF90eXBlIH0gPSByZXEuYm9keTtcblxuICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgaWYgKCFtZWFsX3R5cGUgfHwgIVsnYnJlYWtmYXN0JywgJ2x1bmNoJywgJ2Rpbm5lciddLmluY2x1ZGVzKG1lYWxfdHlwZSkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnTWlzc2luZyBvciBpbnZhbGlkIG1lYWxfdHlwZSBmaWVsZCcsXG4gICAgICAgIGRldGFpbHM6ICdtZWFsX3R5cGUgbXVzdCBiZSBvbmUgb2Y6IGJyZWFrZmFzdCwgbHVuY2gsIGRpbm5lcicsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBHZXQgY3VycmVudCBpbnZlbnRvcnlcbiAgICBjb25zdCBpbnZlbnRvcnkgPSBhd2FpdCBnZXRJbnZlbnRvcnkoKTtcblxuICAgIGlmIChpbnZlbnRvcnkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ05vIGludmVudG9yeSBpdGVtcyBmb3VuZCcsXG4gICAgICAgIGRldGFpbHM6ICdBZGQgaXRlbXMgdG8geW91ciBpbnZlbnRvcnkgYmVmb3JlIHJlcXVlc3RpbmcgbWVhbCBzdWdnZXN0aW9ucycsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBTdWdnZXN0IG1lYWxzIGJhc2VkIG9uIGludmVudG9yeVxuICAgIGNvbnN0IHJlY2lwZXMgPSBhd2FpdCBzdWdnZXN0TWVhbHMoaW52ZW50b3J5LCBtZWFsX3R5cGUpO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgcmVjaXBlcyxcbiAgICAgIG1lc3NhZ2U6IGBIZXJlIGFyZSAke3JlY2lwZXMubGVuZ3RofSAke21lYWxfdHlwZX0gc3VnZ2VzdGlvbnMgZm9yIHlvdSFgLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIFBPU1QgL2FwaS9jaGF0OicsIGVycm9yKTtcblxuICAgIGNvbnN0IGVycm9yTXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuXG4gICAgaWYgKGVycm9yTXNnLmluY2x1ZGVzKCdTVVBBQkFTRScpIHx8IGVycm9yTXNnLmluY2x1ZGVzKCdPUEVOQUknKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdTZXJ2aWNlIGNvbmZpZ3VyYXRpb24gZXJyb3InLFxuICAgICAgICBkZXRhaWxzOiBlcnJvck1zZyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgIGVycm9yOiAnRmFpbGVkIHRvIHN1Z2dlc3QgbWVhbHMnLFxuICAgICAgZGV0YWlsczogZXJyb3JNc2csXG4gICAgfSk7XG4gIH1cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7XG4iLCAiLyoqXG4gKiBDb29raW5nIEFQSSBlbmRwb2ludHNcbiAqXG4gKiBQT1NUIC9hcGkvY29va2luZy9zdGFydDogVGFrZXMgcmVjaXBlIGRldGFpbHMsIGdlbmVyYXRlcyBmdWxsIHJlY2lwZSB3aXRoIGluZ3JlZGllbnRzLCBzYXZlcyBjb29raW5nIHN0YXRlXG4gKiBQT1NUIC9hcGkvY29va2luZy9jb21wbGV0ZTogVXNlciBjb25maXJtcyBkZWR1Y3Rpb24sIGRlZHVjdHMgaW5ncmVkaWVudHMgZnJvbSBpbnZlbnRvcnlcbiAqIFBPU1QgL2FwaS9jb29raW5nL2NvbmZpcm0tZGVkdWN0aW9uOiBHZXQgbGlzdCBvZiB3aGF0IHdpbGwgYmUgZGVkdWN0ZWQgYmVmb3JlIHVzZXIgY29uZmlybXNcbiAqL1xuXG5pbXBvcnQgeyBSb3V0ZXIsIFJlcXVlc3QsIFJlc3BvbnNlIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBnZW5lcmF0ZVJlY2lwZURldGFpbCB9IGZyb20gJy4vdXRpbHMvcHJvbXB0cyc7XG5pbXBvcnQgeyBnZXRJbnZlbnRvcnksIGRlZHVjdEludmVudG9yeVF1YW50aXR5IH0gZnJvbSAnLi91dGlscy9kYic7XG5pbXBvcnQgeyBSZWNpcGVEZXRhaWwsIEludmVudG9yeUl0ZW0sIFN0YXJ0Q29va2luZ1JlcXVlc3QgfSBmcm9tICcuLi9zaGFyZWQvdHlwZXMnO1xuXG5jb25zdCByb3V0ZXIgPSBSb3V0ZXIoKTtcblxuLyoqXG4gKiBQT1NUIC9hcGkvY29va2luZy9kZXRhaWxcbiAqIEdldCBmdWxsIHJlY2lwZSBkZXRhaWxzIGZyb20gcmVjaXBlIG5hbWUsIGRlc2NyaXB0aW9uLCBhbmQgdGltZSBlc3RpbWF0ZVxuICogVGhpcyBlbmRwb2ludCBnZW5lcmF0ZXMgdGhlIGRldGFpbGVkIHJlY2lwZSB3aXRoIGluZ3JlZGllbnRzIGFuZCBpbnN0cnVjdGlvbnNcbiAqXG4gKiBSZXF1ZXN0IGJvZHk6XG4gKiB7XG4gKiAgIFwicmVjaXBlX25hbWVcIjogXCJUb21hdG8gQmFzaWwgQ2hpY2tlblwiLFxuICogICBcInJlY2lwZV9kZXNjcmlwdGlvblwiOiBcIlBhbi1zZWFyZWQgY2hpY2tlbiB3aXRoIGZyZXNoIHRvbWF0b2VzIGFuZCBiYXNpbC4gTGlnaHQgYW5kIGZyZXNoLlwiLFxuICogICBcInJlY2lwZV90aW1lX21pbnNcIjogMjVcbiAqIH1cbiAqXG4gKiBSZXNwb25zZTpcbiAqIHtcbiAqICAgXCJkYXRhXCI6IHtcbiAqICAgICBcIm5hbWVcIjogXCJUb21hdG8gQmFzaWwgQ2hpY2tlblwiLFxuICogICAgIFwiZGVzY3JpcHRpb25cIjogXCIuLi5cIixcbiAqICAgICBcInRpbWVfZXN0aW1hdGVfbWluc1wiOiAyNSxcbiAqICAgICBcImluZ3JlZGllbnRzXCI6IFsuLi5dLFxuICogICAgIFwiaW5zdHJ1Y3Rpb25zXCI6IFsuLi5dXG4gKiAgIH1cbiAqIH1cbiAqL1xucm91dGVyLnBvc3QoJy9kZXRhaWwnLCBhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyByZWNpcGVfbmFtZSwgcmVjaXBlX2Rlc2NyaXB0aW9uLCByZWNpcGVfdGltZV9taW5zIH0gPSByZXEuYm9keTtcblxuICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgaWYgKCFyZWNpcGVfbmFtZSB8fCB0eXBlb2YgcmVjaXBlX25hbWUgIT09ICdzdHJpbmcnIHx8ICFyZWNpcGVfbmFtZS50cmltKCkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnTWlzc2luZyBvciBpbnZhbGlkIHJlY2lwZV9uYW1lIGZpZWxkJyxcbiAgICAgICAgZGV0YWlsczogJ3JlY2lwZV9uYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghcmVjaXBlX2Rlc2NyaXB0aW9uIHx8IHR5cGVvZiByZWNpcGVfZGVzY3JpcHRpb24gIT09ICdzdHJpbmcnIHx8ICFyZWNpcGVfZGVzY3JpcHRpb24udHJpbSgpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ01pc3Npbmcgb3IgaW52YWxpZCByZWNpcGVfZGVzY3JpcHRpb24gZmllbGQnLFxuICAgICAgICBkZXRhaWxzOiAncmVjaXBlX2Rlc2NyaXB0aW9uIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChyZWNpcGVfdGltZV9taW5zID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHJlY2lwZV90aW1lX21pbnMgIT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ01pc3Npbmcgb3IgaW52YWxpZCByZWNpcGVfdGltZV9taW5zIGZpZWxkJyxcbiAgICAgICAgZGV0YWlsczogJ3JlY2lwZV90aW1lX21pbnMgbXVzdCBiZSBhIG51bWJlciAoaW4gbWludXRlcyknLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gR2V0IGN1cnJlbnQgaW52ZW50b3J5IHRvIHZhbGlkYXRlIHJlY2lwZSBjYW4gYmUgbWFkZVxuICAgIGNvbnN0IGN1cnJlbnRJbnZlbnRvcnkgPSBhd2FpdCBnZXRJbnZlbnRvcnkoKTtcblxuICAgIGlmIChjdXJyZW50SW52ZW50b3J5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdDYW5ub3QgZ2VuZXJhdGUgcmVjaXBlIHdpdGggZW1wdHkgaW52ZW50b3J5JyxcbiAgICAgICAgZGV0YWlsczogJ0FkZCBpdGVtcyB0byB5b3VyIGludmVudG9yeSBiZWZvcmUgcmVxdWVzdGluZyByZWNpcGUgZGV0YWlscycsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBHZW5lcmF0ZSBkZXRhaWxlZCByZWNpcGUgZnJvbSBtaW5pbWFsIGlucHV0XG4gICAgY29uc3QgcmVjaXBlRGV0YWlsID0gYXdhaXQgZ2VuZXJhdGVSZWNpcGVEZXRhaWwoXG4gICAgICByZWNpcGVfbmFtZS50cmltKCksXG4gICAgICByZWNpcGVfZGVzY3JpcHRpb24udHJpbSgpLFxuICAgICAgY3VycmVudEludmVudG9yeVxuICAgICk7XG5cbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBkYXRhOiByZWNpcGVEZXRhaWwsXG4gICAgICBtZXNzYWdlOiAnUmVjaXBlIGRldGFpbHMgZ2VuZXJhdGVkIHN1Y2Nlc3NmdWxseScsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gUE9TVCAvYXBpL2Nvb2tpbmcvZGV0YWlsOicsIGVycm9yKTtcblxuICAgIGNvbnN0IGVycm9yTXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuXG4gICAgaWYgKGVycm9yTXNnLmluY2x1ZGVzKCdTVVBBQkFTRScpIHx8IGVycm9yTXNnLmluY2x1ZGVzKCdPUEVOQUknKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdTZXJ2aWNlIGNvbmZpZ3VyYXRpb24gZXJyb3InLFxuICAgICAgICBkZXRhaWxzOiBlcnJvck1zZyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgIGVycm9yOiAnRmFpbGVkIHRvIGdlbmVyYXRlIHJlY2lwZSBkZXRhaWxzJyxcbiAgICAgIGRldGFpbHM6IGVycm9yTXNnLFxuICAgIH0pO1xuICB9XG59KTtcblxuLyoqXG4gKiBJbi1tZW1vcnkgc3RvcmFnZSBmb3IgY29va2luZyBzZXNzaW9uc1xuICogSW4gcHJvZHVjdGlvbiwgdGhpcyB3b3VsZCBiZSBwZXJzaXN0ZWQgdG8gZGF0YWJhc2UgKGNvb2tpbmdfc2Vzc2lvbnMgdGFibGUpXG4gKiBNYXBzIHNlc3Npb25faWQgLT4geyByZWNpcGUsIGludmVudG9yeV9iZWZvcmUsIHN0YXJ0ZWRfYXQgfVxuICovXG5jb25zdCBjb29raW5nU2Vzc2lvbnM6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcblxuLyoqXG4gKiBQT1NUIC9hcGkvY29va2luZy9zdGFydFxuICogQmVnaW4gY29va2luZyBhIHJlY2lwZTogZ2VuZXJhdGUgZnVsbCByZWNpcGUgZGV0YWlscyBmcm9tIG1pbmltYWwgaW5wdXRcbiAqXG4gKiBSZXF1ZXN0IGJvZHk6XG4gKiB7XG4gKiAgIFwicmVjaXBlX25hbWVcIjogXCJUb21hdG8gQmFzaWwgQ2hpY2tlblwiLFxuICogICBcInJlY2lwZV9kZXNjcmlwdGlvblwiOiBcIlBhbi1zZWFyZWQgY2hpY2tlbiB3aXRoIGZyZXNoIHRvbWF0b2VzIGFuZCBiYXNpbC4gTGlnaHQgYW5kIGZyZXNoLlwiLFxuICogICBcInJlY2lwZV90aW1lX21pbnNcIjogMjVcbiAqIH1cbiAqXG4gKiBSZXNwb25zZTpcbiAqIHtcbiAqICAgXCJzZXNzaW9uX2lkXCI6IFwiY29va2luZy1zZXNzaW9uLXV1aWRcIixcbiAqICAgXCJyZWNpcGVcIjoge1xuICogICAgIFwibmFtZVwiOiBcIlRvbWF0byBCYXNpbCBDaGlja2VuXCIsXG4gKiAgICAgXCJkZXNjcmlwdGlvblwiOiBcIi4uLlwiLFxuICogICAgIFwidGltZV9lc3RpbWF0ZV9taW5zXCI6IDI1LFxuICogICAgIFwiaW5ncmVkaWVudHNcIjogWy4uLl0sXG4gKiAgICAgXCJpbnN0cnVjdGlvbnNcIjogWy4uLl1cbiAqICAgfSxcbiAqICAgXCJpbmdyZWRpZW50c190b19kZWR1Y3RcIjogW1xuICogICAgIHsgXCJuYW1lXCI6IFwiY2hpY2tlblwiLCBcInF1YW50aXR5XCI6IDIsIFwidW5pdFwiOiBcInBpZWNlc1wiLCBcImludmVudG9yeV9pdGVtX2lkXCI6IFwiLi4uXCIgfSxcbiAqICAgICB7IFwibmFtZVwiOiBcInRvbWF0b1wiLCBcInF1YW50aXR5XCI6IDMsIFwidW5pdFwiOiBcInBpZWNlc1wiLCBcImludmVudG9yeV9pdGVtX2lkXCI6IFwiLi4uXCIgfVxuICogICBdLFxuICogICBcIm1lc3NhZ2VcIjogXCJSZWFkeSB0byBjb29rISBSZXZpZXcgaW5ncmVkaWVudHMgYWJvdmUgYW5kIGNvbmZpcm0gd2hlbiBkb25lLlwiXG4gKiB9XG4gKi9cbnJvdXRlci5wb3N0KCcvc3RhcnQnLCBhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyByZWNpcGVfbmFtZSwgcmVjaXBlX2Rlc2NyaXB0aW9uLCByZWNpcGVfdGltZV9taW5zIH0gPSByZXEuYm9keTtcblxuICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgaWYgKCFyZWNpcGVfbmFtZSB8fCB0eXBlb2YgcmVjaXBlX25hbWUgIT09ICdzdHJpbmcnIHx8ICFyZWNpcGVfbmFtZS50cmltKCkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnTWlzc2luZyBvciBpbnZhbGlkIHJlY2lwZV9uYW1lIGZpZWxkJyxcbiAgICAgICAgZGV0YWlsczogJ3JlY2lwZV9uYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghcmVjaXBlX2Rlc2NyaXB0aW9uIHx8IHR5cGVvZiByZWNpcGVfZGVzY3JpcHRpb24gIT09ICdzdHJpbmcnIHx8ICFyZWNpcGVfZGVzY3JpcHRpb24udHJpbSgpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ01pc3Npbmcgb3IgaW52YWxpZCByZWNpcGVfZGVzY3JpcHRpb24gZmllbGQnLFxuICAgICAgICBkZXRhaWxzOiAncmVjaXBlX2Rlc2NyaXB0aW9uIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChyZWNpcGVfdGltZV9taW5zID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHJlY2lwZV90aW1lX21pbnMgIT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ01pc3Npbmcgb3IgaW52YWxpZCByZWNpcGVfdGltZV9taW5zIGZpZWxkJyxcbiAgICAgICAgZGV0YWlsczogJ3JlY2lwZV90aW1lX21pbnMgbXVzdCBiZSBhIG51bWJlciAoaW4gbWludXRlcyknLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gR2V0IGN1cnJlbnQgaW52ZW50b3J5IHRvIHZhbGlkYXRlIHJlY2lwZSBjYW4gYmUgbWFkZVxuICAgIGNvbnN0IGN1cnJlbnRJbnZlbnRvcnkgPSBhd2FpdCBnZXRJbnZlbnRvcnkoKTtcblxuICAgIGlmIChjdXJyZW50SW52ZW50b3J5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdDYW5ub3QgZ2VuZXJhdGUgcmVjaXBlIHdpdGggZW1wdHkgaW52ZW50b3J5JyxcbiAgICAgICAgZGV0YWlsczogJ0FkZCBpdGVtcyB0byB5b3VyIGludmVudG9yeSBiZWZvcmUgc3RhcnRpbmcgYSByZWNpcGUnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgZGV0YWlsZWQgcmVjaXBlIGZyb20gbWluaW1hbCBpbnB1dFxuICAgIGNvbnN0IHJlY2lwZURldGFpbCA9IGF3YWl0IGdlbmVyYXRlUmVjaXBlRGV0YWlsKFxuICAgICAgcmVjaXBlX25hbWUudHJpbSgpLFxuICAgICAgcmVjaXBlX2Rlc2NyaXB0aW9uLnRyaW0oKSxcbiAgICAgIGN1cnJlbnRJbnZlbnRvcnlcbiAgICApO1xuXG4gICAgLy8gTWFwIHJlY2lwZSBpbmdyZWRpZW50cyB0byBpbnZlbnRvcnkgaXRlbXMgZm9yIGRlZHVjdGlvbiB0cmFja2luZ1xuICAgIGNvbnN0IGluZ3JlZGllbnRzVG9EZWR1Y3QgPSByZWNpcGVEZXRhaWwuaW5ncmVkaWVudHMubWFwKChpbmdyZWRpZW50KSA9PiB7XG4gICAgICAvLyBGaW5kIG1hdGNoaW5nIGludmVudG9yeSBpdGVtIGJ5IGNhbm9uaWNhbCBuYW1lXG4gICAgICBjb25zdCBpbnZlbnRvcnlJdGVtID0gY3VycmVudEludmVudG9yeS5maW5kKFxuICAgICAgICAoaXRlbSkgPT5cbiAgICAgICAgICBpdGVtLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gaW5ncmVkaWVudC5uYW1lLnRvTG93ZXJDYXNlKCkgfHxcbiAgICAgICAgICBpdGVtLmNhbm9uaWNhbF9uYW1lPy50b0xvd2VyQ2FzZSgpID09PSBpbmdyZWRpZW50Lm5hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgKTtcblxuICAgICAgaWYgKCFpbnZlbnRvcnlJdGVtKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgUmVjaXBlIGluZ3JlZGllbnQgXCIke2luZ3JlZGllbnQubmFtZX1cIiBub3QgZm91bmQgaW4gaW52ZW50b3J5LiBgICtcbiAgICAgICAgICBgVGhpcyBzaG91bGQgbm90IGhhcHBlbiAtIHJlY2lwZSBnZW5lcmF0aW9uIGZhaWxlZCB0byB2YWxpZGF0ZSBhZ2FpbnN0IGludmVudG9yeS5gXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6IGluZ3JlZGllbnQubmFtZSxcbiAgICAgICAgcXVhbnRpdHk6IGluZ3JlZGllbnQucXVhbnRpdHksXG4gICAgICAgIHVuaXQ6IGluZ3JlZGllbnQudW5pdCxcbiAgICAgICAgaW52ZW50b3J5X2l0ZW1faWQ6IGludmVudG9yeUl0ZW0uaWQsXG4gICAgICAgIGNvbmZpZGVuY2U6IGludmVudG9yeUl0ZW0uY29uZmlkZW5jZSxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgY29va2luZyBzZXNzaW9uXG4gICAgY29uc3Qgc2Vzc2lvbklkID0gYGNvb2tpbmctJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KX1gO1xuICAgIGNvb2tpbmdTZXNzaW9uc1tzZXNzaW9uSWRdID0ge1xuICAgICAgcmVjaXBlOiByZWNpcGVEZXRhaWwsXG4gICAgICBpbnZlbnRvcnlfYmVmb3JlOiBjdXJyZW50SW52ZW50b3J5LFxuICAgICAgaW5ncmVkaWVudHNfdG9fZGVkdWN0OiBpbmdyZWRpZW50c1RvRGVkdWN0LFxuICAgICAgc3RhcnRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICByZXMuc3RhdHVzKDIwMSkuanNvbih7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIHNlc3Npb25faWQ6IHNlc3Npb25JZCxcbiAgICAgICAgcmVjaXBlOiByZWNpcGVEZXRhaWwsXG4gICAgICAgIGluZ3JlZGllbnRzX3RvX2RlZHVjdDogaW5ncmVkaWVudHNUb0RlZHVjdCxcbiAgICAgIH0sXG4gICAgICBtZXNzYWdlOiAnUmVjaXBlIHJlYWR5ISBSZXZpZXcgaW5ncmVkaWVudHMgYW5kIGNvbmZpcm0gd2hlbiBjb29raW5nIGlzIGNvbXBsZXRlLicsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gUE9TVCAvYXBpL2Nvb2tpbmcvc3RhcnQ6JywgZXJyb3IpO1xuXG4gICAgY29uc3QgZXJyb3JNc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG5cbiAgICBpZiAoZXJyb3JNc2cuaW5jbHVkZXMoJ1NVUEFCQVNFJykgfHwgZXJyb3JNc2cuaW5jbHVkZXMoJ09QRU5BSScpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ1NlcnZpY2UgY29uZmlndXJhdGlvbiBlcnJvcicsXG4gICAgICAgIGRldGFpbHM6IGVycm9yTXNnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSWYgcmVjaXBlIHZhbGlkYXRpb24gZmFpbGVkXG4gICAgaWYgKGVycm9yTXNnLmluY2x1ZGVzKCdub3QgZm91bmQgaW4gaW52ZW50b3J5JykpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnUmVjaXBlIHZhbGlkYXRpb24gZmFpbGVkJyxcbiAgICAgICAgZGV0YWlsczogZXJyb3JNc2csXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICBlcnJvcjogJ0ZhaWxlZCB0byBzdGFydCBjb29raW5nJyxcbiAgICAgIGRldGFpbHM6IGVycm9yTXNnLFxuICAgIH0pO1xuICB9XG59KTtcblxuLyoqXG4gKiBQT1NUIC9hcGkvY29va2luZy9jb21wbGV0ZVxuICogTWFyayBjb29raW5nIGFzIGNvbXBsZXRlIGFuZCBkZWR1Y3QgaW5ncmVkaWVudHMgZnJvbSBpbnZlbnRvcnlcbiAqXG4gKiBJTVBPUlRBTlQ6IFRoaXMgZW5kcG9pbnQgaW1wbGVtZW50cyB0aGUgXCJjb25maXJtYXRpb24gYmVmb3JlIGRlZHVjdGlvblwiIFVYIHBhdHRlcm4uXG4gKiBCZWZvcmUgY2FsbGluZyB0aGlzLCBjbGllbnQgc2hvdWxkOlxuICogMS4gQ2FsbCBQT1NUIC9hcGkvY29va2luZy9zdGFydCB0byBnZXQgcmVjaXBlIGFuZCBpbmdyZWRpZW50c190b19kZWR1Y3RcbiAqIDIuIFNob3cgdXNlciBhIGNvbmZpcm1hdGlvbiBkaWFsb2cgbGlzdGluZyB3aGF0IHdpbGwgYmUgZGVkdWN0ZWRcbiAqIDMuIE9ubHkgY2FsbCB0aGlzIGVuZHBvaW50IGFmdGVyIHVzZXIgZXhwbGljaXRseSBjb25maXJtc1xuICpcbiAqIFJlcXVlc3QgYm9keTpcbiAqIHtcbiAqICAgXCJzZXNzaW9uX2lkXCI6IFwiY29va2luZy1zZXNzaW9uLXV1aWRcIixcbiAqICAgXCJkZWR1Y3Rpb25fY29uZmlybWVkXCI6IHRydWVcbiAqIH1cbiAqXG4gKiBSZXNwb25zZTpcbiAqIHtcbiAqICAgXCJkYXRhXCI6IHtcbiAqICAgICBcInJlY2lwZV9uYW1lXCI6IFwiVG9tYXRvIEJhc2lsIENoaWNrZW5cIixcbiAqICAgICBcImRlZHVjdGVkX2l0ZW1zXCI6IFtcbiAqICAgICAgIHsgXCJpbnZlbnRvcnlfaXRlbV9pZFwiOiBcIi4uLlwiLCBcInF1YW50aXR5XCI6IDIsIFwidW5pdFwiOiBcInBpZWNlc1wiLCBcInN1Y2Nlc3NcIjogdHJ1ZSB9LFxuICogICAgICAgeyBcImludmVudG9yeV9pdGVtX2lkXCI6IFwiLi4uXCIsIFwicXVhbnRpdHlcIjogMywgXCJ1bml0XCI6IFwicGllY2VzXCIsIFwic3VjY2Vzc1wiOiB0cnVlIH1cbiAqICAgICBdLFxuICogICAgIFwiaW52ZW50b3J5X2FmdGVyXCI6IFsuLi5dXG4gKiAgIH0sXG4gKiAgIFwibWVzc2FnZVwiOiBcIkdyZWF0IGpvYiEgMiBpdGVtcyBkZWR1Y3RlZCBmcm9tIGludmVudG9yeS5cIlxuICogfVxuICovXG5yb3V0ZXIucG9zdCgnL2NvbXBsZXRlJywgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgc2Vzc2lvbl9pZCwgZGVkdWN0aW9uX2NvbmZpcm1lZCB9ID0gcmVxLmJvZHk7XG5cbiAgICAvLyBWYWxpZGF0ZSBpbnB1dFxuICAgIGlmICghc2Vzc2lvbl9pZCB8fCB0eXBlb2Ygc2Vzc2lvbl9pZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnTWlzc2luZyBvciBpbnZhbGlkIHNlc3Npb25faWQgZmllbGQnLFxuICAgICAgICBkZXRhaWxzOiAnc2Vzc2lvbl9pZCBtdXN0IGJlIGEgc3RyaW5nJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChkZWR1Y3Rpb25fY29uZmlybWVkICE9PSB0cnVlKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ0RlZHVjdGlvbiBub3QgY29uZmlybWVkJyxcbiAgICAgICAgZGV0YWlsczogJ2RlZHVjdGlvbl9jb25maXJtZWQgbXVzdCBiZSB0cnVlIHRvIHByb2NlZWQgd2l0aCBpbnZlbnRvcnkgZGVkdWN0aW9uJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIExvb2sgdXAgY29va2luZyBzZXNzaW9uXG4gICAgY29uc3Qgc2Vzc2lvbiA9IGNvb2tpbmdTZXNzaW9uc1tzZXNzaW9uX2lkXTtcbiAgICBpZiAoIXNlc3Npb24pIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnQ29va2luZyBzZXNzaW9uIG5vdCBmb3VuZCcsXG4gICAgICAgIGRldGFpbHM6IGBTZXNzaW9uICR7c2Vzc2lvbl9pZH0gZG9lcyBub3QgZXhpc3Qgb3IgaGFzIGV4cGlyZWRgLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRGVkdWN0IGVhY2ggaW5ncmVkaWVudCBmcm9tIGludmVudG9yeVxuICAgIGNvbnN0IGRlZHVjdGVkSXRlbXMgPSBbXTtcbiAgICBsZXQgc3VjY2Vzc0NvdW50ID0gMDtcblxuICAgIGZvciAoY29uc3QgaW5ncmVkaWVudCBvZiBzZXNzaW9uLmluZ3JlZGllbnRzX3RvX2RlZHVjdCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gVEFTSyA4IEZJWDogVXNlIHBhcnRpYWwgZGVkdWN0aW9uIHdpdGggcXVhbnRpdHkgdmFsaWRhdGlvblxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGw6XG4gICAgICAgIC8vIC0gQmxvY2sgZGVkdWN0aW9uIGlmIGluc3VmZmljaWVudCBxdWFudGl0eVxuICAgICAgICAvLyAtIENyZWF0ZSByZW1haW5kZXIgaXRlbSBpZiBwYXJ0aWFsIGRlZHVjdGlvblxuICAgICAgICAvLyAtIFByZXNlcnZlIGF1ZGl0IHRyYWlsIHdpdGggZGF0ZV91c2VkXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRlZHVjdEludmVudG9yeVF1YW50aXR5KFxuICAgICAgICAgIGluZ3JlZGllbnQuaW52ZW50b3J5X2l0ZW1faWQsXG4gICAgICAgICAgaW5ncmVkaWVudC5xdWFudGl0eVxuICAgICAgICApO1xuXG4gICAgICAgIGRlZHVjdGVkSXRlbXMucHVzaCh7XG4gICAgICAgICAgaW52ZW50b3J5X2l0ZW1faWQ6IGluZ3JlZGllbnQuaW52ZW50b3J5X2l0ZW1faWQsXG4gICAgICAgICAgcXVhbnRpdHk6IGluZ3JlZGllbnQucXVhbnRpdHksXG4gICAgICAgICAgdW5pdDogaW5ncmVkaWVudC51bml0LFxuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgcmVtYWluZGVyX2l0ZW1faWQ6IHJlc3VsdC5yZW1haW5kZXJfaXRlbV9pZCxcbiAgICAgICAgfSk7XG4gICAgICAgIHN1Y2Nlc3NDb3VudCsrO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIGRlZHVjdCBpbmdyZWRpZW50ICR7aW5ncmVkaWVudC5uYW1lfTpgLCBlcnJvcik7XG4gICAgICAgIGNvbnN0IGVycm9yTXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuXG4gICAgICAgIC8vIFRBU0sgOCBGSVg6IERpc3Rpbmd1aXNoIGJldHdlZW4gaW5zdWZmaWNpZW50IHF1YW50aXR5ICh1c2VyIGVycm9yKSBhbmQgc3lzdGVtIGVycm9yc1xuICAgICAgICBjb25zdCBpc0luc3VmZmljaWVudFF1YW50aXR5ID0gZXJyb3JNc2cuaW5jbHVkZXMoJ0luc3VmZmljaWVudCBxdWFudGl0eScpO1xuXG4gICAgICAgIGRlZHVjdGVkSXRlbXMucHVzaCh7XG4gICAgICAgICAgaW52ZW50b3J5X2l0ZW1faWQ6IGluZ3JlZGllbnQuaW52ZW50b3J5X2l0ZW1faWQsXG4gICAgICAgICAgcXVhbnRpdHk6IGluZ3JlZGllbnQucXVhbnRpdHksXG4gICAgICAgICAgdW5pdDogaW5ncmVkaWVudC51bml0LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIHJlYXNvbjogZXJyb3JNc2csXG4gICAgICAgICAgZXJyb3JfdHlwZTogaXNJbnN1ZmZpY2llbnRRdWFudGl0eSA/ICdpbnN1ZmZpY2llbnRfcXVhbnRpdHknIDogJ3N5c3RlbV9lcnJvcicsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZldGNoIHVwZGF0ZWQgaW52ZW50b3J5XG4gICAgY29uc3QgaW52ZW50b3J5QWZ0ZXIgPSBhd2FpdCBnZXRJbnZlbnRvcnkoKTtcblxuICAgIC8vIENsZWFuIHVwIHNlc3Npb25cbiAgICBkZWxldGUgY29va2luZ1Nlc3Npb25zW3Nlc3Npb25faWRdO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgZGF0YToge1xuICAgICAgICByZWNpcGVfbmFtZTogc2Vzc2lvbi5yZWNpcGUubmFtZSxcbiAgICAgICAgZGVkdWN0ZWRfaXRlbXM6IGRlZHVjdGVkSXRlbXMsXG4gICAgICAgIGludmVudG9yeV9hZnRlcjogaW52ZW50b3J5QWZ0ZXIsXG4gICAgICB9LFxuICAgICAgbWVzc2FnZTogYEdyZWF0IGpvYiEgJHtzdWNjZXNzQ291bnR9IGluZ3JlZGllbnQocykgZGVkdWN0ZWQgZnJvbSBpbnZlbnRvcnkuYCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBQT1NUIC9hcGkvY29va2luZy9jb21wbGV0ZTonLCBlcnJvcik7XG5cbiAgICBjb25zdCBlcnJvck1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcblxuICAgIGlmIChlcnJvck1zZy5pbmNsdWRlcygnU1VQQUJBU0UnKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdEYXRhYmFzZSBlcnJvcicsXG4gICAgICAgIGRldGFpbHM6IGVycm9yTXNnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gY29tcGxldGUgY29va2luZycsXG4gICAgICBkZXRhaWxzOiBlcnJvck1zZyxcbiAgICB9KTtcbiAgfVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBc0ZPLFNBQVMsaUJBQWlCLFVBQTBCO0FBQ3pELFFBQU0sYUFBYSxTQUFTLFlBQVksRUFBRSxLQUFLO0FBQy9DLFNBQU8sZ0JBQWdCLFVBQVUsS0FBSztBQUN4QztBQXpGQSxJQU1hO0FBTmI7QUFBQTtBQUFBO0FBTU8sSUFBTSxrQkFBMEM7QUFBQTtBQUFBLE1BRXJELFVBQVU7QUFBQSxNQUNWLFlBQVk7QUFBQSxNQUNaLFNBQVM7QUFBQTtBQUFBLE1BR1QsVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLE1BQ1osaUJBQWlCO0FBQUEsTUFDakIsbUJBQW1CO0FBQUEsTUFDbkIsb0JBQW9CO0FBQUE7QUFBQSxNQUdwQixRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsTUFDVCxjQUFjO0FBQUEsTUFDZCxlQUFlO0FBQUEsTUFDZixjQUFjO0FBQUEsTUFDZCxlQUFlO0FBQUEsTUFDZixZQUFZO0FBQUEsTUFDWixhQUFhO0FBQUE7QUFBQSxN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QXdDLEtBQUs7QUFFM0QsVUFBTSxXQUFXLGlCQUFpQixRQUFRLE1BQU0sVUFBVSxPQUFPLEtBQUs7QUFFdEUsUUFBSSxTQUFTLFNBQVMsVUFBVSxHQUFHO0FBQ2pDLGFBQU8sSUFBSSxPQUFPLEdBQUcsRUFBRSxLQUFLO0FBQUEsUUFDMUIsT0FBTztBQUFBLFFBQ1AsU0FBUztBQUFBLE1BQ1gsQ0FBQztBQUFBLElBQ0g7QUFFQSxRQUFJLE9BQU8sR0FBRyxFQUFFLEtBQUs7QUFBQSxNQUNuQixPQUFPO0FBQUEsTUFDUCxTQUFTO0FBQUEsSUFDWCxDQUFDO0FBQUEsRUFDSDtBQUNGLENBQUM7QUFFRCxJQUFPLGtCQUFRQTs7O0FMNVdmLElBQU0sTUFBZSxRQUFRO0FBRzdCLElBQUksSUFBSSxLQUFLLENBQUM7QUFDZCxJQUFJLElBQUksUUFBUSxLQUFLLENBQUM7QUFHdEIsSUFBSSxJQUFJLGVBQWUsQ0FBQyxLQUFjLFFBQWtCO0FBQ3RELE1BQUksS0FBSyxFQUFFLFFBQVEsTUFBTSxZQUFXLG9CQUFJLEtBQUssR0FBRSxZQUFZLEVBQUUsQ0FBQztBQUNoRSxDQUFDO0FBR0QsSUFBSSxJQUFJLGtCQUFrQixpQkFBZTtBQUN6QyxJQUFJLElBQUksYUFBYSxZQUFVO0FBQy9CLElBQUksSUFBSSxnQkFBZ0IsZUFBYTtBQUdyQyxJQUFJLElBQUksQ0FBQyxLQUFVLEtBQWMsUUFBa0I7QUFDakQsVUFBUSxNQUFNLEdBQUc7QUFDakIsTUFBSSxPQUFPLEdBQUcsRUFBRSxLQUFLO0FBQUEsSUFDbkIsT0FBTztBQUFBLElBQ1AsU0FBUyxJQUFJO0FBQUEsRUFDZixDQUFDO0FBQ0gsQ0FBQztBQUVELElBQU8sY0FBUTsiLAogICJuYW1lcyI6IFsiZ2V0Q2Fub25pY2FsTmFtZSIsICJnZXRDYW5vbmljYWxOYW1lIiwgImRlZHVjdGVkSXRlbSIsICJSb3V0ZXIiLCAicm91dGVyIiwgIlJvdXRlciIsICJSb3V0ZXIiLCAicm91dGVyIiwgIlJvdXRlciJdCn0K
