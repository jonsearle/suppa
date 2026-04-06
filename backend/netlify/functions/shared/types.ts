/**
 * Shared type definitions for Suppa backend and frontend
 * These types mirror the Supabase schema exactly
 */

/**
 * User account record
 */
export interface User {
  id: string;
  created_at: string;
}

/**
 * A food item in user's inventory
 * Items are never deleted, just marked with date_used when consumed
 */
export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  quantity_approx?: number;
  unit?: string;
  date_added: string;
  date_used?: string;
}

/**
 * A single message in the chat history
 * Append-only: never modified after creation
 */
export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

/**
 * A recipe suggestion returned from the meal suggestion API
 * Contains just enough info to display in a card
 */
export interface Recipe {
  name: string;
  time_estimate_mins: number;
  key_ingredients: string[];
  brief_method: string;
}

/**
 * Wrapper for meal suggestions API response
 */
export interface MealSuggestions {
  recipes: Recipe[];
}

/**
 * Full recipe detail with ingredients and step-by-step instructions
 * Extends Recipe with more detailed cooking information
 */
export interface RecipeDetail extends Recipe {
  ingredients: Array<{
    name: string;
    quantity: number | string;
    unit: string;
  }>;
  instructions: string[];
}

/**
 * State snapshot before cooking starts
 * Used to track what was used and adjust inventory after cooking
 */
export interface CookingState {
  recipe: RecipeDetail;
  inventory_before: InventoryItem[];
}

/**
 * Request payload for inventory parsing (from frontend)
 */
export interface AddInventoryRequest {
  user_input: string;
}

/**
 * Request payload for meal suggestions
 */
export interface SuggestMealsRequest {
  meal_type: 'breakfast' | 'lunch' | 'dinner';
}

/**
 * Request payload for recipe detail generation
 */
export interface GetRecipeDetailRequest {
  name: string;
  key_ingredients: string[];
  brief_method: string;
}

/**
 * Request payload for cooking start
 */
export interface StartCookingRequest {
  recipe: RecipeDetail;
}

/**
 * Request payload for marking cooking as complete
 * Contains which ingredients to deduct from inventory
 */
export interface CompleteCookingRequest {
  recipe_name: string;
  ingredients_used: Array<{
    inventory_item_id: string;
    quantity: number;
  }>;
}

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  status: number;
  details?: string;
}

/**
 * Standard success response wrapper
 */
export interface ApiSuccess<T> {
  data: T;
  status: 200 | 201;
}
