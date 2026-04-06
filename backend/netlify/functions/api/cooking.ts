/**
 * Cooking API endpoints
 *
 * POST /api/cooking/start: Takes recipe details, generates full recipe with ingredients, saves cooking state
 * POST /api/cooking/complete: User confirms deduction, deducts ingredients from inventory
 * POST /api/cooking/confirm-deduction: Get list of what will be deducted before user confirms
 */

import { Router, Request, Response } from 'express';
import { generateRecipeDetail } from './utils/prompts';
import { getInventory, deductInventory } from './utils/db';
import { RecipeDetail, InventoryItem, StartCookingRequest } from '../../shared/types';

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
 *     { "name": "tomato", "quantity": 3, "unit": "pieces", "inventory_item_id": "..." }\n *   ],\n *   "message": "Ready to cook! Review ingredients above and confirm when done.\"\n * }\n */\nrouter.post('/start', async (req: Request, res: Response) => {\n  try {\n    const { recipe_name, recipe_description, recipe_time_mins } = req.body;\n\n    // Validate input\n    if (!recipe_name || typeof recipe_name !== 'string' || !recipe_name.trim()) {\n      return res.status(400).json({\n        error: 'Missing or invalid recipe_name field',\n        details: 'recipe_name must be a non-empty string',\n      });\n    }\n\n    if (!recipe_description || typeof recipe_description !== 'string' || !recipe_description.trim()) {\n      return res.status(400).json({\n        error: 'Missing or invalid recipe_description field',\n        details: 'recipe_description must be a non-empty string',\n      });\n    }\n\n    if (recipe_time_mins === undefined || typeof recipe_time_mins !== 'number') {\n      return res.status(400).json({\n        error: 'Missing or invalid recipe_time_mins field',\n        details: 'recipe_time_mins must be a number (in minutes)',\n      });\n    }\n\n    // Get current inventory to validate recipe can be made\n    const currentInventory = await getInventory();\n\n    if (currentInventory.length === 0) {\n      return res.status(400).json({\n        error: 'Cannot generate recipe with empty inventory',\n        details: 'Add items to your inventory before starting a recipe',\n      });\n    }\n\n    // Generate detailed recipe from minimal input\n    const recipeDetail = await generateRecipeDetail(\n      recipe_name.trim(),\n      recipe_description.trim(),\n      currentInventory\n    );\n\n    // Map recipe ingredients to inventory items for deduction tracking\n    const ingredientsToDeduct = recipeDetail.ingredients.map((ingredient) => {\n      // Find matching inventory item by canonical name\n      const inventoryItem = currentInventory.find(\n        (item) =>\n          item.name.toLowerCase() === ingredient.name.toLowerCase() ||\n          item.canonical_name?.toLowerCase() === ingredient.name.toLowerCase()\n      );\n\n      if (!inventoryItem) {\n        throw new Error(\n          `Recipe ingredient \"${ingredient.name}\" not found in inventory. ` +\n          `This should not happen - recipe generation failed to validate against inventory.`\n        );\n      }\n\n      return {\n        name: ingredient.name,\n        quantity: ingredient.quantity,\n        unit: ingredient.unit,\n        inventory_item_id: inventoryItem.id,\n        confidence: inventoryItem.confidence,\n      };\n    });\n\n    // Create cooking session\n    const sessionId = `cooking-${Date.now()}-${Math.random().toString(36).substring(7)}`;\n    cookingSessions[sessionId] = {\n      recipe: recipeDetail,\n      inventory_before: currentInventory,\n      ingredients_to_deduct: ingredientsToDeduct,\n      started_at: new Date().toISOString(),\n    };\n\n    res.status(201).json({\n      data: {\n        session_id: sessionId,\n        recipe: recipeDetail,\n        ingredients_to_deduct: ingredientsToDeduct,\n      },\n      message: 'Recipe ready! Review ingredients and confirm when cooking is complete.',\n    });\n  } catch (error) {\n    console.error('Error in POST /api/cooking/start:', error);\n\n    const errorMsg = error instanceof Error ? error.message : String(error);\n\n    if (errorMsg.includes('SUPABASE') || errorMsg.includes('OPENAI')) {\n      return res.status(500).json({\n        error: 'Service configuration error',\n        details: errorMsg,\n      });\n    }\n\n    // If recipe validation failed\n    if (errorMsg.includes('not found in inventory')) {\n      return res.status(400).json({\n        error: 'Recipe validation failed',\n        details: errorMsg,\n      });\n    }\n\n    res.status(400).json({\n      error: 'Failed to start cooking',\n      details: errorMsg,\n    });\n  }\n});\n\n/**\n * POST /api/cooking/complete\n * Mark cooking as complete and deduct ingredients from inventory\n *\n * IMPORTANT: This endpoint implements the \"confirmation before deduction\" UX pattern.\n * Before calling this, client should:\n * 1. Call POST /api/cooking/start to get recipe and ingredients_to_deduct\n * 2. Show user a confirmation dialog listing what will be deducted\n * 3. Only call this endpoint after user explicitly confirms\n *\n * Request body:\n * {\n *   \"session_id\": \"cooking-session-uuid\",\n *   \"deduction_confirmed\": true\n * }\n *\n * Response:\n * {\n *   \"data\": {\n *     \"recipe_name\": \"Tomato Basil Chicken\",\n *     \"deducted_items\": [\n *       { \"inventory_item_id\": \"...\", \"quantity\": 2, \"unit\": \"pieces\", \"success\": true },\n *       { \"inventory_item_id\": \"...\", \"quantity\": 3, \"unit\": \"pieces\", \"success\": true }\n *     ],\n *     \"inventory_after\": [...]\n *   },\n *   \"message\": \"Great job! 2 items deducted from inventory.\"\n * }\n */\nrouter.post('/complete', async (req: Request, res: Response) => {\n  try {\n    const { session_id, deduction_confirmed } = req.body;\n\n    // Validate input\n    if (!session_id || typeof session_id !== 'string') {\n      return res.status(400).json({\n        error: 'Missing or invalid session_id field',\n        details: 'session_id must be a string',\n      });\n    }\n\n    if (deduction_confirmed !== true) {\n      return res.status(400).json({\n        error: 'Deduction not confirmed',\n        details: 'deduction_confirmed must be true to proceed with inventory deduction',\n      });\n    }\n\n    // Look up cooking session\n    const session = cookingSessions[session_id];\n    if (!session) {\n      return res.status(404).json({\n        error: 'Cooking session not found',\n        details: `Session ${session_id} does not exist or has expired`,\n      });\n    }\n\n    // Deduct each ingredient from inventory\n    const deductedItems = [];\n    let successCount = 0;\n\n    for (const ingredient of session.ingredients_to_deduct) {\n      try {\n        // Check if inventory item still exists and has sufficient quantity\n        const currentInventory = await getInventory();\n        const inventoryItem = currentInventory.find(\n          (item) => item.id === ingredient.inventory_item_id && !item.date_used\n        );\n\n        if (!inventoryItem) {\n          // Item already used or doesn't exist\n          deductedItems.push({\n            inventory_item_id: ingredient.inventory_item_id,\n            quantity: ingredient.quantity,\n            unit: ingredient.unit,\n            success: false,\n            reason: 'Item already used or no longer available',\n          });\n          continue;\n        }\n\n        // Check if user has sufficient quantity\n        const available = inventoryItem.quantity_approx || 0;\n        if (available < ingredient.quantity) {\n          // User has less than recipe requires\n          // This is a warning but we still deduct what's available\n          console.warn(\n            `Insufficient quantity for ${ingredient.name}: ` +\n            `need ${ingredient.quantity} ${ingredient.unit}, have ${available}`\n          );\n        }\n\n        // Deduct the item (mark as used)\n        const deducted = await deductInventory(ingredient.inventory_item_id);\n\n        deductedItems.push({\n          inventory_item_id: ingredient.inventory_item_id,\n          quantity: ingredient.quantity,\n          unit: ingredient.unit,\n          success: true,\n        });\n        successCount++;\n      } catch (error) {\n        console.error(`Failed to deduct ingredient ${ingredient.name}:`, error);\n        deductedItems.push({\n          inventory_item_id: ingredient.inventory_item_id,\n          quantity: ingredient.quantity,\n          unit: ingredient.unit,\n          success: false,\n          reason: `Deduction failed: ${error instanceof Error ? error.message : String(error)}`,\n        });\n      }\n    }\n\n    // Fetch updated inventory\n    const inventoryAfter = await getInventory();\n\n    // Clean up session\n    delete cookingSessions[session_id];\n\n    res.status(200).json({\n      data: {\n        recipe_name: session.recipe.name,\n        deducted_items: deductedItems,\n        inventory_after: inventoryAfter,\n      },\n      message: `Great job! ${successCount} ingredient(s) deducted from inventory.`,\n    });\n  } catch (error) {\n    console.error('Error in POST /api/cooking/complete:', error);\n\n    const errorMsg = error instanceof Error ? error.message : String(error);\n\n    if (errorMsg.includes('SUPABASE')) {\n      return res.status(500).json({\n        error: 'Database error',\n        details: errorMsg,\n      });\n    }\n\n    res.status(400).json({\n      error: 'Failed to complete cooking',\n      details: errorMsg,\n    });\n  }\n});\n\nexport default router;\n