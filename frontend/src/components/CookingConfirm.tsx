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

interface DeductionError {
  itemId: string;
  itemName: string;
  reason: string;
  errorType: 'insufficient_quantity' | 'system_error';
}

export const CookingConfirm: React.FC<CookingConfirmProps> = ({
  sessionId,
  recipeName,
  ingredientsToDeduct,
  onConfirm,
  onCancel,
}) => {
  const [confirming, setConfirming] = useState(false);
  const [deductionErrors, setDeductionErrors] = useState<DeductionError[]>([]);
  const [hasAttempted, setHasAttempted] = useState(false);

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
      setDeductionErrors([]);
      setHasAttempted(false);

      // Create request with deduction_confirmed flag
      const result = await completeCooking(sessionId, recipeName, []);

      // TASK 8 FIX: Check if any deductions failed
      const failedItems = result.deductedItems.filter(item => !item.success);

      if (failedItems.length > 0) {
        // Convert failed items to error format for display
        const errors: DeductionError[] = failedItems.map(item => {
          const originalItem = ingredientsToDeduct.find(
            ing => ing.id === item.inventory_item_id
          );
          return {
            itemId: item.inventory_item_id,
            itemName: originalItem?.name || 'Unknown Item',
            reason: item.reason || 'Unknown error',
            errorType: item.error_type || 'system_error',
          };
        });

        setDeductionErrors(errors);
        setHasAttempted(true);
        return;
      }

      // Success: call onConfirm callback
      onConfirm?.();
    } catch (err) {
      // Network error
      const message =
        err instanceof Error ? err.message : 'Failed to complete cooking';
      setDeductionErrors([
        {
          itemId: 'network',
          itemName: 'Connection Error',
          reason: message,
          errorType: 'system_error',
        },
      ]);
      setHasAttempted(true);
    } finally {
      setConfirming(false);
    }
  };

  const approximateItems = ingredientsToDeduct.filter(
    (item) => item.confidence === 'approximate'
  );

  const hasInsufficientQuantityError = deductionErrors.some(
    e => e.errorType === 'insufficient_quantity'
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
          const hasError = deductionErrors.some(e => e.itemId === item.id);

          return (
            <div
              key={item.id}
              className={`p-3 rounded-lg border ${
                hasError
                  ? 'border-red-300 bg-red-50'
                  : isApproximate
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
                <div className="flex-shrink-0 ml-2 flex gap-1">
                  {hasError && (
                    <span className="inline-block px-2 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded">
                      ❌ Error
                    </span>
                  )}
                  {isApproximate && !hasError && (
                    <span className="inline-block px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded">
                      ⚠️ Approx
                    </span>
                  )}
                </div>
              </div>
              {hasError && (
                <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                  {deductionErrors.find(e => e.itemId === item.id)?.reason}
                </div>
              )}
              {isApproximate && !hasError && (
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
      {approximateItems.length > 0 && deductionErrors.length === 0 && (
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

      {/* TASK 8 FIX: Error summary for deduction failures */}
      {hasAttempted && deductionErrors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="text-red-700">
              <p className="font-semibold">
                {hasInsufficientQuantityError
                  ? 'Insufficient Inventory'
                  : 'Deduction Failed'}
              </p>
              <p className="text-sm mt-1">
                {hasInsufficientQuantityError
                  ? `You don't have enough of ${deductionErrors
                      .filter(e => e.errorType === 'insufficient_quantity')
                      .map(e => e.itemName)
                      .join(', ')}. `
                  : 'An error occurred while deducting ingredients. '}
                {hasInsufficientQuantityError
                  ? 'Add more items to your inventory or choose a different recipe.'
                  : 'Please try again.'}
              </p>
              {deductionErrors.length > 0 && (
                <ul className="text-sm mt-2 space-y-1">
                  {deductionErrors.map(error => (
                    <li key={error.itemId} className="text-xs">
                      • <span className="font-medium">{error.itemName}:</span>{' '}
                      {error.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={confirming}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
        >
          {hasAttempted && deductionErrors.length > 0 ? 'Go Back' : 'Cancel'}
        </button>
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {confirming
            ? 'Confirming...'
            : hasAttempted && deductionErrors.length > 0
            ? 'Retry'
            : 'Confirm & Deduct'}
        </button>
      </div>
    </div>
  );
};

export default CookingConfirm;
