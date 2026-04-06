/**
 * Supabase database helper functions
 * Handles all database operations for inventory and chat history
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InventoryItem, ChatMessage } from '../../../shared/types';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client
 * Uses SUPABASE_URL and SUPABASE_ANON_KEY from environment
 */
function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment'
      );
    }

    supabaseClient = createClient(url, key);
  }

  return supabaseClient;
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
 */
export async function getInventory(): Promise<InventoryItem[]> {
  const client = getSupabaseClient();
  const userId = getUserId();

  const { data, error } = await client
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .is('date_used', null)
    .order('date_added', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch inventory: ${error.message}`);
  }

  return data || [];
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
  const client = getSupabaseClient();
  const userId = getUserId();
  const { getCanonicalName } = await import('./canonical-foods');

  const canonicalName = item.canonical_name || getCanonicalName(item.name);

  // Check if item with same canonical_name already exists for this user
  const { data: existing, error: checkError } = await client
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .eq('canonical_name', canonicalName)
    .is('date_used', null)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is expected
    throw checkError;
  }

  if (existing) {
    // Merge: update quantity and unit, keep most recent name
    const { data, error } = await client
      .from('inventory_items')
      .update({
        name: item.name || existing.name,
        quantity_approx: item.quantity_approx !== undefined ? item.quantity_approx : existing.quantity_approx,
        unit: item.unit || existing.unit,
        confidence: item.confidence || existing.confidence,
        has_item: item.has_item !== undefined ? item.has_item : existing.has_item,
        date_added: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryItem;
  }

  // No existing item: create new
  const { data, error } = await client
    .from('inventory_items')
    .insert([
      {
        user_id: userId,
        name: item.name,
        canonical_name: canonicalName,
        has_item: item.has_item || false,
        quantity_approx: item.quantity_approx || null,
        unit: item.unit || null,
        confidence: item.confidence || 'approximate',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as InventoryItem;
}

/**
 * Mark an inventory item as used (soft delete)
 * Sets date_used to current timestamp instead of actually deleting the row
 * This preserves audit trail
 */
export async function deductInventory(itemId: string): Promise<InventoryItem> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('inventory_items')
    .update({
      date_used: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to deduct inventory: ${error.message}`);
  }

  return data as InventoryItem;
}

/**
 * Fetch recent chat history for the current user
 * Returns messages in chronological order (oldest first)
 */
export async function getChatHistory(limit: number = 20): Promise<ChatMessage[]> {
  const client = getSupabaseClient();
  const userId = getUserId();

  const { data, error } = await client
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch chat history: ${error.message}`);
  }

  return data || [];
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
  const client = getSupabaseClient();
  const userId = getUserId();

  const { data, error } = await client
    .from('chat_messages')
    .insert({
      user_id: userId,
      message,
      role,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add chat message: ${error.message}`);
  }

  return data as ChatMessage;
}
