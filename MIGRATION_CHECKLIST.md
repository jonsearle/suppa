# PocketBase Migration Checklist

## Pre-Migration Setup

- [x] Read MIGRATION_SUMMARY.md for overview
- [x] Review POCKETBASE_SETUP.md for installation
- [x] Review IMPLEMENTATION_NOTES.md for technical details

## Installation & Setup

- [ ] Install PocketBase: `brew install pocketbase`
- [ ] Start PocketBase: `pb serve`
- [ ] Verify admin UI accessible at `http://localhost:8090/admin`

## Collection Creation

### inventory_items Collection
- [ ] Click "New collection" in PocketBase admin
- [ ] Name: `inventory_items`
- [ ] Add fields:
  - [ ] `user_id` (Text, required)
  - [ ] `name` (Text, required)
  - [ ] `canonical_name` (Text, optional)
  - [ ] `has_item` (Boolean, default: false)
  - [ ] `quantity_approx` (Number, optional)
  - [ ] `unit` (Text, optional)
  - [ ] `confidence` (Select: exact, approximate, required, default: approximate)
  - [ ] `date_added` (DateTime, required, default: now)
  - [ ] `date_used` (DateTime, optional)
- [ ] Create indexes:
  - [ ] `user_id`
  - [ ] `canonical_name`
  - [ ] `date_used`

### chat_messages Collection
- [ ] Click "New collection" in PocketBase admin
- [ ] Name: `chat_messages`
- [ ] Add fields:
  - [ ] `user_id` (Text, required)
  - [ ] `message` (Text, required)
  - [ ] `role` (Select: user, assistant, required)
  - [ ] `timestamp` (DateTime, required, default: now)
- [ ] Create indexes:
  - [ ] `user_id`
  - [ ] `timestamp`

## Backend Configuration

- [ ] Copy `.env.example` to `.env.local` (if not exists)
- [ ] Set `POCKETBASE_URL=http://localhost:8090`
- [ ] Set `USER_ID=test_user_id` (or any test value)
- [ ] Set `OPENAI_API_KEY=<your_key>` (from existing setup)
- [ ] Verify file: `backend/package.json` (no @supabase/supabase-js)
- [ ] Run: `cd backend && npm install`

## Code Verification

- [ ] Verify `db.ts` has no Supabase references: `grep -i supabase backend/netlify/functions/api/utils/db.ts`
- [ ] Confirm file contains `pocketbaseFetch` function: `grep -c "pocketbaseFetch" backend/netlify/functions/api/utils/db.ts`
- [ ] Check all 6 functions are exported: `grep "^export async function" backend/netlify/functions/api/utils/db.ts`

## Local Testing

- [ ] Start PocketBase: `pb serve`
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Test GET /api/inventory (should return empty array or existing items)
- [ ] Test POST /api/inventory with:
  ```json
  {
    "user_input": "3 tomatoes, 2 chicken breasts"
  }
  ```
- [ ] Verify items are stored in PocketBase admin > inventory_items collection
- [ ] Test GET /api/inventory again (should show new items)
- [ ] Test POST /api/chat with:
  ```json
  {
    "meal_type": "breakfast"
  }
  ```
- [ ] Verify meal suggestions returned (no errors)

## Manual Database Testing

In PocketBase admin:
- [ ] Open inventory_items collection
- [ ] Verify test items created by API
- [ ] Check `date_used` is null for active items
- [ ] Open chat_messages collection
- [ ] Verify chat history is empty (first test)

## Cooking Flow Test

- [ ] POST /api/cooking/start with test recipe
- [ ] Verify ingredients_to_deduct list returned
- [ ] POST /api/cooking/complete to deduct inventory
- [ ] Verify in PocketBase admin:
  - [ ] Deducted items have `date_used` set
  - [ ] Remainder items created for partial deductions

## Deduction Scenarios

Test all quantity deduction paths:
- [ ] Boolean item deduction (has_item=true, no quantity)
- [ ] Exact quantity match (consumed entire amount)
- [ ] Partial deduction (creates remainder item)
- [ ] Insufficient quantity (throws error, prevents deduction)

## Data Integrity Tests

- [ ] Merge-on-add: Add same item twice, verify quantity updated
- [ ] Chat history: Add multiple messages, verify all retrieved in order
- [ ] Soft deletes: Mark item as used, verify not in active list
- [ ] User isolation: Verify filtering by USER_ID works (if testing multiple users)

## Error Handling Tests

- [ ] Invalid recipe (no inventory items) → proper error
- [ ] Missing environment variables → proper error
- [ ] PocketBase offline → proper error message
- [ ] Invalid filter format → proper error

## Performance Baseline

Record baseline performance (with one tab open):
- [ ] GET /api/inventory response time: _____ ms
- [ ] POST /api/inventory response time: _____ ms
- [ ] POST /api/cooking/complete response time: _____ ms

## Documentation Review

- [ ] Read MIGRATION_SUMMARY.md for future reference
- [ ] Read POCKETBASE_SETUP.md for deployment steps
- [ ] Read IMPLEMENTATION_NOTES.md for architecture details
- [ ] Review inline comments in db.ts for implementation details

## Backup & Safety

- [ ] Save PocketBase data location: `pb_data/` directory
- [ ] Create backup of existing PocketBase data
- [ ] Document PocketBase instance URL and credentials
- [ ] Keep original Supabase credentials safe (in case rollback needed)

## Production Deployment

When ready to deploy:
- [ ] Choose production PocketBase hosting (Docker, VPS, or Cloud)
- [ ] Create production collections with same schema
- [ ] Set `POCKETBASE_URL` to production instance
- [ ] Set `USER_ID` to real user ID (before JWT auth)
- [ ] Configure CORS in PocketBase for frontend domain
- [ ] Enable SSL/HTTPS for production
- [ ] Set up backup strategy for `pb_data/`
- [ ] Document how to restore from backup
- [ ] Test all flows in production environment

## Rollback Plan (If Needed)

If critical issues arise:
- [ ] Stop current services
- [ ] Revert db.ts: `git checkout original-version db.ts`
- [ ] Revert package.json: `git checkout original-version package.json`
- [ ] Run: `npm install` (restore Supabase SDK)
- [ ] Update .env to use Supabase credentials
- [ ] Restart services
- [ ] Verify all flows work

## Sign-off

- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Documentation complete and reviewed
- [ ] Ready for production deployment

---

**Checklist Completed By:** _________________
**Date:** _________________
**Notes:**

