import React, { useState } from 'react';
import { suggestMeals } from '../services/api';
import type { Recipe } from '../types';
import { RecipeCard } from './RecipeCard';

interface ChatProps {
  onSelectRecipe?: (recipe: Recipe) => void;
}

export const Chat: React.FC<ChatProps> = ({ onSelectRecipe }) => {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>(
    'dinner'
  );
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSuggestMeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await suggestMeals(mealType);
      setRecipes(result.recipes);
      setHasSearched(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to get meal suggestions';
      setError(message);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Suggestion Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Get Meal Suggestions</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What meal are you planning?
            </label>
            <div className="flex gap-3">
              {(['breakfast', 'lunch', 'dinner'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mealType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSuggestMeals}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Getting suggestions...' : 'Suggest Meals'}
          </button>
        </div>
      </div>

      {/* Recipes Grid */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="mt-4">Finding great recipes for you...</p>
        </div>
      )}

      {hasSearched && !loading && recipes.length === 0 && !error && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-center">
          <p className="text-yellow-800">
            No meal suggestions available. Try adding more inventory items.
          </p>
        </div>
      )}

      {recipes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {recipes.length} recipe
            {recipes.length !== 1 ? 's' : ''} suggested
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.name}
                recipe={recipe}
                onSelect={() => onSelectRecipe?.(recipe)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
