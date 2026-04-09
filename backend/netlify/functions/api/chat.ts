/**
 * Chat/Meal Suggestion API endpoint
 *
 * POST /api/chat - Get meal suggestions for current inventory and meal type
 * This endpoint handles the "Suggestions" tab flow
 */

import { Router, Request, Response } from 'express';
import { suggestMeals } from './utils/prompts';
import { getInventory } from './utils/db';

const router = Router();

/**
 * POST /api/chat
 * Get meal suggestions based on current inventory and meal type
 *
 * Request body:
 * {
 *   "message": "Suggest breakfast meals",
 *   "meal_type": "breakfast" | "lunch" | "dinner"
 * }
 *
 * Response:
 * {
 *   "recipes": [
 *     {
 *       "name": "Scrambled Eggs with Tomatoes",
 *       "description": "Fluffy scrambled eggs with fresh diced tomatoes. Light and protein-rich.",
 *       "time_estimate_mins": 10
 *     },
 *     ...
 *   ]
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { meal_type } = req.body;

    // Validate input
    if (!meal_type || !['breakfast', 'lunch', 'dinner'].includes(meal_type)) {
      return res.status(400).json({
        error: 'Missing or invalid meal_type field',
        details: 'meal_type must be one of: breakfast, lunch, dinner',
      });
    }

    // Get current inventory
    const inventory = await getInventory();

    if (inventory.length === 0) {
      return res.status(400).json({
        error: 'No inventory items found',
        details: 'Add items to your inventory before requesting meal suggestions',
      });
    }

    // Suggest meals based on inventory
    const recipes = await suggestMeals(inventory, meal_type);

    res.status(200).json({
      recipes,
      message: `Here are ${recipes.length} ${meal_type} suggestions for you!`,
    });
  } catch (error) {
    console.error('Error in POST /api/chat:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg.includes('SUPABASE') || errorMsg.includes('OPENAI')) {
      return res.status(500).json({
        error: 'Service configuration error',
        details: errorMsg,
      });
    }

    res.status(400).json({
      error: 'Failed to suggest meals',
      details: errorMsg,
    });
  }
});

export default router;
