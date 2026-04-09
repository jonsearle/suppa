/**
 * PocketBase database helper functions
 * Handles all database operations for inventory and chat history
 * Uses PocketBase REST API instead of Supabase SDK
 */

import { InventoryItem, ChatMessage } from '../../shared/types';
import { convertToCanonical } from './units';

/**
 * Get PocketBase URL from environment
 * Must be set to local (http://localhost:8090) or deployment URL
 */
function getPocketBaseUrl(): string {
  const url = process.env.POCKETBASE_URL;
  if (!url) {
    throw new Error('POCKETBASE_URL must be set in environment');
  }
  return url.replace(/\/$/, ''); // Remove trailing slash if present
}

/**
 * Helper to make authenticated fetch requests to PocketBase API
 * PocketBase REST API base: /api/collections/{collection}/records
 */
async function pocketbaseFetch(
  path: string,
  options: RequestInit & { method?: string } = {}
): Promise<any> {
  const url = `${getPocketBaseUrl()}/api${path}`;
  const method = options.method || 'GET';

  try {
    const response = await fetch(url, {
      ...options,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any;
      throw new Error(
        `PocketBase request failed (${response.status}): ${
          errorData.message || response.statusText
        }`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`PocketBase request failed: ${String(error)}`);
  }
}

/**
 * Get the user ID from environment
 * For MVP, we use a hardcoded user ID; later this will come from JWT
 */
function getUserId(): string {
  const userId = process.env.USER_ID;
  if (!userId) {
    throw new Error('USER_ID must be set in environment');
  }
  return userId;
}

/**
 * Fetch all active inventory items for the current user
 * Returns items where date_used IS NULL (not yet consumed)
 * PocketBase filter syntax: ?filter=(field="value"&&field2=null)
 */
export async function getInventory(): Promise<InventoryItem[]> {
  const userId = getUserId();

  // PocketBase filter: user_id matches AND date_used is null
  // Sort by date_added descending (most recent first)
  const filter = encodeURIComponent(`(user_id="${userId}"&&date_used=null)`);
  const sort = encodeURIComponent('-date_added');

  const response = await pocketbaseFetch(
    `/collections/inventory_items/records?filter=${filter}&sort=${sort}`
  );

  // PocketBase returns { items: [...] } or just array depending on version
  const items = response.items || (Array.isArray(response) ? response : []);
  return items as InventoryItem[];
}

/**
 * Add a single inventory item with merge-on-add deduplication
 * If an item with the same canonical_name exists, merge by updating quantity
 * Otherwise, create new item
 * Returns the item (either newly created or updated via merge)
 */
export async function addInventoryItem(
  item: Omit<InventoryItem, 'id' | 'user_id' | 'date_added' | 'date_used'>
): Promise<InventoryItem> {
  const userId = getUserId();
  const { getCanonicalName } = await import('./canonical-foods');

  const canonicalName = item.canonical_name || getCanonicalName(item.name);

  // Check if item with same canonical_name already exists for this user
  // PocketBase filter: user_id matches AND canonical_name matches AND date_used is null
  const filter = encodeURIComponent(
    `(user_id="${userId}"&&canonical_name="${canonicalName}"&&date_used=null)`
  );

  const existingResponse = await pocketbaseFetch(
    `/collections/inventory_items/records?filter=${filter}&limit=1`
  );

  const existingItems = existingResponse.items || (Array.isArray(existingResponse) ? existingResponse : []);
  const existing = existingItems[0];

  if (existing) {
    // Merge: update quantity and unit, keep most recent name
    // PocketBase PATCH: /api/collections/{collection}/records/{id}
    const updatedItem = await pocketbaseFetch(
      `/collections/inventory_items/records/${existing.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          name: item.name || existing.name,
          quantity_approx:
            item.quantity_approx !== undefined
              ? item.quantity_approx
              : existing.quantity_approx,
          unit: item.unit || existing.unit,
          confidence: item.confidence || existing.confidence,
          has_item:
            item.has_item !== undefined ? item.has_item : existing.has_item,
          date_added: new Date().toISOString(),
        }),
      }
    );

    return updatedItem as InventoryItem;
  }

  // No existing item: create new
  // PocketBase POST: /api/collections/{collection}/records
  const newItem = await pocketbaseFetch(
    `/collections/inventory_items/records`,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        name: item.name,
        canonical_name: canonicalName,
        has_item: item.has_item || false,
        quantity_approx: item.quantity_approx || null,
        unit: item.unit || null,
        confidence: item.confidence || 'approximate',
      }),
    }
  );

  return newItem as InventoryItem;
}

/**
 * Mark all active inventory items as used for the current user.
 * This is compatible with the current PocketBase permissions and
 * clears the active inventory list for local testing.
 */
export async function clearInventory(): Promise<number> {
  const items = await getInventory();

  await Promise.all(
    items.map((item) =>
      pocketbaseFetch(`/collections/inventory_items/records/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          date_used: new Date().toISOString(),
        }),
      })
    )
  );

  return items.length;
}

/**
 * Mark an inventory item as used (soft delete)
 * Sets date_used to current timestamp instead of actually deleting the row
 * This preserves audit trail
 */
