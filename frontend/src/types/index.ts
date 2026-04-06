/**
 * Frontend type definitions for Suppa
 * Mirrors backend shared types
 */

export interface User {
  id: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  quantity_approx?: number;
  unit?: string;
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
  time_estimate_mins: number;
  key_ingredients: string[];
  brief_method: string;
}

export interface RecipeDetail extends Recipe {
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
