# Task 8: Test Plan for Error Handling & Refinements

**Date:** 2026-04-06
**Status:** Ready for Testing

---

## Test Objectives

Validate the two CRITICAL fixes implemented in Task 8:
1. Partial deduction works correctly (remainder items created)
2. Insufficient quantity is properly blocked

---

## Test Scenarios

### Scenario 1: Partial Deduction ✅

**Setup:**
- User has: 10 tomatoes (exact quantity)
- Recipe needs: 3 tomatoes

**Steps:**
1. Start cooking
2. Review ingredients confirmation
3. Confirm cooking

**Expected Result:**
- Deduction succeeds
- Response shows: `success: true`, no error
- Inventory before: 10 tomatoes
- Inventory after: 7 tomatoes (remainder item created)
- Original 10-tomato item marked as `date_used`
- New 7-tomato item created with same `canonical_name`

**Validation:**
```bash
# Before cooking
SELECT * FROM inventory_items WHERE name = 'tomato' AND user_id = '...' AND date_used IS NULL
# Result: 10, exact

# After cooking
SELECT * FROM inventory_items WHERE canonical_name = 'tomato' AND user_id = '...'
# Result:
#   - ID A: quantity=10, date_used=NOW()  (original, marked as used)
#   - ID B: quantity=7, date_used=NULL   (remainder, active)
```

---

### Scenario 2: Exact Match Deduction ✅

**Setup:**
- User has: 2 chicken breasts (exact)
- Recipe needs: 2 chicken breasts

**Steps:**
1. Start cooking
2. Review ingredients
3. Confirm cooking

**Expected Result:**
- Deduction succeeds
- No remainder item created (exact match)
- Chicken breast item marked as `date_used`
- Inventory shows 0 chicken breasts

**Validation:**
```bash
# After cooking
SELECT * FROM inventory_items WHERE canonical_name = 'chicken' AND user_id = '...' AND date_used IS NULL
# Result: Empty (no active items)

SELECT * FROM inventory_items WHERE canonical_name = 'chicken' AND user_id = '...' AND date_used IS NOT NULL
# Result: 1 row with quantity=2, date_used=NOW()
```

---

### Scenario 3: Insufficient Quantity Blocked 🚨 (CRITICAL)

**Setup:**
- User has: 1 tomato
- Recipe needs: 5 tomatoes

**Steps:**
1. Start cooking
2. See ingredients to deduct
3. Attempt to confirm cooking

**Expected Result:**
- Deduction fails with error
- Response shows: `success: false`, `error_type: 'insufficient_quantity'`
- Error message: "Insufficient quantity: need 5 pieces, have 1"
- Frontend shows error in red
- Inventory unchanged (no deduction occurred)
- User can see which items failed and why

**Frontend Error Display:**
```
[RED BANNER]
Insufficient Inventory
You don't have enough of tomato. Add more items to your inventory or choose a different recipe.
• tomato: Insufficient quantity: need 5 pieces, have 1

[Buttons: "Go Back" | "Retry"]
```

**Database Validation:**
```bash
# Inventory before = 1 tomato
SELECT * FROM inventory_items WHERE canonical_name = 'tomato' AND user_id = '...' AND date_used IS NULL
# Result: 1 row with quantity=1

# After failed deduction, should be UNCHANGED
SELECT * FROM inventory_items WHERE canonical_name = 'tomato' AND user_id = '...' AND date_used IS NULL
# Result: 1 row with quantity=1 (STILL UNCHANGED - no deduction occurred)
```

---

### Scenario 4: Boolean Item (Salt/Spices) ✅

**Setup:**
- User has: Salt (boolean, has_item=true)
- Recipe needs: "pinch of salt"

**Steps:**
1. Start cooking
2. See salt in ingredients
3. Confirm cooking

