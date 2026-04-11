
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

// netlify/functions/api/utils/units.ts
var units_exports = {};
__export(units_exports, {
  areUnitsCompatible: () => areUnitsCompatible,
  cacheCanonicalUnit: () => cacheCanonicalUnit,
  convertToCanonical: () => convertToCanonical,
  deductWithConfidence: () => deductWithConfidence,
  getCanonicalUnit: () => getCanonicalUnit
});
function getCanonicalUnit(ingredientName) {
  const lowerName = ingredientName.toLowerCase();
  if (canonicalUnitCache[lowerName]) {
    return canonicalUnitCache[lowerName];
  }
  if (lowerName.includes("milk") || lowerName.includes("water") || lowerName.includes("stock") || lowerName.includes("oil") || lowerName.includes("juice") || lowerName.includes("tomatoes")) {
    return "ml";
  }
  if (lowerName.includes("egg") || lowerName.includes("tomato") || lowerName.includes("onion") || lowerName.includes("potato") || lowerName.includes("lemon") || lowerName.includes("clove") || lowerName.includes("pepper")) {
    return "pieces";
  }
  return "g";
}
function cacheCanonicalUnit(ingredientName, unit) {
  canonicalUnitCache[ingredientName.toLowerCase()] = unit;
}
function convertToCanonical(userQuantity, userUnit, ingredientName) {
  const canonicalUnit = getCanonicalUnit(ingredientName);
  const qty = typeof userQuantity === "string" ? parseFloat(userQuantity) : userQuantity;
  if (!userUnit) {
    return {
      quantity: qty,
      unit: canonicalUnit,
      confidence: "approximate"
    };
  }
  const userUnitLower = userUnit.toLowerCase().trim();
  if (canonicalUnit === "ml") {
    if (userUnitLower === "ml" || userUnitLower === "milliliter" || userUnitLower === "millilitres") {
      return { quantity: qty, unit: "ml", confidence: "exact" };
    }
    if (userUnitLower === "l" || userUnitLower === "liter" || userUnitLower === "litre") {
      return { quantity: qty * 1e3, unit: "ml", confidence: "exact" };
    }
    if (userUnitLower === "cup" || userUnitLower === "cups") {
      return { quantity: qty * 240, unit: "ml", confidence: "exact" };
    }
    if (userUnitLower === "tbsp" || userUnitLower === "tablespoon" || userUnitLower === "tablespoons") {
      return { quantity: qty * 15, unit: "ml", confidence: "exact" };
    }
    if (userUnitLower === "tsp" || userUnitLower === "teaspoon" || userUnitLower === "teaspoons") {
      return { quantity: qty * 5, unit: "ml", confidence: "exact" };
    }
    if (userUnitLower === "pint" || userUnitLower === "pints") {
      return { quantity: qty * 568, unit: "ml", confidence: "exact" };
    }
    if (userUnitLower === "fl oz" || userUnitLower === "floz" || userUnitLower === "fluid ounce") {
      return { quantity: qty * 30, unit: "ml", confidence: "exact" };
    }
  }
  if (canonicalUnit === "g") {
    if (userUnitLower === "g" || userUnitLower === "gram" || userUnitLower === "grams") {
      return { quantity: qty, unit: "g", confidence: "exact" };
    }
    if (userUnitLower === "kg" || userUnitLower === "kilogram" || userUnitLower === "kilograms") {
      return { quantity: qty * 1e3, unit: "g", confidence: "exact" };
    }
    if (userUnitLower === "oz" || userUnitLower === "ounce" || userUnitLower === "ounces") {
      return { quantity: qty * 28.35, unit: "g", confidence: "exact" };
    }
    if (userUnitLower === "lb" || userUnitLower === "lbs" || userUnitLower === "pound" || userUnitLower === "pounds") {
      return { quantity: qty * 454, unit: "g", confidence: "exact" };
    }
    if (userUnitLower === "cup" || userUnitLower === "cups") {
      return { quantity: qty * 125, unit: "g", confidence: "exact" };
    }
    if (userUnitLower === "tbsp" || userUnitLower === "tablespoon" || userUnitLower === "tablespoons") {
      return { quantity: qty * 15, unit: "g", confidence: "exact" };
    }
    if (userUnitLower === "tsp" || userUnitLower === "teaspoon" || userUnitLower === "teaspoons") {
      return { quantity: qty * 5, unit: "g", confidence: "exact" };
    }
  }
  if (canonicalUnit === "pieces") {
    if (userUnitLower === "pieces" || userUnitLower === "piece" || userUnitLower === "count" || userUnitLower === "clove" || userUnitLower === "cloves") {
      return { quantity: qty, unit: "pieces", confidence: "exact" };
    }
  }
  return { quantity: qty, unit: canonicalUnit, confidence: "approximate" };
}
function deductWithConfidence(inventoryConfidence, deductionConfidence) {
  if (inventoryConfidence === "exact" && deductionConfidence === "exact") {
    return "exact";
  }
  return "approximate";
}
function areUnitsCompatible(unit1, unit2) {
  const unit1Lower = unit1.toLowerCase();
  const unit2Lower = unit2.toLowerCase();
  const volumeUnits = ["ml", "l", "cup", "cups", "tbsp", "tsp", "pint", "fl oz"];
  const weightUnits = ["g", "kg", "oz", "lb", "lbs"];
  const countUnits = ["pieces", "piece", "count", "clove", "cloves"];
  const isVolume1 = volumeUnits.some((u) => unit1Lower.includes(u));
  const isVolume2 = volumeUnits.some((u) => unit2Lower.includes(u));
  if (isVolume1 && isVolume2) return true;
  const isWeight1 = weightUnits.some((u) => unit1Lower.includes(u));
  const isWeight2 = weightUnits.some((u) => unit2Lower.includes(u));
  if (isWeight1 && isWeight2) return true;
  const isCount1 = countUnits.some((u) => unit1Lower.includes(u));
  const isCount2 = countUnits.some((u) => unit2Lower.includes(u));
  if (isCount1 && isCount2) return true;
  return false;
}
var canonicalUnitCache;
var init_units = __esm({
  "netlify/functions/api/utils/units.ts"() {
    "use strict";
    canonicalUnitCache = {};
  }
});

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
init_units();
import OpenAI from "openai";
var openaiClient = null;
var PANTRY_STAPLE_CANONICALS = /* @__PURE__ */ new Set([
  "salt",
  "pepper",
  "oil",
  "olive_oil",
  "vegetable_oil",
  "butter",
  "vinegar",
  "soy_sauce",
  "spice",
  "spices",
  "cumin",
  "cinnamon",
  "thyme",
  "oregano"
]);
function hasOpenAiApiKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
function inferCanonicalName(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_");
}
function isPantryStaple(item) {
  const canonical = (item.canonical_name || inferCanonicalName(item.name)).toLowerCase();
  const normalizedName = item.name.toLowerCase().trim();
  return item.has_item === true || PANTRY_STAPLE_CANONICALS.has(canonical) || PANTRY_STAPLE_CANONICALS.has(normalizedName.replace(/\s+/g, "_"));
}
function hasCookableIngredients(inventoryItems) {
  return inventoryItems.some((item) => !isPantryStaple(item));
}
async function parseInventoryInputLocally(userInput) {
  const { getCanonicalName: getCanonicalName2 } = await Promise.resolve().then(() => (init_canonical_foods(), canonical_foods_exports));
  const pantryStaples = /* @__PURE__ */ new Set([
    "salt",
    "pepper",
    "oil",
    "olive oil",
    "butter",
    "vinegar",
    "soy sauce",
    "spice",
    "spices",
    "basil",
    "garlic",
    "parsley"
  ]);
  return userInput.split(/,| and /i).map((part) => part.trim()).filter(Boolean).map((part) => {
    const cleaned = part.replace(/^(i have|we have|got)\s+/i, "").trim();
    const qtyMatch = cleaned.match(
      /^(\d+(?:\.\d+)?)\s*(kilogram|kg|gram|g|milliliter|ml|liter|l|tablespoons?|tbsp|teaspoons?|tsp|cups?|cup|ounces?|oz|pieces?|piece|cloves?|bunch(?:es)?)?\s*(?:of\s+)?(.+)$/i
    );
    let name = cleaned;
    let quantity = void 0;
    let unit = void 0;
    let confidence = "approximate";
    let hasItem = false;
    if (qtyMatch) {
      quantity = Number(qtyMatch[1]);
      unit = qtyMatch[2] || void 0;
      name = qtyMatch[3].trim();
      confidence = "exact";
    } else if (pantryStaples.has(cleaned.toLowerCase())) {
      hasItem = true;
      confidence = "exact";
    } else if (/^(some|a little|a bit|a handful of|a bunch of)\s+/i.test(cleaned)) {
      const approxMatch = cleaned.match(/^(some|a little|a bit|a handful of|a bunch of)\s+/i);
      name = cleaned.replace(/^(some|a little|a bit|a handful of|a bunch of)\s+/i, "").trim();
      quantity = 1;
      if (approxMatch && /a bunch of/i.test(approxMatch[1])) {
        unit = "bunch";
      }
    }
    if (!hasItem && name && pantryStaples.has(name.toLowerCase())) {
      hasItem = true;
    }
    let finalUnit = unit;
    if (!finalUnit && quantity && !hasItem) {
      const countableKeywords = ["chicken", "breast", "tomato", "apple", "egg", "carrot", "onion", "potato", "pepper", "cucumber", "spinach", "lettuce", "basil", "parsley", "clove"];
      const isCountable = countableKeywords.some((keyword) => name.toLowerCase().includes(keyword));
      if (isCountable) {
        if (!unit) {
          finalUnit = "pieces";
        }
      }
    }
    const canonical = getCanonicalName2(name) || inferCanonicalName(name);
    return {
      name,
      canonical_name: canonical,
      has_item: hasItem,
      quantity_approx: hasItem ? void 0 : quantity,
      unit: finalUnit,
      confidence
    };
  });
}
function suggestMealsLocally(inventoryItems, mealType) {
  const names = inventoryItems.map((item) => item.name);
  const lead = names.slice(0, 3);
  const joined = lead.join(", ");
  return [
    {
      name: `${lead[0] || "Pantry"} ${mealType === "breakfast" ? "Hash" : "Skillet"}`,
      description: `A quick ${mealType} idea built from ${joined || "what you have on hand"}.`,
      time_estimate_mins: mealType === "breakfast" ? 10 : 15
    },
    {
      name: `${lead[0] || "Simple"} ${mealType === "lunch" ? "Bowl" : "Saute"}`,
      description: `A simple ${mealType} using ${joined || "your current inventory"}.`,
      time_estimate_mins: 15
    },
    {
      name: `${mealType[0].toUpperCase()}${mealType.slice(1)} ${lead[1] || "Kitchen"} Mix`,
      description: `A flexible dish combining ${joined || "available ingredients"} with minimal prep.`,
      time_estimate_mins: 20
    }
  ];
}
function generateRecipeDetailLocally(recipeName, recipeDescription, userInventory) {
  const rawIngredients = userInventory.slice(0, 5).map((item) => ({
    name: item.name.toLowerCase(),
    quantity: item.quantity_approx ?? 1,
    unit: item.unit || (item.has_item ? "to taste" : "pieces")
  }));
  const ingredients = rawIngredients.map((ing) => {
    const result = convertToCanonical(ing.quantity, ing.unit, ing.name);
    cacheCanonicalUnit(ing.name, result.unit);
    return {
      name: ing.name,
      quantity: result.quantity,
      unit: result.unit
    };
  });
  return {
    name: recipeName,
    description: recipeDescription,
    time_estimate_mins: Math.max(10, ingredients.length * 5),
    ingredients,
    instructions: [
      "Prepare the ingredients from your current inventory.",
      "Cook the main ingredients together over medium heat until tender.",
      "Adjust the texture and combine everything evenly.",
      "Serve immediately while warm."
    ]
  };
}
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
  if (!hasOpenAiApiKey()) {
    return parseInventoryInputLocally(userInput);
  }
  const client = getOpenAIClient();
  const { getCanonicalName: getCanonicalName2 } = await Promise.resolve().then(() => (init_canonical_foods(), canonical_foods_exports));
  const systemPrompt = `You are a kitchen inventory parser. Your job is to extract food items from user input.

For each item, extract:
1. name: The food item name only, stripped of quantities and units (e.g., "chicken breast", "oil", NOT "3 chicken breasts" or "2 tablespoons of oil")
2. canonical_name: Normalized version (e.g., "chicken_breast", "salad_leaves") - you'll compute this from name
3. has_item: boolean. True ONLY for pantry staples where quantity doesn't matter (salt, spices, oils, condiments)
4. quantity_approx: The quantity as a number. For approximate quantities, use best judgment:
   - "some" / "a little" / "a bit" = 1
   - "a bunch" / "handful" / "quite a bit" = 2
   - "lots" / "a lot" / "plenty" = 4
   - Fractions: parse literally ("half" = 0.5, "1/3" = 0.33)
   - For has_item=true items, quantity_approx = null
5. unit: The unit of measurement. Use standard units:
   - "pieces" for countable items (chicken breasts, tomatoes, eggs, apples, etc.) - ALWAYS use "pieces" if no explicit unit given
   - "bunch" for bunches/bundles
   - "g" for grams
   - "ml" for milliliters
   - "cup" for cups
   - "tbsp" for tablespoons
   - null for bulk items without quantifiable units (like "salt", "spice")
6. confidence: "exact" if user specified quantity precisely, "approximate" if estimated

Return ONLY a JSON array, no other text. Example format:
[
  {"name": "chicken breast", "canonical_name": "chicken_breast", "quantity_approx": 3, "unit": "pieces", "confidence": "exact"},
  {"name": "tomato", "canonical_name": "tomato", "quantity_approx": 2, "unit": "pieces", "confidence": "exact"},
  {"name": "basil", "canonical_name": "basil", "quantity_approx": 1, "unit": "bunch", "confidence": "exact"},
  {"name": "salt", "canonical_name": "salt", "has_item": true, "quantity_approx": null, "unit": null, "confidence": "exact"}
]

Categories:
1. Pantry staples (salt, spices, loose items): has_item=true, unit=null, quantity_approx=null
2. Exact quantities with units (500g beef, 240ml milk): confidence="exact"
3. Exact counts (3 apples, 2 chicken breasts): unit="pieces", confidence="exact"
4. Bunches/bundles (1 bunch basil): unit="bunch", confidence="exact"
5. Rough quantities (some salad, lots of carrots): confidence="approximate", unit="pieces" (if countable)

Handle edge cases:
- Ignore articles like "a", "an", "the"
- Normalize item names (e.g., "tomatoes" \u2192 "tomato", "chicken breasts" \u2192 "chicken breast")
- Extract units from compound items (e.g., "2 tablespoons of oil" \u2192 name: "oil", quantity_approx: 2, unit: "tbsp")
- For countable items (meats, vegetables, fruits, eggs) WITHOUT an explicit unit, default to unit: "pieces"`;
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
    const { convertToCanonical: convertToCanonical2, cacheCanonicalUnit: cacheCanonicalUnit2 } = await Promise.resolve().then(() => (init_units(), units_exports));
    parsed.forEach((item) => {
      const canonicalResult = convertToCanonical2(
        item.quantity_approx || 1,
        item.unit,
        item.name
      );
      cacheCanonicalUnit2(item.name, canonicalResult.unit);
    });
    return parsed.map((item) => {
      let cleanName = item.name || "";
      let cleanUnit = item.unit;
      const unitPrefixes = ["tablespoons?", "tbsp", "teaspoons?", "tsp", "cups?", "ml", "grams?", "g", "ounces?", "oz", "pieces?", "count"];
      unitPrefixes.forEach((prefix) => {
        const regex = new RegExp(`^\\d*\\.?\\d*\\s*${prefix}\\s+(?:of\\s+)?`, "i");
        cleanName = cleanName.replace(regex, "");
      });
      let inferredUnit = cleanUnit || null;
      if (!inferredUnit && !item.has_item && item.quantity_approx !== null) {
        const countableKeywords = ["chicken", "breast", "tomato", "apple", "egg", "carrot", "onion", "potato", "pepper", "cucumber", "spinach", "lettuce", "basil", "parsley", "clove", "leaf", "leaves", "slice"];
        const isCountable = countableKeywords.some((keyword) => cleanName.toLowerCase().includes(keyword));
        if (isCountable) {
          inferredUnit = "pieces";
        } else if (cleanUnit === "bunch" || item.unit === "bunch") {
          inferredUnit = "bunch";
        }
      }
      if (cleanUnit === "bunch" || item.unit === "bunch") {
        inferredUnit = "bunch";
      }
      let canonicalNameValue = item.canonical_name || getCanonicalName2(cleanName || "");
      let cleanCanonicalName = canonicalNameValue;
      unitPrefixes.forEach((prefix) => {
        const regex = new RegExp(`^${prefix}_of_|_${prefix}s?|${prefix}_of_`, "i");
        cleanCanonicalName = cleanCanonicalName.replace(regex, "");
      });
      cleanCanonicalName = cleanCanonicalName.replace(/^[\w]+_of_/, "");
      return {
        name: cleanName.trim(),
        canonical_name: cleanCanonicalName.trim(),
        has_item: item.has_item || false,
        quantity_approx: item.quantity_approx || null,
        unit: inferredUnit,
        confidence: item.confidence || "approximate"
      };
    });
  } catch (error) {
    console.error("Error parsing inventory input:", error);
    throw new Error(
      `Failed to parse inventory: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
async function suggestMeals(inventoryItems, mealType) {
  if (!hasCookableIngredients(inventoryItems)) {
    return [];
  }
  if (!hasOpenAiApiKey()) {
    return suggestMealsLocally(inventoryItems, mealType);
  }
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
      temperature: 0,
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
  if (!hasOpenAiApiKey()) {
    return generateRecipeDetailLocally(
      recipeName,
      recipeDescription,
      userInventory
    );
  }
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
    parsed.ingredients.forEach((ing) => {
      if (!ing.unit || ing.unit === "" || ing.unit === null) {
        throw new Error(
          `Recipe ingredient "${ing.name}" is missing a unit. All recipe ingredients must specify units (e.g., "g", "ml", "pieces").`
        );
      }
    });
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
    parsed.ingredients = parsed.ingredients.map((ing) => {
      const result = convertToCanonical(ing.quantity, ing.unit, ing.name);
      cacheCanonicalUnit(ing.name, result.unit);
      return {
        name: ing.name,
        quantity: result.quantity,
        unit: result.unit
      };
    });
    return parsed;
  } catch (error) {
    console.error("Error generating recipe detail:", error);
    throw new Error(
      `Failed to generate recipe detail: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
async function parseRecipeAdjustments(userInput, recipeContext) {
  if (/^(looks good|ready|no changes|sounds good|ok|all set|fine|good to go)$/i.test(userInput.trim())) {
    return [];
  }
  if (!hasOpenAiApiKey()) {
    return parseRecipeAdjustmentsLocally(userInput, recipeContext);
  }
  try {
    const client = getOpenAIClient();
    const recipeIngredients = recipeContext.ingredients.map((ing) => `- ${ing.name}: ${ing.quantity}${ing.unit}`).join("\n");
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
- adjustment_type (QUANTITY ONLY): Infer whether user means:
  * 'inventory_correction': "I only have X" (inventory was wrong, needs updating)
  * 'recipe_constraint': "I only want to use X" (recipe adjustment only, don't update inventory)
  * 'both': "I have exactly X and using it all" (update inventory AND recipe)

Examples:
"I only have 300g flour" \u2192 { type: 'quantity', ingredient: 'flour', quantity: 300, unit: 'g', confidence: 'exact', adjustment_type: 'inventory_correction' }
"milk is gone off" \u2192 { type: 'removal', ingredient: 'milk', reason: 'gone_off' }
"use cod instead of chicken" \u2192 { type: 'substitution', ingredient: 'chicken', substitute_with: 'cod', confidence: 'exact' }
"about 6 eggs" \u2192 { type: 'quantity', ingredient: 'eggs', quantity: 6, unit: 'pieces', confidence: 'approximate', adjustment_type: 'recipe_constraint' }
"looks good" \u2192 {} (no adjustments - return empty array in response)

Return ONLY valid JSON array of adjustment objects. If no adjustments, return empty array [].
Never return JSON with extra text or markdown.`;
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userInput
        }
      ]
    });
    const content = response.choices[0].message.content;
    if (!content || typeof content !== "string") {
      throw new Error("Unexpected response type from LLM");
    }
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error parsing recipe adjustments:", error);
    try {
      return parseRecipeAdjustmentsLocally(userInput, recipeContext);
    } catch {
      return [];
    }
  }
}
function parseRecipeAdjustmentsLocally(userInput, recipeContext) {
  const adjustments = [];
  const input = userInput.toLowerCase();
  const ingredientMap = new Map(
    recipeContext.ingredients.map((ing) => [ing.name.toLowerCase(), ing])
  );
  const qtyPattern = /(\d+(?:\.\d+)?)\s*(g|ml|cups?|tbsp|tsp|pieces?|cloves?)?(?:\s+of)?\s+(\w+)/gi;
  let match;
  while ((match = qtyPattern.exec(input)) !== null) {
    const quantity = parseFloat(match[1]);
    const unit = match[2] || "pieces";
    const ingredient = match[3];
    for (const [ingKey, ingValue] of ingredientMap) {
      if (ingKey.includes(ingredient) || ingredient.includes(ingKey.split("_")[0])) {
        let adjustmentType = "recipe_constraint";
        if (/^(i only have|only have|i have)/.test(userInput.toLowerCase())) {
          adjustmentType = "inventory_correction";
        } else if (/\(have exactly|using all|using it all\)/.test(userInput.toLowerCase())) {
          adjustmentType = "both";
        }
        adjustments.push({
          type: "quantity",
          ingredient: ingValue.name,
          quantity,
          unit,
          confidence: "exact",
          adjustment_type: adjustmentType
        });
        break;
      }
    }
  }
  ingredientMap.forEach((ing) => {
    const ingPattern = new RegExp(`(${ing.name}|${ing.name.split(" ")[0]}).*?(gone|ran out|don't have|do not have|missing|no longer)`, "i");
    if (ingPattern.test(userInput)) {
      if (!adjustments.some((adj) => adj.ingredient === ing.name && adj.type === "quantity")) {
        adjustments.push({
          type: "removal",
          ingredient: ing.name,
          reason: "gone_off"
        });
      }
    }
  });
  const substPattern = /use\s+(\w+)\s+instead of\s+(\w+)/i;
  if ((match = substPattern.exec(userInput)) !== null) {
    const substitution = match[1];
    const original = match[2];
    for (const [ingKey, ingValue] of ingredientMap) {
      if (ingKey.includes(original.toLowerCase()) || original.toLowerCase().includes(ingKey.split("_")[0])) {
        adjustments.push({
          type: "substitution",
          ingredient: ingValue.name,
          substitute_with: substitution,
          confidence: "exact"
        });
        break;
      }
    }
  }
  return adjustments;
}
async function isIngredientCritical(ingredientName, recipe) {
  if (!hasOpenAiApiKey()) {
    const mainIngredients = recipe.ingredients.slice(0, Math.ceil(recipe.ingredients.length / 2));
    return mainIngredients.some((ing) => ing.name.toLowerCase() === ingredientName.toLowerCase());
  }
  const client = getOpenAIClient();
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 100,
      messages: [
        {
          role: "system",
          content: `You are a culinary expert. Determine if an ingredient is critical to a recipe.

Critical ingredients = main protein, carb, or fat that the recipe depends on
Non-critical = seasonings, garnishes, flavor additions that can be substituted or omitted

Reply with ONLY "yes" or "no".`
        },
        {
          role: "user",
          content: `Recipe: ${recipe.name} - ${recipe.description}
Ingredients: ${recipe.ingredients.map((i) => `${i.name}`).join(", ")}

Is "${ingredientName}" critical to this recipe?`
        }
      ]
    });
    const answer = response.choices[0].message.content?.toLowerCase().trim() ?? "no";
    return answer.includes("yes");
  } catch (error) {
    console.error("Error checking critical ingredient:", error);
    const mainIngredients = recipe.ingredients.slice(0, Math.ceil(recipe.ingredients.length / 2));
    return mainIngredients.some((ing) => ing.name.toLowerCase() === ingredientName.toLowerCase());
  }
}

