import React from 'react';

interface QuantityAdjustmentChoiceProps {
  ingredient: string;
  inventory_quantity: number;
  inventory_unit: string;
  recipe_quantity: number;
  onChoice: (choice: 'inventory' | 'recipe' | 'both') => void;
}

export function QuantityAdjustmentChoice({
  ingredient,
  inventory_quantity,
  inventory_unit,
  recipe_quantity,
  onChoice
}: QuantityAdjustmentChoiceProps) {
  return (
    <div className="border p-4 rounded-lg bg-blue-50 mb-4">
      <p className="text-sm font-semibold text-gray-900 mb-2">
        What should we do with {inventory_quantity}{inventory_unit} {ingredient}?
      </p>
      <p className="text-xs text-gray-600 mb-4">
        Recipe originally needs: {recipe_quantity}{inventory_unit}
      </p>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onChoice('inventory')}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
        >
          📝 Update inventory to {inventory_quantity}{inventory_unit}
        </button>
        <button
          onClick={() => onChoice('recipe')}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
        >
          🍳 Use {inventory_quantity}{inventory_unit} in this recipe only
        </button>
        <button
          onClick={() => onChoice('both')}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
        >
          ✓ Both (I have exactly {inventory_quantity}{inventory_unit})
        </button>
      </div>
    </div>
  );
}