**Expected Result:**
- Deduction succeeds
- Salt item marked as `date_used`
- No quantity check (boolean items don't require quantity validation)
- Recipe can use "pinch" of salt successfully

---

### Scenario 5: Mixed Success/Failure (Multiple Ingredients)

**Setup:**
- User has: 10 chicken (exact), 1 tomato (exact), 100g flour (exact)
- Recipe needs: 5 chicken, 5 tomatoes, 50g flour

**Steps:**
1. Start cooking
2. Review ingredients
3. Confirm cooking

**Expected Result:**
- Chicken: succeeds (5 deducted, 5 remain)
- Tomato: **fails** (needs 5, have 1) → insufficient_quantity error
- Flour: succeeds (50 deducted, 50 remain)

**Frontend Shows:**
- Chicken: ✓ Success
- Tomato: ❌ Error (insufficient_quantity)
- Flour: ✓ Success

**Button Changes:**
- Changes from "Confirm & Deduct" to "Retry"
- User can add more tomatoes and retry

**Database State:**
- Chicken: Original 10 marked as used, 5 remainder created
- Tomato: **UNCHANGED** (no deduction occurred)
- Flour: Original 100 marked as used, 50 remainder created

---

### Scenario 6: Approximate Quantity + Insufficient

**Setup:**
- User has: "some tomatoes" (approximate, quantity_approx=3)
- Recipe needs: 5 tomatoes (exact)

**Steps:**
1. Start cooking (yellow warning shows "Approx")
2. Confirm cooking

**Expected Result:**
- Fails with insufficient_quantity error
- Message: "Insufficient quantity: need 5 pieces, have 3"
- Plus original approximate warning still visible
- User sees BOTH warnings: approximate + insufficient

---

## API Response Validation

### Success Response Format
```json
{
  "data": {
    "recipe_name": "Tomato Basil Chicken",
    "deducted_items": [
      {
        "inventory_item_id": "abc-123",
        "quantity": 2,
        "unit": "pieces",
        "success": true,
        "remainder_item_id": "xyz-789"
      },
      {
        "inventory_item_id": "def-456",
        "quantity": 3,
        "unit": "pieces",
        "success": true
      }
    ],
    "inventory_after": [...]
  },
  "message": "Great job! 2 ingredient(s) deducted from inventory."
}
```

### Error Response Format
```json
{
  "data": {
    "recipe_name": "Tomato Basil Chicken",
    "deducted_items": [
      {
        "inventory_item_id": "abc-123",
        "quantity": 5,
        "unit": "pieces",
        "success": false,
        "reason": "Insufficient quantity: need 5 pieces, have 1",
        "error_type": "insufficient_quantity"
      }
    ],
    "inventory_after": [...]
  },
  "message": "Great job! 0 ingredient(s) deducted from inventory."
}
```

---

## Frontend Component Testing

### CookingConfirm Component Changes

**New Behavior:**
- [ ] Displays error message when deduction fails
- [ ] Shows `error_type` in red banner
- [ ] Lists all failed items with reasons
- [ ] Button changes to "Retry" when errors present
- [ ] "Go Back" button appears instead of "Cancel"
- [ ] Can retry after adding more inventory

**Before Fix (Old):**
```
Generic error message
[Cancel] [Confirm & Deduct]
```

**After Fix (New):**
```
[RED BANNER]
Insufficient Inventory
You don't have enough of tomato. Add more items or choose different recipe.
• tomato: Insufficient quantity: need 5 pieces, have 1

[Go Back] [Retry]
```

---

## Test Checklist

**Backend Deduction Logic:**
- [ ] Partial deduction creates remainder item
- [ ] Remainder item has correct quantity
- [ ] Remainder item has same canonical_name
- [ ] Remainder item is marked date_used=NULL (active)
- [ ] Original item is marked date_used=NOW()
- [ ] Insufficient quantity throws error
- [ ] Error message includes needed and available quantities
- [ ] Boolean items skip quantity validation
- [ ] Exact match deduction creates no remainder
- [ ] Multiple ingredients handled correctly (some fail, some succeed)

**API Service (api.ts):**
- [ ] completeCooking returns detailed response
- [ ] Returns deducted_items array
- [ ] Each item has success, reason, error_type fields
- [ ] remainder_item_id populated when applicable

**Frontend Component (CookingConfirm.tsx):**
- [ ] Displays failed items with red highlighting
- [ ] Shows error message in red banner
- [ ] Distinguishes insufficient_quantity from system_error
- [ ] "Retry" button appears after error
- [ ] "Go Back" button works
- [ ] Can retry after user adds inventory
- [ ] Approximate warnings still show alongside errors
- [ ] Network errors handled gracefully

**Database Audit:**
- [ ] Failed deductions don't modify inventory
- [ ] Successful deductions create audit trail
- [ ] Remainder items appear in next getInventory() call
- [ ] Canonical names preserved on remainder items
- [ ] Can cook multiple times with remainder items

---

## Known Limitations (Phase 1+)

**Not Implemented in MVP:**
- [ ] Unit conversion (500g flour ≠ 1 cup flour) - block for now
- [ ] Plural handling ("tomatoes" vs "tomato") - use canonical names
- [ ] Session persistence - expires on server restart
- [ ] Rollback transaction if partial failure
- [ ] Real-time inventory sync if user modifies during cooking

---

## Success Criteria

**MUST PASS:**
- ✅ Partial deductions work correctly
- ✅ Insufficient quantities are blocked
- ✅ Error messages display in UI
- ✅ Database state remains consistent
- ✅ No data corruption

**SHOULD PASS:**
- Remainder items properly merged on next add
- Multiple cooks work sequentially
- Boolean items handled correctly

**NICE TO HAVE:**
- Performance of remainder item creation
- Error message clarity

---

## Running Tests Manually

**Prerequisites:**
- Backend running on http://localhost:8888
- Frontend running on http://localhost:3000
- User has inventory in database

**Test Flow:**
1. Add inventory (10 tomatoes, 2 chicken, 100g flour)
2. Get meal suggestions
3. Select recipe
4. Get recipe detail
5. Start cooking
6. Review confirmation with ingredients
7. Confirm deduction
8. Check response for success/error
9. Query database to verify state
10. Check inventory UI to confirm remainder items appear

---

## Debugging Checklist

If tests fail:

1. **Check backend logs:**
   ```bash
   # Look for error messages in deductInventoryQuantity
   # Check quantity calculations
   # Verify remainder item creation
   ```

2. **Check database:**
   ```sql
   -- Verify original item marked as used
   SELECT id, name, quantity_approx, date_used FROM inventory_items
   WHERE canonical_name = 'tomato' ORDER BY date_added DESC;

   -- Verify remainder item created
   SELECT id, name, quantity_approx, date_used FROM inventory_items
   WHERE canonical_name = 'tomato' AND date_used IS NULL;
   ```

3. **Check API response:**
   ```bash
   # Use curl to test /api/cooking/complete endpoint
   # Verify deducted_items array includes remainder_item_id
   ```

4. **Check frontend console:**
   ```javascript
   // Log deductionErrors state
   // Verify error_type is set correctly
   // Check error message formatting
   ```

---

## Next Steps After Testing

1. **If tests pass:** Proceed to Task 9 (Polish & Final Iteration)
2. **If tests fail:** Debug using checklist above, iterate on fixes
3. **Document findings:** Update TASK_8_PROGRESS.md with results

