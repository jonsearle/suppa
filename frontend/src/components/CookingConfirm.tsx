import React, { useState } from 'react';
import { confirmRecipeAdjustments, completeCooking } from '../services/api';
import type { RecipeDetail } from '../types';

interface CookingConfirmProps {
  sessionId: string;
  recipe: RecipeDetail;
  onComplete: () => void;
  onCancel: () => void;
}

export function CookingConfirm({
  sessionId,
  recipe,
  onComplete,
  onCancel
}: CookingConfirmProps) {
  const [adjustmentInput, setAdjustmentInput] = useState('');
  const [confirmationStep, setConfirmationStep] = useState<'input' | 'deduct'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedRecipe, setUpdatedRecipe] = useState<RecipeDetail>(recipe);
  const [ingredientsToDeduct, setIngredientsToDeduct] = useState<
    Array<{ name: string; quantity: number; unit: string }>
  >([]);

  const handleConfirmAdjustments = async () => {
    if (!adjustmentInput.trim()) {
      // No adjustments, go straight to deduction with original recipe
      setConfirmationStep('deduct');
      setIngredientsToDeduct(recipe.ingredients as any);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await confirmRecipeAdjustments(sessionId, adjustmentInput.trim());

      setUpdatedRecipe(result.recipe);
      setIngredientsToDeduct(result.ingredients_to_deduct);
      setConfirmationStep('deduct');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm adjustments');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDeduction = async () => {
    setLoading(true);
    setError(null);

    try {
      await completeCooking(sessionId, recipe.name, []);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete cooking');
    } finally {
      setLoading(false);
    }
  };

  // Input step
  if (confirmationStep === 'input') {
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded">
        <h2 className="text-lg font-semibold">Review Recipe</h2>

        <div className="bg-white p-3 rounded border">
          <h3 className="font-semibold mb-2">{recipe.name}</h3>
          <div className="space-y-1 text-sm">
            <div>
              <strong>Time:</strong> {recipe.time_estimate_mins} mins
            </div>
            <div>
              <strong>Ingredients:</strong>
            </div>
            <ul className="list-disc list-inside ml-2">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx}>
                  {ing.name}: {ing.quantity}
                  {ing.unit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium">Want to make any adjustments?</span>
            <span className="text-xs text-gray-500 block mt-1">
              Describe quantities you actually have, ingredients that are gone off, or
              substitutions
            </span>
            <textarea
              value={adjustmentInput}
              onChange={(e) => setAdjustmentInput(e.target.value)}
              placeholder='Examples: "I only have 300g flour", "milk is gone off", "use cod instead of chicken"'
              className="w-full p-2 border rounded mt-1 text-sm"
              rows={3}
              disabled={loading}
            />
          </label>
        </div>

        {error && (
          <div className="p-2 bg-red-100 text-red-800 rounded text-sm">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleConfirmAdjustments}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Deduction step - confirm and deduct from inventory
  if (confirmationStep === 'deduct') {
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded">
        <h2 className="text-lg font-semibold">Ready to Cook?</h2>

        <p className="text-sm text-gray-600">We'll deduct the following from your inventory:</p>

        <div className="space-y-2 bg-white p-3 rounded border">
          {ingredientsToDeduct.map((ing, idx) => (
            <div key={idx} className="text-sm">
              ✓ {ing.quantity}
              {ing.unit} {ing.name}
            </div>
          ))}
        </div>

        {error && (
          <div className="p-2 bg-red-100 text-red-800 rounded text-sm">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleCompleteDeduction}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Completing...' : 'Complete & Deduct'}
          </button>
          <button
            onClick={() => setConfirmationStep('input')}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default CookingConfirm;
