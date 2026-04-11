import React, { useState, useEffect } from 'react';
import { addInventory, clearInventory, getInventory } from '../services/api';
import type { InventoryItem } from '../types';

interface InventoryFormProps {
  onInventoryUpdate?: (items: InventoryItem[]) => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({ onInventoryUpdate }) => {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial inventory on mount
  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await getInventory();
      setInventory(items);
      onInventoryUpdate?.(items);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load inventory';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      setError('Please enter some items');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const newItems = await addInventory(input);
      setInput('');
      // Reload full inventory after adding items
      await loadInventory();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add inventory';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearInventory = async () => {
    const confirmed = window.confirm(
      'Clear all current inventory items for testing? This will reset the inventory list.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setClearing(true);
      setError(null);
      await clearInventory();
      await loadInventory();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to clear inventory';
      setError(message);
    } finally {
      setClearing(false);
    }
  };

  const formatQuantity = (item: InventoryItem): string => {
    if (item.quantity_approx !== undefined && item.unit) {
      return `${item.quantity_approx} ${item.unit}`;
    }
    if (item.quantity_approx !== undefined) {
      return String(item.quantity_approx);
    }
    return 'Yes';
  };

  const activeItems = inventory.filter(item => !item.date_used);

  return (
    <div className="space-y-6">
      {/* Add Inventory Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Add Items to Inventory</h2>
        <p className="text-gray-600 text-sm mb-4">
          Describe what you have available. Examples: "3 chicken breasts, some
          tomatoes", "2 cups rice, salt, pepper"
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="I have..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={submitting}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !input.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {submitting ? 'Adding...' : 'Add Items'}
          </button>
        </form>
      </div>

      {/* Current Inventory */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">
            Current Inventory ({activeItems.length})
          </h2>
          <button
            type="button"
            onClick={handleClearInventory}
            disabled={loading || clearing}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {clearing ? 'Clearing Inventory...' : 'Clear Inventory for Testing'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : activeItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No inventory yet</p>
            <p className="text-sm">Add some items to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatQuantity(item)}
                    {item.confidence === 'approximate' && (
                      <span className="ml-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        Approx
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-xs text-gray-400 ml-4">
                  {item.date_added ? new Date(item.date_added).toLocaleDateString() : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryForm;
