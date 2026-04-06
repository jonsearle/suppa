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
 * Add a single inventory item
 * Returns the newly created item with auto-generated ID and timestamps
 */
export async function addInventoryItem(
  name: string,
  quantity_approx?: number,
  unit?: string
): Promise<InventoryItem> {
  const client = getSupabaseClient();
  const userId = getUserId();

  const { data, error } = await client
    .from('inventory_items')
    .insert({
      user_id: userId,
      name,
      quantity_approx: quantity_approx || null,
      unit: unit || null,
      date_added: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add inventory item: ${error.message}`);
  }

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
