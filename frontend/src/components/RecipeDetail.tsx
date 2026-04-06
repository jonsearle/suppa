import React, { useState } from 'react';
import type { Recipe, RecipeDetail as RecipeDetailType } from '../types';
import { getRecipeDetail, startCooking } from '../services/api';

interface RecipeDetailProps {
  recipe: Recipe;
  onStartCooking?: (sessionId: string, ingredients: any[]) => void;
  onBack?: () => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onStartCooking,
  onBack,
}) => {
  const [detail, setDetail] = useState<RecipeDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Load recipe details on mount
  React.useEffect(() => {
    loadRecipeDetail();
  }, [recipe.name]);

  const loadRecipeDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const details = await getRecipeDetail(recipe);
      setDetail(details);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load recipe details';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCooking = async () => {
    if (!detail) return;
    try {
      setStarting(true);
      setError(null);
      const result = await startCooking(detail);
      onStartCooking?.(result.sessionId, result.ingredientsToDeduct);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start cooking';
      setError(message);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="mt-4">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            ← Back to Suggestions
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Failed to load recipe'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          ← Back to Suggestions
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{detail.name}</h1>
        <p className="text-gray-600">{detail.description}</p>
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span>⏱️ {detail.time_estimate_mins} minutes</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Ingredients */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h2>
        <ul className="space-y-2">
          {detail.ingredients.map((ingredient, idx) => (
            <li
              key={idx}
              className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span className="text-blue-600 font-semibold mr-3">•</span>
              <div>
                <p className="font-medium text-gray-900">{ingredient.name}</p>
                <p className="text-sm text-gray-600">
                  {ingredient.quantity} {ingredient.unit}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
        <ol className="space-y-3">
          {detail.instructions.map((instruction, idx) => (
            <li key={idx} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                {idx + 1}
              </span>
              <p className="text-gray-700 pt-1">{instruction}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Start Cooking Button */}
      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={handleStartCooking}
          disabled={starting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-lg"
        >
          {starting ? 'Starting...' : 'Start Cooking'}
        </button>
      </div>
    </div>
  );
};

export default RecipeDetail;
