# PocketBase API Tests - Task 8 Validation

Testing the two CRITICAL fixes implemented in Task 8:
1. ✅ Partial deduction (creates remainder items instead of all-or-nothing)
2. ✅ Insufficient quantity blocking (prevents over-deduction)

## Test Setup

**PocketBase URL**: `http://localhost:8090`
**Test User ID**: `test_user`
**Admin Email**: `jon.searle@gmail.com`
**Admin Password**: `SK8Ztxn4aERA7Ey`

## Test Scenario 1: Add Inventory Items

Add test inventory to work with:

```bash
# Add 10 tomatoes
curl -X POST http://localhost:8090/api/collections/inventory_items/records \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "name": "10 tomatoes",
    "canonical_name": "tomato",
    "quantity_approx": 10,
    "unit": "pieces",
    "confidence": "exact",
    "has_item": false
  }'

# Expected: Returns item with ID (e.g., "item_id_1")
```

Save the returned item IDs for use in deduction tests.

## Test Scenario 2: Partial Deduction (FIX #1)

**Setup**: Have 10 tomatoes in inventory
**Action**: Deduct 3 tomatoes
**Expected Outcome**:
- Original item marked as used (date_used set)
- New remainder item created with 7 tomatoes
- Both items exist in database
- No data loss

```bash
# This would be called via the backend API
# POST /api/cooking/complete with deduction of 3 tomatoes
# The db.deductInventoryQuantity() function should:
# 1. Check: available (10) >= needed (3) ✓
# 2. Calculate remainder: 10 - 3 = 7
# 3. Create new item: quantity_approx = 7
# 4. Mark original as used: date_used = NOW()
```

**Verify in PocketBase**:
```bash
curl -X GET "http://localhost:8090/api/collections/inventory_items/records?filter=(user_id=\"test_user\")" \
  -H "Content-Type: application/json"

# Look for:
# - Original item: has date_used set
# - Remainder item: quantity_approx = 7, date_used = null
```

## Test Scenario 3: Insufficient Quantity Blocking (FIX #2)

**Setup**: Have 2 tomatoes in inventory
**Action**: Try to deduct 5 tomatoes
**Expected Outcome**:
- Deduction BLOCKED with error
- Original inventory unchanged (still 2 tomatoes)
- Error message: "Insufficient quantity: need 5 pieces, have 2"
- Frontend receives error_type: "insufficient_quantity"

```bash
# This would be called via the backend API
# The db.deductInventoryQuantity() function should:
# 1. Check: available (2) >= needed (5) ✗
# 2. THROW ERROR immediately
# 3. Do NOT mark item as used
# 4. Do NOT create remainder
# 5. Inventory stays exactly as it was
```

**Verify in PocketBase**:
```bash
curl -X GET "http://localhost:8090/api/collections/inventory_items/records?filter=(user_id=\"test_user\")" \
  -H "Content-Type: application/json"

# Should show:
# - Tomato item: quantity_approx = 2, date_used = null (UNCHANGED)
```

## Test Scenario 4: Exact Match Deduction

**Setup**: Have 3 chicken pieces
**Action**: Deduct 3 chicken pieces
**Expected Outcome**:
- Original item marked as used
- NO remainder item created (exact match)
- Clean completion

## Test Scenario 5: Boolean Items (Salt/Spices)

**Setup**: Add salt with `has_item=true`
**Action**: Deduct salt for recipe
**Expected Outcome**:
- Item marked as used regardless of quantity
- No quantity validation needed
- Works for items like salt, spices, oils

## Direct API Testing (Backend)

Once backend is running, test the cooking completion endpoint:

```bash
# POST /api/cooking/complete
curl -X POST http://localhost:3000/api/cooking/complete \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session",
    "deduction_confirmed": true
  }'

# Expected response format:
{
  "data": {
    "recipe_name": "Test Recipe",
    "deducted_items": [
      {
        "inventory_item_id": "...",
        "quantity": 3,
        "unit": "pieces",
        "success": true,
        "remainder_item_id": "..."  // Only if partial deduction
      }
    ],
    "inventory_after": [...]
  }
}

# On insufficient quantity error:
{
  "data": {
    "deducted_items": [
      {
        "inventory_item_id": "...",
        "quantity": 5,
        "unit": "pieces",
        "success": false,
        "reason": "Insufficient quantity: need 5 pieces, have 2",
        "error_type": "insufficient_quantity"
      }
    ]
  }
}
```

## Test Checklist

- [ ] Partial deduction creates remainder items
- [ ] Insufficient quantity throws error without deducting
- [ ] Error messages are clear and actionable
- [ ] Original items marked with date_used when consumed
- [ ] Remainder items preserve canonical_name
- [ ] Multiple ingredients in one recipe (mixed success/failure)
- [ ] Boolean items work without quantity validation
- [ ] Database state is consistent (no orphaned records)

## Success Criteria (Task 8)

✅ All deductions must be validated:
1. Partial deductions work correctly
2. Insufficient quantities are blocked
3. Error messages display in frontend
4. Database remains consistent

Both CRITICAL fixes must pass all scenarios.