// netlify/functions/api/utils/db.ts
init_units();
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
async function clearInventory() {
  const items = await getInventory();
  await Promise.all(
    items.map(
      (item) => pocketbaseFetch(`/collections/inventory_items/records/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          date_used: (/* @__PURE__ */ new Date()).toISOString()
        })
      })
    )
  );
  return items.length;
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
    const inventoryCanonical = convertToCanonical(available, item.unit, item.name);
    if (inventoryCanonical.quantity < quantityToDeduct) {
      throw new Error(
        `Insufficient quantity: need ${quantityToDeduct}${inventoryCanonical.unit}, have ${inventoryCanonical.quantity}${inventoryCanonical.unit}. User must review recipe or add more inventory.`
      );
    }
    const remainderQuantity = inventoryCanonical.quantity - quantityToDeduct;
    if (Math.abs(remainderQuantity) < 0.01) {
      const deductedItem3 = await pocketbaseFetch(
        `/collections/inventory_items/records/${itemId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ date_used: (/* @__PURE__ */ new Date()).toISOString() })
        }
      );
      return { deducted_item: deductedItem3 };
    }
    const conversionRatio = inventoryCanonical.quantity / available;
    const remainder = remainderQuantity / conversionRatio;
    const remainderItem = await pocketbaseFetch(
      `/collections/inventory_items/records`,
      {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          name: item.name,
          canonical_name: item.canonical_name,
          quantity_approx: remainder,
          // Now in original unit (e.g., 0.2 cups)
          unit: item.unit,
          // Original unit (e.g., 'cup')
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
router.delete("/", async (req, res) => {
  try {
    const clearedCount = await clearInventory();
    res.status(200).json({
      cleared: clearedCount,
      message: `Cleared ${clearedCount} inventory item${clearedCount === 1 ? "" : "s"}`
    });
  } catch (error) {
    console.error("Error in DELETE /api/inventory:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: "Failed to clear inventory",
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
router3.post("/confirm-adjustments", async (req, res) => {
  try {
    const { session_id, user_input } = req.body;
    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({
        error: "Missing or invalid session_id field",
        details: "session_id must be a string"
      });
    }
    if (!user_input || typeof user_input !== "string") {
      return res.status(400).json({
        error: "Missing or invalid user_input field",
        details: "user_input must be a non-empty string"
      });
    }
    const session = cookingSessions[session_id];
    if (!session) {
      return res.status(404).json({
        error: "Cooking session not found",
        details: `Session ${session_id} does not exist or has expired`
      });
    }
    const adjustments = await parseRecipeAdjustments(user_input, {
      ingredients: session.recipe.ingredients
    });
    let updatedRecipe = { ...session.recipe };
    let updatedIngredients = [...updatedRecipe.ingredients];
    for (const adjustment of adjustments) {
      if (adjustment.type === "quantity") {
        const ingredientIndex = updatedIngredients.findIndex(
          (ing) => ing.name.toLowerCase() === adjustment.ingredient.toLowerCase()
        );
        if (ingredientIndex !== -1) {
          updatedIngredients[ingredientIndex] = {
            ...updatedIngredients[ingredientIndex],
            quantity: adjustment.quantity || updatedIngredients[ingredientIndex].quantity,
            unit: adjustment.unit || updatedIngredients[ingredientIndex].unit
          };
        }
      } else if (adjustment.type === "removal") {
        const isCritical = await isIngredientCritical(adjustment.ingredient, session.recipe);
        if (isCritical) {
          adjustment.warning = `\u26A0\uFE0F This is a critical ingredient. Recipe may not work without ${adjustment.ingredient}.`;
        }
        updatedIngredients = updatedIngredients.filter(
          (ing) => ing.name.toLowerCase() !== adjustment.ingredient.toLowerCase()
        );
      } else if (adjustment.type === "substitution") {
        const ingredientIndex = updatedIngredients.findIndex(
          (ing) => ing.name.toLowerCase() === adjustment.ingredient.toLowerCase()
        );
        if (ingredientIndex !== -1) {
          updatedIngredients[ingredientIndex] = {
            ...updatedIngredients[ingredientIndex],
            name: adjustment.substitute_with || updatedIngredients[ingredientIndex].name
          };
        }
      }
    }
    updatedRecipe.ingredients = updatedIngredients;
    try {
      const currentInventory2 = await getInventory();
      updatedRecipe = await generateRecipeDetail(
        updatedRecipe.name,
        updatedRecipe.description,
        currentInventory2
      );
      updatedRecipe.ingredients = updatedIngredients;
    } catch (error) {
      console.warn("Could not regenerate recipe instructions:", error);
      updatedRecipe.ingredients = updatedIngredients;
    }
    const currentInventory = await getInventory();
    const ingredientsToDeduct = updatedRecipe.ingredients.map((ingredient) => {
      const inventoryItem = currentInventory.find(
        (item) => item.name.toLowerCase() === ingredient.name.toLowerCase() || item.canonical_name?.toLowerCase() === ingredient.name.toLowerCase()
      );
      if (!inventoryItem) {
        throw new Error(
          `Adjusted recipe ingredient "${ingredient.name}" not found in inventory. User may have removed it during adjustment.`
        );
      }
      return {
        name: ingredient.name,
        quantity: typeof ingredient.quantity === "string" ? parseFloat(ingredient.quantity) : ingredient.quantity,
        unit: ingredient.unit,
        inventory_item_id: inventoryItem.id,
        confidence: inventoryItem.confidence
      };
    });
    session.recipe = updatedRecipe;
    session.ingredients_to_deduct = ingredientsToDeduct;
    res.status(200).json({
      data: {
        session_id,
        adjustments,
        recipe: updatedRecipe,
        ingredients_to_deduct: ingredientsToDeduct
      },
      message: `${adjustments.length} adjustment(s) applied. Ready to cook!`
    });
  } catch (error) {
    console.error("Error in POST /api/cooking/confirm-adjustments:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("not found in inventory")) {
      return res.status(400).json({
        error: "Adjusted recipe validation failed",
        details: errorMsg
      });
    }
    res.status(400).json({
      error: "Failed to confirm adjustments",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvYXBpL3V0aWxzL3VuaXRzLnRzIiwgIm5ldGxpZnkvZnVuY3Rpb25zL2FwaS91dGlscy9jYW5vbmljYWwtZm9vZHMudHMiLCAibmV0bGlmeS9mdW5jdGlvbnMvYXBpLnRzIiwgIm5ldGxpZnkvZnVuY3Rpb25zL2FwaS9pbnZlbnRvcnkudHMiLCAibmV0bGlmeS9mdW5jdGlvbnMvYXBpL3V0aWxzL3Byb21wdHMudHMiLCAibmV0bGlmeS9mdW5jdGlvbnMvYXBpL3V0aWxzL2RiLnRzIiwgIm5ldGxpZnkvZnVuY3Rpb25zL2FwaS9jaGF0LnRzIiwgIm5ldGxpZnkvZnVuY3Rpb25zL2FwaS9jb29raW5nLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIFVuaXQgTm9ybWFsaXphdGlvbiBVdGlsaXRpZXNcbiAqIE1hcHMgaW5ncmVkaWVudHMgdG8gY2Fub25pY2FsIHN0b3JhZ2UgdW5pdHMgYW5kIGNvbnZlcnRzIHVzZXIgaW5wdXRzXG4gKi9cblxuLy8gQ2FjaGUgb2YgaW5ncmVkaWVudCBcdTIxOTIgY2Fub25pY2FsIHVuaXQgKHBvcHVsYXRlZCBieSBMTE0gb24gZmlyc3QgYWRkKVxuY29uc3QgY2Fub25pY2FsVW5pdENhY2hlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbi8qKlxuICogR2V0IGNhbm9uaWNhbCB1bml0IGZvciBhbiBpbmdyZWRpZW50XG4gKiBSZXR1cm5zIGZyb20gY2FjaGUgaWYgYXZhaWxhYmxlLCBvdGhlcndpc2UgcmV0dXJucyBkZWZhdWx0IGJhc2VkIG9uIGNhdGVnb3J5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDYW5vbmljYWxVbml0KGluZ3JlZGllbnROYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBsb3dlck5hbWUgPSBpbmdyZWRpZW50TmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gIC8vIElmIHdlJ3ZlIGNhY2hlZCBpdCBiZWZvcmUsIHJldHVybiBjYWNoZWQgdmFsdWVcbiAgaWYgKGNhbm9uaWNhbFVuaXRDYWNoZVtsb3dlck5hbWVdKSB7XG4gICAgcmV0dXJuIGNhbm9uaWNhbFVuaXRDYWNoZVtsb3dlck5hbWVdO1xuICB9XG5cbiAgLy8gRGVmYXVsdCBmYWxsYmFja3MgYmFzZWQgb24gaW5ncmVkaWVudCBjYXRlZ29yeVxuICBpZiAobG93ZXJOYW1lLmluY2x1ZGVzKCdtaWxrJykgfHwgbG93ZXJOYW1lLmluY2x1ZGVzKCd3YXRlcicpIHx8XG4gICAgICBsb3dlck5hbWUuaW5jbHVkZXMoJ3N0b2NrJykgfHwgbG93ZXJOYW1lLmluY2x1ZGVzKCdvaWwnKSB8fFxuICAgICAgbG93ZXJOYW1lLmluY2x1ZGVzKCdqdWljZScpIHx8IGxvd2VyTmFtZS5pbmNsdWRlcygndG9tYXRvZXMnKSkge1xuICAgIHJldHVybiAnbWwnO1xuICB9XG5cbiAgaWYgKGxvd2VyTmFtZS5pbmNsdWRlcygnZWdnJykgfHwgbG93ZXJOYW1lLmluY2x1ZGVzKCd0b21hdG8nKSB8fFxuICAgICAgbG93ZXJOYW1lLmluY2x1ZGVzKCdvbmlvbicpIHx8IGxvd2VyTmFtZS5pbmNsdWRlcygncG90YXRvJykgfHxcbiAgICAgIGxvd2VyTmFtZS5pbmNsdWRlcygnbGVtb24nKSB8fCBsb3dlck5hbWUuaW5jbHVkZXMoJ2Nsb3ZlJykgfHxcbiAgICAgIGxvd2VyTmFtZS5pbmNsdWRlcygncGVwcGVyJykpIHtcbiAgICByZXR1cm4gJ3BpZWNlcyc7XG4gIH1cblxuICAvLyBEZWZhdWx0IHRvIGdyYW1zIGZvciBldmVyeXRoaW5nIGVsc2UgKGZsb3VyLCByaWNlLCBzdWdhciwgc2FsdCwgY2hlZXNlLCBicmVhZCwgZXRjLilcbiAgcmV0dXJuICdnJztcbn1cblxuLyoqXG4gKiBDYWNoZSB0aGUgTExNLWRldGVybWluZWQgY2Fub25pY2FsIHVuaXQgZm9yIGFuIGluZ3JlZGllbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhY2hlQ2Fub25pY2FsVW5pdChpbmdyZWRpZW50TmFtZTogc3RyaW5nLCB1bml0OiBzdHJpbmcpOiB2b2lkIHtcbiAgY2Fub25pY2FsVW5pdENhY2hlW2luZ3JlZGllbnROYW1lLnRvTG93ZXJDYXNlKCldID0gdW5pdDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb252ZXJzaW9uUmVzdWx0IHtcbiAgcXVhbnRpdHk6IG51bWJlcjtcbiAgdW5pdDogc3RyaW5nO1xuICBjb25maWRlbmNlOiAnZXhhY3QnIHwgJ2FwcHJveGltYXRlJztcbn1cblxuLyoqXG4gKiBDb252ZXJ0IHF1YW50aXR5IGZyb20gdXNlciB1bml0IHRvIGNhbm9uaWNhbCB1bml0XG4gKiBlLmcuLCAxIGN1cCBmbG91ciBcdTIxOTIgMTI1ZyBmbG91clxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udmVydFRvQ2Fub25pY2FsKFxuICB1c2VyUXVhbnRpdHk6IG51bWJlciB8IHN0cmluZyxcbiAgdXNlclVuaXQ6IHN0cmluZyB8IG51bGwsXG4gIGluZ3JlZGllbnROYW1lOiBzdHJpbmdcbik6IENvbnZlcnNpb25SZXN1bHQge1xuICBjb25zdCBjYW5vbmljYWxVbml0ID0gZ2V0Q2Fub25pY2FsVW5pdChpbmdyZWRpZW50TmFtZSk7XG4gIGNvbnN0IHF0eSA9IHR5cGVvZiB1c2VyUXVhbnRpdHkgPT09ICdzdHJpbmcnID8gcGFyc2VGbG9hdCh1c2VyUXVhbnRpdHkpIDogdXNlclF1YW50aXR5O1xuXG4gIC8vIElmIG5vIHVzZXIgdW5pdCBzcGVjaWZpZWQsIGFzc3VtZSBpdCdzIGFscmVhZHkgaW4gY2Fub25pY2FsIHVuaXRzXG4gIGlmICghdXNlclVuaXQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcXVhbnRpdHk6IHF0eSxcbiAgICAgIHVuaXQ6IGNhbm9uaWNhbFVuaXQsXG4gICAgICBjb25maWRlbmNlOiAnYXBwcm94aW1hdGUnXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHVzZXJVbml0TG93ZXIgPSB1c2VyVW5pdC50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuICAvLyA9PT09PSBWT0xVTUUgQ09OVkVSU0lPTlMgKHRvIG1sKSA9PT09PVxuICBpZiAoY2Fub25pY2FsVW5pdCA9PT0gJ21sJykge1xuICAgIGlmICh1c2VyVW5pdExvd2VyID09PSAnbWwnIHx8IHVzZXJVbml0TG93ZXIgPT09ICdtaWxsaWxpdGVyJyB8fCB1c2VyVW5pdExvd2VyID09PSAnbWlsbGlsaXRyZXMnKSB7XG4gICAgICByZXR1cm4geyBxdWFudGl0eTogcXR5LCB1bml0OiAnbWwnLCBjb25maWRlbmNlOiAnZXhhY3QnIH07XG4gICAgfVxuICAgIGlmICh1c2VyVW5pdExvd2VyID09PSAnbCcgfHwgdXNlclVuaXRMb3dlciA9PT0gJ2xpdGVyJyB8fCB1c2VyVW5pdExvd2VyID09PSAnbGl0cmUnKSB7XG4gICAgICByZXR1cm4geyBxdWFudGl0eTogcXR5ICogMTAwMCwgdW5pdDogJ21sJywgY29uZmlkZW5jZTogJ2V4YWN0JyB9O1xuICAgIH1cbiAgICBpZiAodXNlclVuaXRMb3dlciA9PT0gJ2N1cCcgfHwgdXNlclVuaXRMb3dlciA9PT0gJ2N1cHMnKSB7XG4gICAgICByZXR1cm4geyBxdWFudGl0eTogcXR5ICogMjQwLCB1bml0OiAnbWwnLCBjb25maWRlbmNlOiAnZXhhY3QnIH07XG4gICAgfVxuICAgIGlmICh1c2VyVW5pdExvd2VyID09PSAndGJzcCcgfHwgdXNlclVuaXRMb3dlciA9PT0gJ3RhYmxlc3Bvb24nIHx8IHVzZXJVbml0TG93ZXIgPT09ICd0YWJsZXNwb29ucycpIHtcbiAgICAgIHJldHVybiB7IHF1YW50aXR5OiBxdHkgKiAxNSwgdW5pdDogJ21sJywgY29uZmlkZW5jZTogJ2V4YWN0JyB9O1xuICAgIH1cbiAgICBpZiAodXNlclVuaXRMb3dlciA9PT0gJ3RzcCcgfHwgdXNlclVuaXRMb3dlciA9PT0gJ3RlYXNwb29uJyB8fCB1c2VyVW5pdExvd2VyID09PSAndGVhc3Bvb25zJykge1xuICAgICAgcmV0dXJuIHsgcXVhbnRpdHk6IHF0eSAqIDUsIHVuaXQ6ICdtbCcsIGNvbmZpZGVuY2U6ICdleGFjdCcgfTtcbiAgICB9XG4gICAgaWYgKHVzZXJVbml0TG93ZXIgPT09ICdwaW50JyB8fCB1c2VyVW5pdExvd2VyID09PSAncGludHMnKSB7XG4gICAgICByZXR1cm4geyBxdWFudGl0eTogcXR5ICogNTY4LCB1bml0OiAnbWwnLCBjb25maWRlbmNlOiAnZXhhY3QnIH07IC8vIFVLIHBpbnRcbiAgICB9XG4gICAgaWYgKHVzZXJVbml0TG93ZXIgPT09ICdmbCBveicgfHwgdXNlclVuaXRMb3dlciA9PT0gJ2Zsb3onIHx8IHVzZXJVbml0TG93ZXIgPT09ICdmbHVpZCBvdW5jZScpIHtcbiAgICAgIHJldHVybiB7IHF1YW50aXR5OiBxdHkgKiAzMCwgdW5pdDogJ21sJywgY29uZmlkZW5jZTogJ2V4YWN0JyB9O1xuICAgIH1cbiAgfVxuXG4gIC8vID09PT09IFdFSUdIVCBDT05WRVJTSU9OUyAodG8gZykgPT09PT1cbiAgaWYgKGNhbm9uaWNhbFVuaXQgPT09ICdnJykge1xuICAgIGlmICh1c2VyVW5pdExvd2VyID09PSAnZycgfHwgdXNlclVuaXRMb3dlciA9PT0gJ2dyYW0nIHx8IHVzZXJVbml0TG93ZXIgPT09ICdncmFtcycpIHtcbiAgICAgIHJldHVybiB7IHF1YW50aXR5OiBxdHksIHVuaXQ6ICdnJywgY29uZmlkZW5jZTogJ2V4YWN0JyB9O1xuICAgIH1cbiAgICBpZiAodXNlclVuaXRMb3dlciA9PT0gJ2tnJyB8fCB1c2VyVW5pdExvd2VyID09PSAna2lsb2dyYW0nIHx8IHVzZXJVbml0TG93ZXIgPT09ICdraWxvZ3JhbXMnKSB7XG4gICAgICByZXR1cm4geyBxdWFudGl0eTogcXR5ICogMTAwMCwgdW5pdDogJ2cnLCBjb25maWRlbmNlOiAnZXhhY3QnIH07XG4gICAgfVxuICAgIGlmICh1c2VyVW5pdExvd2VyID09PSAnb3onIHx8IHVzZXJVbml0TG93ZXIgPT09ICdvdW5jZScgfHwgdXNlclVuaXRMb3dlciA9PT0gJ291bmNlcycpIHtcbiAgICAgIHJldHVybiB7IHF1YW50aXR5OiBxdHkgKiAyOC4zNSwgdW5pdDogJ2cnLCBjb25maWRlbmNlOiAnZXhhY3QnIH07XG4gICAgfVxuICAgIGlmICh1c2VyVW5pdExvd2VyID09PSAnbGInIHx8IHVzZXJVbml0TG93ZXIgPT09ICdsYnMnIHx8IHVzZXJVbml0TG93ZXIgPT09ICdwb3VuZCcgfHwgdXNlclVuaXRMb3dlciA9PT0gJ3BvdW5kcycpIHtcbiAgICAgIHJldHVybiB7IHF1YW50aXR5OiBxdHkgKiA0NTQsIHVuaXQ6ICdnJywgY29uZmlkZW5jZTogJ2V4YWN0JyB9O1xuICAgIH1cbiAgICAvLyBDdXAgY29udmVyc2lvbnMgdmFyeSBieSBpbmdyZWRpZW50LCBidXQgdGhlc2UgYXJlIHJlYXNvbmFibGUgZGVmYXVsdHNcbiAgICBpZiAodXNlclVuaXRMb3dlciA9PT0gJ2N1cCcgfHwgdXNlclVuaXRMb3dlciA9PT0gJ2N1cHMnKSB7XG4gICAgICAvLyBEZWZhdWx0IGN1cCBmb3IgZ3JhaW5zL2Zsb3VyOiB+MTI1Z1xuICAgICAgcmV0dXJuIHsgcXVhbnRpdHk6IHF0eSAqIDEyNSwgdW5pdDogJ2cnLCBjb25maWRlbmNlOiAnZXhhY3QnIH07XG4gICAgfVxuICAgIGlmICh1c2VyVW5pdExvd2VyID09PSAndGJzcCcgfHwgdXNlclVuaXRMb3dlciA9PT0gJ3RhYmxlc3Bvb24nIHx8IHVzZXJVbml0TG93ZXIgPT09ICd0YWJsZXNwb29ucycpIHtcbiAgICAgIHJldHVybiB7IHF1YW50aXR5OiBxdHkgKiAxNSwgdW5pdDogJ2cnLCBjb25maWRlbmNlOiAnZXhhY3QnIH07XG4gICAgfVxuICAgIGlmICh1c2VyVW5pdExvd2VyID09PSAndHNwJyB8fCB1c2VyVW5pdExvd2VyID09PSAndGVhc3Bvb24nIHx8IHVzZXJVbml0TG93ZXIgPT09ICd0ZWFzcG9vbnMnKSB7XG4gICAgICByZXR1cm4geyBxdWFudGl0eTogcXR5ICogNSwgdW5pdDogJ2cnLCBjb25maWRlbmNlOiAnZXhhY3QnIH07XG4gICAgfVxuICB9XG5cbiAgLy8gPT09PT0gQ09VTlQgQ09OVkVSU0lPTlMgKHBpZWNlcykgPT09PT1cbiAgaWYgKGNhbm9uaWNhbFVuaXQgPT09ICdwaWVjZXMnKSB7XG4gICAgaWYgKHVzZXJVbml0TG93ZXIgPT09ICdwaWVjZXMnIHx8IHVzZXJVbml0TG93ZXIgPT09ICdwaWVjZScgfHxcbiAgICAgICAgdXNlclVuaXRMb3dlciA9PT0gJ2NvdW50JyB8fCB1c2VyVW5pdExvd2VyID09PSAnY2xvdmUnIHx8IHVzZXJVbml0TG93ZXIgPT09ICdjbG92ZXMnKSB7XG4gICAgICByZXR1cm4geyBxdWFudGl0eTogcXR5LCB1bml0OiAncGllY2VzJywgY29uZmlkZW5jZTogJ2V4YWN0JyB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIElmIHVuaXQgZG9lc24ndCBtYXRjaCBjYW5vbmljYWwsIHJldHVybiBhcy1pcyBidXQgbWFyayBhcHByb3hpbWF0ZVxuICByZXR1cm4geyBxdWFudGl0eTogcXR5LCB1bml0OiBjYW5vbmljYWxVbml0LCBjb25maWRlbmNlOiAnYXBwcm94aW1hdGUnIH07XG59XG5cbi8qKlxuICogQXBwbHkgY29uZmlkZW5jZSBydWxlcyBmb3IgZGVkdWN0aW9uXG4gKiBleGFjdCAtIGV4YWN0ID0gZXhhY3RcbiAqIGFwcHJveGltYXRlIC0gYW55dGhpbmcgPSBhcHByb3hpbWF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVkdWN0V2l0aENvbmZpZGVuY2UoXG4gIGludmVudG9yeUNvbmZpZGVuY2U6ICdleGFjdCcgfCAnYXBwcm94aW1hdGUnLFxuICBkZWR1Y3Rpb25Db25maWRlbmNlOiAnZXhhY3QnIHwgJ2FwcHJveGltYXRlJ1xuKTogJ2V4YWN0JyB8ICdhcHByb3hpbWF0ZScge1xuICBpZiAoaW52ZW50b3J5Q29uZmlkZW5jZSA9PT0gJ2V4YWN0JyAmJiBkZWR1Y3Rpb25Db25maWRlbmNlID09PSAnZXhhY3QnKSB7XG4gICAgcmV0dXJuICdleGFjdCc7XG4gIH1cbiAgcmV0dXJuICdhcHByb3hpbWF0ZSc7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdHdvIHVuaXRzIGFyZSBjb21wYXRpYmxlIChib3RoIHZvbHVtZSwgYm90aCB3ZWlnaHQsIG9yIGJvdGggY291bnQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcmVVbml0c0NvbXBhdGlibGUodW5pdDE6IHN0cmluZywgdW5pdDI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCB1bml0MUxvd2VyID0gdW5pdDEudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgdW5pdDJMb3dlciA9IHVuaXQyLnRvTG93ZXJDYXNlKCk7XG5cbiAgY29uc3Qgdm9sdW1lVW5pdHMgPSBbJ21sJywgJ2wnLCAnY3VwJywgJ2N1cHMnLCAndGJzcCcsICd0c3AnLCAncGludCcsICdmbCBveiddO1xuICBjb25zdCB3ZWlnaHRVbml0cyA9IFsnZycsICdrZycsICdveicsICdsYicsICdsYnMnXTtcbiAgY29uc3QgY291bnRVbml0cyA9IFsncGllY2VzJywgJ3BpZWNlJywgJ2NvdW50JywgJ2Nsb3ZlJywgJ2Nsb3ZlcyddO1xuXG4gIGNvbnN0IGlzVm9sdW1lMSA9IHZvbHVtZVVuaXRzLnNvbWUodSA9PiB1bml0MUxvd2VyLmluY2x1ZGVzKHUpKTtcbiAgY29uc3QgaXNWb2x1bWUyID0gdm9sdW1lVW5pdHMuc29tZSh1ID0+IHVuaXQyTG93ZXIuaW5jbHVkZXModSkpO1xuICBpZiAoaXNWb2x1bWUxICYmIGlzVm9sdW1lMikgcmV0dXJuIHRydWU7XG5cbiAgY29uc3QgaXNXZWlnaHQxID0gd2VpZ2h0VW5pdHMuc29tZSh1ID0+IHVuaXQxTG93ZXIuaW5jbHVkZXModSkpO1xuICBjb25zdCBpc1dlaWdodDIgPSB3ZWlnaHRVbml0cy5zb21lKHUgPT4gdW5pdDJMb3dlci5pbmNsdWRlcyh1KSk7XG4gIGlmIChpc1dlaWdodDEgJiYgaXNXZWlnaHQyKSByZXR1cm4gdHJ1ZTtcblxuICBjb25zdCBpc0NvdW50MSA9IGNvdW50VW5pdHMuc29tZSh1ID0+IHVuaXQxTG93ZXIuaW5jbHVkZXModSkpO1xuICBjb25zdCBpc0NvdW50MiA9IGNvdW50VW5pdHMuc29tZSh1ID0+IHVuaXQyTG93ZXIuaW5jbHVkZXModSkpO1xuICBpZiAoaXNDb3VudDEgJiYgaXNDb3VudDIpIHJldHVybiB0cnVlO1xuXG4gIHJldHVybiBmYWxzZTtcbn1cbiIsICIvKipcbiAqIENhbm9uaWNhbCBmb29kIG5hbWUgbWFwcGluZ3MgZm9yIGRlZHVwbGljYXRpb25cbiAqIE1hcHMgdmFyaWF0aW9ucyAocGx1cmFsLCBtaXNzcGVsbGluZ3MsIGFsaWFzZXMpIHRvIGNhbm9uaWNhbCBmb3JtXG4gKiBVc2VkIGJ5IGFkZEludmVudG9yeUl0ZW0oKSB0byBtZXJnZSBkdXBsaWNhdGUgaXRlbXNcbiAqL1xuXG5leHBvcnQgY29uc3QgQ0FOT05JQ0FMX0ZPT0RTOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAvLyBQb3RhdG9lc1xuICAncG90YXRvJzogJ3BvdGF0bycsXG4gICdwb3RhdG9lcyc6ICdwb3RhdG8nLFxuICAnc3B1ZHMnOiAncG90YXRvJyxcblxuICAvLyBUb21hdG9lc1xuICAndG9tYXRvJzogJ3RvbWF0bycsXG4gICd0b21hdG9lcyc6ICd0b21hdG8nLFxuICAnY2hlcnJ5IHRvbWF0byc6ICdjaGVycnlfdG9tYXRvJyxcbiAgJ2NoZXJyeSB0b21hdG9lcyc6ICdjaGVycnlfdG9tYXRvJyxcbiAgJ3N1bi1kcmllZCB0b21hdG8nOiAnc3VuX2RyaWVkX3RvbWF0bycsXG5cbiAgLy8gQmVhbnNcbiAgJ2JlYW4nOiAnYmVhbicsXG4gICdiZWFucyc6ICdiZWFuJyxcbiAgJ2dyZWVuIGJlYW4nOiAnZ3JlZW5fYmVhbicsXG4gICdncmVlbiBiZWFucyc6ICdncmVlbl9iZWFuJyxcbiAgJ2Jha2VkIGJlYW4nOiAnYmFrZWRfYmVhbicsXG4gICdiYWtlZCBiZWFucyc6ICdiYWtlZF9iZWFuJyxcbiAgJ2NoaWNrcGVhJzogJ2NoaWNrcGVhJyxcbiAgJ2NoaWNrcGVhcyc6ICdjaGlja3BlYScsXG5cbiAgLy8gVmVnZXRhYmxlc1xuICAnY2Fycm90JzogJ2NhcnJvdCcsXG4gICdjYXJyb3RzJzogJ2NhcnJvdCcsXG4gICdvbmlvbic6ICdvbmlvbicsXG4gICdvbmlvbnMnOiAnb25pb24nLFxuICAnZ2FybGljJzogJ2dhcmxpYycsXG4gICdicm9jY29saSc6ICdicm9jY29saScsXG4gICdzcGluYWNoJzogJ3NwaW5hY2gnLFxuICAnbGV0dHVjZSc6ICdzYWxhZF9sZWF2ZXMnLFxuICAnc2FsYWQnOiAnc2FsYWRfbGVhdmVzJyxcbiAgJ3NhbGFkIGxlYXZlcyc6ICdzYWxhZF9sZWF2ZXMnLFxuICAnbWl4ZWQgc2FsYWQnOiAnc2FsYWRfbGVhdmVzJyxcblxuICAvLyBQcm90ZWluc1xuICAnY2hpY2tlbic6ICdjaGlja2VuJyxcbiAgJ2NoaWNrZW4gYnJlYXN0JzogJ2NoaWNrZW5fYnJlYXN0JyxcbiAgJ2NoaWNrZW4gYnJlYXN0cyc6ICdjaGlja2VuX2JyZWFzdCcsXG4gICdjaGlja2VuIHRoaWdoJzogJ2NoaWNrZW5fdGhpZ2gnLFxuICAnY2hpY2tlbiB0aGlnaHMnOiAnY2hpY2tlbl90aGlnaCcsXG4gICdiZWVmJzogJ2JlZWYnLFxuICAnZWdnJzogJ2VnZycsXG4gICdlZ2dzJzogJ2VnZycsXG5cbiAgLy8gR3JhaW5zXG4gICdyaWNlJzogJ3JpY2UnLFxuICAnd2hpdGUgcmljZSc6ICdyaWNlJyxcbiAgJ2Jyb3duIHJpY2UnOiAnYnJvd25fcmljZScsXG4gICdwYXN0YSc6ICdwYXN0YScsXG4gICdub29kbGUnOiAnbm9vZGxlJyxcbiAgJ25vb2RsZXMnOiAnbm9vZGxlJyxcbiAgJ2JyZWFkJzogJ2JyZWFkJyxcblxuICAvLyBPaWxzICYgRmF0c1xuICAnb2lsJzogJ29pbCcsXG4gICdvbGl2ZSBvaWwnOiAnb2xpdmVfb2lsJyxcbiAgJ3ZlZ2V0YWJsZSBvaWwnOiAndmVnZXRhYmxlX29pbCcsXG4gICdidXR0ZXInOiAnYnV0dGVyJyxcblxuICAvLyBIZXJicyAmIFNwaWNlcyAodHlwaWNhbGx5IGhhc19pdGVtPXRydWUpXG4gICdzYWx0JzogJ3NhbHQnLFxuICAncGVwcGVyJzogJ3BlcHBlcicsXG4gICdiYXNpbCc6ICdiYXNpbCcsXG4gICdvcmVnYW5vJzogJ29yZWdhbm8nLFxuICAnY3VtaW4nOiAnY3VtaW4nLFxuICAnY2lubmFtb24nOiAnY2lubmFtb24nLFxuICAndGh5bWUnOiAndGh5bWUnLFxuXG4gIC8vIERhaXJ5XG4gICdtaWxrJzogJ21pbGsnLFxuICAnY2hlZXNlJzogJ2NoZWVzZScsXG4gICd5b2d1cnQnOiAneW9ndXJ0Jyxcbn07XG5cbi8qKlxuICogR2V0IGNhbm9uaWNhbCBuYW1lIGZvciBhbiBpbmdyZWRpZW50XG4gKiBJZiBub3QgaW4gbWFwcGluZywgcmV0dXJucyBsb3dlcmNhc2VkIG9yaWdpbmFsIG5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENhbm9uaWNhbE5hbWUoaXRlbU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxvd2VyY2FzZWQgPSBpdGVtTmFtZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgcmV0dXJuIENBTk9OSUNBTF9GT09EU1tsb3dlcmNhc2VkXSB8fCBsb3dlcmNhc2VkO1xufVxuIiwgIi8qKlxuICogTWFpbiBFeHByZXNzIHNlcnZlciBmb3IgU3VwcGEgYmFja2VuZFxuICogUnVucyBvbiBOZXRsaWZ5IEZ1bmN0aW9uc1xuICpcbiAqIEVuZHBvaW50czpcbiAqIC0gUE9TVCAvYXBpL2ludmVudG9yeSAtIEFkZCBpbnZlbnRvcnkgaXRlbXMgZnJvbSB1c2VyIGlucHV0XG4gKiAtIEdFVCAvYXBpL2ludmVudG9yeSAtIEdldCBjdXJyZW50IGFjdGl2ZSBpbnZlbnRvcnlcbiAqIC0gUE9TVCAvYXBpL2NoYXQgLSBTZW5kIGNoYXQgbWVzc2FnZSwgZ2V0IHN1Z2dlc3Rpb25zL3Jlc3BvbnNlc1xuICogLSBQT1NUIC9hcGkvY29va2luZy9zdGFydCAtIE1hcmsgcmVjaXBlIGFzIGNvb2tpbmdcbiAqIC0gUE9TVCAvYXBpL2Nvb2tpbmcvY29tcGxldGUgLSBNYXJrIGNvb2tpbmcgYXMgY29tcGxldGUsIGRlZHVjdCBpbmdyZWRpZW50c1xuICovXG5cbmltcG9ydCBleHByZXNzLCB7IEV4cHJlc3MsIFJlcXVlc3QsIFJlc3BvbnNlIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgY29ycyBmcm9tICdjb3JzJztcbmltcG9ydCAnZG90ZW52L2NvbmZpZyc7XG5pbXBvcnQgaW52ZW50b3J5Um91dGVyIGZyb20gJy4vYXBpL2ludmVudG9yeS50cyc7XG5pbXBvcnQgY2hhdFJvdXRlciBmcm9tICcuL2FwaS9jaGF0LnRzJztcbmltcG9ydCBjb29raW5nUm91dGVyIGZyb20gJy4vYXBpL2Nvb2tpbmcudHMnO1xuXG5jb25zdCBhcHA6IEV4cHJlc3MgPSBleHByZXNzKCk7XG5cbi8vIE1pZGRsZXdhcmVcbmFwcC51c2UoY29ycygpKTtcbmFwcC51c2UoZXhwcmVzcy5qc29uKCkpO1xuXG4vLyBIZWFsdGggY2hlY2sgZW5kcG9pbnRcbmFwcC5nZXQoJy9hcGkvaGVhbHRoJywgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICByZXMuanNvbih7IHN0YXR1czogJ29rJywgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSk7XG59KTtcblxuLy8gTW91bnQgcm91dGVyc1xuYXBwLnVzZSgnL2FwaS9pbnZlbnRvcnknLCBpbnZlbnRvcnlSb3V0ZXIpO1xuYXBwLnVzZSgnL2FwaS9jaGF0JywgY2hhdFJvdXRlcik7XG5hcHAudXNlKCcvYXBpL2Nvb2tpbmcnLCBjb29raW5nUm91dGVyKTtcblxuLy8gRXJyb3IgaGFuZGxpbmcgbWlkZGxld2FyZVxuYXBwLnVzZSgoZXJyOiBhbnksIHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICBjb25zb2xlLmVycm9yKGVycik7XG4gIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXG4gIH0pO1xufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGFwcDtcbiIsICIvKipcbiAqIEludmVudG9yeSBBUEkgZW5kcG9pbnRzXG4gKlxuICogUE9TVCAvYXBpL2ludmVudG9yeSAtIEFjY2VwdCBmcmVlLWZvcm0gdXNlciBpbnB1dCwgcGFyc2Ugd2l0aCBMTE0sIHN0b3JlIGl0ZW1zXG4gKiBHRVQgL2FwaS9pbnZlbnRvcnkgLSBGZXRjaCBhbGwgYWN0aXZlIGludmVudG9yeSBpdGVtcyBmb3IgY3VycmVudCB1c2VyXG4gKi9cblxuaW1wb3J0IHsgUm91dGVyLCBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IHsgcGFyc2VJbnZlbnRvcnlJbnB1dCB9IGZyb20gJy4vdXRpbHMvcHJvbXB0cy50cyc7XG5pbXBvcnQgeyBnZXRJbnZlbnRvcnksIGFkZEludmVudG9yeUl0ZW0sIGNsZWFySW52ZW50b3J5IH0gZnJvbSAnLi91dGlscy9kYi50cyc7XG5pbXBvcnQgeyBJbnZlbnRvcnlJdGVtIH0gZnJvbSAnLi4vc2hhcmVkL3R5cGVzLnRzJztcblxuY29uc3Qgcm91dGVyID0gUm91dGVyKCk7XG5cbi8qKlxuICogUE9TVCAvYXBpL2ludmVudG9yeVxuICogQWNjZXB0IGZyZWUtZm9ybSBpbnZlbnRvcnkgaW5wdXQgYW5kIHBhcnNlIGl0IHVzaW5nIExMTVxuICpcbiAqIFJlcXVlc3QgYm9keTpcbiAqIHtcbiAqICAgXCJ1c2VyX2lucHV0XCI6IFwiMyBjaGlja2VuIGJyZWFzdHMsIDIgdG9tYXRvZXMsIHNvbWUgYmFzaWxcIlxuICogfVxuICpcbiAqIFJlc3BvbnNlOlxuICoge1xuICogICBcImRhdGFcIjogW1xuICogICAgIHtcImlkXCI6IFwiLi4uXCIsIFwibmFtZVwiOiBcImNoaWNrZW4gYnJlYXN0XCIsIFwicXVhbnRpdHlfYXBwcm94XCI6IDMsIFwidW5pdFwiOiBcInBpZWNlc1wiLCAuLi59LFxuICogICAgIC4uLlxuICogICBdXG4gKiB9XG4gKi9cbnJvdXRlci5wb3N0KCcvJywgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgdXNlcl9pbnB1dCB9ID0gcmVxLmJvZHk7XG5cbiAgICBpZiAoIXVzZXJfaW5wdXQgfHwgdHlwZW9mIHVzZXJfaW5wdXQgIT09ICdzdHJpbmcnIHx8ICF1c2VyX2lucHV0LnRyaW0oKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdNaXNzaW5nIG9yIGludmFsaWQgdXNlcl9pbnB1dCBmaWVsZCcsXG4gICAgICAgIGRldGFpbHM6ICd1c2VyX2lucHV0IG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFBhcnNlIHRoZSB1c2VyIGlucHV0IHVzaW5nIExMTVxuICAgIGNvbnN0IHBhcnNlZEl0ZW1zID0gYXdhaXQgcGFyc2VJbnZlbnRvcnlJbnB1dCh1c2VyX2lucHV0LnRyaW0oKSk7XG5cbiAgICAvLyBTdG9yZSBlYWNoIHBhcnNlZCBpdGVtIGluIGRhdGFiYXNlICh3aXRoIG1lcmdlLW9uLWFkZCBkZWR1cGxpY2F0aW9uKVxuICAgIGNvbnN0IHN0b3JlZEl0ZW1zOiBJbnZlbnRvcnlJdGVtW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcGFyc2VkSXRlbXMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0b3JlZCA9IGF3YWl0IGFkZEludmVudG9yeUl0ZW0oaXRlbSk7XG4gICAgICAgIHN0b3JlZEl0ZW1zLnB1c2goc3RvcmVkKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBzdG9yZSBpdGVtICR7aXRlbS5uYW1lfTpgLCBlcnJvcik7XG4gICAgICAgIC8vIENvbnRpbnVlIHdpdGggbmV4dCBpdGVtIGluc3RlYWQgb2YgZmFpbGluZyBlbnRpcmUgcmVxdWVzdFxuICAgICAgfVxuICAgIH1cblxuICAgIHJlcy5zdGF0dXMoMjAxKS5qc29uKHtcbiAgICAgIGRhdGE6IHN0b3JlZEl0ZW1zLFxuICAgICAgY291bnQ6IHN0b3JlZEl0ZW1zLmxlbmd0aCxcbiAgICAgIG1lc3NhZ2U6IGBQYXJzZWQgYW5kIHN0b3JlZCAke3N0b3JlZEl0ZW1zLmxlbmd0aH0gaW52ZW50b3J5IGl0ZW1zYCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBQT1NUIC9hcGkvaW52ZW50b3J5OicsIGVycm9yKTtcblxuICAgIGNvbnN0IGVycm9yTXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuXG4gICAgaWYgKGVycm9yTXNnLmluY2x1ZGVzKCdTVVBBQkFTRScpIHx8IGVycm9yTXNnLmluY2x1ZGVzKCdPUEVOQUknKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdTZXJ2aWNlIGNvbmZpZ3VyYXRpb24gZXJyb3InLFxuICAgICAgICBkZXRhaWxzOiBlcnJvck1zZyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgIGVycm9yOiAnRmFpbGVkIHRvIHBhcnNlIGludmVudG9yeScsXG4gICAgICBkZXRhaWxzOiBlcnJvck1zZyxcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8qKlxuICogR0VUIC9hcGkvaW52ZW50b3J5XG4gKiBGZXRjaCBhbGwgYWN0aXZlIGludmVudG9yeSBpdGVtcyBmb3IgdGhlIGN1cnJlbnQgdXNlclxuICpcbiAqIFF1ZXJ5IHBhcmFtZXRlcnM6XG4gKiAtIGxpbWl0IChvcHRpb25hbCk6IE1heCBudW1iZXIgb2YgaXRlbXMgdG8gcmV0dXJuIChkZWZhdWx0OiAxMDApXG4gKlxuICogUmVzcG9uc2U6XG4gKiB7XG4gKiAgIFwiZGF0YVwiOiBbXG4gKiAgICAge1wiaWRcIjogXCIuLi5cIiwgXCJuYW1lXCI6IFwiY2hpY2tlbiBicmVhc3RcIiwgXCJxdWFudGl0eV9hcHByb3hcIjogMywgXCJ1bml0XCI6IFwicGllY2VzXCIsIC4uLn0sXG4gKiAgICAgLi4uXG4gKiAgIF0sXG4gKiAgIFwiY291bnRcIjogNVxuICogfVxuICovXG5yb3V0ZXIuZ2V0KCcvJywgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgZ2V0SW52ZW50b3J5KCk7XG5cbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBkYXRhOiBpdGVtcyxcbiAgICAgIGNvdW50OiBpdGVtcy5sZW5ndGgsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gR0VUIC9hcGkvaW52ZW50b3J5OicsIGVycm9yKTtcblxuICAgIGNvbnN0IGVycm9yTXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gZmV0Y2ggaW52ZW50b3J5JyxcbiAgICAgIGRldGFpbHM6IGVycm9yTXNnLFxuICAgIH0pO1xuICB9XG59KTtcblxuLyoqXG4gKiBERUxFVEUgL2FwaS9pbnZlbnRvcnlcbiAqIENsZWFyIGFsbCBhY3RpdmUgaW52ZW50b3J5IGl0ZW1zIGZvciB0aGUgY3VycmVudCB1c2VyLlxuICogSW50ZW5kZWQgZm9yIGxvY2FsL2RldiB0ZXN0aW5nIHNvIHRoZSBhcHAgY2FuIGJlIHJlc2V0IHF1aWNrbHkuXG4gKi9cbnJvdXRlci5kZWxldGUoJy8nLCBhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgY2xlYXJlZENvdW50ID0gYXdhaXQgY2xlYXJJbnZlbnRvcnkoKTtcblxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIGNsZWFyZWQ6IGNsZWFyZWRDb3VudCxcbiAgICAgIG1lc3NhZ2U6IGBDbGVhcmVkICR7Y2xlYXJlZENvdW50fSBpbnZlbnRvcnkgaXRlbSR7Y2xlYXJlZENvdW50ID09PSAxID8gJycgOiAncyd9YCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBERUxFVEUgL2FwaS9pbnZlbnRvcnk6JywgZXJyb3IpO1xuXG4gICAgY29uc3QgZXJyb3JNc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG5cbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBlcnJvcjogJ0ZhaWxlZCB0byBjbGVhciBpbnZlbnRvcnknLFxuICAgICAgZGV0YWlsczogZXJyb3JNc2csXG4gICAgfSk7XG4gIH1cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7XG4iLCAiLyoqXG4gKiBMTE0gcHJvbXB0IHV0aWxpdGllcyBmb3IgaW52ZW50b3J5IHBhcnNpbmcsIG1lYWwgc3VnZ2VzdGlvbnMsIGFuZCByZWNpcGUgZ2VuZXJhdGlvblxuICogVXNlcyBPcGVuQUkgR1BULTRvIG1pbmkgZm9yIGFsbCBuYXR1cmFsIGxhbmd1YWdlIHByb2Nlc3NpbmdcbiAqXG4gKiBLZXkgcGF0dGVybjogQWx3YXlzIHJlcXVlc3QgSlNPTi1vbmx5IHJlc3BvbnNlcyBmcm9tIHRoZSBMTE0gdG8gYXZvaWQgcGFyc2luZyBjb25mdXNpb25cbiAqL1xuXG5pbXBvcnQgT3BlbkFJIGZyb20gJ29wZW5haSc7XG5pbXBvcnQgeyBJbnZlbnRvcnlJdGVtLCBSZWNpcGUsIFJlY2lwZURldGFpbCB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5pbXBvcnQgeyBjb252ZXJ0VG9DYW5vbmljYWwsIGNhY2hlQ2Fub25pY2FsVW5pdCB9IGZyb20gJy4vdW5pdHMnO1xuXG5sZXQgb3BlbmFpQ2xpZW50OiBPcGVuQUkgfCBudWxsID0gbnVsbDtcblxuY29uc3QgUEFOVFJZX1NUQVBMRV9DQU5PTklDQUxTID0gbmV3IFNldChbXG4gICdzYWx0JyxcbiAgJ3BlcHBlcicsXG4gICdvaWwnLFxuICAnb2xpdmVfb2lsJyxcbiAgJ3ZlZ2V0YWJsZV9vaWwnLFxuICAnYnV0dGVyJyxcbiAgJ3ZpbmVnYXInLFxuICAnc295X3NhdWNlJyxcbiAgJ3NwaWNlJyxcbiAgJ3NwaWNlcycsXG4gICdjdW1pbicsXG4gICdjaW5uYW1vbicsXG4gICd0aHltZScsXG4gICdvcmVnYW5vJyxcbl0pO1xuXG5mdW5jdGlvbiBoYXNPcGVuQWlBcGlLZXkoKTogYm9vbGVhbiB7XG4gIHJldHVybiBCb29sZWFuKHByb2Nlc3MuZW52Lk9QRU5BSV9BUElfS0VZPy50cmltKCkpO1xufVxuXG5mdW5jdGlvbiBpbmZlckNhbm9uaWNhbE5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5hbWVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC50cmltKClcbiAgICAucmVwbGFjZSgvW15hLXowLTlcXHNdL2csICcnKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csICdfJyk7XG59XG5cbmZ1bmN0aW9uIGlzUGFudHJ5U3RhcGxlKGl0ZW06IFBpY2s8SW52ZW50b3J5SXRlbSwgJ25hbWUnIHwgJ2Nhbm9uaWNhbF9uYW1lJyB8ICdoYXNfaXRlbSc+KTogYm9vbGVhbiB7XG4gIGNvbnN0IGNhbm9uaWNhbCA9IChpdGVtLmNhbm9uaWNhbF9uYW1lIHx8IGluZmVyQ2Fub25pY2FsTmFtZShpdGVtLm5hbWUpKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBub3JtYWxpemVkTmFtZSA9IGl0ZW0ubmFtZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuICByZXR1cm4gKFxuICAgIGl0ZW0uaGFzX2l0ZW0gPT09IHRydWUgfHxcbiAgICBQQU5UUllfU1RBUExFX0NBTk9OSUNBTFMuaGFzKGNhbm9uaWNhbCkgfHxcbiAgICBQQU5UUllfU1RBUExFX0NBTk9OSUNBTFMuaGFzKG5vcm1hbGl6ZWROYW1lLnJlcGxhY2UoL1xccysvZywgJ18nKSlcbiAgKTtcbn1cblxuZnVuY3Rpb24gaGFzQ29va2FibGVJbmdyZWRpZW50cyhpbnZlbnRvcnlJdGVtczogSW52ZW50b3J5SXRlbVtdKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnZlbnRvcnlJdGVtcy5zb21lKChpdGVtKSA9PiAhaXNQYW50cnlTdGFwbGUoaXRlbSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBwYXJzZUludmVudG9yeUlucHV0TG9jYWxseShcbiAgdXNlcklucHV0OiBzdHJpbmdcbik6IFByb21pc2U8T21pdDxJbnZlbnRvcnlJdGVtLCAnaWQnIHwgJ3VzZXJfaWQnIHwgJ2RhdGVfYWRkZWQnIHwgJ2RhdGVfdXNlZCc+W10+IHtcbiAgY29uc3QgeyBnZXRDYW5vbmljYWxOYW1lIH0gPSBhd2FpdCBpbXBvcnQoJy4vY2Fub25pY2FsLWZvb2RzJyk7XG4gIGNvbnN0IHBhbnRyeVN0YXBsZXMgPSBuZXcgU2V0KFtcbiAgICAnc2FsdCcsXG4gICAgJ3BlcHBlcicsXG4gICAgJ29pbCcsXG4gICAgJ29saXZlIG9pbCcsXG4gICAgJ2J1dHRlcicsXG4gICAgJ3ZpbmVnYXInLFxuICAgICdzb3kgc2F1Y2UnLFxuICAgICdzcGljZScsXG4gICAgJ3NwaWNlcycsXG4gICAgJ2Jhc2lsJyxcbiAgICAnZ2FybGljJyxcbiAgICAncGFyc2xleScsXG4gIF0pO1xuXG4gIHJldHVybiB1c2VySW5wdXRcbiAgICAuc3BsaXQoLyx8IGFuZCAvaSlcbiAgICAubWFwKChwYXJ0KSA9PiBwYXJ0LnRyaW0oKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLm1hcCgocGFydCkgPT4ge1xuICAgICAgY29uc3QgY2xlYW5lZCA9IHBhcnQucmVwbGFjZSgvXihpIGhhdmV8d2UgaGF2ZXxnb3QpXFxzKy9pLCAnJykudHJpbSgpO1xuICAgICAgY29uc3QgcXR5TWF0Y2ggPSBjbGVhbmVkLm1hdGNoKFxuICAgICAgICAvXihcXGQrKD86XFwuXFxkKyk/KVxccyooa2lsb2dyYW18a2d8Z3JhbXxnfG1pbGxpbGl0ZXJ8bWx8bGl0ZXJ8bHx0YWJsZXNwb29ucz98dGJzcHx0ZWFzcG9vbnM/fHRzcHxjdXBzP3xjdXB8b3VuY2VzP3xvenxwaWVjZXM/fHBpZWNlfGNsb3Zlcz98YnVuY2goPzplcyk/KT9cXHMqKD86b2ZcXHMrKT8oLispJC9pXG4gICAgICApO1xuXG4gICAgICBsZXQgbmFtZSA9IGNsZWFuZWQ7XG4gICAgICBsZXQgcXVhbnRpdHk6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCB1bml0OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgY29uZmlkZW5jZTogJ2V4YWN0JyB8ICdhcHByb3hpbWF0ZScgPSAnYXBwcm94aW1hdGUnO1xuICAgICAgbGV0IGhhc0l0ZW0gPSBmYWxzZTtcblxuICAgICAgaWYgKHF0eU1hdGNoKSB7XG4gICAgICAgIHF1YW50aXR5ID0gTnVtYmVyKHF0eU1hdGNoWzFdKTtcbiAgICAgICAgdW5pdCA9IHF0eU1hdGNoWzJdIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgbmFtZSA9IHF0eU1hdGNoWzNdLnRyaW0oKTtcbiAgICAgICAgY29uZmlkZW5jZSA9ICdleGFjdCc7XG4gICAgICB9IGVsc2UgaWYgKHBhbnRyeVN0YXBsZXMuaGFzKGNsZWFuZWQudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgICAgaGFzSXRlbSA9IHRydWU7XG4gICAgICAgIGNvbmZpZGVuY2UgPSAnZXhhY3QnO1xuICAgICAgfSBlbHNlIGlmICgvXihzb21lfGEgbGl0dGxlfGEgYml0fGEgaGFuZGZ1bCBvZnxhIGJ1bmNoIG9mKVxccysvaS50ZXN0KGNsZWFuZWQpKSB7XG4gICAgICAgIGNvbnN0IGFwcHJveE1hdGNoID0gY2xlYW5lZC5tYXRjaCgvXihzb21lfGEgbGl0dGxlfGEgYml0fGEgaGFuZGZ1bCBvZnxhIGJ1bmNoIG9mKVxccysvaSk7XG4gICAgICAgIG5hbWUgPSBjbGVhbmVkLnJlcGxhY2UoL14oc29tZXxhIGxpdHRsZXxhIGJpdHxhIGhhbmRmdWwgb2Z8YSBidW5jaCBvZilcXHMrL2ksICcnKS50cmltKCk7XG4gICAgICAgIHF1YW50aXR5ID0gMTtcblxuICAgICAgICAvLyBFeHRyYWN0IHVuaXQgZnJvbSBhcHByb3hpbWF0ZSBxdWFudGl0eVxuICAgICAgICBpZiAoYXBwcm94TWF0Y2ggJiYgL2EgYnVuY2ggb2YvaS50ZXN0KGFwcHJveE1hdGNoWzFdKSkge1xuICAgICAgICAgIHVuaXQgPSAnYnVuY2gnO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmIHRoZSBleHRyYWN0ZWQgbmFtZSBpcyBhIHBhbnRyeSBzdGFwbGVcbiAgICAgIGlmICghaGFzSXRlbSAmJiBuYW1lICYmIHBhbnRyeVN0YXBsZXMuaGFzKG5hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgICAgaGFzSXRlbSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEluZmVyIHVuaXQgZm9yIGNvdW50YWJsZSBpdGVtcyBpZiBub3QgcHJvdmlkZWRcbiAgICAgIGxldCBmaW5hbFVuaXQgPSB1bml0O1xuICAgICAgaWYgKCFmaW5hbFVuaXQgJiYgcXVhbnRpdHkgJiYgIWhhc0l0ZW0pIHtcbiAgICAgICAgLy8gSWYgaXQncyBhIGNvdW50YWJsZSBpdGVtIHdpdGhvdXQgYSB1bml0LCBkZWZhdWx0IHRvIFwicGllY2VzXCJcbiAgICAgICAgY29uc3QgY291bnRhYmxlS2V5d29yZHMgPSBbJ2NoaWNrZW4nLCAnYnJlYXN0JywgJ3RvbWF0bycsICdhcHBsZScsICdlZ2cnLCAnY2Fycm90JywgJ29uaW9uJywgJ3BvdGF0bycsICdwZXBwZXInLCAnY3VjdW1iZXInLCAnc3BpbmFjaCcsICdsZXR0dWNlJywgJ2Jhc2lsJywgJ3BhcnNsZXknLCAnY2xvdmUnXTtcbiAgICAgICAgY29uc3QgaXNDb3VudGFibGUgPSBjb3VudGFibGVLZXl3b3Jkcy5zb21lKGtleXdvcmQgPT4gbmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGtleXdvcmQpKTtcbiAgICAgICAgaWYgKGlzQ291bnRhYmxlKSB7XG4gICAgICAgICAgLy8gQnV0IGRvbid0IG92ZXJyaWRlIGlmIHVuaXQgaXMgYWxyZWFkeSBzZXQgKGxpa2UgXCJidW5jaFwiKVxuICAgICAgICAgIGlmICghdW5pdCkge1xuICAgICAgICAgICAgZmluYWxVbml0ID0gJ3BpZWNlcyc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNhbm9uaWNhbCA9IGdldENhbm9uaWNhbE5hbWUobmFtZSkgfHwgaW5mZXJDYW5vbmljYWxOYW1lKG5hbWUpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgY2Fub25pY2FsX25hbWU6IGNhbm9uaWNhbCxcbiAgICAgICAgaGFzX2l0ZW06IGhhc0l0ZW0sXG4gICAgICAgIHF1YW50aXR5X2FwcHJveDogaGFzSXRlbSA/IHVuZGVmaW5lZCA6IHF1YW50aXR5LFxuICAgICAgICB1bml0OiBmaW5hbFVuaXQsXG4gICAgICAgIGNvbmZpZGVuY2UsXG4gICAgICB9O1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzdWdnZXN0TWVhbHNMb2NhbGx5KFxuICBpbnZlbnRvcnlJdGVtczogSW52ZW50b3J5SXRlbVtdLFxuICBtZWFsVHlwZTogJ2JyZWFrZmFzdCcgfCAnbHVuY2gnIHwgJ2Rpbm5lcidcbik6IFJlY2lwZVtdIHtcbiAgY29uc3QgbmFtZXMgPSBpbnZlbnRvcnlJdGVtcy5tYXAoKGl0ZW0pID0+IGl0ZW0ubmFtZSk7XG4gIGNvbnN0IGxlYWQgPSBuYW1lcy5zbGljZSgwLCAzKTtcbiAgY29uc3Qgam9pbmVkID0gbGVhZC5qb2luKCcsICcpO1xuXG4gIHJldHVybiBbXG4gICAge1xuICAgICAgbmFtZTogYCR7bGVhZFswXSB8fCAnUGFudHJ5J30gJHttZWFsVHlwZSA9PT0gJ2JyZWFrZmFzdCcgPyAnSGFzaCcgOiAnU2tpbGxldCd9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiBgQSBxdWljayAke21lYWxUeXBlfSBpZGVhIGJ1aWx0IGZyb20gJHtqb2luZWQgfHwgJ3doYXQgeW91IGhhdmUgb24gaGFuZCd9LmAsXG4gICAgICB0aW1lX2VzdGltYXRlX21pbnM6IG1lYWxUeXBlID09PSAnYnJlYWtmYXN0JyA/IDEwIDogMTUsXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBgJHtsZWFkWzBdIHx8ICdTaW1wbGUnfSAke21lYWxUeXBlID09PSAnbHVuY2gnID8gJ0Jvd2wnIDogJ1NhdXRlJ31gLFxuICAgICAgZGVzY3JpcHRpb246IGBBIHNpbXBsZSAke21lYWxUeXBlfSB1c2luZyAke2pvaW5lZCB8fCAneW91ciBjdXJyZW50IGludmVudG9yeSd9LmAsXG4gICAgICB0aW1lX2VzdGltYXRlX21pbnM6IDE1LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogYCR7bWVhbFR5cGVbMF0udG9VcHBlckNhc2UoKX0ke21lYWxUeXBlLnNsaWNlKDEpfSAke2xlYWRbMV0gfHwgJ0tpdGNoZW4nfSBNaXhgLFxuICAgICAgZGVzY3JpcHRpb246IGBBIGZsZXhpYmxlIGRpc2ggY29tYmluaW5nICR7am9pbmVkIHx8ICdhdmFpbGFibGUgaW5ncmVkaWVudHMnfSB3aXRoIG1pbmltYWwgcHJlcC5gLFxuICAgICAgdGltZV9lc3RpbWF0ZV9taW5zOiAyMCxcbiAgICB9LFxuICBdO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVJlY2lwZURldGFpbExvY2FsbHkoXG4gIHJlY2lwZU5hbWU6IHN0cmluZyxcbiAgcmVjaXBlRGVzY3JpcHRpb246IHN0cmluZyxcbiAgdXNlckludmVudG9yeTogSW52ZW50b3J5SXRlbVtdXG4pOiBSZWNpcGVEZXRhaWwge1xuICBjb25zdCByYXdJbmdyZWRpZW50cyA9IHVzZXJJbnZlbnRvcnkuc2xpY2UoMCwgNSkubWFwKChpdGVtKSA9PiAoe1xuICAgIG5hbWU6IGl0ZW0ubmFtZS50b0xvd2VyQ2FzZSgpLFxuICAgIHF1YW50aXR5OiBpdGVtLnF1YW50aXR5X2FwcHJveCA/PyAxLFxuICAgIHVuaXQ6IGl0ZW0udW5pdCB8fCAoaXRlbS5oYXNfaXRlbSA/ICd0byB0YXN0ZScgOiAncGllY2VzJyksXG4gIH0pKTtcblxuICAvLyBOb3JtYWxpemUgaW5ncmVkaWVudCBxdWFudGl0aWVzIHRvIGNhbm9uaWNhbCB1bml0c1xuICBjb25zdCBpbmdyZWRpZW50cyA9IHJhd0luZ3JlZGllbnRzLm1hcCgoaW5nKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gY29udmVydFRvQ2Fub25pY2FsKGluZy5xdWFudGl0eSwgaW5nLnVuaXQsIGluZy5uYW1lKTtcbiAgICBjYWNoZUNhbm9uaWNhbFVuaXQoaW5nLm5hbWUsIHJlc3VsdC51bml0KTtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogaW5nLm5hbWUsXG4gICAgICBxdWFudGl0eTogcmVzdWx0LnF1YW50aXR5LFxuICAgICAgdW5pdDogcmVzdWx0LnVuaXQsXG4gICAgfTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiByZWNpcGVOYW1lLFxuICAgIGRlc2NyaXB0aW9uOiByZWNpcGVEZXNjcmlwdGlvbixcbiAgICB0aW1lX2VzdGltYXRlX21pbnM6IE1hdGgubWF4KDEwLCBpbmdyZWRpZW50cy5sZW5ndGggKiA1KSxcbiAgICBpbmdyZWRpZW50cyxcbiAgICBpbnN0cnVjdGlvbnM6IFtcbiAgICAgICdQcmVwYXJlIHRoZSBpbmdyZWRpZW50cyBmcm9tIHlvdXIgY3VycmVudCBpbnZlbnRvcnkuJyxcbiAgICAgICdDb29rIHRoZSBtYWluIGluZ3JlZGllbnRzIHRvZ2V0aGVyIG92ZXIgbWVkaXVtIGhlYXQgdW50aWwgdGVuZGVyLicsXG4gICAgICAnQWRqdXN0IHRoZSB0ZXh0dXJlIGFuZCBjb21iaW5lIGV2ZXJ5dGhpbmcgZXZlbmx5LicsXG4gICAgICAnU2VydmUgaW1tZWRpYXRlbHkgd2hpbGUgd2FybS4nLFxuICAgIF0sXG4gIH07XG59XG5cbi8qKlxuICogR2V0IG9yIGNyZWF0ZSBPcGVuQUkgY2xpZW50XG4gKiBVc2VzIE9QRU5BSV9BUElfS0VZIGZyb20gZW52aXJvbm1lbnRcbiAqL1xuZnVuY3Rpb24gZ2V0T3BlbkFJQ2xpZW50KCk6IE9wZW5BSSB7XG4gIGlmICghb3BlbmFpQ2xpZW50KSB7XG4gICAgY29uc3QgYXBpS2V5ID0gcHJvY2Vzcy5lbnYuT1BFTkFJX0FQSV9LRVk7XG4gICAgaWYgKCFhcGlLZXkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT1BFTkFJX0FQSV9LRVkgbXVzdCBiZSBzZXQgaW4gZW52aXJvbm1lbnQnKTtcbiAgICB9XG4gICAgb3BlbmFpQ2xpZW50ID0gbmV3IE9wZW5BSSh7IGFwaUtleSB9KTtcbiAgfVxuICByZXR1cm4gb3BlbmFpQ2xpZW50O1xufVxuXG4vKipcbiAqIFBhcnNlIGZyZWUtZm9ybSBpbnZlbnRvcnkgaW5wdXQgaW50byBzdHJ1Y3R1cmVkIGl0ZW1zXG4gKlxuICogRXhhbXBsZXM6XG4gKiAtIFwiMyBjaGlja2VuIGJyZWFzdHMsIDIgdG9tYXRvZXNcIiAtPiBbe25hbWU6IFwiY2hpY2tlbiBicmVhc3RzXCIsIGNhbm9uaWNhbF9uYW1lOiBcImNoaWNrZW5fYnJlYXN0XCIsIHF1YW50aXR5X2FwcHJveDogMywgdW5pdDogXCJwaWVjZXNcIn0sIC4uLl1cbiAqIC0gXCJzb21lIHJpY2UsIGEgYnVuY2ggb2Ygc3BpbmFjaFwiIC0+IHBhcnNlZCB3aXRoIGFwcHJveGltYXRlIHF1YW50aXRpZXNcbiAqIC0gXCIyMDBnIGJlZWYsIDIgY3VwcyBmbG91clwiIC0+IHF1YW50aXRpZXMgYW5kIHVuaXRzIGV4dHJhY3RlZFxuICogLSBcInNhbHQgYW5kIHBlcHBlclwiIC0+IGhhc19pdGVtOiB0cnVlLCBjb25maWRlbmNlOiBcImV4YWN0XCJcbiAqXG4gKiBAcGFyYW0gdXNlcklucHV0IC0gRnJlZS1mb3JtIHRleHQgbGlrZSBcIjMgY2hpY2tlbiBicmVhc3RzLCBzb21lIHRvbWF0b2VzXCJcbiAqIEByZXR1cm5zIEFycmF5IG9mIEludmVudG9yeUl0ZW0gb2JqZWN0cyAod2l0aG91dCBpZCwgdXNlcl9pZCwgZGF0ZXMgLSBhZGRlZCBieSBEQilcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlSW52ZW50b3J5SW5wdXQoXG4gIHVzZXJJbnB1dDogc3RyaW5nXG4pOiBQcm9taXNlPE9taXQ8SW52ZW50b3J5SXRlbSwgJ2lkJyB8ICd1c2VyX2lkJyB8ICdkYXRlX2FkZGVkJyB8ICdkYXRlX3VzZWQnPltdPiB7XG4gIGlmICghaGFzT3BlbkFpQXBpS2V5KCkpIHtcbiAgICByZXR1cm4gcGFyc2VJbnZlbnRvcnlJbnB1dExvY2FsbHkodXNlcklucHV0KTtcbiAgfVxuXG4gIGNvbnN0IGNsaWVudCA9IGdldE9wZW5BSUNsaWVudCgpO1xuICBjb25zdCB7IGdldENhbm9uaWNhbE5hbWUgfSA9IGF3YWl0IGltcG9ydCgnLi9jYW5vbmljYWwtZm9vZHMnKTtcblxuICBjb25zdCBzeXN0ZW1Qcm9tcHQgPSBgWW91IGFyZSBhIGtpdGNoZW4gaW52ZW50b3J5IHBhcnNlci4gWW91ciBqb2IgaXMgdG8gZXh0cmFjdCBmb29kIGl0ZW1zIGZyb20gdXNlciBpbnB1dC5cblxuRm9yIGVhY2ggaXRlbSwgZXh0cmFjdDpcbjEuIG5hbWU6IFRoZSBmb29kIGl0ZW0gbmFtZSBvbmx5LCBzdHJpcHBlZCBvZiBxdWFudGl0aWVzIGFuZCB1bml0cyAoZS5nLiwgXCJjaGlja2VuIGJyZWFzdFwiLCBcIm9pbFwiLCBOT1QgXCIzIGNoaWNrZW4gYnJlYXN0c1wiIG9yIFwiMiB0YWJsZXNwb29ucyBvZiBvaWxcIilcbjIuIGNhbm9uaWNhbF9uYW1lOiBOb3JtYWxpemVkIHZlcnNpb24gKGUuZy4sIFwiY2hpY2tlbl9icmVhc3RcIiwgXCJzYWxhZF9sZWF2ZXNcIikgLSB5b3UnbGwgY29tcHV0ZSB0aGlzIGZyb20gbmFtZVxuMy4gaGFzX2l0ZW06IGJvb2xlYW4uIFRydWUgT05MWSBmb3IgcGFudHJ5IHN0YXBsZXMgd2hlcmUgcXVhbnRpdHkgZG9lc24ndCBtYXR0ZXIgKHNhbHQsIHNwaWNlcywgb2lscywgY29uZGltZW50cylcbjQuIHF1YW50aXR5X2FwcHJveDogVGhlIHF1YW50aXR5IGFzIGEgbnVtYmVyLiBGb3IgYXBwcm94aW1hdGUgcXVhbnRpdGllcywgdXNlIGJlc3QganVkZ21lbnQ6XG4gICAtIFwic29tZVwiIC8gXCJhIGxpdHRsZVwiIC8gXCJhIGJpdFwiID0gMVxuICAgLSBcImEgYnVuY2hcIiAvIFwiaGFuZGZ1bFwiIC8gXCJxdWl0ZSBhIGJpdFwiID0gMlxuICAgLSBcImxvdHNcIiAvIFwiYSBsb3RcIiAvIFwicGxlbnR5XCIgPSA0XG4gICAtIEZyYWN0aW9uczogcGFyc2UgbGl0ZXJhbGx5IChcImhhbGZcIiA9IDAuNSwgXCIxLzNcIiA9IDAuMzMpXG4gICAtIEZvciBoYXNfaXRlbT10cnVlIGl0ZW1zLCBxdWFudGl0eV9hcHByb3ggPSBudWxsXG41LiB1bml0OiBUaGUgdW5pdCBvZiBtZWFzdXJlbWVudC4gVXNlIHN0YW5kYXJkIHVuaXRzOlxuICAgLSBcInBpZWNlc1wiIGZvciBjb3VudGFibGUgaXRlbXMgKGNoaWNrZW4gYnJlYXN0cywgdG9tYXRvZXMsIGVnZ3MsIGFwcGxlcywgZXRjLikgLSBBTFdBWVMgdXNlIFwicGllY2VzXCIgaWYgbm8gZXhwbGljaXQgdW5pdCBnaXZlblxuICAgLSBcImJ1bmNoXCIgZm9yIGJ1bmNoZXMvYnVuZGxlc1xuICAgLSBcImdcIiBmb3IgZ3JhbXNcbiAgIC0gXCJtbFwiIGZvciBtaWxsaWxpdGVyc1xuICAgLSBcImN1cFwiIGZvciBjdXBzXG4gICAtIFwidGJzcFwiIGZvciB0YWJsZXNwb29uc1xuICAgLSBudWxsIGZvciBidWxrIGl0ZW1zIHdpdGhvdXQgcXVhbnRpZmlhYmxlIHVuaXRzIChsaWtlIFwic2FsdFwiLCBcInNwaWNlXCIpXG42LiBjb25maWRlbmNlOiBcImV4YWN0XCIgaWYgdXNlciBzcGVjaWZpZWQgcXVhbnRpdHkgcHJlY2lzZWx5LCBcImFwcHJveGltYXRlXCIgaWYgZXN0aW1hdGVkXG5cblJldHVybiBPTkxZIGEgSlNPTiBhcnJheSwgbm8gb3RoZXIgdGV4dC4gRXhhbXBsZSBmb3JtYXQ6XG5bXG4gIHtcIm5hbWVcIjogXCJjaGlja2VuIGJyZWFzdFwiLCBcImNhbm9uaWNhbF9uYW1lXCI6IFwiY2hpY2tlbl9icmVhc3RcIiwgXCJxdWFudGl0eV9hcHByb3hcIjogMywgXCJ1bml0XCI6IFwicGllY2VzXCIsIFwiY29uZmlkZW5jZVwiOiBcImV4YWN0XCJ9LFxuICB7XCJuYW1lXCI6IFwidG9tYXRvXCIsIFwiY2Fub25pY2FsX25hbWVcIjogXCJ0b21hdG9cIiwgXCJxdWFudGl0eV9hcHByb3hcIjogMiwgXCJ1bml0XCI6IFwicGllY2VzXCIsIFwiY29uZmlkZW5jZVwiOiBcImV4YWN0XCJ9LFxuICB7XCJuYW1lXCI6IFwiYmFzaWxcIiwgXCJjYW5vbmljYWxfbmFtZVwiOiBcImJhc2lsXCIsIFwicXVhbnRpdHlfYXBwcm94XCI6IDEsIFwidW5pdFwiOiBcImJ1bmNoXCIsIFwiY29uZmlkZW5jZVwiOiBcImV4YWN0XCJ9LFxuICB7XCJuYW1lXCI6IFwic2FsdFwiLCBcImNhbm9uaWNhbF9uYW1lXCI6IFwic2FsdFwiLCBcImhhc19pdGVtXCI6IHRydWUsIFwicXVhbnRpdHlfYXBwcm94XCI6IG51bGwsIFwidW5pdFwiOiBudWxsLCBcImNvbmZpZGVuY2VcIjogXCJleGFjdFwifVxuXVxuXG5DYXRlZ29yaWVzOlxuMS4gUGFudHJ5IHN0YXBsZXMgKHNhbHQsIHNwaWNlcywgbG9vc2UgaXRlbXMpOiBoYXNfaXRlbT10cnVlLCB1bml0PW51bGwsIHF1YW50aXR5X2FwcHJveD1udWxsXG4yLiBFeGFjdCBxdWFudGl0aWVzIHdpdGggdW5pdHMgKDUwMGcgYmVlZiwgMjQwbWwgbWlsayk6IGNvbmZpZGVuY2U9XCJleGFjdFwiXG4zLiBFeGFjdCBjb3VudHMgKDMgYXBwbGVzLCAyIGNoaWNrZW4gYnJlYXN0cyk6IHVuaXQ9XCJwaWVjZXNcIiwgY29uZmlkZW5jZT1cImV4YWN0XCJcbjQuIEJ1bmNoZXMvYnVuZGxlcyAoMSBidW5jaCBiYXNpbCk6IHVuaXQ9XCJidW5jaFwiLCBjb25maWRlbmNlPVwiZXhhY3RcIlxuNS4gUm91Z2ggcXVhbnRpdGllcyAoc29tZSBzYWxhZCwgbG90cyBvZiBjYXJyb3RzKTogY29uZmlkZW5jZT1cImFwcHJveGltYXRlXCIsIHVuaXQ9XCJwaWVjZXNcIiAoaWYgY291bnRhYmxlKVxuXG5IYW5kbGUgZWRnZSBjYXNlczpcbi0gSWdub3JlIGFydGljbGVzIGxpa2UgXCJhXCIsIFwiYW5cIiwgXCJ0aGVcIlxuLSBOb3JtYWxpemUgaXRlbSBuYW1lcyAoZS5nLiwgXCJ0b21hdG9lc1wiIFx1MjE5MiBcInRvbWF0b1wiLCBcImNoaWNrZW4gYnJlYXN0c1wiIFx1MjE5MiBcImNoaWNrZW4gYnJlYXN0XCIpXG4tIEV4dHJhY3QgdW5pdHMgZnJvbSBjb21wb3VuZCBpdGVtcyAoZS5nLiwgXCIyIHRhYmxlc3Bvb25zIG9mIG9pbFwiIFx1MjE5MiBuYW1lOiBcIm9pbFwiLCBxdWFudGl0eV9hcHByb3g6IDIsIHVuaXQ6IFwidGJzcFwiKVxuLSBGb3IgY291bnRhYmxlIGl0ZW1zIChtZWF0cywgdmVnZXRhYmxlcywgZnJ1aXRzLCBlZ2dzKSBXSVRIT1VUIGFuIGV4cGxpY2l0IHVuaXQsIGRlZmF1bHQgdG8gdW5pdDogXCJwaWVjZXNcImA7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsaWVudC5jaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgIG1heF90b2tlbnM6IDEwMjQsXG4gICAgICBtZXNzYWdlczogW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgY29udGVudDogc3lzdGVtUHJvbXB0LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgIGNvbnRlbnQ6IGBQYXJzZSB0aGlzIGludmVudG9yeSBpbnB1dDogXCIke3VzZXJJbnB1dH1cImAsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gRXh0cmFjdCB0ZXh0IGZyb20gcmVzcG9uc2VcbiAgICBjb25zdCBtZXNzYWdlID0gcmVzcG9uc2UuY2hvaWNlc1swXS5tZXNzYWdlO1xuICAgIGlmICghbWVzc2FnZS5jb250ZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VtcHR5IHJlc3BvbnNlIGZyb20gT3BlbkFJJyk7XG4gICAgfVxuXG4gICAgLy8gUGFyc2UgSlNPTiBmcm9tIHJlc3BvbnNlXG4gICAgY29uc3QganNvbk1hdGNoID0gbWVzc2FnZS5jb250ZW50Lm1hdGNoKC9cXFtbXFxzXFxTXSpcXF0vKTtcbiAgICBpZiAoIWpzb25NYXRjaCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgZmluZCBKU09OIGFycmF5IGluIHJlc3BvbnNlJyk7XG4gICAgfVxuXG4gICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShqc29uTWF0Y2hbMF0pO1xuXG4gICAgLy8gVmFsaWRhdGUgc3RydWN0dXJlXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHBhcnNlZCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUmVzcG9uc2UgaXMgbm90IGFuIGFycmF5Jyk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBjb252ZXJ0VG9DYW5vbmljYWwsIGNhY2hlQ2Fub25pY2FsVW5pdCB9ID0gYXdhaXQgaW1wb3J0KCcuL3VuaXRzJyk7XG5cbiAgICAvLyBDYWNoZSBjYW5vbmljYWwgdW5pdCBmb3IgZWFjaCBpbmdyZWRpZW50XG4gICAgcGFyc2VkLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgY29uc3QgY2Fub25pY2FsUmVzdWx0ID0gY29udmVydFRvQ2Fub25pY2FsKFxuICAgICAgICBpdGVtLnF1YW50aXR5X2FwcHJveCB8fCAxLFxuICAgICAgICBpdGVtLnVuaXQsXG4gICAgICAgIGl0ZW0ubmFtZVxuICAgICAgKTtcbiAgICAgIGNhY2hlQ2Fub25pY2FsVW5pdChpdGVtLm5hbWUsIGNhbm9uaWNhbFJlc3VsdC51bml0KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBwYXJzZWQubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIC8vIENsZWFuIHVwIG5hbWUgaWYgaXQgY29udGFpbnMgdW5pdHMgKGUuZy4sIFwiMiB0YWJsZXNwb29ucyBvaWxcIiBcdTIxOTIgXCJvaWxcIilcbiAgICAgIGxldCBjbGVhbk5hbWUgPSBpdGVtLm5hbWUgfHwgJyc7XG4gICAgICBsZXQgY2xlYW5Vbml0ID0gaXRlbS51bml0O1xuXG4gICAgICAvLyBSZW1vdmUgY29tbW9uIHVuaXQgcHJlZml4ZXMgZnJvbSBuYW1lXG4gICAgICBjb25zdCB1bml0UHJlZml4ZXMgPSBbJ3RhYmxlc3Bvb25zPycsICd0YnNwJywgJ3RlYXNwb29ucz8nLCAndHNwJywgJ2N1cHM/JywgJ21sJywgJ2dyYW1zPycsICdnJywgJ291bmNlcz8nLCAnb3onLCAncGllY2VzPycsICdjb3VudCddO1xuICAgICAgdW5pdFByZWZpeGVzLmZvckVhY2gocHJlZml4ID0+IHtcbiAgICAgICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGBeXFxcXGQqXFxcXC4/XFxcXGQqXFxcXHMqJHtwcmVmaXh9XFxcXHMrKD86b2ZcXFxccyspP2AsICdpJyk7XG4gICAgICAgIGNsZWFuTmFtZSA9IGNsZWFuTmFtZS5yZXBsYWNlKHJlZ2V4LCAnJyk7XG4gICAgICB9KTtcblxuICAgICAgLy8gSW5mZXIgdW5pdCBmb3IgY291bnRhYmxlIGl0ZW1zIGlmIG1pc3NpbmdcbiAgICAgIGxldCBpbmZlcnJlZFVuaXQgPSBjbGVhblVuaXQgfHwgbnVsbDtcbiAgICAgIGlmICghaW5mZXJyZWRVbml0ICYmICFpdGVtLmhhc19pdGVtICYmIGl0ZW0ucXVhbnRpdHlfYXBwcm94ICE9PSBudWxsKSB7XG4gICAgICAgIC8vIEhldXJpc3RpY3MgZm9yIGRldGVjdGluZyBjb3VudGFibGUgaXRlbXNcbiAgICAgICAgY29uc3QgY291bnRhYmxlS2V5d29yZHMgPSBbJ2NoaWNrZW4nLCAnYnJlYXN0JywgJ3RvbWF0bycsICdhcHBsZScsICdlZ2cnLCAnY2Fycm90JywgJ29uaW9uJywgJ3BvdGF0bycsICdwZXBwZXInLCAnY3VjdW1iZXInLCAnc3BpbmFjaCcsICdsZXR0dWNlJywgJ2Jhc2lsJywgJ3BhcnNsZXknLCAnY2xvdmUnLCAnbGVhZicsICdsZWF2ZXMnLCAnc2xpY2UnXTtcbiAgICAgICAgY29uc3QgaXNDb3VudGFibGUgPSBjb3VudGFibGVLZXl3b3Jkcy5zb21lKGtleXdvcmQgPT4gY2xlYW5OYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoa2V5d29yZCkpO1xuXG4gICAgICAgIC8vIElmIGl0IGxvb2tzIGNvdW50YWJsZSBhbmQgaGFzIGEgcXVhbnRpdHksIHVzZSBcInBpZWNlc1wiXG4gICAgICAgIGlmIChpc0NvdW50YWJsZSkge1xuICAgICAgICAgIGluZmVycmVkVW5pdCA9ICdwaWVjZXMnO1xuICAgICAgICB9XG4gICAgICAgIC8vIEFsc28gdXNlIHBpZWNlcyBpZiBpdCdzIGEgYnVuY2ggKGV4cGxpY2l0IHVzZXIgaW5wdXQgYWJvdXQgcXVhbnRpdHkpXG4gICAgICAgIGVsc2UgaWYgKGNsZWFuVW5pdCA9PT0gJ2J1bmNoJyB8fCBpdGVtLnVuaXQgPT09ICdidW5jaCcpIHtcbiAgICAgICAgICBpbmZlcnJlZFVuaXQgPSAnYnVuY2gnO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSB0aGUgY2FzZSB3aGVyZSB1c2VyIHNwZWNpZmllZCBcImJ1bmNoXCIgZXhwbGljaXRseVxuICAgICAgaWYgKGNsZWFuVW5pdCA9PT0gJ2J1bmNoJyB8fCBpdGVtLnVuaXQgPT09ICdidW5jaCcpIHtcbiAgICAgICAgaW5mZXJyZWRVbml0ID0gJ2J1bmNoJztcbiAgICAgIH1cblxuICAgICAgbGV0IGNhbm9uaWNhbE5hbWVWYWx1ZSA9IGl0ZW0uY2Fub25pY2FsX25hbWUgfHwgZ2V0Q2Fub25pY2FsTmFtZShjbGVhbk5hbWUgfHwgJycpO1xuXG4gICAgICAvLyBDbGVhbiBjYW5vbmljYWwgbmFtZSBpZiBpdCBjb250YWlucyB1bml0cyBvciBhcnRpY2xlc1xuICAgICAgbGV0IGNsZWFuQ2Fub25pY2FsTmFtZSA9IGNhbm9uaWNhbE5hbWVWYWx1ZTtcbiAgICAgIHVuaXRQcmVmaXhlcy5mb3JFYWNoKHByZWZpeCA9PiB7XG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgXiR7cHJlZml4fV9vZl98XyR7cHJlZml4fXM/fCR7cHJlZml4fV9vZl9gLCAnaScpO1xuICAgICAgICBjbGVhbkNhbm9uaWNhbE5hbWUgPSBjbGVhbkNhbm9uaWNhbE5hbWUucmVwbGFjZShyZWdleCwgJycpO1xuICAgICAgfSk7XG4gICAgICAvLyBSZW1vdmUgZXh0cmEgdW5pdHMgdGhhdCBtaWdodCBiZSBpbiB0aGUgY2Fub25pY2FsIG5hbWUgKGUuZy4sIFwidGFibGVzcG9vbnNfb2lsXCIgXHUyMTkyIFwib2lsXCIpXG4gICAgICBjbGVhbkNhbm9uaWNhbE5hbWUgPSBjbGVhbkNhbm9uaWNhbE5hbWUucmVwbGFjZSgvXltcXHddK19vZl8vLCAnJyk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6IGNsZWFuTmFtZS50cmltKCksXG4gICAgICAgIGNhbm9uaWNhbF9uYW1lOiBjbGVhbkNhbm9uaWNhbE5hbWUudHJpbSgpLFxuICAgICAgICBoYXNfaXRlbTogaXRlbS5oYXNfaXRlbSB8fCBmYWxzZSxcbiAgICAgICAgcXVhbnRpdHlfYXBwcm94OiBpdGVtLnF1YW50aXR5X2FwcHJveCB8fCBudWxsLFxuICAgICAgICB1bml0OiBpbmZlcnJlZFVuaXQsXG4gICAgICAgIGNvbmZpZGVuY2U6IGl0ZW0uY29uZmlkZW5jZSB8fCAnYXBwcm94aW1hdGUnLFxuICAgICAgfTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwYXJzaW5nIGludmVudG9yeSBpbnB1dDonLCBlcnJvcik7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEZhaWxlZCB0byBwYXJzZSBpbnZlbnRvcnk6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWBcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogU3VnZ2VzdCBtZWFscyBiYXNlZCBvbiBjdXJyZW50IGludmVudG9yeSBhbmQgbWVhbCB0eXBlXG4gKlxuICogQHBhcmFtIGludmVudG9yeUl0ZW1zIC0gQXJyYXkgb2YgaXRlbXMgaW4gdXNlcidzIGludmVudG9yeVxuICogQHBhcmFtIG1lYWxUeXBlIC0gVHlwZSBvZiBtZWFsOiAnYnJlYWtmYXN0JywgJ2x1bmNoJywgb3IgJ2Rpbm5lcidcbiAqIEByZXR1cm5zIEFycmF5IG9mIFJlY2lwZSBzdWdnZXN0aW9ucyAobmFtZSwgZGVzY3JpcHRpb24sIHRpbWVfZXN0aW1hdGVfbWlucylcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN1Z2dlc3RNZWFscyhcbiAgaW52ZW50b3J5SXRlbXM6IEludmVudG9yeUl0ZW1bXSxcbiAgbWVhbFR5cGU6ICdicmVha2Zhc3QnIHwgJ2x1bmNoJyB8ICdkaW5uZXInXG4pOiBQcm9taXNlPFJlY2lwZVtdPiB7XG4gIGlmICghaGFzQ29va2FibGVJbmdyZWRpZW50cyhpbnZlbnRvcnlJdGVtcykpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBpZiAoIWhhc09wZW5BaUFwaUtleSgpKSB7XG4gICAgcmV0dXJuIHN1Z2dlc3RNZWFsc0xvY2FsbHkoaW52ZW50b3J5SXRlbXMsIG1lYWxUeXBlKTtcbiAgfVxuXG4gIGNvbnN0IGNsaWVudCA9IGdldE9wZW5BSUNsaWVudCgpO1xuXG4gIGNvbnN0IGludmVudG9yeUxpc3QgPSBpbnZlbnRvcnlJdGVtc1xuICAgIC5tYXAoKGl0ZW0pID0+IHtcbiAgICAgIGlmIChpdGVtLmhhc19pdGVtKSB7XG4gICAgICAgIHJldHVybiBgLSAke2l0ZW0ubmFtZX0gKGF2YWlsYWJsZSlgO1xuICAgICAgfVxuICAgICAgY29uc3QgcXR5ID0gaXRlbS5xdWFudGl0eV9hcHByb3ggPyBgJHtpdGVtLnF1YW50aXR5X2FwcHJveH0ke2l0ZW0udW5pdCA/ICcgJyArIGl0ZW0udW5pdCA6ICcnfWAgOiAnc29tZSc7XG4gICAgICByZXR1cm4gYC0gJHtpdGVtLm5hbWV9ICgke3F0eX0pYDtcbiAgICB9KVxuICAgIC5qb2luKCdcXG4nKTtcblxuICBjb25zdCBzeXN0ZW1Qcm9tcHQgPSBgWW91IGFyZSBhIGNyZWF0aXZlIG1lYWwgc3VnZ2VzdGlvbiBlbmdpbmUuIEdpdmVuIGEgbGlzdCBvZiBhdmFpbGFibGUgaW5ncmVkaWVudHMsIHN1Z2dlc3QgMy01IHJlY2lwZXMgdGhhdCBjYW4gYmUgbWFkZS5cblxuQ1JJVElDQUwgQ09OU1RSQUlOVDogWW91IGNhbiBPTkxZIHN1Z2dlc3QgbWVhbHMgdXNpbmcgT05MWSB0aGVzZSBpbmdyZWRpZW50czpcbiR7aW52ZW50b3J5TGlzdH1cblxuRG8gTk9UIHN1Z2dlc3QgYW55IG1lYWxzIHRoYXQgcmVxdWlyZSBpbmdyZWRpZW50cyBub3QgaW4gdGhpcyBsaXN0LlxuRG8gTk9UIGFzc3VtZSB0aGUgdXNlciBoYXMgc2FsdCwgb2lsLCBidXR0ZXIsIHNwaWNlcywgd2F0ZXIsIG9yIGFueSBwYW50cnkgaXRlbXMuXG5EbyBOT1QgYWRkLCBhc3N1bWUsIG9yIHN1Z2dlc3QgYW55IG90aGVyIGluZ3JlZGllbnRzLlxuXG5Gb3IgZWFjaCByZWNpcGUsIHByb3ZpZGU6XG4xLiBuYW1lOiBSZWNpcGUgbmFtZVxuMi4gZGVzY3JpcHRpb246IE1lbnUtc3R5bGUgZGVzY3JpcHRpb24gd2l0aCBoZWFsdGgvY2hhcmFjdGVyIG5vdGVzLiBFeGFtcGxlOiBcIlBhbi1zZWFyZWQgY2hpY2tlbiB3aXRoIGZyZXNoIHRvbWF0b2VzIGFuZCBiYXNpbC4gTGlnaHQsIHByb3RlaW4tcmljaCwgYW5kIG5hdHVyYWxseSBmcmVzaC5cIlxuMy4gdGltZV9lc3RpbWF0ZV9taW5zOiBFc3RpbWF0ZWQgY29va2luZyB0aW1lIGluIG1pbnV0ZXNcblxuUmV0dXJuIE9OTFkgYSBKU09OIG9iamVjdCB3aXRoIGEgXCJyZWNpcGVzXCIgYXJyYXksIG5vIG90aGVyIHRleHQuIEV4YW1wbGUgZm9ybWF0Olxue1xuICBcInJlY2lwZXNcIjogW1xuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcIlRvbWF0byBCYXNpbCBTYWxhZFwiLFxuICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZyZXNoIHRvbWF0b2VzIGFuZCBiYXNpbC4gU2ltcGxlLCBsaWdodCwgYW5kIG5hdHVyYWxseSBmcmVzaC5cIixcbiAgICAgIFwidGltZV9lc3RpbWF0ZV9taW5zXCI6IDVcbiAgICB9XG4gIF1cbn1cblxuRm9jdXMgb24gcmVjaXBlcyB0aGF0OlxuLSBVc2UgaW5ncmVkaWVudHMgZnJvbSB0aGUgaW52ZW50b3J5IChwcmlvcml0aXplIHVzaW5nIG11bHRpcGxlIGl0ZW1zKVxuLSBBcmUgcmVhbGlzdGljIGZvciBhIGhvbWUgY29va1xuLSBNYXRjaCB0aGUgbWVhbCB0eXBlIChicmVha2Zhc3QgPSBxdWljay9saWdodCwgbHVuY2ggPSBiYWxhbmNlZCwgZGlubmVyID0gaGVhcnR5KWA7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsaWVudC5jaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgIHRlbXBlcmF0dXJlOiAwLFxuICAgICAgbWF4X3Rva2VuczogMjA0OCxcbiAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICBjb250ZW50OiBzeXN0ZW1Qcm9tcHQsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgY29udGVudDogYEF2YWlsYWJsZSBpbnZlbnRvcnkgZm9yICR7bWVhbFR5cGV9OlxcbiR7aW52ZW50b3J5TGlzdH1cXG5cXG5TdWdnZXN0IDMtNCAke21lYWxUeXBlfSByZWNpcGVzIEkgY2FuIG1ha2UuYCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBtZXNzYWdlID0gcmVzcG9uc2UuY2hvaWNlc1swXS5tZXNzYWdlO1xuICAgIGlmICghbWVzc2FnZS5jb250ZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VtcHR5IHJlc3BvbnNlIGZyb20gT3BlbkFJJyk7XG4gICAgfVxuXG4gICAgY29uc3QganNvbk1hdGNoID0gbWVzc2FnZS5jb250ZW50Lm1hdGNoKC9cXHtbXFxzXFxTXSpcXH0vKTtcbiAgICBpZiAoIWpzb25NYXRjaCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgZmluZCBKU09OIG9iamVjdCBpbiByZXNwb25zZScpO1xuICAgIH1cblxuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvbk1hdGNoWzBdKTtcblxuICAgIC8vIFZhbGlkYXRlIHN0cnVjdHVyZVxuICAgIGlmICghQXJyYXkuaXNBcnJheShwYXJzZWQucmVjaXBlcykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUmVzcG9uc2UgcmVjaXBlcyBpcyBub3QgYW4gYXJyYXknKTtcbiAgICB9XG5cbiAgICBwYXJzZWQucmVjaXBlcy5mb3JFYWNoKChyZWNpcGU6IGFueSkgPT4ge1xuICAgICAgaWYgKCFyZWNpcGUubmFtZSB8fCAhcmVjaXBlLmRlc2NyaXB0aW9uIHx8IHJlY2lwZS50aW1lX2VzdGltYXRlX21pbnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcmVjaXBlIHN0cnVjdHVyZTogJHtKU09OLnN0cmluZ2lmeShyZWNpcGUpfWApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHBhcnNlZC5yZWNpcGVzO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHN1Z2dlc3RpbmcgbWVhbHM6JywgZXJyb3IpO1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBGYWlsZWQgdG8gc3VnZ2VzdCBtZWFsczogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSBkZXRhaWxlZCByZWNpcGUgd2l0aCBmdWxsIGluZ3JlZGllbnRzIGxpc3QgYW5kIHN0ZXAtYnktc3RlcCBpbnN0cnVjdGlvbnNcbiAqXG4gKiBAcGFyYW0gcmVjaXBlTmFtZSAtIE5hbWUgb2YgdGhlIHJlY2lwZSAoZS5nLiwgXCJUb21hdG8gQmFzaWwgQ2hpY2tlblwiKVxuICogQHBhcmFtIHJlY2lwZURlc2NyaXB0aW9uIC0gTWVudS1zdHlsZSBkZXNjcmlwdGlvbiBmcm9tIG1lYWwgc3VnZ2VzdGlvblxuICogQHBhcmFtIHVzZXJJbnZlbnRvcnkgLSBBcnJheSBvZiBpdGVtcyBpbiB1c2VyJ3MgaW52ZW50b3J5XG4gKiBAcmV0dXJucyBGdWxsIFJlY2lwZURldGFpbCB3aXRoIGluZ3JlZGllbnRzIGxpc3QgYW5kIGluc3RydWN0aW9uc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVSZWNpcGVEZXRhaWwoXG4gIHJlY2lwZU5hbWU6IHN0cmluZyxcbiAgcmVjaXBlRGVzY3JpcHRpb246IHN0cmluZyxcbiAgdXNlckludmVudG9yeTogSW52ZW50b3J5SXRlbVtdXG4pOiBQcm9taXNlPFJlY2lwZURldGFpbD4ge1xuICBpZiAoIWhhc09wZW5BaUFwaUtleSgpKSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlUmVjaXBlRGV0YWlsTG9jYWxseShcbiAgICAgIHJlY2lwZU5hbWUsXG4gICAgICByZWNpcGVEZXNjcmlwdGlvbixcbiAgICAgIHVzZXJJbnZlbnRvcnlcbiAgICApO1xuICB9XG5cbiAgY29uc3QgY2xpZW50ID0gZ2V0T3BlbkFJQ2xpZW50KCk7XG5cbiAgY29uc3QgaW52ZW50b3J5TmFtZXMgPSB1c2VySW52ZW50b3J5Lm1hcChpID0+IGkubmFtZSkuam9pbignLCAnKTtcbiAgY29uc3QgaW52ZW50b3J5U2V0ID0gbmV3IFNldChcbiAgICB1c2VySW52ZW50b3J5LmZsYXRNYXAoaSA9PiBbXG4gICAgICBpLm5hbWUudG9Mb3dlckNhc2UoKSxcbiAgICAgIGkuY2Fub25pY2FsX25hbWU/LnRvTG93ZXJDYXNlKCkgfHwgaS5uYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgXSlcbiAgKTtcblxuICBjb25zdCBzeXN0ZW1Qcm9tcHQgPSBgWW91IGFyZSBhIGRldGFpbGVkIHJlY2lwZSB3cml0ZXIuIEdpdmVuIGEgcmVjaXBlIG5hbWUsIGRlc2NyaXB0aW9uLCBhbmQgYXZhaWxhYmxlIGluZ3JlZGllbnRzLCBleHBhbmQgaXQgaW50byBhIGZ1bGwgcmVjaXBlLlxuXG5DUklUSUNBTDogWW91IGNhbiBPTkxZIHVzZSB0aGVzZSBpbmdyZWRpZW50czpcbiR7aW52ZW50b3J5TmFtZXN9XG5cbkRvIE5PVCBhZGQgc2FsdCwgb2lsLCBidXR0ZXIsIHdhdGVyLCBzcGljZXMsIG9yIGFueSBpbmdyZWRpZW50cyBub3QgbGlzdGVkIGFib3ZlLlxuRXZlcnkgc2luZ2xlIGluZ3JlZGllbnQgaW4geW91ciByZWNpcGUgbXVzdCBiZSBmcm9tIHRoZSBsaXN0IGFib3ZlLlxuSWYgeW91IGNhbm5vdCBjcmVhdGUgYSB2YWxpZCByZWNpcGUgdXNpbmcgT05MWSB0aGVzZSBpbmdyZWRpZW50cywgc2F5IHNvLlxuXG5SZWNpcGU6ICR7cmVjaXBlTmFtZX1cbkRlc2NyaXB0aW9uOiAke3JlY2lwZURlc2NyaXB0aW9ufVxuXG5Gb3IgdGhlIHJlY2lwZSwgcHJvdmlkZTpcbjEuIG5hbWU6IFJlY2lwZSBuYW1lXG4yLiBkZXNjcmlwdGlvbjogVGhlIGRlc2NyaXB0aW9uIHByb3ZpZGVkXG4zLiB0aW1lX2VzdGltYXRlX21pbnM6IEVzdGltYXRlZCB0b3RhbCBjb29raW5nIHRpbWUgaW4gbWludXRlc1xuNC4gaW5ncmVkaWVudHM6IEZ1bGwgaW5ncmVkaWVudHMgbGlzdCB3aXRoIHF1YW50aXRpZXMgYW5kIHVuaXRzLiBFeGFtcGxlOlxuICAgW1xuICAgICB7XCJuYW1lXCI6IFwiY2hpY2tlblwiLCBcInF1YW50aXR5XCI6IDIsIFwidW5pdFwiOiBcInBpZWNlc1wifSxcbiAgICAge1wibmFtZVwiOiBcInRvbWF0b1wiLCBcInF1YW50aXR5XCI6IDMsIFwidW5pdFwiOiBcInBpZWNlc1wifVxuICAgXVxuNS4gaW5zdHJ1Y3Rpb25zOiBTdGVwLWJ5LXN0ZXAgY29va2luZyBpbnN0cnVjdGlvbnMgYXMgYW4gYXJyYXkgb2Ygc3RyaW5nc1xuXG5SZXR1cm4gT05MWSBhIEpTT04gb2JqZWN0LCBubyBvdGhlciB0ZXh0LiBFeGFtcGxlIGZvcm1hdDpcbntcbiAgXCJuYW1lXCI6IFwiVG9tYXRvIEJhc2lsIENoaWNrZW5cIixcbiAgXCJkZXNjcmlwdGlvblwiOiBcIlBhbi1zZWFyZWQgY2hpY2tlbiB3aXRoIGZyZXNoIHRvbWF0b2VzIGFuZCBiYXNpbC4gTGlnaHQgYW5kIGZyZXNoLlwiLFxuICBcInRpbWVfZXN0aW1hdGVfbWluc1wiOiAyNSxcbiAgXCJpbmdyZWRpZW50c1wiOiBbXG4gICAge1wibmFtZVwiOiBcImNoaWNrZW5cIiwgXCJxdWFudGl0eVwiOiAyLCBcInVuaXRcIjogXCJwaWVjZXNcIn0sXG4gICAge1wibmFtZVwiOiBcInRvbWF0b1wiLCBcInF1YW50aXR5XCI6IDMsIFwidW5pdFwiOiBcInBpZWNlc1wifSxcbiAgICB7XCJuYW1lXCI6IFwiYmFzaWxcIiwgXCJxdWFudGl0eVwiOiA1LCBcInVuaXRcIjogXCJsZWF2ZXNcIn1cbiAgXSxcbiAgXCJpbnN0cnVjdGlvbnNcIjogW1xuICAgIFwiSGVhdCBhIHBhbiBvdmVyIG1lZGl1bS1oaWdoIGhlYXRcIixcbiAgICBcIkFkZCBjaGlja2VuIGFuZCBjb29rIGZvciA1LTYgbWludXRlcyBwZXIgc2lkZVwiLFxuICAgIFwiRGljZSB0b21hdG9lcyBhbmQgYWRkIHRvIHBhblwiLFxuICAgIFwiVGVhciBiYXNpbCBhbmQgc3ByaW5rbGUgb3ZlclwiLFxuICAgIFwiU2ltbWVyIGZvciA1IG1pbnV0ZXNcIixcbiAgICBcIlNlcnZlXCJcbiAgXVxufWA7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsaWVudC5jaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgIG1heF90b2tlbnM6IDIwNDgsXG4gICAgICBtZXNzYWdlczogW1xuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgY29udGVudDogc3lzdGVtUHJvbXB0LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgIGNvbnRlbnQ6IGBFeHBhbmQgdGhpcyByZWNpcGUgaW50byBmdWxsIGRldGFpbHMgdXNpbmcgT05MWSBhdmFpbGFibGUgaW5ncmVkaWVudHM6XFxuTmFtZTogJHtyZWNpcGVOYW1lfVxcbkRlc2NyaXB0aW9uOiAke3JlY2lwZURlc2NyaXB0aW9ufWAsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbWVzc2FnZSA9IHJlc3BvbnNlLmNob2ljZXNbMF0ubWVzc2FnZTtcbiAgICBpZiAoIW1lc3NhZ2UuY29udGVudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFbXB0eSByZXNwb25zZSBmcm9tIE9wZW5BSScpO1xuICAgIH1cblxuICAgIGNvbnN0IGpzb25NYXRjaCA9IG1lc3NhZ2UuY29udGVudC5tYXRjaCgvXFx7W1xcc1xcU10qXFx9Lyk7XG4gICAgaWYgKCFqc29uTWF0Y2gpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGZpbmQgSlNPTiBvYmplY3QgaW4gcmVzcG9uc2UnKTtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25NYXRjaFswXSk7XG5cbiAgICAvLyBWYWxpZGF0ZSBhbGwgaW5ncmVkaWVudHMgaGF2ZSB1bml0c1xuICAgIHBhcnNlZC5pbmdyZWRpZW50cy5mb3JFYWNoKChpbmc6IGFueSkgPT4ge1xuICAgICAgaWYgKCFpbmcudW5pdCB8fCBpbmcudW5pdCA9PT0gJycgfHwgaW5nLnVuaXQgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBSZWNpcGUgaW5ncmVkaWVudCBcIiR7aW5nLm5hbWV9XCIgaXMgbWlzc2luZyBhIHVuaXQuIGAgK1xuICAgICAgICAgIGBBbGwgcmVjaXBlIGluZ3JlZGllbnRzIG11c3Qgc3BlY2lmeSB1bml0cyAoZS5nLiwgXCJnXCIsIFwibWxcIiwgXCJwaWVjZXNcIikuYFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gUE9TVC1WQUxJREFUSU9OOiBDaGVjayB0aGF0IGV2ZXJ5IGluZ3JlZGllbnQgaXMgaW4gdXNlcidzIGludmVudG9yeVxuICAgIGNvbnN0IGludmFsaWRJbmdyZWRpZW50czogc3RyaW5nW10gPSBbXTtcbiAgICBwYXJzZWQuaW5ncmVkaWVudHMuZm9yRWFjaCgoaW5nOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IGluZ05hbWUgPSBpbmcubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKCFpbnZlbnRvcnlTZXQuaGFzKGluZ05hbWUpKSB7XG4gICAgICAgIGludmFsaWRJbmdyZWRpZW50cy5wdXNoKGluZy5uYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChpbnZhbGlkSW5ncmVkaWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgUmVjaXBlIHN1Z2dlc3RzIHVuYXZhaWxhYmxlIGluZ3JlZGllbnRzOiAke2ludmFsaWRJbmdyZWRpZW50cy5qb2luKCcsICcpfS4gYCArXG4gICAgICAgIGBBdmFpbGFibGU6ICR7aW52ZW50b3J5TmFtZXN9YFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBOb3JtYWxpemUgaW5ncmVkaWVudCBxdWFudGl0aWVzIHRvIGNhbm9uaWNhbCB1bml0c1xuICAgIC8vIGUuZy4sIDEgY3VwIHJpY2UgXHUyMTkyIDEyNWcgcmljZSwgMjQwbWwgbWlsayBcdTIxOTIgMjQwbWwgbWlsa1xuICAgIHBhcnNlZC5pbmdyZWRpZW50cyA9IHBhcnNlZC5pbmdyZWRpZW50cy5tYXAoKGluZzogYW55KSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBjb252ZXJ0VG9DYW5vbmljYWwoaW5nLnF1YW50aXR5LCBpbmcudW5pdCwgaW5nLm5hbWUpO1xuICAgICAgLy8gQ2FjaGUgdGhlIGNhbm9uaWNhbCB1bml0IGZvciB0aGlzIGluZ3JlZGllbnQgZm9yIGZ1dHVyZSB1c2VcbiAgICAgIGNhY2hlQ2Fub25pY2FsVW5pdChpbmcubmFtZSwgcmVzdWx0LnVuaXQpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogaW5nLm5hbWUsXG4gICAgICAgIHF1YW50aXR5OiByZXN1bHQucXVhbnRpdHksXG4gICAgICAgIHVuaXQ6IHJlc3VsdC51bml0LFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHJldHVybiBwYXJzZWQ7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyByZWNpcGUgZGV0YWlsOicsIGVycm9yKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRmFpbGVkIHRvIGdlbmVyYXRlIHJlY2lwZSBkZXRhaWw6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWBcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogUmVjaXBlIGFkanVzdG1lbnQgdHlwZXMgZm9yIGNvbnZlcnNhdGlvbmFsIHJlY2lwZSBtb2RpZmljYXRpb24gKFRhc2sgNylcbiAqIEFsbG93cyB1c2VycyB0byBhZGp1c3QgcmVjaXBlcyBiZWZvcmUgY29va2luZ1xuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlY2lwZUFkanVzdG1lbnQge1xuICB0eXBlOiAncXVhbnRpdHknIHwgJ3JlbW92YWwnIHwgJ3N1YnN0aXR1dGlvbicgfCAndW5jZXJ0YWluJztcbiAgaW5ncmVkaWVudDogc3RyaW5nO1xuICBxdWFudGl0eT86IG51bWJlcjtcbiAgdW5pdD86IHN0cmluZztcbiAgc3Vic3RpdHV0ZV93aXRoPzogc3RyaW5nO1xuICByZWFzb24/OiBzdHJpbmc7XG4gIGNvbmZpZGVuY2U/OiAnZXhhY3QnIHwgJ2FwcHJveGltYXRlJztcbiAgYWRqdXN0bWVudF90eXBlPzogJ2ludmVudG9yeV9jb3JyZWN0aW9uJyB8ICdyZWNpcGVfY29uc3RyYWludCcgfCAnYm90aCc7XG59XG5cbi8qKlxuICogUGFyc2UgdXNlciBpbnB1dCBhYm91dCByZWNpcGUgYWRqdXN0bWVudHNcbiAqXG4gKiBDb252ZXJ0cyBuYXR1cmFsIGxhbmd1YWdlIGFkanVzdG1lbnRzIGludG8gc3RydWN0dXJlZCBkYXRhOlxuICogLSBRdWFudGl0eSBhZGp1c3RtZW50czogXCJJIG9ubHkgaGF2ZSAzMDBnIGZsb3VyXCJcbiAqIC0gUmVtb3ZhbHM6IFwiVGhlIG1pbGsgaXMgZ29uZSBvZmZcIlxuICogLSBTdWJzdGl0dXRpb25zOiBcIkNhbiBJIHVzZSBjb2QgaW5zdGVhZCBvZiBjaGlja2VuP1wiXG4gKiAtIE11bHRpcGxlIGF0IG9uY2U6IFwiMzAwZyBmbG91ciwgbWlsayBpcyBnb25lLCA2IGVnZ3NcIlxuICpcbiAqIEBwYXJhbSB1c2VySW5wdXQgLSBGcmVlLWZvcm0gdGV4dCBkZXNjcmliaW5nIGFkanVzdG1lbnRzXG4gKiBAcGFyYW0gcmVjaXBlQ29udGV4dCAtIEN1cnJlbnQgcmVjaXBlIGluZ3JlZGllbnRzIHRvIGNvbnRleHR1YWxpemUgYWRqdXN0bWVudHNcbiAqIEByZXR1cm5zIEFycmF5IG9mIFJlY2lwZUFkanVzdG1lbnQgb2JqZWN0c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VSZWNpcGVBZGp1c3RtZW50cyhcbiAgdXNlcklucHV0OiBzdHJpbmcsXG4gIHJlY2lwZUNvbnRleHQ6IHsgaW5ncmVkaWVudHM6IEFycmF5PHsgbmFtZTogc3RyaW5nOyBxdWFudGl0eTogbnVtYmVyOyB1bml0OiBzdHJpbmcgfT4gfVxuKTogUHJvbWlzZTxSZWNpcGVBZGp1c3RtZW50W10+IHtcbiAgLy8gSWYgdXNlciBpbnB1dCBpcyBqdXN0IGFmZmlybWF0aW9uIHdpdGggbm8gY2hhbmdlcywgcmV0dXJuIGVtcHR5IGFycmF5XG4gIGlmICgvXihsb29rcyBnb29kfHJlYWR5fG5vIGNoYW5nZXN8c291bmRzIGdvb2R8b2t8YWxsIHNldHxmaW5lfGdvb2QgdG8gZ28pJC9pLnRlc3QodXNlcklucHV0LnRyaW0oKSkpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBpZiAoIWhhc09wZW5BaUFwaUtleSgpKSB7XG4gICAgLy8gRmFsbGJhY2s6IHBhcnNlIGxvY2FsbHkgd2l0aG91dCBMTE1cbiAgICByZXR1cm4gcGFyc2VSZWNpcGVBZGp1c3RtZW50c0xvY2FsbHkodXNlcklucHV0LCByZWNpcGVDb250ZXh0KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgY2xpZW50ID0gZ2V0T3BlbkFJQ2xpZW50KCk7XG5cbiAgICBjb25zdCByZWNpcGVJbmdyZWRpZW50cyA9IHJlY2lwZUNvbnRleHQuaW5ncmVkaWVudHNcbiAgICAgIC5tYXAoKGluZykgPT4gYC0gJHtpbmcubmFtZX06ICR7aW5nLnF1YW50aXR5fSR7aW5nLnVuaXR9YClcbiAgICAgIC5qb2luKCdcXG4nKTtcblxuICAgIGNvbnN0IHN5c3RlbVByb21wdCA9IGBQYXJzZSB1c2VyIGlucHV0IGRlc2NyaWJpbmcgYWRqdXN0bWVudHMgdG8gYSByZWNpcGUuIFRoZSB1c2VyIGlzIGRlc2NyaWJpbmcgd2hhdCB0aGV5IGFjdHVhbGx5IGhhdmUgb3Igd2FudCB0byBjaGFuZ2UgYWJvdXQgdGhlIHJlY2lwZSBpbmdyZWRpZW50cy5cblxuUmVjaXBlIGluZ3JlZGllbnRzIGJlaW5nIGFkanVzdGVkOlxuJHtyZWNpcGVJbmdyZWRpZW50c31cblxuRm9yIGVhY2ggYWRqdXN0bWVudCBtZW50aW9uZWQgaW4gdXNlciBpbnB1dCwgcmV0dXJuOlxuLSB0eXBlOiAncXVhbnRpdHknICh1c2VyIHNwZWNpZmllcyBob3cgbXVjaCB0aGV5IGhhdmUpLCAncmVtb3ZhbCcgKGluZ3JlZGllbnQgbm90IGF2YWlsYWJsZSksICdzdWJzdGl0dXRpb24nICh1c2UgZGlmZmVyZW50IGluZ3JlZGllbnQpLCAndW5jZXJ0YWluJyAoY2FuJ3QgcGFyc2UpXG4tIGluZ3JlZGllbnQ6IHdoaWNoIHJlY2lwZSBpbmdyZWRpZW50IHRoZXkncmUgYWRqdXN0aW5nIChtYXRjaCBhZ2FpbnN0IHJlY2lwZSBpbmdyZWRpZW50cyBhYm92ZSlcbi0gcXVhbnRpdHkvdW5pdDogaWYgcXVhbnRpdHkgYWRqdXN0bWVudCAoZS5nLiBcIjMwMGcgZmxvdXJcIilcbi0gc3Vic3RpdHV0ZV93aXRoOiBpZiBzdWJzdGl0dXRpb24gKGUuZy4gXCJjb2RcIiB3aGVuIHJlcGxhY2luZyBjaGlja2VuKVxuLSBjb25maWRlbmNlOiAnZXhhY3QnIGlmIHVzZXIgc3BlY2lmaWVkIHByZWNpc2UgYW1vdW50LCAnYXBwcm94aW1hdGUnIGlmIHZhZ3VlIChcImFib3V0XCIsIFwiYXJvdW5kXCIsIFwic29tZVwiKVxuLSByZWFzb246IGlmIHJlbW92YWwgKGUuZy4gXCJnb25lIG9mZlwiLCBcInJhbiBvdXRcIiwgXCJkb24ndCBoYXZlXCIpXG4tIGFkanVzdG1lbnRfdHlwZSAoUVVBTlRJVFkgT05MWSk6IEluZmVyIHdoZXRoZXIgdXNlciBtZWFuczpcbiAgKiAnaW52ZW50b3J5X2NvcnJlY3Rpb24nOiBcIkkgb25seSBoYXZlIFhcIiAoaW52ZW50b3J5IHdhcyB3cm9uZywgbmVlZHMgdXBkYXRpbmcpXG4gICogJ3JlY2lwZV9jb25zdHJhaW50JzogXCJJIG9ubHkgd2FudCB0byB1c2UgWFwiIChyZWNpcGUgYWRqdXN0bWVudCBvbmx5LCBkb24ndCB1cGRhdGUgaW52ZW50b3J5KVxuICAqICdib3RoJzogXCJJIGhhdmUgZXhhY3RseSBYIGFuZCB1c2luZyBpdCBhbGxcIiAodXBkYXRlIGludmVudG9yeSBBTkQgcmVjaXBlKVxuXG5FeGFtcGxlczpcblwiSSBvbmx5IGhhdmUgMzAwZyBmbG91clwiIFx1MjE5MiB7IHR5cGU6ICdxdWFudGl0eScsIGluZ3JlZGllbnQ6ICdmbG91cicsIHF1YW50aXR5OiAzMDAsIHVuaXQ6ICdnJywgY29uZmlkZW5jZTogJ2V4YWN0JywgYWRqdXN0bWVudF90eXBlOiAnaW52ZW50b3J5X2NvcnJlY3Rpb24nIH1cblwibWlsayBpcyBnb25lIG9mZlwiIFx1MjE5MiB7IHR5cGU6ICdyZW1vdmFsJywgaW5ncmVkaWVudDogJ21pbGsnLCByZWFzb246ICdnb25lX29mZicgfVxuXCJ1c2UgY29kIGluc3RlYWQgb2YgY2hpY2tlblwiIFx1MjE5MiB7IHR5cGU6ICdzdWJzdGl0dXRpb24nLCBpbmdyZWRpZW50OiAnY2hpY2tlbicsIHN1YnN0aXR1dGVfd2l0aDogJ2NvZCcsIGNvbmZpZGVuY2U6ICdleGFjdCcgfVxuXCJhYm91dCA2IGVnZ3NcIiBcdTIxOTIgeyB0eXBlOiAncXVhbnRpdHknLCBpbmdyZWRpZW50OiAnZWdncycsIHF1YW50aXR5OiA2LCB1bml0OiAncGllY2VzJywgY29uZmlkZW5jZTogJ2FwcHJveGltYXRlJywgYWRqdXN0bWVudF90eXBlOiAncmVjaXBlX2NvbnN0cmFpbnQnIH1cblwibG9va3MgZ29vZFwiIFx1MjE5MiB7fSAobm8gYWRqdXN0bWVudHMgLSByZXR1cm4gZW1wdHkgYXJyYXkgaW4gcmVzcG9uc2UpXG5cblJldHVybiBPTkxZIHZhbGlkIEpTT04gYXJyYXkgb2YgYWRqdXN0bWVudCBvYmplY3RzLiBJZiBubyBhZGp1c3RtZW50cywgcmV0dXJuIGVtcHR5IGFycmF5IFtdLlxuTmV2ZXIgcmV0dXJuIEpTT04gd2l0aCBleHRyYSB0ZXh0IG9yIG1hcmtkb3duLmA7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsaWVudC5jaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgIG1heF90b2tlbnM6IDUxMixcbiAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICBjb250ZW50OiBzeXN0ZW1Qcm9tcHQsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgY29udGVudDogdXNlcklucHV0LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNvbnRlbnQgPSByZXNwb25zZS5jaG9pY2VzWzBdLm1lc3NhZ2UuY29udGVudDtcbiAgICBpZiAoIWNvbnRlbnQgfHwgdHlwZW9mIGNvbnRlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgcmVzcG9uc2UgdHlwZSBmcm9tIExMTScpO1xuICAgIH1cblxuICAgIC8vIEV4dHJhY3QgSlNPTiBhcnJheSBmcm9tIHJlc3BvbnNlXG4gICAgY29uc3QganNvbk1hdGNoID0gY29udGVudC5tYXRjaCgvXFxbW1xcc1xcU10qXFxdLyk7XG4gICAgaWYgKCFqc29uTWF0Y2gpIHtcbiAgICAgIC8vIElmIG5vIEpTT04gZm91bmQsIGFzc3VtZSBubyBhZGp1c3RtZW50c1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvbk1hdGNoWzBdKTtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShwYXJzZWQpID8gcGFyc2VkIDogW107XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgcGFyc2luZyByZWNpcGUgYWRqdXN0bWVudHM6JywgZXJyb3IpO1xuICAgIC8vIE9uIGVycm9yLCB0cnkgbG9jYWwgcGFyc2luZyBhcyBmYWxsYmFja1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gcGFyc2VSZWNpcGVBZGp1c3RtZW50c0xvY2FsbHkodXNlcklucHV0LCByZWNpcGVDb250ZXh0KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIElmIGJvdGggZmFpbCwgcmV0dXJuIGVtcHR5IGFycmF5IChzYWZlIGRlZmF1bHQpXG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTG9jYWwgZmFsbGJhY2sgZm9yIHJlY2lwZSBhZGp1c3RtZW50IHBhcnNpbmcgKG5vIExMTSByZXF1aXJlZClcbiAqIFVzZXMgcmVnZXggcGF0dGVybnMgdG8gZGV0ZWN0IGFkanVzdG1lbnRzXG4gKi9cbmZ1bmN0aW9uIHBhcnNlUmVjaXBlQWRqdXN0bWVudHNMb2NhbGx5KFxuICB1c2VySW5wdXQ6IHN0cmluZyxcbiAgcmVjaXBlQ29udGV4dDogeyBpbmdyZWRpZW50czogQXJyYXk8eyBuYW1lOiBzdHJpbmc7IHF1YW50aXR5OiBudW1iZXI7IHVuaXQ6IHN0cmluZyB9PiB9XG4pOiBSZWNpcGVBZGp1c3RtZW50W10ge1xuICBjb25zdCBhZGp1c3RtZW50czogUmVjaXBlQWRqdXN0bWVudFtdID0gW107XG4gIGNvbnN0IGlucHV0ID0gdXNlcklucHV0LnRvTG93ZXJDYXNlKCk7XG5cbiAgLy8gQnVpbGQgYSBzZXQgb2YgaW5ncmVkaWVudCBuYW1lcyBmb3IgbWF0Y2hpbmdcbiAgY29uc3QgaW5ncmVkaWVudE1hcCA9IG5ldyBNYXAoXG4gICAgcmVjaXBlQ29udGV4dC5pbmdyZWRpZW50cy5tYXAoKGluZykgPT4gW2luZy5uYW1lLnRvTG93ZXJDYXNlKCksIGluZ10pXG4gICk7XG5cbiAgLy8gTWF0Y2ggcXVhbnRpdHkgYWRqdXN0bWVudHM6IFwiWCB1bml0IGluZ3JlZGllbnRcIlxuICAvLyBFeGFtcGxlczogXCIzMDBnIGZsb3VyXCIsIFwiNiBlZ2dzXCIsIFwiMSBjdXAgbWlsa1wiXG4gIGNvbnN0IHF0eVBhdHRlcm4gPSAvKFxcZCsoPzpcXC5cXGQrKT8pXFxzKihnfG1sfGN1cHM/fHRic3B8dHNwfHBpZWNlcz98Y2xvdmVzPyk/KD86XFxzK29mKT9cXHMrKFxcdyspL2dpO1xuICBsZXQgbWF0Y2g7XG4gIHdoaWxlICgobWF0Y2ggPSBxdHlQYXR0ZXJuLmV4ZWMoaW5wdXQpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHF1YW50aXR5ID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gICAgY29uc3QgdW5pdCA9IG1hdGNoWzJdIHx8ICdwaWVjZXMnO1xuICAgIGNvbnN0IGluZ3JlZGllbnQgPSBtYXRjaFszXTtcblxuICAgIC8vIEZpbmQgbWF0Y2hpbmcgaW5ncmVkaWVudCBpbiByZWNpcGVcbiAgICBmb3IgKGNvbnN0IFtpbmdLZXksIGluZ1ZhbHVlXSBvZiBpbmdyZWRpZW50TWFwKSB7XG4gICAgICBpZiAoaW5nS2V5LmluY2x1ZGVzKGluZ3JlZGllbnQpIHx8IGluZ3JlZGllbnQuaW5jbHVkZXMoaW5nS2V5LnNwbGl0KCdfJylbMF0pKSB7XG4gICAgICAgIC8vIEluZmVyIGFkanVzdG1lbnRfdHlwZSBmcm9tIGNvbnRleHRcbiAgICAgICAgbGV0IGFkanVzdG1lbnRUeXBlOiAnaW52ZW50b3J5X2NvcnJlY3Rpb24nIHwgJ3JlY2lwZV9jb25zdHJhaW50JyB8ICdib3RoJyA9ICdyZWNpcGVfY29uc3RyYWludCc7XG4gICAgICAgIGlmICgvXihpIG9ubHkgaGF2ZXxvbmx5IGhhdmV8aSBoYXZlKS8udGVzdCh1c2VySW5wdXQudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgICAgICBhZGp1c3RtZW50VHlwZSA9ICdpbnZlbnRvcnlfY29ycmVjdGlvbic7XG4gICAgICAgIH0gZWxzZSBpZiAoL1xcKGhhdmUgZXhhY3RseXx1c2luZyBhbGx8dXNpbmcgaXQgYWxsXFwpLy50ZXN0KHVzZXJJbnB1dC50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgIGFkanVzdG1lbnRUeXBlID0gJ2JvdGgnO1xuICAgICAgICB9XG5cbiAgICAgICAgYWRqdXN0bWVudHMucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ3F1YW50aXR5JyxcbiAgICAgICAgICBpbmdyZWRpZW50OiBpbmdWYWx1ZS5uYW1lLFxuICAgICAgICAgIHF1YW50aXR5LFxuICAgICAgICAgIHVuaXQsXG4gICAgICAgICAgY29uZmlkZW5jZTogJ2V4YWN0JyxcbiAgICAgICAgICBhZGp1c3RtZW50X3R5cGU6IGFkanVzdG1lbnRUeXBlLFxuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gTWF0Y2ggcmVtb3ZhbHM6IFwiZ29uZVwiLCBcInJhbiBvdXRcIiwgXCJkb24ndCBoYXZlXCJcbiAgaW5ncmVkaWVudE1hcC5mb3JFYWNoKChpbmcpID0+IHtcbiAgICBjb25zdCBpbmdQYXR0ZXJuID0gbmV3IFJlZ0V4cChgKCR7aW5nLm5hbWV9fCR7aW5nLm5hbWUuc3BsaXQoJyAnKVswXX0pLio/KGdvbmV8cmFuIG91dHxkb24ndCBoYXZlfGRvIG5vdCBoYXZlfG1pc3Npbmd8bm8gbG9uZ2VyKWAsICdpJyk7XG4gICAgaWYgKGluZ1BhdHRlcm4udGVzdCh1c2VySW5wdXQpKSB7XG4gICAgICAvLyBPbmx5IGFkZCBpZiBub3QgYWxyZWFkeSBhZGRlZCBhcyBxdWFudGl0eSBhZGp1c3RtZW50XG4gICAgICBpZiAoIWFkanVzdG1lbnRzLnNvbWUoKGFkaikgPT4gYWRqLmluZ3JlZGllbnQgPT09IGluZy5uYW1lICYmIGFkai50eXBlID09PSAncXVhbnRpdHknKSkge1xuICAgICAgICBhZGp1c3RtZW50cy5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAncmVtb3ZhbCcsXG4gICAgICAgICAgaW5ncmVkaWVudDogaW5nLm5hbWUsXG4gICAgICAgICAgcmVhc29uOiAnZ29uZV9vZmYnLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIC8vIE1hdGNoIHN1YnN0aXR1dGlvbnM6IFwidXNlIFggaW5zdGVhZCBvZiBZXCJcbiAgY29uc3Qgc3Vic3RQYXR0ZXJuID0gL3VzZVxccysoXFx3KylcXHMraW5zdGVhZCBvZlxccysoXFx3KykvaTtcbiAgaWYgKChtYXRjaCA9IHN1YnN0UGF0dGVybi5leGVjKHVzZXJJbnB1dCkpICE9PSBudWxsKSB7XG4gICAgY29uc3Qgc3Vic3RpdHV0aW9uID0gbWF0Y2hbMV07XG4gICAgY29uc3Qgb3JpZ2luYWwgPSBtYXRjaFsyXTtcblxuICAgIC8vIEZpbmQgbWF0Y2hpbmcgaW5ncmVkaWVudCBpbiByZWNpcGVcbiAgICBmb3IgKGNvbnN0IFtpbmdLZXksIGluZ1ZhbHVlXSBvZiBpbmdyZWRpZW50TWFwKSB7XG4gICAgICBpZiAoaW5nS2V5LmluY2x1ZGVzKG9yaWdpbmFsLnRvTG93ZXJDYXNlKCkpIHx8IG9yaWdpbmFsLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoaW5nS2V5LnNwbGl0KCdfJylbMF0pKSB7XG4gICAgICAgIGFkanVzdG1lbnRzLnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdzdWJzdGl0dXRpb24nLFxuICAgICAgICAgIGluZ3JlZGllbnQ6IGluZ1ZhbHVlLm5hbWUsXG4gICAgICAgICAgc3Vic3RpdHV0ZV93aXRoOiBzdWJzdGl0dXRpb24sXG4gICAgICAgICAgY29uZmlkZW5jZTogJ2V4YWN0JyxcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhZGp1c3RtZW50cztcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgYW4gaW5ncmVkaWVudCBpcyBjcml0aWNhbCB0byBhIHJlY2lwZVxuICogQ3JpdGljYWwgPSBtYWluIHByb3RlaW4vY2FyYi9mYXQsIG5vdCBqdXN0IHNlYXNvbmluZ1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaXNJbmdyZWRpZW50Q3JpdGljYWwoXG4gIGluZ3JlZGllbnROYW1lOiBzdHJpbmcsXG4gIHJlY2lwZTogeyBuYW1lOiBzdHJpbmc7IGRlc2NyaXB0aW9uOiBzdHJpbmc7IGluZ3JlZGllbnRzOiBBcnJheTx7IG5hbWU6IHN0cmluZzsgcXVhbnRpdHk6IG51bWJlcjsgdW5pdDogc3RyaW5nIH0+IH1cbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBpZiAoIWhhc09wZW5BaUFwaUtleSgpKSB7XG4gICAgLy8gTG9jYWwgZmFsbGJhY2s6IGNoZWNrIGlmIGluZ3JlZGllbnQgaXMgaW4gZmlyc3QgaGFsZiBvZiBpbmdyZWRpZW50cyAodXN1YWxseSB0aGUgbWFpbiBvbmVzKVxuICAgIGNvbnN0IG1haW5JbmdyZWRpZW50cyA9IHJlY2lwZS5pbmdyZWRpZW50cy5zbGljZSgwLCBNYXRoLmNlaWwocmVjaXBlLmluZ3JlZGllbnRzLmxlbmd0aCAvIDIpKTtcbiAgICByZXR1cm4gbWFpbkluZ3JlZGllbnRzLnNvbWUoaW5nID0+IGluZy5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IGluZ3JlZGllbnROYW1lLnRvTG93ZXJDYXNlKCkpO1xuICB9XG5cbiAgY29uc3QgY2xpZW50ID0gZ2V0T3BlbkFJQ2xpZW50KCk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsaWVudC5jaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICBtb2RlbDogJ2dwdC00by1taW5pJyxcbiAgICAgIG1heF90b2tlbnM6IDEwMCxcbiAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiAnc3lzdGVtJyxcbiAgICAgICAgICBjb250ZW50OiBgWW91IGFyZSBhIGN1bGluYXJ5IGV4cGVydC4gRGV0ZXJtaW5lIGlmIGFuIGluZ3JlZGllbnQgaXMgY3JpdGljYWwgdG8gYSByZWNpcGUuXG5cbkNyaXRpY2FsIGluZ3JlZGllbnRzID0gbWFpbiBwcm90ZWluLCBjYXJiLCBvciBmYXQgdGhhdCB0aGUgcmVjaXBlIGRlcGVuZHMgb25cbk5vbi1jcml0aWNhbCA9IHNlYXNvbmluZ3MsIGdhcm5pc2hlcywgZmxhdm9yIGFkZGl0aW9ucyB0aGF0IGNhbiBiZSBzdWJzdGl0dXRlZCBvciBvbWl0dGVkXG5cblJlcGx5IHdpdGggT05MWSBcInllc1wiIG9yIFwibm9cIi5gXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgY29udGVudDogYFJlY2lwZTogJHtyZWNpcGUubmFtZX0gLSAke3JlY2lwZS5kZXNjcmlwdGlvbn1cbkluZ3JlZGllbnRzOiAke3JlY2lwZS5pbmdyZWRpZW50cy5tYXAoaSA9PiBgJHtpLm5hbWV9YCkuam9pbignLCAnKX1cblxuSXMgXCIke2luZ3JlZGllbnROYW1lfVwiIGNyaXRpY2FsIHRvIHRoaXMgcmVjaXBlP2BcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgY29uc3QgYW5zd2VyID0gcmVzcG9uc2UuY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQ/LnRvTG93ZXJDYXNlKCkudHJpbSgpID8/ICdubyc7XG4gICAgcmV0dXJuIGFuc3dlci5pbmNsdWRlcygneWVzJyk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgY2hlY2tpbmcgY3JpdGljYWwgaW5ncmVkaWVudDonLCBlcnJvcik7XG4gICAgLy8gRmFsbGJhY2s6IGFzc3VtZSBtYWluIGluZ3JlZGllbnRzIChmaXJzdCBoYWxmKSBhcmUgY3JpdGljYWxcbiAgICBjb25zdCBtYWluSW5ncmVkaWVudHMgPSByZWNpcGUuaW5ncmVkaWVudHMuc2xpY2UoMCwgTWF0aC5jZWlsKHJlY2lwZS5pbmdyZWRpZW50cy5sZW5ndGggLyAyKSk7XG4gICAgcmV0dXJuIG1haW5JbmdyZWRpZW50cy5zb21lKGluZyA9PiBpbmcubmFtZS50b0xvd2VyQ2FzZSgpID09PSBpbmdyZWRpZW50TmFtZS50b0xvd2VyQ2FzZSgpKTtcbiAgfVxufVxuIiwgIi8qKlxuICogUG9ja2V0QmFzZSBkYXRhYmFzZSBoZWxwZXIgZnVuY3Rpb25zXG4gKiBIYW5kbGVzIGFsbCBkYXRhYmFzZSBvcGVyYXRpb25zIGZvciBpbnZlbnRvcnkgYW5kIGNoYXQgaGlzdG9yeVxuICogVXNlcyBQb2NrZXRCYXNlIFJFU1QgQVBJIGluc3RlYWQgb2YgU3VwYWJhc2UgU0RLXG4gKi9cblxuaW1wb3J0IHsgSW52ZW50b3J5SXRlbSwgQ2hhdE1lc3NhZ2UgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuaW1wb3J0IHsgY29udmVydFRvQ2Fub25pY2FsIH0gZnJvbSAnLi91bml0cyc7XG5cbi8qKlxuICogR2V0IFBvY2tldEJhc2UgVVJMIGZyb20gZW52aXJvbm1lbnRcbiAqIE11c3QgYmUgc2V0IHRvIGxvY2FsIChodHRwOi8vbG9jYWxob3N0OjgwOTApIG9yIGRlcGxveW1lbnQgVVJMXG4gKi9cbmZ1bmN0aW9uIGdldFBvY2tldEJhc2VVcmwoKTogc3RyaW5nIHtcbiAgY29uc3QgdXJsID0gcHJvY2Vzcy5lbnYuUE9DS0VUQkFTRV9VUkw7XG4gIGlmICghdXJsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQT0NLRVRCQVNFX1VSTCBtdXN0IGJlIHNldCBpbiBlbnZpcm9ubWVudCcpO1xuICB9XG4gIHJldHVybiB1cmwucmVwbGFjZSgvXFwvJC8sICcnKTsgLy8gUmVtb3ZlIHRyYWlsaW5nIHNsYXNoIGlmIHByZXNlbnRcbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gbWFrZSBhdXRoZW50aWNhdGVkIGZldGNoIHJlcXVlc3RzIHRvIFBvY2tldEJhc2UgQVBJXG4gKiBQb2NrZXRCYXNlIFJFU1QgQVBJIGJhc2U6IC9hcGkvY29sbGVjdGlvbnMve2NvbGxlY3Rpb259L3JlY29yZHNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcG9ja2V0YmFzZUZldGNoKFxuICBwYXRoOiBzdHJpbmcsXG4gIG9wdGlvbnM6IFJlcXVlc3RJbml0ICYgeyBtZXRob2Q/OiBzdHJpbmcgfSA9IHt9XG4pOiBQcm9taXNlPGFueT4ge1xuICBjb25zdCB1cmwgPSBgJHtnZXRQb2NrZXRCYXNlVXJsKCl9L2FwaSR7cGF0aH1gO1xuICBjb25zdCBtZXRob2QgPSBvcHRpb25zLm1ldGhvZCB8fCAnR0VUJztcblxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgbWV0aG9kLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAuLi5vcHRpb25zLmhlYWRlcnMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgY29uc3QgZXJyb3JEYXRhID0gKGF3YWl0IHJlc3BvbnNlLmpzb24oKS5jYXRjaCgoKSA9PiAoe30pKSkgYXMgYW55O1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgUG9ja2V0QmFzZSByZXF1ZXN0IGZhaWxlZCAoJHtyZXNwb25zZS5zdGF0dXN9KTogJHtcbiAgICAgICAgICBlcnJvckRhdGEubWVzc2FnZSB8fCByZXNwb25zZS5zdGF0dXNUZXh0XG4gICAgICAgIH1gXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoYFBvY2tldEJhc2UgcmVxdWVzdCBmYWlsZWQ6ICR7U3RyaW5nKGVycm9yKX1gKTtcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgdXNlciBJRCBmcm9tIGVudmlyb25tZW50XG4gKiBGb3IgTVZQLCB3ZSB1c2UgYSBoYXJkY29kZWQgdXNlciBJRDsgbGF0ZXIgdGhpcyB3aWxsIGNvbWUgZnJvbSBKV1RcbiAqL1xuZnVuY3Rpb24gZ2V0VXNlcklkKCk6IHN0cmluZyB7XG4gIGNvbnN0IHVzZXJJZCA9IHByb2Nlc3MuZW52LlVTRVJfSUQ7XG4gIGlmICghdXNlcklkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVU0VSX0lEIG11c3QgYmUgc2V0IGluIGVudmlyb25tZW50Jyk7XG4gIH1cbiAgcmV0dXJuIHVzZXJJZDtcbn1cblxuLyoqXG4gKiBGZXRjaCBhbGwgYWN0aXZlIGludmVudG9yeSBpdGVtcyBmb3IgdGhlIGN1cnJlbnQgdXNlclxuICogUmV0dXJucyBpdGVtcyB3aGVyZSBkYXRlX3VzZWQgSVMgTlVMTCAobm90IHlldCBjb25zdW1lZClcbiAqIFBvY2tldEJhc2UgZmlsdGVyIHN5bnRheDogP2ZpbHRlcj0oZmllbGQ9XCJ2YWx1ZVwiJiZmaWVsZDI9bnVsbClcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEludmVudG9yeSgpOiBQcm9taXNlPEludmVudG9yeUl0ZW1bXT4ge1xuICBjb25zdCB1c2VySWQgPSBnZXRVc2VySWQoKTtcblxuICAvLyBQb2NrZXRCYXNlIGZpbHRlcjogdXNlcl9pZCBtYXRjaGVzIEFORCBkYXRlX3VzZWQgaXMgbnVsbFxuICAvLyBTb3J0IGJ5IGRhdGVfYWRkZWQgZGVzY2VuZGluZyAobW9zdCByZWNlbnQgZmlyc3QpXG4gIGNvbnN0IGZpbHRlciA9IGVuY29kZVVSSUNvbXBvbmVudChgKHVzZXJfaWQ9XCIke3VzZXJJZH1cIiYmZGF0ZV91c2VkPW51bGwpYCk7XG4gIGNvbnN0IHNvcnQgPSBlbmNvZGVVUklDb21wb25lbnQoJy1kYXRlX2FkZGVkJyk7XG5cbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgYC9jb2xsZWN0aW9ucy9pbnZlbnRvcnlfaXRlbXMvcmVjb3Jkcz9maWx0ZXI9JHtmaWx0ZXJ9JnNvcnQ9JHtzb3J0fWBcbiAgKTtcblxuICAvLyBQb2NrZXRCYXNlIHJldHVybnMgeyBpdGVtczogWy4uLl0gfSBvciBqdXN0IGFycmF5IGRlcGVuZGluZyBvbiB2ZXJzaW9uXG4gIGNvbnN0IGl0ZW1zID0gcmVzcG9uc2UuaXRlbXMgfHwgKEFycmF5LmlzQXJyYXkocmVzcG9uc2UpID8gcmVzcG9uc2UgOiBbXSk7XG4gIHJldHVybiBpdGVtcyBhcyBJbnZlbnRvcnlJdGVtW107XG59XG5cbi8qKlxuICogQWRkIGEgc2luZ2xlIGludmVudG9yeSBpdGVtIHdpdGggbWVyZ2Utb24tYWRkIGRlZHVwbGljYXRpb25cbiAqIElmIGFuIGl0ZW0gd2l0aCB0aGUgc2FtZSBjYW5vbmljYWxfbmFtZSBleGlzdHMsIG1lcmdlIGJ5IHVwZGF0aW5nIHF1YW50aXR5XG4gKiBPdGhlcndpc2UsIGNyZWF0ZSBuZXcgaXRlbVxuICogUmV0dXJucyB0aGUgaXRlbSAoZWl0aGVyIG5ld2x5IGNyZWF0ZWQgb3IgdXBkYXRlZCB2aWEgbWVyZ2UpXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRJbnZlbnRvcnlJdGVtKFxuICBpdGVtOiBPbWl0PEludmVudG9yeUl0ZW0sICdpZCcgfCAndXNlcl9pZCcgfCAnZGF0ZV9hZGRlZCcgfCAnZGF0ZV91c2VkJz5cbik6IFByb21pc2U8SW52ZW50b3J5SXRlbT4ge1xuICBjb25zdCB1c2VySWQgPSBnZXRVc2VySWQoKTtcbiAgY29uc3QgeyBnZXRDYW5vbmljYWxOYW1lIH0gPSBhd2FpdCBpbXBvcnQoJy4vY2Fub25pY2FsLWZvb2RzJyk7XG5cbiAgY29uc3QgY2Fub25pY2FsTmFtZSA9IGl0ZW0uY2Fub25pY2FsX25hbWUgfHwgZ2V0Q2Fub25pY2FsTmFtZShpdGVtLm5hbWUpO1xuXG4gIC8vIENoZWNrIGlmIGl0ZW0gd2l0aCBzYW1lIGNhbm9uaWNhbF9uYW1lIGFscmVhZHkgZXhpc3RzIGZvciB0aGlzIHVzZXJcbiAgLy8gUG9ja2V0QmFzZSBmaWx0ZXI6IHVzZXJfaWQgbWF0Y2hlcyBBTkQgY2Fub25pY2FsX25hbWUgbWF0Y2hlcyBBTkQgZGF0ZV91c2VkIGlzIG51bGxcbiAgY29uc3QgZmlsdGVyID0gZW5jb2RlVVJJQ29tcG9uZW50KFxuICAgIGAodXNlcl9pZD1cIiR7dXNlcklkfVwiJiZjYW5vbmljYWxfbmFtZT1cIiR7Y2Fub25pY2FsTmFtZX1cIiYmZGF0ZV91c2VkPW51bGwpYFxuICApO1xuXG4gIGNvbnN0IGV4aXN0aW5nUmVzcG9uc2UgPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgYC9jb2xsZWN0aW9ucy9pbnZlbnRvcnlfaXRlbXMvcmVjb3Jkcz9maWx0ZXI9JHtmaWx0ZXJ9JmxpbWl0PTFgXG4gICk7XG5cbiAgY29uc3QgZXhpc3RpbmdJdGVtcyA9IGV4aXN0aW5nUmVzcG9uc2UuaXRlbXMgfHwgKEFycmF5LmlzQXJyYXkoZXhpc3RpbmdSZXNwb25zZSkgPyBleGlzdGluZ1Jlc3BvbnNlIDogW10pO1xuICBjb25zdCBleGlzdGluZyA9IGV4aXN0aW5nSXRlbXNbMF07XG5cbiAgaWYgKGV4aXN0aW5nKSB7XG4gICAgLy8gTWVyZ2U6IHVwZGF0ZSBxdWFudGl0eSBhbmQgdW5pdCwga2VlcCBtb3N0IHJlY2VudCBuYW1lXG4gICAgLy8gUG9ja2V0QmFzZSBQQVRDSDogL2FwaS9jb2xsZWN0aW9ucy97Y29sbGVjdGlvbn0vcmVjb3Jkcy97aWR9XG4gICAgY29uc3QgdXBkYXRlZEl0ZW0gPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgICBgL2NvbGxlY3Rpb25zL2ludmVudG9yeV9pdGVtcy9yZWNvcmRzLyR7ZXhpc3RpbmcuaWR9YCxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgbmFtZTogaXRlbS5uYW1lIHx8IGV4aXN0aW5nLm5hbWUsXG4gICAgICAgICAgcXVhbnRpdHlfYXBwcm94OlxuICAgICAgICAgICAgaXRlbS5xdWFudGl0eV9hcHByb3ggIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICA/IGl0ZW0ucXVhbnRpdHlfYXBwcm94XG4gICAgICAgICAgICAgIDogZXhpc3RpbmcucXVhbnRpdHlfYXBwcm94LFxuICAgICAgICAgIHVuaXQ6IGl0ZW0udW5pdCB8fCBleGlzdGluZy51bml0LFxuICAgICAgICAgIGNvbmZpZGVuY2U6IGl0ZW0uY29uZmlkZW5jZSB8fCBleGlzdGluZy5jb25maWRlbmNlLFxuICAgICAgICAgIGhhc19pdGVtOlxuICAgICAgICAgICAgaXRlbS5oYXNfaXRlbSAhPT0gdW5kZWZpbmVkID8gaXRlbS5oYXNfaXRlbSA6IGV4aXN0aW5nLmhhc19pdGVtLFxuICAgICAgICAgIGRhdGVfYWRkZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfSksXG4gICAgICB9XG4gICAgKTtcblxuICAgIHJldHVybiB1cGRhdGVkSXRlbSBhcyBJbnZlbnRvcnlJdGVtO1xuICB9XG5cbiAgLy8gTm8gZXhpc3RpbmcgaXRlbTogY3JlYXRlIG5ld1xuICAvLyBQb2NrZXRCYXNlIFBPU1Q6IC9hcGkvY29sbGVjdGlvbnMve2NvbGxlY3Rpb259L3JlY29yZHNcbiAgY29uc3QgbmV3SXRlbSA9IGF3YWl0IHBvY2tldGJhc2VGZXRjaChcbiAgICBgL2NvbGxlY3Rpb25zL2ludmVudG9yeV9pdGVtcy9yZWNvcmRzYCxcbiAgICB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgdXNlcl9pZDogdXNlcklkLFxuICAgICAgICBuYW1lOiBpdGVtLm5hbWUsXG4gICAgICAgIGNhbm9uaWNhbF9uYW1lOiBjYW5vbmljYWxOYW1lLFxuICAgICAgICBoYXNfaXRlbTogaXRlbS5oYXNfaXRlbSB8fCBmYWxzZSxcbiAgICAgICAgcXVhbnRpdHlfYXBwcm94OiBpdGVtLnF1YW50aXR5X2FwcHJveCB8fCBudWxsLFxuICAgICAgICB1bml0OiBpdGVtLnVuaXQgfHwgbnVsbCxcbiAgICAgICAgY29uZmlkZW5jZTogaXRlbS5jb25maWRlbmNlIHx8ICdhcHByb3hpbWF0ZScsXG4gICAgICB9KSxcbiAgICB9XG4gICk7XG5cbiAgcmV0dXJuIG5ld0l0ZW0gYXMgSW52ZW50b3J5SXRlbTtcbn1cblxuLyoqXG4gKiBNYXJrIGFsbCBhY3RpdmUgaW52ZW50b3J5IGl0ZW1zIGFzIHVzZWQgZm9yIHRoZSBjdXJyZW50IHVzZXIuXG4gKiBUaGlzIGlzIGNvbXBhdGlibGUgd2l0aCB0aGUgY3VycmVudCBQb2NrZXRCYXNlIHBlcm1pc3Npb25zIGFuZFxuICogY2xlYXJzIHRoZSBhY3RpdmUgaW52ZW50b3J5IGxpc3QgZm9yIGxvY2FsIHRlc3RpbmcuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhckludmVudG9yeSgpOiBQcm9taXNlPG51bWJlcj4ge1xuICBjb25zdCBpdGVtcyA9IGF3YWl0IGdldEludmVudG9yeSgpO1xuXG4gIGF3YWl0IFByb21pc2UuYWxsKFxuICAgIGl0ZW1zLm1hcCgoaXRlbSkgPT5cbiAgICAgIHBvY2tldGJhc2VGZXRjaChgL2NvbGxlY3Rpb25zL2ludmVudG9yeV9pdGVtcy9yZWNvcmRzLyR7aXRlbS5pZH1gLCB7XG4gICAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIGRhdGVfdXNlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICB9KSxcbiAgICAgIH0pXG4gICAgKVxuICApO1xuXG4gIHJldHVybiBpdGVtcy5sZW5ndGg7XG59XG5cbi8qKlxuICogTWFyayBhbiBpbnZlbnRvcnkgaXRlbSBhcyB1c2VkIChzb2Z0IGRlbGV0ZSlcbiAqIFNldHMgZGF0ZV91c2VkIHRvIGN1cnJlbnQgdGltZXN0YW1wIGluc3RlYWQgb2YgYWN0dWFsbHkgZGVsZXRpbmcgdGhlIHJvd1xuICogVGhpcyBwcmVzZXJ2ZXMgYXVkaXQgdHJhaWxcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlZHVjdEludmVudG9yeShpdGVtSWQ6IHN0cmluZyk6IFByb21pc2U8SW52ZW50b3J5SXRlbT4ge1xuICAvLyBQb2NrZXRCYXNlIFBBVENIOiAvYXBpL2NvbGxlY3Rpb25zL3tjb2xsZWN0aW9ufS9yZWNvcmRzL3tpZH1cbiAgY29uc3QgdXBkYXRlZEl0ZW0gPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgYC9jb2xsZWN0aW9ucy9pbnZlbnRvcnlfaXRlbXMvcmVjb3Jkcy8ke2l0ZW1JZH1gLFxuICAgIHtcbiAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgZGF0ZV91c2VkOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICB9KSxcbiAgICB9XG4gICk7XG5cbiAgcmV0dXJuIHVwZGF0ZWRJdGVtIGFzIEludmVudG9yeUl0ZW07XG59XG5cbi8qKlxuICogRGVkdWN0IGEgc3BlY2lmaWMgcXVhbnRpdHkgZnJvbSBhbiBpbnZlbnRvcnkgaXRlbSAoVEFTSyA4OiBGaXggKyBVbml0IE5vcm1hbGl6YXRpb24pXG4gKiBIYW5kbGVzIHBhcnRpYWwgZGVkdWN0aW9ucyBwcm9wZXJseTpcbiAqIC0gSWYgaXRlbSBpcyBib29sZWFuIChoYXNfaXRlbT10cnVlKTogTWFyayBlbnRpcmUgaXRlbSBhcyB1c2VkXG4gKiAtIElmIGRlZHVjdGluZyBleGFjdCBhbW91bnQ6IE1hcmsgaXRlbSBhcyB1c2VkXG4gKiAtIElmIGRlZHVjdGluZyBwYXJ0aWFsIGFtb3VudDogQ3JlYXRlIG5ldyBpdGVtIHdpdGggcmVtYWluZGVyLCBtYXJrIG9yaWdpbmFsIGFzIHVzZWRcbiAqIC0gSWYgaW5zdWZmaWNpZW50IHF1YW50aXR5OiBUaHJvdyBlcnJvciAocHJldmVudCBkZWR1Y3Rpb24pXG4gKlxuICogVU5JVCBDT05WRVJTSU9OOiBxdWFudGl0eVRvRGVkdWN0IGlzIGFzc3VtZWQgdG8gYmUgaW4gQ0FOT05JQ0FMIHVuaXRzIChnLCBtbCwgcGllY2VzKVxuICogVGhlIGZ1bmN0aW9uIGNvbnZlcnRzIGludmVudG9yeSBpdGVtJ3MgdW5pdCB0byBjYW5vbmljYWwgYmVmb3JlIGNvbXBhcmluZ1xuICogVGhpcyBhbGxvd3MgXCIxIGN1cCByaWNlXCIgaW52ZW50b3J5IHRvIG1hdGNoIFwiMTI1ZyByaWNlXCIgZGVkdWN0aW9uIHJlcXVlc3RcbiAqXG4gKiBSZXR1cm5zIHsgZGVkdWN0ZWRfaXRlbSwgcmVtYWluZGVyX2l0ZW1faWQgfSB3aGVyZSByZW1haW5kZXIgaXMgbnVsbCBpZiBmdWxseSBjb25zdW1lZFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVkdWN0SW52ZW50b3J5UXVhbnRpdHkoXG4gIGl0ZW1JZDogc3RyaW5nLFxuICBxdWFudGl0eVRvRGVkdWN0PzogbnVtYmVyXG4pOiBQcm9taXNlPHsgZGVkdWN0ZWRfaXRlbTogSW52ZW50b3J5SXRlbTsgcmVtYWluZGVyX2l0ZW1faWQ/OiBzdHJpbmcgfT4ge1xuICBjb25zdCB1c2VySWQgPSBnZXRVc2VySWQoKTtcblxuICAvLyBGZXRjaCB0aGUgaXRlbSB0byBjaGVjayBxdWFudGl0eVxuICAvLyBQb2NrZXRCYXNlIEdFVDogL2FwaS9jb2xsZWN0aW9ucy97Y29sbGVjdGlvbn0vcmVjb3Jkcy97aWR9XG4gIGNvbnN0IGl0ZW0gPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgYC9jb2xsZWN0aW9ucy9pbnZlbnRvcnlfaXRlbXMvcmVjb3Jkcy8ke2l0ZW1JZH1gXG4gICk7XG5cbiAgLy8gQm9vbGVhbiBpdGVtcyAoc2FsdCwgc3BpY2VzLCBvaWxzKToganVzdCBtYXJrIGFzIHVzZWQsIG5vIHF1YW50aXR5IGNoZWNrXG4gIGlmIChpdGVtLmhhc19pdGVtID09PSB0cnVlICYmIHF1YW50aXR5VG9EZWR1Y3QgPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGRlZHVjdGVkSXRlbSA9IGF3YWl0IHBvY2tldGJhc2VGZXRjaChcbiAgICAgIGAvY29sbGVjdGlvbnMvaW52ZW50b3J5X2l0ZW1zL3JlY29yZHMvJHtpdGVtSWR9YCxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGRhdGVfdXNlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pLFxuICAgICAgfVxuICAgICk7XG5cbiAgICByZXR1cm4geyBkZWR1Y3RlZF9pdGVtOiBkZWR1Y3RlZEl0ZW0gYXMgSW52ZW50b3J5SXRlbSB9O1xuICB9XG5cbiAgLy8gUXVhbnRpdHktYmFzZWQgaXRlbXM6IGNoZWNrIGlmIHN1ZmZpY2llbnQgcXVhbnRpdHkgZXhpc3RzXG4gIGlmIChxdWFudGl0eVRvRGVkdWN0ICE9PSB1bmRlZmluZWQgJiYgaXRlbS5xdWFudGl0eV9hcHByb3ggIT09IG51bGwpIHtcbiAgICBjb25zdCBhdmFpbGFibGUgPSBpdGVtLnF1YW50aXR5X2FwcHJveDtcblxuICAgIC8vIFVOSVQgTk9STUFMSVpBVElPTiBGSVg6IENvbnZlcnQgaW52ZW50b3J5IGl0ZW0ncyB1bml0IHRvIGNhbm9uaWNhbCBiZWZvcmUgY29tcGFyaW5nXG4gICAgLy8gVGhpcyBlbnN1cmVzIFwiMSBjdXAgcmljZVwiIGNhbiBiZSBwcm9wZXJseSBjb21wYXJlZCBhZ2FpbnN0IFwiMTI1ZyByaWNlXCIgKG5vcm1hbGl6ZWQgZnJvbSAxIGN1cClcbiAgICAvLyBUaGUgZGVkdWN0aW9uIHF1YW50aXR5IGlzIGFzc3VtZWQgdG8gYmUgaW4gY2Fub25pY2FsIHVuaXRzIChmcm9tIG5vcm1hbGl6ZWQgcmVjaXBlKVxuICAgIGNvbnN0IGludmVudG9yeUNhbm9uaWNhbCA9IGNvbnZlcnRUb0Nhbm9uaWNhbChhdmFpbGFibGUsIGl0ZW0udW5pdCwgaXRlbS5uYW1lKTtcblxuICAgIC8vIENvbXBhcmUgcXVhbnRpdGllcyBpbiB0aGUgc2FtZSB1bml0IHN5c3RlbVxuICAgIC8vIENSSVRJQ0FMIEZJWDogQmxvY2sgZGVkdWN0aW9uIGlmIGluc3VmZmljaWVudCBxdWFudGl0eSAoYWZ0ZXIgdW5pdCBjb252ZXJzaW9uKVxuICAgIGlmIChpbnZlbnRvcnlDYW5vbmljYWwucXVhbnRpdHkgPCBxdWFudGl0eVRvRGVkdWN0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBJbnN1ZmZpY2llbnQgcXVhbnRpdHk6IG5lZWQgJHtxdWFudGl0eVRvRGVkdWN0fSR7aW52ZW50b3J5Q2Fub25pY2FsLnVuaXR9LCBgICtcbiAgICAgICAgICBgaGF2ZSAke2ludmVudG9yeUNhbm9uaWNhbC5xdWFudGl0eX0ke2ludmVudG9yeUNhbm9uaWNhbC51bml0fS4gVXNlciBtdXN0IHJldmlldyByZWNpcGUgb3IgYWRkIG1vcmUgaW52ZW50b3J5LmBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ2FsY3VsYXRlIHJlbWFpbmRlciB1c2luZyBjYW5vbmljYWwgcXVhbnRpdHlcbiAgICBjb25zdCByZW1haW5kZXJRdWFudGl0eSA9IGludmVudG9yeUNhbm9uaWNhbC5xdWFudGl0eSAtIHF1YW50aXR5VG9EZWR1Y3Q7XG5cbiAgICAvLyBFeGFjdCBtYXRjaCBvciB2ZXJ5IGNsb3NlOiBtYXJrIGVudGlyZSBpdGVtIGFzIHVzZWQgKGNvbXBhcmUgaW4gY2Fub25pY2FsIHVuaXRzKVxuICAgIGlmIChNYXRoLmFicyhyZW1haW5kZXJRdWFudGl0eSkgPCAwLjAxKSB7XG4gICAgICBjb25zdCBkZWR1Y3RlZEl0ZW0gPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgICAgIGAvY29sbGVjdGlvbnMvaW52ZW50b3J5X2l0ZW1zL3JlY29yZHMvJHtpdGVtSWR9YCxcbiAgICAgICAge1xuICAgICAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGRhdGVfdXNlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pLFxuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgICByZXR1cm4geyBkZWR1Y3RlZF9pdGVtOiBkZWR1Y3RlZEl0ZW0gYXMgSW52ZW50b3J5SXRlbSB9O1xuICAgIH1cblxuICAgIC8vIFBhcnRpYWwgZGVkdWN0aW9uOiBjcmVhdGUgcmVtYWluZGVyIGl0ZW0sIG1hcmsgb3JpZ2luYWwgYXMgdXNlZFxuICAgIC8vIFRoZSByZW1haW5kZXIgaXMgY2FsY3VsYXRlZCBpbiBjYW5vbmljYWwgdW5pdHMsIGJ1dCB3ZSBuZWVkIHRvIHN0b3JlIGl0IGluIHRoZSBvcmlnaW5hbCB1bml0XG4gICAgLy8gQ2FsY3VsYXRlIHRoZSByYXRpbyB0byBjb252ZXJ0IHJlbWFpbmRlciBiYWNrIHRvIG9yaWdpbmFsIHVuaXRcbiAgICAvLyBFLmcuLCBpZiAxIGN1cCA9IDEyNWcsIGFuZCByZW1haW5kZXJRdWFudGl0eSA9IDI1ZywgdGhlbiByZW1haW5kZXJfaW5fY3VwcyA9IDI1IC8gMTI1ID0gMC4yIGN1cHNcbiAgICBjb25zdCBjb252ZXJzaW9uUmF0aW8gPSBpbnZlbnRvcnlDYW5vbmljYWwucXVhbnRpdHkgLyBhdmFpbGFibGU7IC8vIGNhbm9uaWNhbCBwZXIgb3JpZ2luYWwgdW5pdFxuICAgIGNvbnN0IHJlbWFpbmRlciA9IHJlbWFpbmRlclF1YW50aXR5IC8gY29udmVyc2lvblJhdGlvOyAvLyBjb252ZXJ0IHJlbWFpbmRlciBiYWNrIHRvIG9yaWdpbmFsIHVuaXRcblxuICAgIC8vIENyZWF0ZSBuZXcgaXRlbSBmb3IgcmVtYWluZGVyXG4gICAgLy8gUG9ja2V0QmFzZSBQT1NUOiAvYXBpL2NvbGxlY3Rpb25zL3tjb2xsZWN0aW9ufS9yZWNvcmRzXG4gICAgY29uc3QgcmVtYWluZGVySXRlbSA9IGF3YWl0IHBvY2tldGJhc2VGZXRjaChcbiAgICAgIGAvY29sbGVjdGlvbnMvaW52ZW50b3J5X2l0ZW1zL3JlY29yZHNgLFxuICAgICAge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgICBuYW1lOiBpdGVtLm5hbWUsXG4gICAgICAgICAgY2Fub25pY2FsX25hbWU6IGl0ZW0uY2Fub25pY2FsX25hbWUsXG4gICAgICAgICAgcXVhbnRpdHlfYXBwcm94OiByZW1haW5kZXIsICAvLyBOb3cgaW4gb3JpZ2luYWwgdW5pdCAoZS5nLiwgMC4yIGN1cHMpXG4gICAgICAgICAgdW5pdDogaXRlbS51bml0LCAgICAgICAgICAgICAvLyBPcmlnaW5hbCB1bml0IChlLmcuLCAnY3VwJylcbiAgICAgICAgICBjb25maWRlbmNlOiBpdGVtLmNvbmZpZGVuY2UsXG4gICAgICAgICAgaGFzX2l0ZW06IGZhbHNlLFxuICAgICAgICAgIGRhdGVfYWRkZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfSksXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIE1hcmsgb3JpZ2luYWwgYXMgdXNlZFxuICAgIGNvbnN0IGRlZHVjdGVkSXRlbSA9IGF3YWl0IHBvY2tldGJhc2VGZXRjaChcbiAgICAgIGAvY29sbGVjdGlvbnMvaW52ZW50b3J5X2l0ZW1zL3JlY29yZHMvJHtpdGVtSWR9YCxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiAnUEFUQ0gnLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGRhdGVfdXNlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pLFxuICAgICAgfVxuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZGVkdWN0ZWRfaXRlbTogZGVkdWN0ZWRJdGVtIGFzIEludmVudG9yeUl0ZW0sXG4gICAgICByZW1haW5kZXJfaXRlbV9pZDogcmVtYWluZGVySXRlbS5pZCxcbiAgICB9O1xuICB9XG5cbiAgLy8gTm8gcXVhbnRpdHkgc3BlY2lmaWVkIGFuZCBubyBxdWFudGl0eSBpbiBpdGVtOiBqdXN0IG1hcmsgYXMgdXNlZFxuICBjb25zdCBkZWR1Y3RlZEl0ZW0gPSBhd2FpdCBwb2NrZXRiYXNlRmV0Y2goXG4gICAgYC9jb2xsZWN0aW9ucy9pbnZlbnRvcnlfaXRlbXMvcmVjb3Jkcy8ke2l0ZW1JZH1gLFxuICAgIHtcbiAgICAgIG1ldGhvZDogJ1BBVENIJyxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZGF0ZV91c2VkOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSksXG4gICAgfVxuICApO1xuXG4gIHJldHVybiB7IGRlZHVjdGVkX2l0ZW06IGRlZHVjdGVkSXRlbSBhcyBJbnZlbnRvcnlJdGVtIH07XG59XG5cbi8qKlxuICogRmV0Y2ggcmVjZW50IGNoYXQgaGlzdG9yeSBmb3IgdGhlIGN1cnJlbnQgdXNlclxuICogUmV0dXJucyBtZXNzYWdlcyBpbiBjaHJvbm9sb2dpY2FsIG9yZGVyIChvbGRlc3QgZmlyc3QpXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDaGF0SGlzdG9yeShsaW1pdDogbnVtYmVyID0gMjApOiBQcm9taXNlPENoYXRNZXNzYWdlW10+IHtcbiAgY29uc3QgdXNlcklkID0gZ2V0VXNlcklkKCk7XG5cbiAgLy8gUG9ja2V0QmFzZSBmaWx0ZXI6IHVzZXJfaWQgbWF0Y2hlc1xuICAvLyBTb3J0IGJ5IHRpbWVzdGFtcCBhc2NlbmRpbmcgKG9sZGVzdCBmaXJzdClcbiAgY29uc3QgZmlsdGVyID0gZW5jb2RlVVJJQ29tcG9uZW50KGAodXNlcl9pZD1cIiR7dXNlcklkfVwiKWApO1xuICBjb25zdCBzb3J0ID0gZW5jb2RlVVJJQ29tcG9uZW50KCd0aW1lc3RhbXAnKTtcblxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHBvY2tldGJhc2VGZXRjaChcbiAgICBgL2NvbGxlY3Rpb25zL2NoYXRfbWVzc2FnZXMvcmVjb3Jkcz9maWx0ZXI9JHtmaWx0ZXJ9JnNvcnQ9JHtzb3J0fSZsaW1pdD0ke2xpbWl0fWBcbiAgKTtcblxuICAvLyBQb2NrZXRCYXNlIHJldHVybnMgeyBpdGVtczogWy4uLl0gfSBvciBhcnJheSBkZXBlbmRpbmcgb24gdmVyc2lvblxuICBjb25zdCBtZXNzYWdlcyA9IHJlc3BvbnNlLml0ZW1zIHx8IChBcnJheS5pc0FycmF5KHJlc3BvbnNlKSA/IHJlc3BvbnNlIDogW10pO1xuICByZXR1cm4gbWVzc2FnZXMgYXMgQ2hhdE1lc3NhZ2VbXTtcbn1cblxuLyoqXG4gKiBBZGQgYSBjaGF0IG1lc3NhZ2UgdG8gaGlzdG9yeVxuICogUm9sZSBtdXN0IGJlICd1c2VyJyBvciAnYXNzaXN0YW50J1xuICogUmV0dXJucyB0aGUgbmV3bHkgY3JlYXRlZCBtZXNzYWdlXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRDaGF0TWVzc2FnZShcbiAgbWVzc2FnZTogc3RyaW5nLFxuICByb2xlOiAndXNlcicgfCAnYXNzaXN0YW50J1xuKTogUHJvbWlzZTxDaGF0TWVzc2FnZT4ge1xuICBjb25zdCB1c2VySWQgPSBnZXRVc2VySWQoKTtcblxuICAvLyBQb2NrZXRCYXNlIFBPU1Q6IC9hcGkvY29sbGVjdGlvbnMve2NvbGxlY3Rpb259L3JlY29yZHNcbiAgY29uc3QgbmV3TWVzc2FnZSA9IGF3YWl0IHBvY2tldGJhc2VGZXRjaChcbiAgICBgL2NvbGxlY3Rpb25zL2NoYXRfbWVzc2FnZXMvcmVjb3Jkc2AsXG4gICAge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgcm9sZSxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICB9KSxcbiAgICB9XG4gICk7XG5cbiAgcmV0dXJuIG5ld01lc3NhZ2UgYXMgQ2hhdE1lc3NhZ2U7XG59XG4iLCAiLyoqXG4gKiBDaGF0L01lYWwgU3VnZ2VzdGlvbiBBUEkgZW5kcG9pbnRcbiAqXG4gKiBQT1NUIC9hcGkvY2hhdCAtIEdldCBtZWFsIHN1Z2dlc3Rpb25zIGZvciBjdXJyZW50IGludmVudG9yeSBhbmQgbWVhbCB0eXBlXG4gKiBUaGlzIGVuZHBvaW50IGhhbmRsZXMgdGhlIFwiU3VnZ2VzdGlvbnNcIiB0YWIgZmxvd1xuICovXG5cbmltcG9ydCB7IFJvdXRlciwgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IHN1Z2dlc3RNZWFscyB9IGZyb20gJy4vdXRpbHMvcHJvbXB0cy50cyc7XG5pbXBvcnQgeyBnZXRJbnZlbnRvcnkgfSBmcm9tICcuL3V0aWxzL2RiLnRzJztcblxuY29uc3Qgcm91dGVyID0gUm91dGVyKCk7XG5cbi8qKlxuICogUE9TVCAvYXBpL2NoYXRcbiAqIEdldCBtZWFsIHN1Z2dlc3Rpb25zIGJhc2VkIG9uIGN1cnJlbnQgaW52ZW50b3J5IGFuZCBtZWFsIHR5cGVcbiAqXG4gKiBSZXF1ZXN0IGJvZHk6XG4gKiB7XG4gKiAgIFwibWVzc2FnZVwiOiBcIlN1Z2dlc3QgYnJlYWtmYXN0IG1lYWxzXCIsXG4gKiAgIFwibWVhbF90eXBlXCI6IFwiYnJlYWtmYXN0XCIgfCBcImx1bmNoXCIgfCBcImRpbm5lclwiXG4gKiB9XG4gKlxuICogUmVzcG9uc2U6XG4gKiB7XG4gKiAgIFwicmVjaXBlc1wiOiBbXG4gKiAgICAge1xuICogICAgICAgXCJuYW1lXCI6IFwiU2NyYW1ibGVkIEVnZ3Mgd2l0aCBUb21hdG9lc1wiLFxuICogICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkZsdWZmeSBzY3JhbWJsZWQgZWdncyB3aXRoIGZyZXNoIGRpY2VkIHRvbWF0b2VzLiBMaWdodCBhbmQgcHJvdGVpbi1yaWNoLlwiLFxuICogICAgICAgXCJ0aW1lX2VzdGltYXRlX21pbnNcIjogMTBcbiAqICAgICB9LFxuICogICAgIC4uLlxuICogICBdXG4gKiB9XG4gKi9cbnJvdXRlci5wb3N0KCcvJywgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgbWVhbF90eXBlIH0gPSByZXEuYm9keTtcblxuICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgaWYgKCFtZWFsX3R5cGUgfHwgIVsnYnJlYWtmYXN0JywgJ2x1bmNoJywgJ2Rpbm5lciddLmluY2x1ZGVzKG1lYWxfdHlwZSkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnTWlzc2luZyBvciBpbnZhbGlkIG1lYWxfdHlwZSBmaWVsZCcsXG4gICAgICAgIGRldGFpbHM6ICdtZWFsX3R5cGUgbXVzdCBiZSBvbmUgb2Y6IGJyZWFrZmFzdCwgbHVuY2gsIGRpbm5lcicsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBHZXQgY3VycmVudCBpbnZlbnRvcnlcbiAgICBjb25zdCBpbnZlbnRvcnkgPSBhd2FpdCBnZXRJbnZlbnRvcnkoKTtcblxuICAgIGlmIChpbnZlbnRvcnkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ05vIGludmVudG9yeSBpdGVtcyBmb3VuZCcsXG4gICAgICAgIGRldGFpbHM6ICdBZGQgaXRlbXMgdG8geW91ciBpbnZlbnRvcnkgYmVmb3JlIHJlcXVlc3RpbmcgbWVhbCBzdWdnZXN0aW9ucycsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBTdWdnZXN0IG1lYWxzIGJhc2VkIG9uIGludmVudG9yeVxuICAgIGNvbnN0IHJlY2lwZXMgPSBhd2FpdCBzdWdnZXN0TWVhbHMoaW52ZW50b3J5LCBtZWFsX3R5cGUpO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgcmVjaXBlcyxcbiAgICAgIG1lc3NhZ2U6IGBIZXJlIGFyZSAke3JlY2lwZXMubGVuZ3RofSAke21lYWxfdHlwZX0gc3VnZ2VzdGlvbnMgZm9yIHlvdSFgLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIFBPU1QgL2FwaS9jaGF0OicsIGVycm9yKTtcblxuICAgIGNvbnN0IGVycm9yTXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuXG4gICAgaWYgKGVycm9yTXNnLmluY2x1ZGVzKCdTVVBBQkFTRScpIHx8IGVycm9yTXNnLmluY2x1ZGVzKCdPUEVOQUknKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdTZXJ2aWNlIGNvbmZpZ3VyYXRpb24gZXJyb3InLFxuICAgICAgICBkZXRhaWxzOiBlcnJvck1zZyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgIGVycm9yOiAnRmFpbGVkIHRvIHN1Z2dlc3QgbWVhbHMnLFxuICAgICAgZGV0YWlsczogZXJyb3JNc2csXG4gICAgfSk7XG4gIH1cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7XG4iLCAiLyoqXG4gKiBDb29raW5nIEFQSSBlbmRwb2ludHNcbiAqXG4gKiBQT1NUIC9hcGkvY29va2luZy9zdGFydDogVGFrZXMgcmVjaXBlIGRldGFpbHMsIGdlbmVyYXRlcyBmdWxsIHJlY2lwZSB3aXRoIGluZ3JlZGllbnRzLCBzYXZlcyBjb29raW5nIHN0YXRlXG4gKiBQT1NUIC9hcGkvY29va2luZy9jb21wbGV0ZTogVXNlciBjb25maXJtcyBkZWR1Y3Rpb24sIGRlZHVjdHMgaW5ncmVkaWVudHMgZnJvbSBpbnZlbnRvcnlcbiAqIFBPU1QgL2FwaS9jb29raW5nL2NvbmZpcm0tZGVkdWN0aW9uOiBHZXQgbGlzdCBvZiB3aGF0IHdpbGwgYmUgZGVkdWN0ZWQgYmVmb3JlIHVzZXIgY29uZmlybXNcbiAqIFBPU1QgL2FwaS9jb29raW5nL2NvbmZpcm0tYWRqdXN0bWVudHM6IFRhc2sgNyAtIFBhcnNlIGFuZCBhcHBseSB1c2VyIHJlY2lwZSBhZGp1c3RtZW50cyBiZWZvcmUgY29va2luZ1xuICovXG5cbmltcG9ydCB7IFJvdXRlciwgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IGdlbmVyYXRlUmVjaXBlRGV0YWlsLCBwYXJzZVJlY2lwZUFkanVzdG1lbnRzLCBSZWNpcGVBZGp1c3RtZW50LCBpc0luZ3JlZGllbnRDcml0aWNhbCB9IGZyb20gJy4vdXRpbHMvcHJvbXB0cyc7XG5pbXBvcnQgeyBnZXRJbnZlbnRvcnksIGRlZHVjdEludmVudG9yeVF1YW50aXR5IH0gZnJvbSAnLi91dGlscy9kYic7XG5pbXBvcnQgeyBSZWNpcGVEZXRhaWwsIEludmVudG9yeUl0ZW0sIFN0YXJ0Q29va2luZ1JlcXVlc3QgfSBmcm9tICcuLi9zaGFyZWQvdHlwZXMnO1xuXG5jb25zdCByb3V0ZXIgPSBSb3V0ZXIoKTtcblxuLyoqXG4gKiBQT1NUIC9hcGkvY29va2luZy9kZXRhaWxcbiAqIEdldCBmdWxsIHJlY2lwZSBkZXRhaWxzIGZyb20gcmVjaXBlIG5hbWUsIGRlc2NyaXB0aW9uLCBhbmQgdGltZSBlc3RpbWF0ZVxuICogVGhpcyBlbmRwb2ludCBnZW5lcmF0ZXMgdGhlIGRldGFpbGVkIHJlY2lwZSB3aXRoIGluZ3JlZGllbnRzIGFuZCBpbnN0cnVjdGlvbnNcbiAqXG4gKiBSZXF1ZXN0IGJvZHk6XG4gKiB7XG4gKiAgIFwicmVjaXBlX25hbWVcIjogXCJUb21hdG8gQmFzaWwgQ2hpY2tlblwiLFxuICogICBcInJlY2lwZV9kZXNjcmlwdGlvblwiOiBcIlBhbi1zZWFyZWQgY2hpY2tlbiB3aXRoIGZyZXNoIHRvbWF0b2VzIGFuZCBiYXNpbC4gTGlnaHQgYW5kIGZyZXNoLlwiLFxuICogICBcInJlY2lwZV90aW1lX21pbnNcIjogMjVcbiAqIH1cbiAqXG4gKiBSZXNwb25zZTpcbiAqIHtcbiAqICAgXCJkYXRhXCI6IHtcbiAqICAgICBcIm5hbWVcIjogXCJUb21hdG8gQmFzaWwgQ2hpY2tlblwiLFxuICogICAgIFwiZGVzY3JpcHRpb25cIjogXCIuLi5cIixcbiAqICAgICBcInRpbWVfZXN0aW1hdGVfbWluc1wiOiAyNSxcbiAqICAgICBcImluZ3JlZGllbnRzXCI6IFsuLi5dLFxuICogICAgIFwiaW5zdHJ1Y3Rpb25zXCI6IFsuLi5dXG4gKiAgIH1cbiAqIH1cbiAqL1xucm91dGVyLnBvc3QoJy9kZXRhaWwnLCBhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyByZWNpcGVfbmFtZSwgcmVjaXBlX2Rlc2NyaXB0aW9uLCByZWNpcGVfdGltZV9taW5zIH0gPSByZXEuYm9keTtcblxuICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgaWYgKCFyZWNpcGVfbmFtZSB8fCB0eXBlb2YgcmVjaXBlX25hbWUgIT09ICdzdHJpbmcnIHx8ICFyZWNpcGVfbmFtZS50cmltKCkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnTWlzc2luZyBvciBpbnZhbGlkIHJlY2lwZV9uYW1lIGZpZWxkJyxcbiAgICAgICAgZGV0YWlsczogJ3JlY2lwZV9uYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghcmVjaXBlX2Rlc2NyaXB0aW9uIHx8IHR5cGVvZiByZWNpcGVfZGVzY3JpcHRpb24gIT09ICdzdHJpbmcnIHx8ICFyZWNpcGVfZGVzY3JpcHRpb24udHJpbSgpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ01pc3Npbmcgb3IgaW52YWxpZCByZWNpcGVfZGVzY3JpcHRpb24gZmllbGQnLFxuICAgICAgICBkZXRhaWxzOiAncmVjaXBlX2Rlc2NyaXB0aW9uIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChyZWNpcGVfdGltZV9taW5zID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHJlY2lwZV90aW1lX21pbnMgIT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ01pc3Npbmcgb3IgaW52YWxpZCByZWNpcGVfdGltZV9taW5zIGZpZWxkJyxcbiAgICAgICAgZGV0YWlsczogJ3JlY2lwZV90aW1lX21pbnMgbXVzdCBiZSBhIG51bWJlciAoaW4gbWludXRlcyknLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gR2V0IGN1cnJlbnQgaW52ZW50b3J5IHRvIHZhbGlkYXRlIHJlY2lwZSBjYW4gYmUgbWFkZVxuICAgIGNvbnN0IGN1cnJlbnRJbnZlbnRvcnkgPSBhd2FpdCBnZXRJbnZlbnRvcnkoKTtcblxuICAgIGlmIChjdXJyZW50SW52ZW50b3J5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdDYW5ub3QgZ2VuZXJhdGUgcmVjaXBlIHdpdGggZW1wdHkgaW52ZW50b3J5JyxcbiAgICAgICAgZGV0YWlsczogJ0FkZCBpdGVtcyB0byB5b3VyIGludmVudG9yeSBiZWZvcmUgcmVxdWVzdGluZyByZWNpcGUgZGV0YWlscycsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBHZW5lcmF0ZSBkZXRhaWxlZCByZWNpcGUgZnJvbSBtaW5pbWFsIGlucHV0XG4gICAgY29uc3QgcmVjaXBlRGV0YWlsID0gYXdhaXQgZ2VuZXJhdGVSZWNpcGVEZXRhaWwoXG4gICAgICByZWNpcGVfbmFtZS50cmltKCksXG4gICAgICByZWNpcGVfZGVzY3JpcHRpb24udHJpbSgpLFxuICAgICAgY3VycmVudEludmVudG9yeVxuICAgICk7XG5cbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBkYXRhOiByZWNpcGVEZXRhaWwsXG4gICAgICBtZXNzYWdlOiAnUmVjaXBlIGRldGFpbHMgZ2VuZXJhdGVkIHN1Y2Nlc3NmdWxseScsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gUE9TVCAvYXBpL2Nvb2tpbmcvZGV0YWlsOicsIGVycm9yKTtcblxuICAgIGNvbnN0IGVycm9yTXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuXG4gICAgaWYgKGVycm9yTXNnLmluY2x1ZGVzKCdTVVBBQkFTRScpIHx8IGVycm9yTXNnLmluY2x1ZGVzKCdPUEVOQUknKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdTZXJ2aWNlIGNvbmZpZ3VyYXRpb24gZXJyb3InLFxuICAgICAgICBkZXRhaWxzOiBlcnJvck1zZyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgIGVycm9yOiAnRmFpbGVkIHRvIGdlbmVyYXRlIHJlY2lwZSBkZXRhaWxzJyxcbiAgICAgIGRldGFpbHM6IGVycm9yTXNnLFxuICAgIH0pO1xuICB9XG59KTtcblxuLyoqXG4gKiBJbi1tZW1vcnkgc3RvcmFnZSBmb3IgY29va2luZyBzZXNzaW9uc1xuICogSW4gcHJvZHVjdGlvbiwgdGhpcyB3b3VsZCBiZSBwZXJzaXN0ZWQgdG8gZGF0YWJhc2UgKGNvb2tpbmdfc2Vzc2lvbnMgdGFibGUpXG4gKiBNYXBzIHNlc3Npb25faWQgLT4geyByZWNpcGUsIGludmVudG9yeV9iZWZvcmUsIHN0YXJ0ZWRfYXQgfVxuICovXG5jb25zdCBjb29raW5nU2Vzc2lvbnM6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcblxuLyoqXG4gKiBQT1NUIC9hcGkvY29va2luZy9zdGFydFxuICogQmVnaW4gY29va2luZyBhIHJlY2lwZTogZ2VuZXJhdGUgZnVsbCByZWNpcGUgZGV0YWlscyBmcm9tIG1pbmltYWwgaW5wdXRcbiAqXG4gKiBSZXF1ZXN0IGJvZHk6XG4gKiB7XG4gKiAgIFwicmVjaXBlX25hbWVcIjogXCJUb21hdG8gQmFzaWwgQ2hpY2tlblwiLFxuICogICBcInJlY2lwZV9kZXNjcmlwdGlvblwiOiBcIlBhbi1zZWFyZWQgY2hpY2tlbiB3aXRoIGZyZXNoIHRvbWF0b2VzIGFuZCBiYXNpbC4gTGlnaHQgYW5kIGZyZXNoLlwiLFxuICogICBcInJlY2lwZV90aW1lX21pbnNcIjogMjVcbiAqIH1cbiAqXG4gKiBSZXNwb25zZTpcbiAqIHtcbiAqICAgXCJzZXNzaW9uX2lkXCI6IFwiY29va2luZy1zZXNzaW9uLXV1aWRcIixcbiAqICAgXCJyZWNpcGVcIjoge1xuICogICAgIFwibmFtZVwiOiBcIlRvbWF0byBCYXNpbCBDaGlja2VuXCIsXG4gKiAgICAgXCJkZXNjcmlwdGlvblwiOiBcIi4uLlwiLFxuICogICAgIFwidGltZV9lc3RpbWF0ZV9taW5zXCI6IDI1LFxuICogICAgIFwiaW5ncmVkaWVudHNcIjogWy4uLl0sXG4gKiAgICAgXCJpbnN0cnVjdGlvbnNcIjogWy4uLl1cbiAqICAgfSxcbiAqICAgXCJpbmdyZWRpZW50c190b19kZWR1Y3RcIjogW1xuICogICAgIHsgXCJuYW1lXCI6IFwiY2hpY2tlblwiLCBcInF1YW50aXR5XCI6IDIsIFwidW5pdFwiOiBcInBpZWNlc1wiLCBcImludmVudG9yeV9pdGVtX2lkXCI6IFwiLi4uXCIgfSxcbiAqICAgICB7IFwibmFtZVwiOiBcInRvbWF0b1wiLCBcInF1YW50aXR5XCI6IDMsIFwidW5pdFwiOiBcInBpZWNlc1wiLCBcImludmVudG9yeV9pdGVtX2lkXCI6IFwiLi4uXCIgfVxuICogICBdLFxuICogICBcIm1lc3NhZ2VcIjogXCJSZWFkeSB0byBjb29rISBSZXZpZXcgaW5ncmVkaWVudHMgYWJvdmUgYW5kIGNvbmZpcm0gd2hlbiBkb25lLlwiXG4gKiB9XG4gKi9cbnJvdXRlci5wb3N0KCcvc3RhcnQnLCBhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyByZWNpcGVfbmFtZSwgcmVjaXBlX2Rlc2NyaXB0aW9uLCByZWNpcGVfdGltZV9taW5zIH0gPSByZXEuYm9keTtcblxuICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgaWYgKCFyZWNpcGVfbmFtZSB8fCB0eXBlb2YgcmVjaXBlX25hbWUgIT09ICdzdHJpbmcnIHx8ICFyZWNpcGVfbmFtZS50cmltKCkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnTWlzc2luZyBvciBpbnZhbGlkIHJlY2lwZV9uYW1lIGZpZWxkJyxcbiAgICAgICAgZGV0YWlsczogJ3JlY2lwZV9uYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghcmVjaXBlX2Rlc2NyaXB0aW9uIHx8IHR5cGVvZiByZWNpcGVfZGVzY3JpcHRpb24gIT09ICdzdHJpbmcnIHx8ICFyZWNpcGVfZGVzY3JpcHRpb24udHJpbSgpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ01pc3Npbmcgb3IgaW52YWxpZCByZWNpcGVfZGVzY3JpcHRpb24gZmllbGQnLFxuICAgICAgICBkZXRhaWxzOiAncmVjaXBlX2Rlc2NyaXB0aW9uIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChyZWNpcGVfdGltZV9taW5zID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHJlY2lwZV90aW1lX21pbnMgIT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ01pc3Npbmcgb3IgaW52YWxpZCByZWNpcGVfdGltZV9taW5zIGZpZWxkJyxcbiAgICAgICAgZGV0YWlsczogJ3JlY2lwZV90aW1lX21pbnMgbXVzdCBiZSBhIG51bWJlciAoaW4gbWludXRlcyknLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gR2V0IGN1cnJlbnQgaW52ZW50b3J5IHRvIHZhbGlkYXRlIHJlY2lwZSBjYW4gYmUgbWFkZVxuICAgIGNvbnN0IGN1cnJlbnRJbnZlbnRvcnkgPSBhd2FpdCBnZXRJbnZlbnRvcnkoKTtcblxuICAgIGlmIChjdXJyZW50SW52ZW50b3J5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdDYW5ub3QgZ2VuZXJhdGUgcmVjaXBlIHdpdGggZW1wdHkgaW52ZW50b3J5JyxcbiAgICAgICAgZGV0YWlsczogJ0FkZCBpdGVtcyB0byB5b3VyIGludmVudG9yeSBiZWZvcmUgc3RhcnRpbmcgYSByZWNpcGUnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgZGV0YWlsZWQgcmVjaXBlIGZyb20gbWluaW1hbCBpbnB1dFxuICAgIGNvbnN0IHJlY2lwZURldGFpbCA9IGF3YWl0IGdlbmVyYXRlUmVjaXBlRGV0YWlsKFxuICAgICAgcmVjaXBlX25hbWUudHJpbSgpLFxuICAgICAgcmVjaXBlX2Rlc2NyaXB0aW9uLnRyaW0oKSxcbiAgICAgIGN1cnJlbnRJbnZlbnRvcnlcbiAgICApO1xuXG4gICAgLy8gTWFwIHJlY2lwZSBpbmdyZWRpZW50cyB0byBpbnZlbnRvcnkgaXRlbXMgZm9yIGRlZHVjdGlvbiB0cmFja2luZ1xuICAgIGNvbnN0IGluZ3JlZGllbnRzVG9EZWR1Y3QgPSByZWNpcGVEZXRhaWwuaW5ncmVkaWVudHMubWFwKChpbmdyZWRpZW50KSA9PiB7XG4gICAgICAvLyBGaW5kIG1hdGNoaW5nIGludmVudG9yeSBpdGVtIGJ5IGNhbm9uaWNhbCBuYW1lXG4gICAgICBjb25zdCBpbnZlbnRvcnlJdGVtID0gY3VycmVudEludmVudG9yeS5maW5kKFxuICAgICAgICAoaXRlbSkgPT5cbiAgICAgICAgICBpdGVtLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gaW5ncmVkaWVudC5uYW1lLnRvTG93ZXJDYXNlKCkgfHxcbiAgICAgICAgICBpdGVtLmNhbm9uaWNhbF9uYW1lPy50b0xvd2VyQ2FzZSgpID09PSBpbmdyZWRpZW50Lm5hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgKTtcblxuICAgICAgaWYgKCFpbnZlbnRvcnlJdGVtKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgUmVjaXBlIGluZ3JlZGllbnQgXCIke2luZ3JlZGllbnQubmFtZX1cIiBub3QgZm91bmQgaW4gaW52ZW50b3J5LiBgICtcbiAgICAgICAgICBgVGhpcyBzaG91bGQgbm90IGhhcHBlbiAtIHJlY2lwZSBnZW5lcmF0aW9uIGZhaWxlZCB0byB2YWxpZGF0ZSBhZ2FpbnN0IGludmVudG9yeS5gXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6IGluZ3JlZGllbnQubmFtZSxcbiAgICAgICAgcXVhbnRpdHk6IGluZ3JlZGllbnQucXVhbnRpdHksXG4gICAgICAgIHVuaXQ6IGluZ3JlZGllbnQudW5pdCxcbiAgICAgICAgaW52ZW50b3J5X2l0ZW1faWQ6IGludmVudG9yeUl0ZW0uaWQsXG4gICAgICAgIGNvbmZpZGVuY2U6IGludmVudG9yeUl0ZW0uY29uZmlkZW5jZSxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgY29va2luZyBzZXNzaW9uXG4gICAgY29uc3Qgc2Vzc2lvbklkID0gYGNvb2tpbmctJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KX1gO1xuICAgIGNvb2tpbmdTZXNzaW9uc1tzZXNzaW9uSWRdID0ge1xuICAgICAgcmVjaXBlOiByZWNpcGVEZXRhaWwsXG4gICAgICBpbnZlbnRvcnlfYmVmb3JlOiBjdXJyZW50SW52ZW50b3J5LFxuICAgICAgaW5ncmVkaWVudHNfdG9fZGVkdWN0OiBpbmdyZWRpZW50c1RvRGVkdWN0LFxuICAgICAgc3RhcnRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICByZXMuc3RhdHVzKDIwMSkuanNvbih7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIHNlc3Npb25faWQ6IHNlc3Npb25JZCxcbiAgICAgICAgcmVjaXBlOiByZWNpcGVEZXRhaWwsXG4gICAgICAgIGluZ3JlZGllbnRzX3RvX2RlZHVjdDogaW5ncmVkaWVudHNUb0RlZHVjdCxcbiAgICAgIH0sXG4gICAgICBtZXNzYWdlOiAnUmVjaXBlIHJlYWR5ISBSZXZpZXcgaW5ncmVkaWVudHMgYW5kIGNvbmZpcm0gd2hlbiBjb29raW5nIGlzIGNvbXBsZXRlLicsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gUE9TVCAvYXBpL2Nvb2tpbmcvc3RhcnQ6JywgZXJyb3IpO1xuXG4gICAgY29uc3QgZXJyb3JNc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG5cbiAgICBpZiAoZXJyb3JNc2cuaW5jbHVkZXMoJ1NVUEFCQVNFJykgfHwgZXJyb3JNc2cuaW5jbHVkZXMoJ09QRU5BSScpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ1NlcnZpY2UgY29uZmlndXJhdGlvbiBlcnJvcicsXG4gICAgICAgIGRldGFpbHM6IGVycm9yTXNnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSWYgcmVjaXBlIHZhbGlkYXRpb24gZmFpbGVkXG4gICAgaWYgKGVycm9yTXNnLmluY2x1ZGVzKCdub3QgZm91bmQgaW4gaW52ZW50b3J5JykpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnUmVjaXBlIHZhbGlkYXRpb24gZmFpbGVkJyxcbiAgICAgICAgZGV0YWlsczogZXJyb3JNc2csXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICBlcnJvcjogJ0ZhaWxlZCB0byBzdGFydCBjb29raW5nJyxcbiAgICAgIGRldGFpbHM6IGVycm9yTXNnLFxuICAgIH0pO1xuICB9XG59KTtcblxuLyoqXG4gKiBQT1NUIC9hcGkvY29va2luZy9jb21wbGV0ZVxuICogTWFyayBjb29raW5nIGFzIGNvbXBsZXRlIGFuZCBkZWR1Y3QgaW5ncmVkaWVudHMgZnJvbSBpbnZlbnRvcnlcbiAqXG4gKiBJTVBPUlRBTlQ6IFRoaXMgZW5kcG9pbnQgaW1wbGVtZW50cyB0aGUgXCJjb25maXJtYXRpb24gYmVmb3JlIGRlZHVjdGlvblwiIFVYIHBhdHRlcm4uXG4gKiBCZWZvcmUgY2FsbGluZyB0aGlzLCBjbGllbnQgc2hvdWxkOlxuICogMS4gQ2FsbCBQT1NUIC9hcGkvY29va2luZy9zdGFydCB0byBnZXQgcmVjaXBlIGFuZCBpbmdyZWRpZW50c190b19kZWR1Y3RcbiAqIDIuIFNob3cgdXNlciBhIGNvbmZpcm1hdGlvbiBkaWFsb2cgbGlzdGluZyB3aGF0IHdpbGwgYmUgZGVkdWN0ZWRcbiAqIDMuIE9ubHkgY2FsbCB0aGlzIGVuZHBvaW50IGFmdGVyIHVzZXIgZXhwbGljaXRseSBjb25maXJtc1xuICpcbiAqIFJlcXVlc3QgYm9keTpcbiAqIHtcbiAqICAgXCJzZXNzaW9uX2lkXCI6IFwiY29va2luZy1zZXNzaW9uLXV1aWRcIixcbiAqICAgXCJkZWR1Y3Rpb25fY29uZmlybWVkXCI6IHRydWVcbiAqIH1cbiAqXG4gKiBSZXNwb25zZTpcbiAqIHtcbiAqICAgXCJkYXRhXCI6IHtcbiAqICAgICBcInJlY2lwZV9uYW1lXCI6IFwiVG9tYXRvIEJhc2lsIENoaWNrZW5cIixcbiAqICAgICBcImRlZHVjdGVkX2l0ZW1zXCI6IFtcbiAqICAgICAgIHsgXCJpbnZlbnRvcnlfaXRlbV9pZFwiOiBcIi4uLlwiLCBcInF1YW50aXR5XCI6IDIsIFwidW5pdFwiOiBcInBpZWNlc1wiLCBcInN1Y2Nlc3NcIjogdHJ1ZSB9LFxuICogICAgICAgeyBcImludmVudG9yeV9pdGVtX2lkXCI6IFwiLi4uXCIsIFwicXVhbnRpdHlcIjogMywgXCJ1bml0XCI6IFwicGllY2VzXCIsIFwic3VjY2Vzc1wiOiB0cnVlIH1cbiAqICAgICBdLFxuICogICAgIFwiaW52ZW50b3J5X2FmdGVyXCI6IFsuLi5dXG4gKiAgIH0sXG4gKiAgIFwibWVzc2FnZVwiOiBcIkdyZWF0IGpvYiEgMiBpdGVtcyBkZWR1Y3RlZCBmcm9tIGludmVudG9yeS5cIlxuICogfVxuICovXG5yb3V0ZXIucG9zdCgnL2NvbXBsZXRlJywgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgc2Vzc2lvbl9pZCwgZGVkdWN0aW9uX2NvbmZpcm1lZCB9ID0gcmVxLmJvZHk7XG5cbiAgICAvLyBWYWxpZGF0ZSBpbnB1dFxuICAgIGlmICghc2Vzc2lvbl9pZCB8fCB0eXBlb2Ygc2Vzc2lvbl9pZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnTWlzc2luZyBvciBpbnZhbGlkIHNlc3Npb25faWQgZmllbGQnLFxuICAgICAgICBkZXRhaWxzOiAnc2Vzc2lvbl9pZCBtdXN0IGJlIGEgc3RyaW5nJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChkZWR1Y3Rpb25fY29uZmlybWVkICE9PSB0cnVlKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ0RlZHVjdGlvbiBub3QgY29uZmlybWVkJyxcbiAgICAgICAgZGV0YWlsczogJ2RlZHVjdGlvbl9jb25maXJtZWQgbXVzdCBiZSB0cnVlIHRvIHByb2NlZWQgd2l0aCBpbnZlbnRvcnkgZGVkdWN0aW9uJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIExvb2sgdXAgY29va2luZyBzZXNzaW9uXG4gICAgY29uc3Qgc2Vzc2lvbiA9IGNvb2tpbmdTZXNzaW9uc1tzZXNzaW9uX2lkXTtcbiAgICBpZiAoIXNlc3Npb24pIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnQ29va2luZyBzZXNzaW9uIG5vdCBmb3VuZCcsXG4gICAgICAgIGRldGFpbHM6IGBTZXNzaW9uICR7c2Vzc2lvbl9pZH0gZG9lcyBub3QgZXhpc3Qgb3IgaGFzIGV4cGlyZWRgLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRGVkdWN0IGVhY2ggaW5ncmVkaWVudCBmcm9tIGludmVudG9yeVxuICAgIGNvbnN0IGRlZHVjdGVkSXRlbXMgPSBbXTtcbiAgICBsZXQgc3VjY2Vzc0NvdW50ID0gMDtcblxuICAgIGZvciAoY29uc3QgaW5ncmVkaWVudCBvZiBzZXNzaW9uLmluZ3JlZGllbnRzX3RvX2RlZHVjdCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gVEFTSyA4IEZJWDogVXNlIHBhcnRpYWwgZGVkdWN0aW9uIHdpdGggcXVhbnRpdHkgdmFsaWRhdGlvblxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGw6XG4gICAgICAgIC8vIC0gQmxvY2sgZGVkdWN0aW9uIGlmIGluc3VmZmljaWVudCBxdWFudGl0eVxuICAgICAgICAvLyAtIENyZWF0ZSByZW1haW5kZXIgaXRlbSBpZiBwYXJ0aWFsIGRlZHVjdGlvblxuICAgICAgICAvLyAtIFByZXNlcnZlIGF1ZGl0IHRyYWlsIHdpdGggZGF0ZV91c2VkXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRlZHVjdEludmVudG9yeVF1YW50aXR5KFxuICAgICAgICAgIGluZ3JlZGllbnQuaW52ZW50b3J5X2l0ZW1faWQsXG4gICAgICAgICAgaW5ncmVkaWVudC5xdWFudGl0eVxuICAgICAgICApO1xuXG4gICAgICAgIGRlZHVjdGVkSXRlbXMucHVzaCh7XG4gICAgICAgICAgaW52ZW50b3J5X2l0ZW1faWQ6IGluZ3JlZGllbnQuaW52ZW50b3J5X2l0ZW1faWQsXG4gICAgICAgICAgcXVhbnRpdHk6IGluZ3JlZGllbnQucXVhbnRpdHksXG4gICAgICAgICAgdW5pdDogaW5ncmVkaWVudC51bml0LFxuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgcmVtYWluZGVyX2l0ZW1faWQ6IHJlc3VsdC5yZW1haW5kZXJfaXRlbV9pZCxcbiAgICAgICAgfSk7XG4gICAgICAgIHN1Y2Nlc3NDb3VudCsrO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIGRlZHVjdCBpbmdyZWRpZW50ICR7aW5ncmVkaWVudC5uYW1lfTpgLCBlcnJvcik7XG4gICAgICAgIGNvbnN0IGVycm9yTXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuXG4gICAgICAgIC8vIFRBU0sgOCBGSVg6IERpc3Rpbmd1aXNoIGJldHdlZW4gaW5zdWZmaWNpZW50IHF1YW50aXR5ICh1c2VyIGVycm9yKSBhbmQgc3lzdGVtIGVycm9yc1xuICAgICAgICBjb25zdCBpc0luc3VmZmljaWVudFF1YW50aXR5ID0gZXJyb3JNc2cuaW5jbHVkZXMoJ0luc3VmZmljaWVudCBxdWFudGl0eScpO1xuXG4gICAgICAgIGRlZHVjdGVkSXRlbXMucHVzaCh7XG4gICAgICAgICAgaW52ZW50b3J5X2l0ZW1faWQ6IGluZ3JlZGllbnQuaW52ZW50b3J5X2l0ZW1faWQsXG4gICAgICAgICAgcXVhbnRpdHk6IGluZ3JlZGllbnQucXVhbnRpdHksXG4gICAgICAgICAgdW5pdDogaW5ncmVkaWVudC51bml0LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIHJlYXNvbjogZXJyb3JNc2csXG4gICAgICAgICAgZXJyb3JfdHlwZTogaXNJbnN1ZmZpY2llbnRRdWFudGl0eSA/ICdpbnN1ZmZpY2llbnRfcXVhbnRpdHknIDogJ3N5c3RlbV9lcnJvcicsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZldGNoIHVwZGF0ZWQgaW52ZW50b3J5XG4gICAgY29uc3QgaW52ZW50b3J5QWZ0ZXIgPSBhd2FpdCBnZXRJbnZlbnRvcnkoKTtcblxuICAgIC8vIENsZWFuIHVwIHNlc3Npb25cbiAgICBkZWxldGUgY29va2luZ1Nlc3Npb25zW3Nlc3Npb25faWRdO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgZGF0YToge1xuICAgICAgICByZWNpcGVfbmFtZTogc2Vzc2lvbi5yZWNpcGUubmFtZSxcbiAgICAgICAgZGVkdWN0ZWRfaXRlbXM6IGRlZHVjdGVkSXRlbXMsXG4gICAgICAgIGludmVudG9yeV9hZnRlcjogaW52ZW50b3J5QWZ0ZXIsXG4gICAgICB9LFxuICAgICAgbWVzc2FnZTogYEdyZWF0IGpvYiEgJHtzdWNjZXNzQ291bnR9IGluZ3JlZGllbnQocykgZGVkdWN0ZWQgZnJvbSBpbnZlbnRvcnkuYCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBQT1NUIC9hcGkvY29va2luZy9jb21wbGV0ZTonLCBlcnJvcik7XG5cbiAgICBjb25zdCBlcnJvck1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcblxuICAgIGlmIChlcnJvck1zZy5pbmNsdWRlcygnU1VQQUJBU0UnKSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdEYXRhYmFzZSBlcnJvcicsXG4gICAgICAgIGRldGFpbHM6IGVycm9yTXNnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gY29tcGxldGUgY29va2luZycsXG4gICAgICBkZXRhaWxzOiBlcnJvck1zZyxcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8qKlxuICogUE9TVCAvYXBpL2Nvb2tpbmcvY29uZmlybS1hZGp1c3RtZW50c1xuICogVGFzayA3OiBQYXJzZSBhbmQgYXBwbHkgdXNlciByZWNpcGUgYWRqdXN0bWVudHMgYmVmb3JlIGNvb2tpbmdcbiAqXG4gKiBVc2VyIHByb3ZpZGVzIG5hdHVyYWwgbGFuZ3VhZ2UgYWRqdXN0bWVudHMgdG8gcmVjaXBlIGluIHRoZSBjb29raW5nIGNvbmZpcm1hdGlvbiBmbG93LlxuICogVGhpcyBlbmRwb2ludCBwYXJzZXMgdGhvc2UgYWRqdXN0bWVudHMgYW5kIHVwZGF0ZXMgdGhlIHJlY2lwZSBhY2NvcmRpbmdseS5cbiAqXG4gKiBSZXF1ZXN0IGJvZHk6XG4gKiB7XG4gKiAgIFwic2Vzc2lvbl9pZFwiOiBcImNvb2tpbmctc2Vzc2lvbi11dWlkXCIsXG4gKiAgIFwidXNlcl9pbnB1dFwiOiBcIkkgb25seSBoYXZlIDMwMGcgZmxvdXIsIG1pbGsgaXMgZ29uZSBvZmYsIDYgZWdnc1wiXG4gKiB9XG4gKlxuICogUmVzcG9uc2U6XG4gKiB7XG4gKiAgIFwiZGF0YVwiOiB7XG4gKiAgICAgXCJhZGp1c3RtZW50c1wiOiBbXG4gKiAgICAgICB7IHR5cGU6ICdxdWFudGl0eScsIGluZ3JlZGllbnQ6ICdmbG91cicsIHF1YW50aXR5OiAzMDAsIHVuaXQ6ICdnJywgY29uZmlkZW5jZTogJ2V4YWN0JyB9LFxuICogICAgICAgeyB0eXBlOiAncmVtb3ZhbCcsIGluZ3JlZGllbnQ6ICdtaWxrJywgcmVhc29uOiAnZ29uZV9vZmYnIH0sXG4gKiAgICAgICB7IHR5cGU6ICdxdWFudGl0eScsIGluZ3JlZGllbnQ6ICdlZ2dzJywgcXVhbnRpdHk6IDYsIHVuaXQ6ICdwaWVjZXMnLCBjb25maWRlbmNlOiAnZXhhY3QnIH1cbiAqICAgICBdLFxuICogICAgIFwicmVjaXBlXCI6IHsgdXBkYXRlZCByZWNpcGUgZGV0YWlscyB9LFxuICogICAgIFwiaW5ncmVkaWVudHNfdG9fZGVkdWN0XCI6IFt1cGRhdGVkIGRlZHVjdGlvbiBsaXN0XVxuICogICB9LFxuICogICBcIm1lc3NhZ2VcIjogXCJBZGp1c3RtZW50cyBwYXJzZWQgYW5kIGFwcGxpZWQuIFJlYWR5IHRvIGNvb2shXCJcbiAqIH1cbiAqL1xucm91dGVyLnBvc3QoJy9jb25maXJtLWFkanVzdG1lbnRzJywgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgc2Vzc2lvbl9pZCwgdXNlcl9pbnB1dCB9ID0gcmVxLmJvZHk7XG5cbiAgICAvLyBWYWxpZGF0ZSBpbnB1dFxuICAgIGlmICghc2Vzc2lvbl9pZCB8fCB0eXBlb2Ygc2Vzc2lvbl9pZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnTWlzc2luZyBvciBpbnZhbGlkIHNlc3Npb25faWQgZmllbGQnLFxuICAgICAgICBkZXRhaWxzOiAnc2Vzc2lvbl9pZCBtdXN0IGJlIGEgc3RyaW5nJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghdXNlcl9pbnB1dCB8fCB0eXBlb2YgdXNlcl9pbnB1dCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnTWlzc2luZyBvciBpbnZhbGlkIHVzZXJfaW5wdXQgZmllbGQnLFxuICAgICAgICBkZXRhaWxzOiAndXNlcl9pbnB1dCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZycsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBMb29rIHVwIGNvb2tpbmcgc2Vzc2lvblxuICAgIGNvbnN0IHNlc3Npb24gPSBjb29raW5nU2Vzc2lvbnNbc2Vzc2lvbl9pZF07XG4gICAgaWYgKCFzZXNzaW9uKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICBlcnJvcjogJ0Nvb2tpbmcgc2Vzc2lvbiBub3QgZm91bmQnLFxuICAgICAgICBkZXRhaWxzOiBgU2Vzc2lvbiAke3Nlc3Npb25faWR9IGRvZXMgbm90IGV4aXN0IG9yIGhhcyBleHBpcmVkYCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFBhcnNlIHVzZXIgYWRqdXN0bWVudHMgdXNpbmcgTExNXG4gICAgY29uc3QgYWRqdXN0bWVudHMgPSBhd2FpdCBwYXJzZVJlY2lwZUFkanVzdG1lbnRzKHVzZXJfaW5wdXQsIHtcbiAgICAgIGluZ3JlZGllbnRzOiBzZXNzaW9uLnJlY2lwZS5pbmdyZWRpZW50cyxcbiAgICB9KTtcblxuICAgIC8vIEFwcGx5IGFkanVzdG1lbnRzIHRvIHJlY2lwZVxuICAgIGxldCB1cGRhdGVkUmVjaXBlID0geyAuLi5zZXNzaW9uLnJlY2lwZSB9O1xuICAgIGxldCB1cGRhdGVkSW5ncmVkaWVudHMgPSBbLi4udXBkYXRlZFJlY2lwZS5pbmdyZWRpZW50c107XG5cbiAgICBmb3IgKGNvbnN0IGFkanVzdG1lbnQgb2YgYWRqdXN0bWVudHMpIHtcbiAgICAgIGlmIChhZGp1c3RtZW50LnR5cGUgPT09ICdxdWFudGl0eScpIHtcbiAgICAgICAgLy8gVXBkYXRlIGluZ3JlZGllbnQgcXVhbnRpdHlcbiAgICAgICAgY29uc3QgaW5ncmVkaWVudEluZGV4ID0gdXBkYXRlZEluZ3JlZGllbnRzLmZpbmRJbmRleChcbiAgICAgICAgICAoaW5nKSA9PiBpbmcubmFtZS50b0xvd2VyQ2FzZSgpID09PSBhZGp1c3RtZW50LmluZ3JlZGllbnQudG9Mb3dlckNhc2UoKVxuICAgICAgICApO1xuICAgICAgICBpZiAoaW5ncmVkaWVudEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgIHVwZGF0ZWRJbmdyZWRpZW50c1tpbmdyZWRpZW50SW5kZXhdID0ge1xuICAgICAgICAgICAgLi4udXBkYXRlZEluZ3JlZGllbnRzW2luZ3JlZGllbnRJbmRleF0sXG4gICAgICAgICAgICBxdWFudGl0eTogYWRqdXN0bWVudC5xdWFudGl0eSB8fCB1cGRhdGVkSW5ncmVkaWVudHNbaW5ncmVkaWVudEluZGV4XS5xdWFudGl0eSxcbiAgICAgICAgICAgIHVuaXQ6IGFkanVzdG1lbnQudW5pdCB8fCB1cGRhdGVkSW5ncmVkaWVudHNbaW5ncmVkaWVudEluZGV4XS51bml0LFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYWRqdXN0bWVudC50eXBlID09PSAncmVtb3ZhbCcpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhpcyBpcyBhIGNyaXRpY2FsIGluZ3JlZGllbnRcbiAgICAgICAgY29uc3QgaXNDcml0aWNhbCA9IGF3YWl0IGlzSW5ncmVkaWVudENyaXRpY2FsKGFkanVzdG1lbnQuaW5ncmVkaWVudCwgc2Vzc2lvbi5yZWNpcGUpO1xuXG4gICAgICAgIC8vIFN0b3JlIHdhcm5pbmcgaW4gYWRqdXN0bWVudCByZXNwb25zZSBmb3IgZnJvbnRlbmRcbiAgICAgICAgaWYgKGlzQ3JpdGljYWwpIHtcbiAgICAgICAgICAoYWRqdXN0bWVudCBhcyBhbnkpLndhcm5pbmcgPSBgXHUyNkEwXHVGRTBGIFRoaXMgaXMgYSBjcml0aWNhbCBpbmdyZWRpZW50LiBSZWNpcGUgbWF5IG5vdCB3b3JrIHdpdGhvdXQgJHthZGp1c3RtZW50LmluZ3JlZGllbnR9LmA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgaW5ncmVkaWVudCBmcm9tIHJlY2lwZVxuICAgICAgICB1cGRhdGVkSW5ncmVkaWVudHMgPSB1cGRhdGVkSW5ncmVkaWVudHMuZmlsdGVyKFxuICAgICAgICAgIChpbmcpID0+IGluZy5uYW1lLnRvTG93ZXJDYXNlKCkgIT09IGFkanVzdG1lbnQuaW5ncmVkaWVudC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKGFkanVzdG1lbnQudHlwZSA9PT0gJ3N1YnN0aXR1dGlvbicpIHtcbiAgICAgICAgLy8gUmVwbGFjZSBpbmdyZWRpZW50XG4gICAgICAgIGNvbnN0IGluZ3JlZGllbnRJbmRleCA9IHVwZGF0ZWRJbmdyZWRpZW50cy5maW5kSW5kZXgoXG4gICAgICAgICAgKGluZykgPT4gaW5nLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gYWRqdXN0bWVudC5pbmdyZWRpZW50LnRvTG93ZXJDYXNlKClcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGluZ3JlZGllbnRJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICB1cGRhdGVkSW5ncmVkaWVudHNbaW5ncmVkaWVudEluZGV4XSA9IHtcbiAgICAgICAgICAgIC4uLnVwZGF0ZWRJbmdyZWRpZW50c1tpbmdyZWRpZW50SW5kZXhdLFxuICAgICAgICAgICAgbmFtZTogYWRqdXN0bWVudC5zdWJzdGl0dXRlX3dpdGggfHwgdXBkYXRlZEluZ3JlZGllbnRzW2luZ3JlZGllbnRJbmRleF0ubmFtZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHJlY2lwZSB3aXRoIGFkanVzdGVkIGluZ3JlZGllbnRzXG4gICAgdXBkYXRlZFJlY2lwZS5pbmdyZWRpZW50cyA9IHVwZGF0ZWRJbmdyZWRpZW50cztcblxuICAgIC8vIFJlZ2VuZXJhdGUgaW5zdHJ1Y3Rpb25zIHdpdGggYWRqdXN0ZWQgcmVjaXBlXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRJbnZlbnRvcnkgPSBhd2FpdCBnZXRJbnZlbnRvcnkoKTtcbiAgICAgIHVwZGF0ZWRSZWNpcGUgPSBhd2FpdCBnZW5lcmF0ZVJlY2lwZURldGFpbChcbiAgICAgICAgdXBkYXRlZFJlY2lwZS5uYW1lLFxuICAgICAgICB1cGRhdGVkUmVjaXBlLmRlc2NyaXB0aW9uLFxuICAgICAgICBjdXJyZW50SW52ZW50b3J5XG4gICAgICApO1xuICAgICAgLy8gUHJlc2VydmUgdGhlIGFkanVzdGVkIGluZ3JlZGllbnRzIGluIHRoZSByZWdlbmVyYXRlZCByZWNpcGVcbiAgICAgIHVwZGF0ZWRSZWNpcGUuaW5ncmVkaWVudHMgPSB1cGRhdGVkSW5ncmVkaWVudHM7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIElmIHJlZ2VuZXJhdGlvbiBmYWlscywga2VlcCB0aGUgYWRqdXN0ZWQgaW5ncmVkaWVudHNcbiAgICAgIGNvbnNvbGUud2FybignQ291bGQgbm90IHJlZ2VuZXJhdGUgcmVjaXBlIGluc3RydWN0aW9uczonLCBlcnJvcik7XG4gICAgICB1cGRhdGVkUmVjaXBlLmluZ3JlZGllbnRzID0gdXBkYXRlZEluZ3JlZGllbnRzO1xuICAgIH1cblxuICAgIC8vIE1hcCB1cGRhdGVkIHJlY2lwZSBpbmdyZWRpZW50cyB0byBpbnZlbnRvcnkgZm9yIGRlZHVjdGlvblxuICAgIGNvbnN0IGN1cnJlbnRJbnZlbnRvcnkgPSBhd2FpdCBnZXRJbnZlbnRvcnkoKTtcbiAgICBjb25zdCBpbmdyZWRpZW50c1RvRGVkdWN0ID0gdXBkYXRlZFJlY2lwZS5pbmdyZWRpZW50cy5tYXAoKGluZ3JlZGllbnQpID0+IHtcbiAgICAgIGNvbnN0IGludmVudG9yeUl0ZW0gPSBjdXJyZW50SW52ZW50b3J5LmZpbmQoXG4gICAgICAgIChpdGVtKSA9PlxuICAgICAgICAgIGl0ZW0ubmFtZS50b0xvd2VyQ2FzZSgpID09PSBpbmdyZWRpZW50Lm5hbWUudG9Mb3dlckNhc2UoKSB8fFxuICAgICAgICAgIGl0ZW0uY2Fub25pY2FsX25hbWU/LnRvTG93ZXJDYXNlKCkgPT09IGluZ3JlZGllbnQubmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICApO1xuXG4gICAgICBpZiAoIWludmVudG9yeUl0ZW0pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBBZGp1c3RlZCByZWNpcGUgaW5ncmVkaWVudCBcIiR7aW5ncmVkaWVudC5uYW1lfVwiIG5vdCBmb3VuZCBpbiBpbnZlbnRvcnkuIGAgK1xuICAgICAgICAgIGBVc2VyIG1heSBoYXZlIHJlbW92ZWQgaXQgZHVyaW5nIGFkanVzdG1lbnQuYFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiBpbmdyZWRpZW50Lm5hbWUsXG4gICAgICAgIHF1YW50aXR5OiB0eXBlb2YgaW5ncmVkaWVudC5xdWFudGl0eSA9PT0gJ3N0cmluZycgPyBwYXJzZUZsb2F0KGluZ3JlZGllbnQucXVhbnRpdHkpIDogaW5ncmVkaWVudC5xdWFudGl0eSxcbiAgICAgICAgdW5pdDogaW5ncmVkaWVudC51bml0LFxuICAgICAgICBpbnZlbnRvcnlfaXRlbV9pZDogaW52ZW50b3J5SXRlbS5pZCxcbiAgICAgICAgY29uZmlkZW5jZTogaW52ZW50b3J5SXRlbS5jb25maWRlbmNlLFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSBzZXNzaW9uIHdpdGggYWRqdXN0ZWQgcmVjaXBlXG4gICAgc2Vzc2lvbi5yZWNpcGUgPSB1cGRhdGVkUmVjaXBlO1xuICAgIHNlc3Npb24uaW5ncmVkaWVudHNfdG9fZGVkdWN0ID0gaW5ncmVkaWVudHNUb0RlZHVjdDtcblxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgc2Vzc2lvbl9pZCxcbiAgICAgICAgYWRqdXN0bWVudHMsXG4gICAgICAgIHJlY2lwZTogdXBkYXRlZFJlY2lwZSxcbiAgICAgICAgaW5ncmVkaWVudHNfdG9fZGVkdWN0OiBpbmdyZWRpZW50c1RvRGVkdWN0LFxuICAgICAgfSxcbiAgICAgIG1lc3NhZ2U6IGAke2FkanVzdG1lbnRzLmxlbmd0aH0gYWRqdXN0bWVudChzKSBhcHBsaWVkLiBSZWFkeSB0byBjb29rIWAsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gUE9TVCAvYXBpL2Nvb2tpbmcvY29uZmlybS1hZGp1c3RtZW50czonLCBlcnJvcik7XG5cbiAgICBjb25zdCBlcnJvck1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcblxuICAgIGlmIChlcnJvck1zZy5pbmNsdWRlcygnbm90IGZvdW5kIGluIGludmVudG9yeScpKSB7XG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ0FkanVzdGVkIHJlY2lwZSB2YWxpZGF0aW9uIGZhaWxlZCcsXG4gICAgICAgIGRldGFpbHM6IGVycm9yTXNnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gY29uZmlybSBhZGp1c3RtZW50cycsXG4gICAgICBkZXRhaWxzOiBlcnJvck1zZyxcbiAgICB9KTtcbiAgfVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBWU8sU0FBUyxpQkFBaUIsZ0JBQWdDO0FBQy9ELFFBQU0sWUFBWSxlQUFlLFlBQVk7QUFHN0MsTUFBSSxtQkFBbUIsU0FBUyxHQUFHO0FBQ2pDLFdBQU8sbUJBQW1CLFNBQVM7QUFBQSxFQUNyQztBQUdBLE1BQUksVUFBVSxTQUFTLE1BQU0sS0FBSyxVQUFVLFNBQVMsT0FBTyxLQUN4RCxVQUFVLFNBQVMsT0FBTyxLQUFLLFVBQVUsU0FBUyxLQUFLLEtBQ3ZELFVBQVUsU0FBUyxPQUFPLEtBQUssVUFBVSxTQUFTLFVBQVUsR0FBRztBQUNqRSxXQUFPO0FBQUEsRUFDVDtBQUVBLE1BQUksVUFBVSxTQUFTLEtBQUssS0FBSyxVQUFVLFNBQVMsUUFBUSxLQUN4RCxVQUFVLFNBQVMsT0FBTyxLQUFLLFVBQVUsU0FBUyxRQUFRLEtBQzFELFVBQVUsU0FBUyxPQUFPLEtBQUssVUFBVSxTQUFTLE9BQU8sS0FDekQsVUFBVSxTQUFTLFFBQVEsR0FBRztBQUNoQyxXQUFPO0FBQUEsRUFDVDtBQUdBLFNBQU87QUFDVDtBQUtPLFNBQVMsbUJBQW1CLGdCQUF3QixNQUFvQjtBQUM3RSxxQkFBbUIsZUFBZSxZQUFZLENBQUMsSUFBSTtBQUNyRDtBQVlPLFNBQVMsbUJBQ2QsY0FDQSxVQUNBLGdCQUNrQjtBQUNsQixRQUFNLGdCQUFnQixpQkFBaUIsY0FBYztBQUNyRCxRQUFNLE1BQU0sT0FBTyxpQkFBaUIsV0FBVyxXQUFXLFlBQVksSUFBSTtBQUcxRSxNQUFJLENBQUMsVUFBVTtBQUNiLFdBQU87QUFBQSxNQUNMLFVBQVU7QUFBQSxNQUNWLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUVB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LE1BQ1AsU0FBUztBQUFBLElBQ1gsQ0FBQztBQUFBLEVBQ0g7QUFDRixDQUFDO0FBRUQsSUFBTyxrQkFBUUY7OztBTGppQmYsSUFBTSxNQUFlLFFBQVE7QUFHN0IsSUFBSSxJQUFJLEtBQUssQ0FBQztBQUNkLElBQUksSUFBSSxRQUFRLEtBQUssQ0FBQztBQUd0QixJQUFJLElBQUksZUFBZSxDQUFDLEtBQWMsUUFBa0I7QUFDdEQsTUFBSSxLQUFLLEVBQUUsUUFBUSxNQUFNLFlBQVcsb0JBQUksS0FBSyxHQUFFLFlBQVksRUFBRSxDQUFDO0FBQ2hFLENBQUM7QUFHRCxJQUFJLElBQUksa0JBQWtCLGlCQUFlO0FBQ3pDLElBQUksSUFBSSxhQUFhLFlBQVU7QUFDL0IsSUFBSSxJQUFJLGdCQUFnQixlQUFhO0FBR3JDLElBQUksSUFBSSxDQUFDLEtBQVUsS0FBYyxRQUFrQjtBQUNqRCxVQUFRLE1BQU0sR0FBRztBQUNqQixNQUFJLE9BQU8sR0FBRyxFQUFFLEtBQUs7QUFBQSxJQUNuQixPQUFPO0FBQUEsSUFDUCxTQUFTLElBQUk7QUFBQSxFQUNmLENBQUM7QUFDSCxDQUFDO0FBRUQsSUFBTyxjQUFROyIsCiAgIm5hbWVzIjogWyJnZXRDYW5vbmljYWxOYW1lIiwgImNvbnZlcnRUb0Nhbm9uaWNhbCIsICJjYWNoZUNhbm9uaWNhbFVuaXQiLCAiZ2V0Q2Fub25pY2FsTmFtZSIsICJkZWR1Y3RlZEl0ZW0iLCAiUm91dGVyIiwgInJvdXRlciIsICJSb3V0ZXIiLCAiUm91dGVyIiwgInJvdXRlciIsICJSb3V0ZXIiLCAiY3VycmVudEludmVudG9yeSJdCn0K
