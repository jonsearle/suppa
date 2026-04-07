/**
 * Cooking API endpoints
 *
 * POST /api/cooking/start: Takes recipe details, generates full recipe with ingredients, saves cooking state
 * POST /api/cooking/complete: User confirms deduction, deducts ingredients from inventory
 * POST /api/cooking/confirm-deduction: Get list of what will be deducted before user confirms
 */

import { Router, Request, Response } from 'express';
import { generateRecipeDetail } from './utils/prompts';
import { getInventory, deductInventoryQuantity } from './utils/db';
import { RecipeDetail, InventoryItem, StartCookingRequest } from '../shared/types';

const router = Router();

/**
 * POST /api/cooking/detail
 * Get full recipe details from recipe name, description, and time estimate
 * This endpoint generates the detailed recipe with ingredients and instructions
 *
 * Request body:
 * {
 *   "recipe_name": "Tomato Basil Chicken",
 *   "recipe_description": "Pan-seared chicken with fresh tomatoes and basil. Light and fresh.",
 *   "recipe_time_mins": 25
 * }
 *
 * Response:
 * {
 *   "data": {
 *     "name": "Tomato Basil Chicken",
 *     "description": "...",
 *     "time_estimate_mins": 25,
 *     "ingredients": [...],
 *     "instructions": [...]
 *   }
 * }
 */
