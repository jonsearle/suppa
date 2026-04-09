# PocketBase Migration - Quick Reference Card

## One-Liner Setup

```bash
# 1. Install PocketBase
brew install pocketbase

# 2. Start PocketBase
pb serve

# 3. In another terminal, setup backend
cd backend && npm install
cp .env.example .env.local

# 4. Edit .env.local with:
# POCKETBASE_URL=http://localhost:8090
# USER_ID=test_user
# OPENAI_API_KEY=xxx

# 5. Start backend
npm run dev
```

## Collection Schema Quick Reference

### inventory_items
```
user_id (Text, required)
name (Text, required)
canonical_name (Text)
has_item (Boolean)
quantity_approx (Number)
unit (Text)
confidence (Select: exact/approximate)
date_added (DateTime)
date_used (DateTime)
```

### chat_messages
```
user_id (Text, required)
message (Text, required)
role (Select: user/assistant)
timestamp (DateTime)
```

## Key Code Changes

### Before (Supabase)
```typescript
const client = createClient(url, key);
const { data, error } = await client
  .from('inventory_items')
  .select('*')
  .eq('user_id', userId);
```

### After (PocketBase)
```typescript
const response = await pocketbaseFetch(
  `/collections/inventory_items/records?filter=(user_id="${userId}")`
);
const items = response.items || [];
```

## API Endpoints (Unchanged)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/inventory | GET | List active items |
| /api/inventory | POST | Add items |
| /api/chat | POST | Get meal suggestions |
| /api/cooking/detail | POST | Get recipe details |
| /api/cooking/start | POST | Start cooking |
| /api/cooking/complete | POST | Deduct inventory |

## PocketBase REST API Quick Reference

```
GET    /api/collections/{name}/records?filter=...&sort=...
POST   /api/collections/{name}/records
PATCH  /api/collections/{name}/records/{id}
DELETE /api/collections/{name}/records/{id}
GET    /api/collections/{name}/records/{id}
```

## Environment Variables

```bash
# Required
POCKETBASE_URL=http://localhost:8090  # Local or deployed
USER_ID=your_user_id                  # MVP: hardcoded

# Existing
OPENAI_API_KEY=sk-xxxxx              # Unchanged
```

## Test Requests

### Add Inventory
```bash
curl -X POST http://localhost:3000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{"user_input":"3 tomatoes, 2 chicken"}'
```

### Get Inventory
```bash
curl http://localhost:3000/api/inventory
```

## Critical Functions in db.ts

```typescript
getInventory(): Promise<InventoryItem[]>
addInventoryItem(item): Promise<InventoryItem>
deductInventory(itemId): Promise<InventoryItem>
deductInventoryQuantity(itemId, quantity): Promise<{...}>
getChatHistory(limit): Promise<ChatMessage[]>
addChatMessage(message, role): Promise<ChatMessage>
```

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Connection refused | Verify `pb serve` running |
| 404 Collection not found | Check collection names match exactly |
| Empty results | Check user_id filter and date_used=null |
| CORS error | Check PocketBase settings |

## Important Files

| File | Purpose |
|------|---------|
| backend/netlify/functions/api/utils/db.ts | Database layer (migrated) |
| backend/package.json | Dependencies (no Supabase SDK) |
| backend/.env.example | Configuration template |
| MIGRATION_SUMMARY.md | Complete overview |
| POCKETBASE_SETUP.md | Setup guide |
| IMPLEMENTATION_NOTES.md | Technical details |
| MIGRATION_CHECKLIST.md | Testing checklist |

## Resources

- PocketBase Docs: https://pocketbase.io/docs/
- REST API: https://pocketbase.io/docs/api-records/
- Filter Guide: https://pocketbase.io/docs/api-query-syntax/

---

**Keep this card handy for quick reference!**
