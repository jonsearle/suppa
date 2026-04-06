/**
 * Frontend type definitions for Suppa
 * Mirrors backend shared types and adds UI-specific types
 */

// ============================================================================
// Backend Data Models
// ============================================================================

export interface User {
  id: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  canonical_name?: string;
  has_item?: boolean;
  quantity_approx?: number;
  unit?: string;
  confidence: 'exact' | 'approximate';
  date_added: string;
  date_used?: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface Recipe {
  name: string;
  description: string;
  time_estimate_mins: number;
}

export interface RecipeDetail {
  name: string;
  description: string;
  time_estimate_mins: number;
  ingredients: Array<{
    name: string;
    quantity: number | string;
    unit: string;
  }>;
  instructions: string[];
}

export interface MealSuggestions {
  recipes: Recipe[];
}

export interface CookingState {
  recipe: RecipeDetail;
  inventory_before: InventoryItem[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface AddInventoryRequest {
  user_input: string;
}

export interface SuggestMealsRequest {
  meal_type: 'breakfast' | 'lunch' | 'dinner';
}

export interface GetRecipeDetailRequest {
  name: string;
  key_ingredients: string[];
  brief_method: string;
}

export interface StartCookingRequest {
  recipe: RecipeDetail;
}

export interface CompleteCookingRequest {
  recipe_name: string;
  ingredients_used: Array<{
    inventory_item_id: string;
    quantity: number;
  }>;
}

export interface ApiError {
  error: string;
  status: number;
  details?: string;
}

export interface ApiSuccess<T> {
  data: T;
  status: 200 | 201;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface UiState {
  currentTab: 'inventory' | 'suggestions' | 'recipe';
  loading: boolean;
  error: string | null;
}

export interface InventoryFormState {
  input: string;
  submitting: boolean;
  error: string | null;
  recentItems: InventoryItem[];
}

export interface SuggestionsState {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  selectedRecipe: Recipe | null;
  recipeDetail: RecipeDetail | null;
}

export interface CookingState {
  recipe: RecipeDetail | null;
  ingredientsToDeduct: InventoryItem[];
  loading: boolean;
  error: string | null;
  sessionId: string | null;
}

export interface CookingConfirmState {
  ingredientsToDeduct: Array<{
    item: InventoryItem;
    confidence: 'exact' | 'approximate';
  }>;
  confirming: boolean;
  error: string | null;
}