export async function deductInventory(itemId: string): Promise<InventoryItem> {
  // PocketBase PATCH: /api/collections/{collection}/records/{id}
  const updatedItem = await pocketbaseFetch(
    `/collections/inventory_items/records/${itemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        date_used: new Date().toISOString(),
      }),
    }
  );

  return updatedItem as InventoryItem;
}

/**
 * Deduct a specific quantity from an inventory item (TASK 8: Fix + Unit Normalization)
 * Handles partial deductions properly:
 * - If item is boolean (has_item=true): Mark entire item as used
 * - If deducting exact amount: Mark item as used
 * - If deducting partial amount: Create new item with remainder, mark original as used
 * - If insufficient quantity: Throw error (prevent deduction)
 *
 * UNIT CONVERSION: quantityToDeduct is assumed to be in CANONICAL units (g, ml, pieces)
 * The function converts inventory item's unit to canonical before comparing
 * This allows "1 cup rice" inventory to match "125g rice" deduction request
 *
 * Returns { deducted_item, remainder_item_id } where remainder is null if fully consumed
 */
export async function deductInventoryQuantity(
  itemId: string,
  quantityToDeduct?: number
): Promise<{ deducted_item: InventoryItem; remainder_item_id?: string }> {
  const userId = getUserId();

  // Fetch the item to check quantity
  // PocketBase GET: /api/collections/{collection}/records/{id}
  const item = await pocketbaseFetch(
    `/collections/inventory_items/records/${itemId}`
  );

  // Boolean items (salt, spices, oils): just mark as used, no quantity check
  if (item.has_item === true && quantityToDeduct === undefined) {
    const deductedItem = await pocketbaseFetch(
      `/collections/inventory_items/records/${itemId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ date_used: new Date().toISOString() }),
      }
    );

    return { deducted_item: deductedItem as InventoryItem };
  }

  // Quantity-based items: check if sufficient quantity exists
  if (quantityToDeduct !== undefined && item.quantity_approx !== null) {
    const available = item.quantity_approx;

    // UNIT NORMALIZATION FIX: Convert inventory item's unit to canonical before comparing
    // This ensures "1 cup rice" can be properly compared against "125g rice" (normalized from 1 cup)
    // The deduction quantity is assumed to be in canonical units (from normalized recipe)
    const inventoryCanonical = convertToCanonical(available, item.unit, item.name);

    // Compare quantities in the same unit system
    // CRITICAL FIX: Block deduction if insufficient quantity (after unit conversion)
    if (inventoryCanonical.quantity < quantityToDeduct) {
      throw new Error(
        `Insufficient quantity: need ${quantityToDeduct}${inventoryCanonical.unit}, ` +
          `have ${inventoryCanonical.quantity}${inventoryCanonical.unit}. User must review recipe or add more inventory.`
      );
    }

    // Calculate remainder using canonical quantity
    const remainderQuantity = inventoryCanonical.quantity - quantityToDeduct;

    // Exact match or very close: mark entire item as used (compare in canonical units)
    if (Math.abs(remainderQuantity) < 0.01) {
      const deductedItem = await pocketbaseFetch(
        `/collections/inventory_items/records/${itemId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ date_used: new Date().toISOString() }),
        }
      );

      return { deducted_item: deductedItem as InventoryItem };
    }

    // Partial deduction: create remainder item, mark original as used
    // The remainder is calculated in canonical units, but we need to store it in the original unit
    // Calculate the ratio to convert remainder back to original unit
    // E.g., if 1 cup = 125g, and remainderQuantity = 25g, then remainder_in_cups = 25 / 125 = 0.2 cups
    const conversionRatio = inventoryCanonical.quantity / available; // canonical per original unit
    const remainder = remainderQuantity / conversionRatio; // convert remainder back to original unit

    // Create new item for remainder
    // PocketBase POST: /api/collections/{collection}/records
    const remainderItem = await pocketbaseFetch(
      `/collections/inventory_items/records`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          name: item.name,
          canonical_name: item.canonical_name,
          quantity_approx: remainder,  // Now in original unit (e.g., 0.2 cups)
          unit: item.unit,             // Original unit (e.g., 'cup')
          confidence: item.confidence,
          has_item: false,
          date_added: new Date().toISOString(),
        }),
      }
    );

    // Mark original as used
    const deductedItem = await pocketbaseFetch(
      `/collections/inventory_items/records/${itemId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ date_used: new Date().toISOString() }),
      }
    );

    return {
      deducted_item: deductedItem as InventoryItem,
      remainder_item_id: remainderItem.id,
    };
  }

  // No quantity specified and no quantity in item: just mark as used
  const deductedItem = await pocketbaseFetch(
    `/collections/inventory_items/records/${itemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ date_used: new Date().toISOString() }),
    }
  );

  return { deducted_item: deductedItem as InventoryItem };
}

/**
 * Fetch recent chat history for the current user
 * Returns messages in chronological order (oldest first)
 */
export async function getChatHistory(limit: number = 20): Promise<ChatMessage[]> {
  const userId = getUserId();

  // PocketBase filter: user_id matches
  // Sort by timestamp ascending (oldest first)
  const filter = encodeURIComponent(`(user_id="${userId}")`);
  const sort = encodeURIComponent('timestamp');

  const response = await pocketbaseFetch(
    `/collections/chat_messages/records?filter=${filter}&sort=${sort}&limit=${limit}`
  );

  // PocketBase returns { items: [...] } or array depending on version
  const messages = response.items || (Array.isArray(response) ? response : []);
  return messages as ChatMessage[];
}

/**
 * Add a chat message to history
 * Role must be 'user' or 'assistant'
 * Returns the newly created message
 */
export async function addChatMessage(
  message: string,
  role: 'user' | 'assistant'
): Promise<ChatMessage> {
  const userId = getUserId();

  // PocketBase POST: /api/collections/{collection}/records
  const newMessage = await pocketbaseFetch(
    `/collections/chat_messages/records`,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        message,
        role,
        timestamp: new Date().toISOString(),
      }),
    }
  );

  return newMessage as ChatMessage;
}
