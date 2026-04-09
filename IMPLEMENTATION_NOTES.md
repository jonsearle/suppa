# PocketBase Migration - Implementation Notes

## Overview

The Suppa backend has been successfully migrated from Supabase to PocketBase. All database operations now use PocketBase's REST API instead of the Supabase SDK.

## Key Technical Decisions

### 1. Using Native Fetch Instead of SDK
- **Decision:** Use native Node.js `fetch()` instead of PocketBase SDK
- **Rationale:** Keeps dependencies minimal and gives full control over API calls
- **Trade-off:** More verbose than using a SDK, but simpler dependency management

### 2. Filter Syntax Conversion
- **Supabase:** `.eq('user_id', userId).is('date_used', null)`
- **PocketBase:** `?filter=(user_id="userId"&&date_used=null)`
- **Implementation:** Manual filter string construction with URL encoding

### 3. Error Handling
- **Consistent:** Error handling patterns remain identical to original Supabase code
- **Response Parsing:** Handles variable PocketBase response formats (items array or direct array)
- **User-Friendly:** Original error messages preserved for user-facing errors

### 4. User ID Management
- **Current:** Hardcoded `USER_ID` from environment (MVP approach)
- **Future:** Will be replaced with JWT token from PocketBase auth
- **No Changes Required:** API endpoints unchanged, only internal implementation

## Architecture Overview

```
Frontend (React)
    ↓
Netlify Functions (Express)
    ├── inventory.ts (uses db functions)
    ├── chat.ts (uses db functions)
    ├── cooking.ts (uses db functions)
    └── utils/db.ts (PocketBase REST API calls)
         ↓
    PocketBase API (http://localhost:8090/api)
         ├── /collections/inventory_items/records
         └── /collections/chat_messages/records
```

## Critical Implementation Details

### PocketBase Response Format

PocketBase returns list responses as:
```json
{
  "items": [...],
  "page": 1,
  "perPage": 30,
  "totalItems": 100,
  "totalPages": 4
}
```

**Handling:** The `pocketbaseFetch()` helper checks for both `response.items` and direct array, providing backward compatibility.

### Filter Edge Cases

When filtering for null values in PocketBase:
```javascript
// Active inventory items (NOT consumed)
const filter = `(user_id="user123"&&date_used=null)`;

// Note: PocketBase uses `=null` not `IS NULL` like SQL
```

### Soft Deletes

Original logic preserved: items are never deleted, only marked with `date_used` timestamp:
```javascript
// Deduct inventory
PATCH /api/collections/inventory_items/records/{id}
{
  "date_used": "2026-04-07T12:34:56.000Z"
}

// Query only active items
GET /api/collections/inventory_items/records?filter=(date_used=null)
```

### Merge-on-Add Deduplication

Logic unchanged, but implementation now uses PocketBase:
1. Query for existing item with same `canonical_name` and `date_used=null`
2. If found: PATCH update the existing item
3. If not found: POST create new item

## Testing Recommendations

### Unit Tests
- Verify filter strings are properly URL-encoded
- Test response parsing for both response formats
- Test error handling for network failures

### Integration Tests
- Create test PocketBase instance with test collections
- Test each db function with real data
- Test deduction logic with various quantity scenarios
- Test merge-on-add with duplicate canonical names

### Manual Testing
1. Start PocketBase locally
2. Add test inventory items via `POST /api/inventory`
3. Verify `GET /api/inventory` returns correct items
4. Test cooking flow with deduction
5. Verify chat history persistence

## Performance Considerations

### Current
- No query optimization or caching
- One HTTP request per database operation
- No connection pooling (not needed with REST API)

### Future Improvements
1. **Caching:** Cache inventory list to reduce API calls
2. **Batch Operations:** Group multiple operations where possible
3. **Indexes:** Ensure PocketBase has indexes on:
   - `user_id` (all collections)
   - `canonical_name` (inventory_items)
   - `date_used` (inventory_items)