router.post('/detail', async (req: Request, res: Response) => {
  try {
    const { recipe_name, recipe_description, recipe_time_mins } = req.body;

    // Validate input
    if (!recipe_name || typeof recipe_name !== 'string' || !recipe_name.trim()) {
      return res.status(400).json({
        error: 'Missing or invalid recipe_name field',
        details: 'recipe_name must be a non-empty string',
      });
    }

    if (!recipe_description || typeof recipe_description !== 'string' || !recipe_description.trim()) {
      return res.status(400).json({
        error: 'Missing or invalid recipe_description field',
        details: 'recipe_description must be a non-empty string',
      });
    }

    if (recipe_time_mins === undefined || typeof recipe_time_mins !== 'number') {
      return res.status(400).json({
        error: 'Missing or invalid recipe_time_mins field',
        details: 'recipe_time_mins must be a number (in minutes)',
      });
    }

    // Get current inventory to validate recipe can be made
    const currentInventory = await getInventory();

    if (currentInventory.length === 0) {
      return res.status(400).json({
        error: 'Cannot generate recipe with empty inventory',
        details: 'Add items to your inventory before requesting recipe details',
      });
    }

    // Generate detailed recipe from minimal input
    const recipeDetail = await generateRecipeDetail(
      recipe_name.trim(),
      recipe_description.trim(),
      currentInventory
    );

    res.status(200).json({
      data: recipeDetail,
      message: 'Recipe details generated successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/cooking/detail:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg.includes('SUPABASE') || errorMsg.includes('OPENAI')) {
      return res.status(500).json({
        error: 'Service configuration error',
        details: errorMsg,
      });
    }

    res.status(400).json({
      error: 'Failed to generate recipe details',
      details: errorMsg,
    });
  }
});

/**
 * In-memory storage for cooking sessions
 * In production, this would be persisted to database (cooking_sessions table)
 * Maps session_id -> { recipe, inventory_before, started_at }
 */
const cookingSessions: Record<string, any> = {};

/**
 * POST /api/cooking/start
 * Begin cooking a recipe: generate full recipe details from minimal input
 *
 * Request body:
 * {
 *   "recipe_name": "Tomato Basil Chicken",
 *   "recipe_description": "Pan-seared chicken with fresh tomatoes and basil. Light and fresh.",
 *   "recipe_time_mins": 25
 * }
 *
 * Response:
 * {
 *   "session_id": "cooking-session-uuid",
 *   "recipe": {
 *     "name": "Tomato Basil Chicken",
 *     "description": "...",
 *     "time_estimate_mins": 25,
 *     "ingredients": [...],
 *     "instructions": [...]
 *   },
 *   "ingredients_to_deduct": [
 *     { "name": "chicken", "quantity": 2, "unit": "pieces", "inventory_item_id": "..." },
 *     { "name": "tomato", "quantity": 3, "unit": "pieces", "inventory_item_id": "..." }
 *   ],
 *   "message": "Ready to cook! Review ingredients above and confirm when done."
 * }
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { recipe_name, recipe_description, recipe_time_mins } = req.body;

    // Validate input
    if (!recipe_name || typeof recipe_name !== 'string' || !recipe_name.trim()) {
      return res.status(400).json({
        error: 'Missing or invalid recipe_name field',
        details: 'recipe_name must be a non-empty string',
      });
    }

    if (!recipe_description || typeof recipe_description !== 'string' || !recipe_description.trim()) {
      return res.status(400).json({
        error: 'Missing or invalid recipe_description field',
        details: 'recipe_description must be a non-empty string',
      });
    }

    if (recipe_time_mins === undefined || typeof recipe_time_mins !== 'number') {
      return res.status(400).json({
        error: 'Missing or invalid recipe_time_mins field',
        details: 'recipe_time_mins must be a number (in minutes)',
      });
    }

    // Get current inventory to validate recipe can be made
    const currentInventory = await getInventory();

    if (currentInventory.length === 0) {
      return res.status(400).json({
        error: 'Cannot generate recipe with empty inventory',
        details: 'Add items to your inventory before starting a recipe',
      });
    }

    // Generate detailed recipe from minimal input
    const recipeDetail = await generateRecipeDetail(
      recipe_name.trim(),
      recipe_description.trim(),
      currentInventory
    );

    // Map recipe ingredients to inventory items for deduction tracking
    const ingredientsToDeduct = recipeDetail.ingredients.map((ingredient) => {
      // Find matching inventory item by canonical name
      const inventoryItem = currentInventory.find(
        (item) =>
          item.name.toLowerCase() === ingredient.name.toLowerCase() ||
          item.canonical_name?.toLowerCase() === ingredient.name.toLowerCase()
      );

      if (!inventoryItem) {
        throw new Error(
          `Recipe ingredient "${ingredient.name}" not found in inventory. ` +
          `This should not happen - recipe generation failed to validate against inventory.`
        );
      }

      return {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        inventory_item_id: inventoryItem.id,
        confidence: inventoryItem.confidence,
      };
    });

    // Create cooking session
    const sessionId = `cooking-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    cookingSessions[sessionId] = {
      recipe: recipeDetail,
      inventory_before: currentInventory,
      ingredients_to_deduct: ingredientsToDeduct,
      started_at: new Date().toISOString(),
    };

    res.status(201).json({
      data: {
        session_id: sessionId,
        recipe: recipeDetail,
        ingredients_to_deduct: ingredientsToDeduct,
      },
      message: 'Recipe ready! Review ingredients and confirm when cooking is complete.',
    });
  } catch (error) {
    console.error('Error in POST /api/cooking/start:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg.includes('SUPABASE') || errorMsg.includes('OPENAI')) {
      return res.status(500).json({
        error: 'Service configuration error',
        details: errorMsg,
      });
    }

    // If recipe validation failed
    if (errorMsg.includes('not found in inventory')) {
      return res.status(400).json({
        error: 'Recipe validation failed',
        details: errorMsg,
      });
    }

    res.status(400).json({
      error: 'Failed to start cooking',
      details: errorMsg,
    });
  }
});

/**
 * POST /api/cooking/complete
 * Mark cooking as complete and deduct ingredients from inventory
 *
 * IMPORTANT: This endpoint implements the "confirmation before deduction" UX pattern.
 * Before calling this, client should:
 * 1. Call POST /api/cooking/start to get recipe and ingredients_to_deduct
 * 2. Show user a confirmation dialog listing what will be deducted
 * 3. Only call this endpoint after user explicitly confirms
 *
 * Request body:
 * {
 *   "session_id": "cooking-session-uuid",
 *   "deduction_confirmed": true
 * }
 *
 * Response:
 * {
 *   "data": {
 *     "recipe_name": "Tomato Basil Chicken",
 *     "deducted_items": [
 *       { "inventory_item_id": "...", "quantity": 2, "unit": "pieces", "success": true },
 *       { "inventory_item_id": "...", "quantity": 3, "unit": "pieces", "success": true }
 *     ],
 *     "inventory_after": [...]
 *   },
 *   "message": "Great job! 2 items deducted from inventory."
 * }
 */
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { session_id, deduction_confirmed } = req.body;

    // Validate input
    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid session_id field',
        details: 'session_id must be a string',
      });
    }

    if (deduction_confirmed !== true) {
      return res.status(400).json({
        error: 'Deduction not confirmed',
        details: 'deduction_confirmed must be true to proceed with inventory deduction',
      });
    }

    // Look up cooking session
    const session = cookingSessions[session_id];
    if (!session) {
      return res.status(404).json({
        error: 'Cooking session not found',
        details: `Session ${session_id} does not exist or has expired`,
      });
    }

    // Deduct each ingredient from inventory
    const deductedItems = [];
    let successCount = 0;

    for (const ingredient of session.ingredients_to_deduct) {
      try {
        // TASK 8 FIX: Use partial deduction with quantity validation
        // This function will:
        // - Block deduction if insufficient quantity
        // - Create remainder item if partial deduction
        // - Preserve audit trail with date_used
        const result = await deductInventoryQuantity(
          ingredient.inventory_item_id,
          ingredient.quantity
        );

        deductedItems.push({
          inventory_item_id: ingredient.inventory_item_id,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          success: true,
          remainder_item_id: result.remainder_item_id,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to deduct ingredient ${ingredient.name}:`, error);
        const errorMsg = error instanceof Error ? error.message : String(error);

        // TASK 8 FIX: Distinguish between insufficient quantity (user error) and system errors
        const isInsufficientQuantity = errorMsg.includes('Insufficient quantity');

        deductedItems.push({
          inventory_item_id: ingredient.inventory_item_id,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          success: false,
          reason: errorMsg,
          error_type: isInsufficientQuantity ? 'insufficient_quantity' : 'system_error',
        });
      }
    }

    // Fetch updated inventory
    const inventoryAfter = await getInventory();

    // Clean up session
    delete cookingSessions[session_id];

    res.status(200).json({
      data: {
        recipe_name: session.recipe.name,
        deducted_items: deductedItems,
        inventory_after: inventoryAfter,
      },
      message: `Great job! ${successCount} ingredient(s) deducted from inventory.`,
    });
  } catch (error) {
    console.error('Error in POST /api/cooking/complete:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg.includes('SUPABASE')) {
      return res.status(500).json({
        error: 'Database error',
        details: errorMsg,
      });
    }

    res.status(400).json({
      error: 'Failed to complete cooking',
      details: errorMsg,
    });
  }
});

export default router;
