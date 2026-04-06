# Suppa Database Schema

## Overview

Suppa uses Supabase PostgreSQL for persistence. All tables support row-level security (RLS) and are indexed for performance.

## Tables

### `users`

Primary user table. One record per user account.

**Columns:**
- `id` (UUID, PRIMARY KEY): User identifier, auto-generated
- `created_at` (TIMESTAMP): Account creation time, defaults to now()

**Indexes:**
- Primary key on `id`

**Example query:**
```sql
SELECT * FROM users WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

---

### `inventory_items`

Track food items a user has available. Supports quantity taxonomy (exact, approximate, boolean).

**Columns:**
- `id` (UUID, PRIMARY KEY): Item identifier, auto-generated
- `user_id` (UUID, FOREIGN KEY): References `users(id)`, not null
- `name` (TEXT): Item name (what user typed), not null
- `canonical_name` (TEXT): Normalized name for deduplication (e.g., "potato", "green_bean")
- `has_item` (BOOLEAN): For Category 1 items (salt, spices, oils) where only presence matters
- `quantity_approx` (NUMERIC): Approximate quantity, optional (e.g., 3, 1.5, 0.5 for fractions)
- `unit` (TEXT): Unit of measurement, optional (e.g., "pieces", "g", "cup")
- `confidence` (VARCHAR): 'exact' for user-specified quantities, 'approximate' for estimates
- `date_added` (TIMESTAMP): When item was added, defaults to now()
- `date_used` (TIMESTAMP): When item was deducted/used, null until deducted

**Quantity Taxonomy:**
1. Boolean items: has_item=true (salt, curry powder) — user either has it or doesn't
2. Exact quantities: confidence='exact' (500g beef, 3 apples) — user specified precisely
3. Exact counts: confidence='exact', unit='pieces' (2 chicken breasts)
4. Rough quantities: confidence='approximate' (some salad, lots of carrots)

**Deduplication:**
- canonical_name normalizes variations: "potatoes" → "potato", "green beans" → "green_bean"
- addInventoryItem() merges items with same canonical_name + user_id
- Query logic uses canonical_name for ingredient matching

**Indexes:**
- Primary key on `id`
- Index on `user_id` for fast filtering
- Index on `(user_id, canonical_name)` for deduplication lookups
- Index on `(user_id, date_used)` for active inventory queries

**Example queries:**
```sql
-- Get all active inventory for a user
SELECT * FROM inventory_items
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND date_used IS NULL
ORDER BY date_added DESC;

-- Mark item as used
UPDATE inventory_items
SET date_used = now()
WHERE id = '...' AND user_id = '...';
```

---

### `chat_messages`

Conversational history for each user. Stores both user inputs and assistant responses.

**Columns:**
- `id` (UUID, PRIMARY KEY): Message identifier, auto-generated
- `user_id` (UUID, FOREIGN KEY): References `users(id)`, not null
- `message` (TEXT): Message content, not null
- `role` (TEXT): 'user' or 'assistant', enforced with CHECK constraint
- `timestamp` (TIMESTAMP): When message was created, defaults to now()

**Constraints:**
- `role` in ('user', 'assistant')

**Indexes:**
- Primary key on `id`
- Index on `(user_id, timestamp)` for fast filtering by user and chronological sorting

**Example queries:**
```sql
-- Get recent chat history for a user (last 10 messages)
SELECT * FROM chat_messages
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY timestamp DESC
LIMIT 10;

-- Add a user message
INSERT INTO chat_messages (user_id, message, role)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'I have chicken and tomatoes', 'user')
RETURNING *;
```

---

## SQL Setup Script

Run this in the Supabase SQL editor to create the schema:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  canonical_name TEXT,
  has_item BOOLEAN DEFAULT FALSE,
  quantity_approx NUMERIC,
  unit TEXT,
  confidence VARCHAR(20) DEFAULT 'approximate',
  date_added TIMESTAMP DEFAULT now(),
  date_used TIMESTAMP
);

CREATE INDEX idx_inventory_user ON inventory_items(user_id);
CREATE INDEX idx_inventory_canonical ON inventory_items(user_id, canonical_name);
CREATE INDEX idx_inventory_active ON inventory_items(user_id, date_used);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  timestamp TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_chat_user_time ON chat_messages(user_id, timestamp);
```

## Manual Setup Steps

1. Log into Supabase console (https://supabase.com/)
2. Go to SQL Editor
3. Create a new query
4. Copy the SQL setup script above
5. Click "Run"
6. Verify tables appear in the "Tables" panel

## Notes

- All times are stored in UTC (TIMESTAMP type in PostgreSQL)
- User IDs are UUIDs for security
- The `inventory_items` table uses soft-delete pattern: items are never deleted, just marked with `date_used`
- Chat history is append-only: messages are never modified
- Currently all queries filter by a single `USER_ID` hardcoded in the backend (for MVP testing)
- Future: implement Row-Level Security (RLS) policies to enforce user isolation at database level
