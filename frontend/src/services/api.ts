/**
 * Frontend API client for Suppa backend
 * Wraps axios for HTTP communication with backend endpoints
 */

import axios from 'axios';
import type {
  Recipe,
  RecipeDetail,
  InventoryItem,
  ChatMessage,
  MealSuggestions,
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8888';

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Parse user inventory input and add items to database
 */
export async function addInventory(userInput: string): Promise<InventoryItem[]> {
  const response = await client.post('/api/inventory', {
    user_input: userInput,
  });
  return response.data.items;
}

/**
 * Get current active inventory for the user
 */
export async function getInventory(): Promise<InventoryItem[]> {
  const response = await client.get('/api/inventory');
  return response.data.items;
}

/**
 * Get meal suggestions for given inventory and meal type
 */
export async function suggestMeals(
  mealType: 'breakfast' | 'lunch' | 'dinner'
): Promise<MealSuggestions> {
  const response = await client.post('/api/chat', {
    message: `Suggest ${mealType} meals`,
    meal_type: mealType,
  });
  return {
    recipes: response.data.recipes || [],
  };
}

/**
 * Get detailed recipe for a specific meal
 */
export async function getRecipeDetail(
  recipeName: string,
  keyIngredients: string[],
  briefMethod: string
): Promise<RecipeDetail> {
  const response = await client.post('/api/chat', {
    message: `Detailed recipe for ${recipeName}`,
    recipe_request: {
      name: recipeName,
      key_ingredients: keyIngredients,
      brief_method: briefMethod,
    },
  });
  return response.data.recipe;
}

/**
 * Send a chat message and get a response
 */
export async function sendChatMessage(message: string): Promise<ChatMessage> {
  const response = await client.post('/api/chat', {
    message,
  });
  return response.data.message;
}

/**
 * Mark cooking as started (for tracking purposes)
 */
export async function startCooking(recipeName: string): Promise<void> {
  await client.post('/api/cooking/start', {
    recipe_name: recipeName,
  });
}

/**
 * Mark cooking as complete and deduct ingredients from inventory
 */
export async function completeCooking(
  recipeName: string,
  ingredientsUsed: Array<{ inventory_item_id: string; quantity: number }>
): Promise<void> {
  await client.post('/api/cooking/complete', {
    recipe_name: recipeName,
    ingredients_used: ingredientsUsed,
  });
}

export default client;