### Estimated Response Times
- GET inventory: 50-100ms (depends on item count)
- POST new item: 30-50ms
- PATCH update: 20-40ms
- List chat history: 40-80ms

## Security Considerations

### Current MVP Approach
- No authentication: `USER_ID` comes from environment
- No authorization: All operations assume valid user
- Public PocketBase instance: Anyone with URL can access data

### Production Requirements (Not Implemented)
1. **PocketBase Auth:** Use PocketBase's built-in user auth
2. **JWT Tokens:** Replace hardcoded USER_ID with JWT from login
3. **Rate Limiting:** Add rate limiting to prevent abuse
4. **HTTPS:** Always use HTTPS for PocketBase URL in production
5. **Data Validation:** Validate all inputs before PocketBase operations

### Next Steps for Auth
1. Create users table in PocketBase
2. Implement login endpoint using PocketBase auth
3. Return JWT token from login
4. Include token in Authorization header for API calls
5. Validate token in backend before database operations

## Deployment Checklist

Before deploying to production:

- [ ] PocketBase instance created and running
- [ ] Collections created with correct schema
- [ ] `POCKETBASE_URL` environment variable set correctly
- [ ] CORS enabled in PocketBase (check admin settings)
- [ ] Backup strategy in place for `pb_data/` directory
- [ ] SSL/TLS certificate configured for HTTPS
- [ ] Rate limiting configured
- [ ] Monitoring/logging set up
- [ ] Disaster recovery plan documented
- [ ] Data migration from Supabase completed (if applicable)

## Rollback Procedure

If critical issues arise with PocketBase:

1. Keep original Supabase db.ts in version control
2. Switch back by:
   ```bash
   git checkout original-branch backend/netlify/functions/api/utils/db.ts
   git checkout original-branch backend/package.json
   ```
3. Run `npm install` to restore Supabase SDK
4. Restart backend services

## Code Examples

### Inventory Operations
```javascript
// Add item
const newItem = await addInventoryItem({
  name: "tomato",
  quantity_approx: 3,
  unit: "pieces",
  confidence: "approximate"
});

// Deduct with quantity validation
const { deducted_item, remainder_item_id } = await deductInventoryQuantity(
  itemId,
  2 // deduct 2 units
);
// If successful: creates remainder item, marks original as date_used
// If insufficient: throws error preventing deduction
```

### Chat Operations
```javascript
// Add message
const msg = await addChatMessage(
  "What can I make with these ingredients?",
  "user"
);

// Get chat history
const history = await getChatHistory(20); // last 20 messages
```

## Known Limitations

1. **No Transactions:** PocketBase doesn't support transactions, so partial failures in multi-step operations could leave inconsistent state
   - Mitigation: Implement client-side retry logic for partial failures

2. **No Stored Procedures:** Complex validation must happen in backend code
   - Example: Quantity validation is done in Node.js before calling PocketBase

3. **Limited Query Flexibility:** PocketBase filters are simpler than SQL
   - Handles current needs, but complex aggregations would require client-side processing

## Future Enhancements

1. **WebSocket Support:** PocketBase supports real-time updates via WebSockets
   - Could implement live inventory updates for multi-user scenarios

2. **File Uploads:** PocketBase supports file attachments
   - Could add recipe photos or inventory item images

3. **Webhooks:** PocketBase can trigger webhooks on record changes
   - Could integrate external services (notifications, analytics)

4. **Collections as Relations:** Better support for recipe-inventory relationships
   - Could create cooking_sessions as persistent PocketBase collection

## Contact & Questions

For migration issues or questions:
1. Check POCKETBASE_SETUP.md for configuration help
2. Review MIGRATION_SUMMARY.md for complete change list
3. Consult PocketBase docs: https://pocketbase.io/docs/
4. Check db.ts inline comments for implementation details

---

Last Updated: 2026-04-07
