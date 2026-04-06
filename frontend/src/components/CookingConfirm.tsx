import React, { useState } from 'react';
import { completeCooking } from '../services/api';
import type { InventoryItem } from '../types';

interface CookingConfirmProps {
  sessionId: string;
  recipeName: string;
  ingredientsToDeduct: InventoryItem[];
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const CookingConfirm: React.FC<CookingConfirmProps> = ({
  sessionId,
  recipeName,
  ingredientsToDeduct,
  onConfirm,
  onCancel,
}) => {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatQuantity = (item: InventoryItem): string => {
    if (item.quantity_approx !== undefined && item.unit) {
      return `${item.quantity_approx} ${item.unit}`;
    }
    if (item.quantity_approx !== undefined) {
      return String(item.quantity_approx);
    }
    return 'Yes';
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      setError(null);

      // Create ingredients_used array from ingredientsToDeduct
      const ingredientsUsed = ingredientsToDeduct.map((item) => ({
        inventory_item_id: item.id,
        quantity: item.quantity_approx || 0,
      }));

      await completeCooking(sessionId, recipeName, ingredientsUsed);
      onConfirm?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to complete cooking';
      setError(message);
    } finally {
      setConfirming(false);
    }
  };

  const approximateItems = ingredientsToDeduct.filter(
    (item) => item.confidence === 'approximate'
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6 max-w-md mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Confirm Ingredients Used
        </h2>
        <p className="text-gray-600 mt-2">
          Review and confirm the ingredients we'll deduct from your inventory.
        </p>
      </div>

      {/* Ingredients List */}
      <div className="space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
        {ingredientsToDeduct.map((item) => {
          const isApproximate = item.confidence === 'approximate';
          return (
            <div
              key={item.id}
              className={`p-3 rounded-lg border ${
                isApproximate
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-green-300 bg-green-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatQuantity(item)}
                  </p>
                </div>
                {isApproximate && (
                  <div className="flex-shrink-0 ml-2">
                    <span className="inline-block px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded">
                      ⚠️ Approx
                    </span>
                  </div>
                )}
              </div>
              {isApproximate && (
                <p className="text-xs text-yellow-700 mt-2">
                  You said "{item.name}" without exact quantity. Verify this
                  amount is correct.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Warning if any approximate items */}
      {approximateItems.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="text-yellow-700">
              <p className="font-semibold">Approximate quantities detected</p>
              <p className="text-sm mt-1">
                You have {approximateItems.length} item
                {approximateItems.length !== 1 ? 's' : ''} with estimated
                quantities. Review them carefully before confirming.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={confirming}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {confirming ? 'Confirming...' : 'Confirm & Deduct'}
        </button>
      </div>
    </div>
  );
};

export default CookingConfirm;
