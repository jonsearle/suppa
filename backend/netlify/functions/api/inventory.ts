/**
 * Inventory API endpoints
 *
 * POST /api/inventory - Accept free-form user input, parse with LLM, store items
 * GET /api/inventory - Fetch all active inventory items for current user
 */

import { Router, Request, Response } from 'express';
import { parseInventoryInput } from './utils/prompts.js';
import { getInventory, addInventoryItem, clearInventory } from './utils/db.js';
import { InventoryItem } from '../shared/types.js';

const router = Router();

/**
 * POST /api/inventory
 * Accept free-form inventory input and parse it using LLM
 *
 * Request body:
 * {
 *   "user_input": "3 chicken breasts, 2 tomatoes, some basil"
 * }
 *
 * Response:
 * {
 *   "data": [
 *     {"id": "...", "name": "chicken breast", "quantity_approx": 3, "unit": "pieces", ...},
 *     ...
 *   ]
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_input } = req.body;

    if (!user_input || typeof user_input !== 'string' || !user_input.trim()) {
      return res.status(400).json({
        error: 'Missing or invalid user_input field',
        details: 'user_input must be a non-empty string',
      });
    }

    // Parse the user input using LLM
    const parsedItems = await parseInventoryInput(user_input.trim());

    // Store each parsed item in database (with merge-on-add deduplication)
    const storedItems: InventoryItem[] = [];
    for (const item of parsedItems) {
      try {
        const stored = await addInventoryItem(item);
        storedItems.push(stored);
      } catch (error) {
        console.error(`Failed to store item ${item.name}:`, error);
        // Continue with next item instead of failing entire request
      }
    }

    res.status(201).json({
      data: storedItems,
      count: storedItems.length,
      message: `Parsed and stored ${storedItems.length} inventory items`,
    });
  } catch (error) {
    console.error('Error in POST /api/inventory:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg.includes('SUPABASE') || errorMsg.includes('OPENAI')) {
      return res.status(500).json({
        error: 'Service configuration error',
        details: errorMsg,
      });
    }

    res.status(400).json({
      error: 'Failed to parse inventory',
      details: errorMsg,
    });
  }
});

/**
 * GET /api/inventory
 * Fetch all active inventory items for the current user
 *
 * Query parameters:
 * - limit (optional): Max number of items to return (default: 100)
 *
 * Response:
 * {
 *   "data": [
 *     {"id": "...", "name": "chicken breast", "quantity_approx": 3, "unit": "pieces", ...},
 *     ...
 *   ],
 *   "count": 5
 * }
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const items = await getInventory();

    res.status(200).json({
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error in GET /api/inventory:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);

    res.status(500).json({
      error: 'Failed to fetch inventory',
      details: errorMsg,
    });
  }
});

/**
 * DELETE /api/inventory
 * Clear all active inventory items for the current user.
 * Intended for local/dev testing so the app can be reset quickly.
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const clearedCount = await clearInventory();

    res.status(200).json({
      cleared: clearedCount,
      message: `Cleared ${clearedCount} inventory item${clearedCount === 1 ? '' : 's'}`,
    });
  } catch (error) {
    console.error('Error in DELETE /api/inventory:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);

    res.status(500).json({
      error: 'Failed to clear inventory',
      details: errorMsg,
    });
  }
});

export default router;
