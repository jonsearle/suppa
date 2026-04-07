/**
 * Frontend API client for Suppa backend
 * Handles HTTP communication with backend endpoints
 * Provides error handling and response parsing
 */

import type {
  Recipe,
  RecipeDetail,
  InventoryItem,
  MealSuggestions,
} from '../types';

// Use environment variable or default to local dev server
// In production (Netlify), use relative URLs which route to /.netlify/functions/api via redirects
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8888';
const getBaseURL = () => {
  // In production on Netlify, use relative URLs to leverage netlify.toml redirects
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '';
  }
  return API_URL;
};

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Helper function to handle fetch responses and errors
 */
async function fetchWithErrorHandling(
  endpoint: string,
  options: RequestInit
): Promise<any> {
  try {
    const baseURL = getBaseURL();
    const response = await fetch(`${baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data.error ||
        data.message ||
        `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data.details);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new ApiError(
        'Connection failed. Is the backend running?',
        0,
        error.message
      );
    }
    throw new ApiError(
      'An unexpected error occurred',
      0,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Parse user inventory input and add items to database
 * @throws ApiError on network or server errors
 */
export async function addInventory(userInput: string): Promise<InventoryItem[]> {
  const data = await fetchWithErrorHandling('/api/inventory', {
    method: 'POST',
    body: JSON.stringify({ user_input: userInput }),
  });
  return data.items || [];
}

/**
 * Get current active inventory for the user
 * @throws ApiError on network or server errors
 */
export async function getInventory(): Promise<InventoryItem[]> {
  const data = await fetchWithErrorHandling('/api/inventory', {
    method: 'GET',
  });
  return data.items || [];
}

/**
 * Get meal suggestions for given inventory and meal type
 * @throws ApiError on network or server errors
 */
export async function suggestMeals(
  mealType: 'breakfast' | 'lunch' | 'dinner'
): Promise<MealSuggestions> {
  const data = await fetchWithErrorHandling('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: `Suggest ${mealType} meals`,
      meal_type: mealType,
    }),
  });
  return {
    recipes: data.recipes || [],
  };
}

/**
 * Get detailed recipe for a specific meal
 * @throws ApiError on network or server errors
 */
export async function getRecipeDetail(recipe: Recipe): Promise<RecipeDetail> {
  const data = await fetchWithErrorHandling('/api/cooking/detail', {
    method: 'POST',
    body: JSON.stringify({
      recipe_name: recipe.name,
      recipe_description: recipe.description,
      recipe_time_mins: recipe.time_estimate_mins,
    }),
  });
  return data.recipe || data.data;
}

/**
 * Start cooking - returns ingredients to be deducted
 * @throws ApiError on network or server errors
 */
export async function startCooking(
  recipe: RecipeDetail
): Promise<{
  sessionId: string;
  ingredientsToDeduct: InventoryItem[];
}> {
  const data = await fetchWithErrorHandling('/api/cooking/start', {
    method: 'POST',
    body: JSON.stringify({
      recipe_name: recipe.name,
      recipe_description: recipe.description,
      recipe_time_mins: recipe.time_estimate_mins,
    }),
  });
  return {
    sessionId: data.data.session_id,
    ingredientsToDeduct: data.data.ingredients_to_deduct || [],
  };
}

/**
 * Complete cooking and deduct ingredients from inventory
 * TASK 8 FIX: Returns detailed deduction results instead of void
 * @throws ApiError on network or server errors
 */
export async function completeCooking(
  sessionId: string,
  recipeName: string,
  ingredientsUsed: Array<{ inventory_item_id: string; quantity: number }>
): Promise<{
  recipeName: string;
  deductedItems: Array<{
    inventory_item_id: string;
    quantity: number;
    unit: string;
    success: boolean;
    reason?: string;
    error_type?: 'insufficient_quantity' | 'system_error';
  }>;
  inventoryAfter: InventoryItem[];
}> {
  const data = await fetchWithErrorHandling('/api/cooking/complete', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      deduction_confirmed: true,
    }),
  });
  return {
    recipeName: data.data.recipe_name,
    deductedItems: data.data.deducted_items || [],
    inventoryAfter: data.data.inventory_after || [],
  };
}

export { ApiError };
export default { addInventory, getInventory, suggestMeals, getRecipeDetail, startCooking, completeCooking };
