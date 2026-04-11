import React, { useState } from 'react';
import type { Recipe, RecipeDetail as RecipeDetailType } from '../types';
import { getRecipeDetail, startCooking } from '../services/api';
import { QuantityAdjustmentChoice } from './QuantityAdjustmentChoice';

interface RecipeDetailProps {
  recipe: Recipe;
  onStartCooking?: (sessionId: string, recipeDetail: RecipeDetailType, ingredients: any[]) => void;
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
  const [showAdjustmentPanel, setShowAdjustmentPanel] = useState(false);
  const [adjustmentInput, setAdjustmentInput] = useState('');
  const [pendingAdjustments, setPendingAdjustments] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [confirming, setConfirming] = useState<{
    adjustment: any;
    inventoryQty: number;
    recipeQty: number;
  } | null>(null);

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

    // If adjustment panel not shown yet, create session and show it
    if (!showAdjustmentPanel) {
      try {
        setStarting(true);
        setError(null);
        const result = await startCooking(detail);
        setSessionId(result.sessionId);
        setShowAdjustmentPanel(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to start cooking';
        setError(message);
      } finally {
        setStarting(false);
      }
    } else {
      // Adjustment panel is shown, proceed to cooking confirmation
      if (!sessionId) return;
      try {
        setStarting(true);
        setError(null);
        // Call the callback to proceed to CookingConfirm
        onStartCooking?.(sessionId, detail, []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to proceed';
        setError(message);
      } finally {
        setStarting(false);
      }
    }
  };

  const handleAdjustmentSubmit = async () => {
    if (!adjustmentInput.trim() || !sessionId) return;

    setAdjustmentLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cooking/confirm-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_input: adjustmentInput
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process adjustments');
      }

      const result = await response.json();
      const adjustments = result.data.adjustments || [];

      // Check for quantity adjustments that need three-button choice
      const quantityAdj = adjustments.find((a: any) => a.type === 'quantity');
      if (quantityAdj) {
        const recipeIngredient = detail?.ingredients.find(
          (i) => i.name.toLowerCase() === quantityAdj.ingredient.toLowerCase()
        );
        if (recipeIngredient) {
          setConfirming({
            adjustment: quantityAdj,
            inventoryQty: quantityAdj.quantity,
            recipeQty: typeof recipeIngredient.quantity === 'string'
              ? parseFloat(recipeIngredient.quantity)
              : recipeIngredient.quantity
          });
        }
      } else {
        setPendingAdjustments(adjustments);
        setAdjustmentInput('');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to process adjustments';
      setError(message);
    } finally {
      setAdjustmentLoading(false);
    }
  };

  const handleAdjustmentChoice = async (choice: 'inventory' | 'recipe' | 'both') => {
    if (!confirming || !sessionId) return;

    setAdjustmentLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cooking/confirm-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_input: adjustmentInput,
          adjustment_type_choice: choice
        })
      });

      if (!response.ok) {
        throw new Error('Failed to apply choice');
      }

      const result = await response.json();
      setPendingAdjustments(result.data.adjustments || []);
      setConfirming(null);
      setAdjustmentInput('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to apply choice';
      setError(message);
    } finally {
      setAdjustmentLoading(false);
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

      {/* Adjustment Panel */}
      {showAdjustmentPanel && (
        <div className="border-t pt-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Make any changes?</h2>

          {/* Three-Button Choice for Quantity Adjustments */}
          {confirming && (
            <div className="mb-4">
              <QuantityAdjustmentChoice
                ingredient={confirming.adjustment.ingredient}
                inventory_quantity={confirming.inventoryQty}
                inventory_unit={confirming.adjustment.unit}
                recipe_quantity={confirming.recipeQty}
                onChoice={handleAdjustmentChoice}
              />
            </div>
          )}

          {/* Adjustment Input */}
          {!confirming && (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Describe any adjustments: quantities you have, ingredients that are unavailable, or substitutions
              </p>
              <textarea
                value={adjustmentInput}
                onChange={(e) => setAdjustmentInput(e.target.value)}
                placeholder="e.g., 'I only have 300g flour, milk's gone off'"
                className="w-full p-3 border rounded-lg mb-3 text-sm"
                rows={3}
                disabled={adjustmentLoading}
              />
              <button
                onClick={handleAdjustmentSubmit}
                disabled={adjustmentLoading || !adjustmentInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-3"
              >
                {adjustmentLoading ? 'Processing...' : 'Check Adjustments'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Pending Adjustments Display */}
      {pendingAdjustments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
          <p className="text-sm font-semibold text-yellow-900 mb-2">Adjustments to apply:</p>
          {pendingAdjustments.map((adj, i) => (
            <div key={i} className="text-sm text-yellow-800 mb-1">
              {adj.type === 'quantity' && `${adj.ingredient}: ${adj.quantity}${adj.unit}`}
              {adj.type === 'removal' && `Remove: ${adj.ingredient}`}
              {adj.type === 'substitution' && `Use ${adj.substitute_with} instead of ${adj.ingredient}`}
              {adj.warning && <div className="text-red-600 font-semibold">{adj.warning}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Start Cooking Button */}
      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={handleStartCooking}
          disabled={starting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-lg"
        >
          {starting ? 'Starting...' : showAdjustmentPanel ? 'Continue to Cooking' : 'Start Cooking'}
        </button>
      </div>
    </div>
  );
};

export default RecipeDetail;
