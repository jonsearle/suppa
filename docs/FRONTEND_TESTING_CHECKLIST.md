# Frontend Integration Testing Checklist

**Task 6 Day 8: Wire Frontend to Backend**

This checklist covers all 5 critical integration flows for the Suppa meal discovery app. Each flow tests the full round-trip from user action through backend processing to updated UI.

## Prerequisites

Before starting, ensure:
- Backend is running on http://localhost:8888
- Frontend is running on http://localhost:3000
- Environment variables are properly set:
  - `OPENAI_API_KEY` in backend
  - `SUPABASE_URL` and `SUPABASE_ANON_KEY` in backend
  - `REACT_APP_API_URL=http://localhost:8888` in frontend
- Browser DevTools console is open to watch for errors

## Flow 1: Inventory Management

### Test 1.1: Add Single Item with Exact Quantity
**User Action**: Type "3 chicken breasts" in inventory form and submit
**Expected Behavior**:
- Form submits and clears
- No error message appears
- New item appears in inventory list with name "chicken breasts" (or normalized variant)
- Quantity shows "3 pieces"
- Date added shows today's date
- Confidence badge does NOT appear (exact quantity = no badge)

**Console Check**:
- No errors in console
- GET /api/inventory succeeds (200 status)
- POST /api/inventory succeeds (201 status)

**Pass Criteria**: ✓ All checks pass

### Test 1.2: Add Multiple Items in One Input
**User Action**: Type "2 tomatoes, some basil, 500g rice" and submit
**Expected Behavior**:
- All three items appear in inventory list
- Tomatoes: "2 pieces" (exact)
- Basil: "1" with "Approx" badge (approximate)
- Rice: "500 g" (exact)
- Deduplication: If you already have "basil" from a previous add, should merge into one "basil" item

**Console Check**:
- POST request body shows correctly parsed user_input
- Response includes 3 items

**Pass Criteria**: ✓ All items added, deduplication works

### Test 1.3: Deduplication
**User Action**:
1. Add "potatoes"
2. Add "3 potatoes"
**Expected Behavior**:
- After step 1: One item "potatoes" appears
- After step 2: Still ONE "potatoes" item (not two)
- Quantity updates to "3 pieces"
- No duplicate entries

**Console Check**:
- Both POST requests succeed
- Second POST updates existing item instead of creating new one

**Pass Criteria**: ✓ No duplicates, quantity updated

### Test 1.4: Error Handling - Empty Input
**User Action**: Click "Add Items" button without typing anything
**Expected Behavior**:
- Button is disabled (grayed out)
- No API call is made
- Error message appears: "Please enter some items"

**Console Check**:
- No POST request made
- No console errors

**Pass Criteria**: ✓ Frontend validation works

### Test 1.5: Error Handling - Connection Failed
**User Action**: Stop backend server, then try to add an item
**Expected Behavior**:
- Error message appears: "Connection failed. Is the backend running?"
- User can still interact with UI
- Error is clear and actionable

**Console Check**:
- Error shows network failure (Type error or 0 status code)
- No unhandled exceptions

**Pass Criteria**: ✓ Error handled gracefully

## Flow 2: Meal Suggestions

### Test 2.1: Get Dinner Suggestions with Diverse Inventory
**Setup**: Add "3 chicken breasts, 2 tomatoes, basil, 500g pasta" to inventory
**User Action**:
1. Go to Suggestions tab
2. Select "Dinner" meal type
3. Click "Suggest Meals"
**Expected Behavior**:
- Loading spinner appears
- Within 5-10 seconds, 3-5 meal suggestions appear
- Each suggestion shows:
  - Recipe name (e.g., "Tomato Basil Chicken Pasta")
  - Description (menu-quality, e.g., "Pan-seared chicken with fresh tomatoes and aromatic basil...")
  - Time estimate (reasonable: 20-45 mins for dinner)
- All suggestions use only available items (no garlic, oil, salt if not added)
- No duplicate suggestions

**Console Check**:
- GET /api/inventory succeeds
- POST /api/chat with meal_type: "dinner" succeeds
- Response includes recipes array with name, description, time_estimate_mins

**Pass Criteria**: ✓ 3-5 quality suggestions returned

### Test 2.2: Get Breakfast Suggestions with Limited Inventory
**Setup**: Clear inventory, add "6 eggs, 1 loaf bread"
**User Action**:
1. Go to Suggestions tab
2. Select "Breakfast"
3. Click "Suggest Meals"
**Expected Behavior**:
- 3-4 suggestions appear
- All mention eggs or bread
- Time estimates are quick: 5-20 minutes
- Examples might include: "Scrambled Eggs", "French Toast with Bread", "Fried Eggs on Toast"

**Pass Criteria**: ✓ Quality breakfast suggestions for limited inventory

### Test 2.3: Get Lunch Suggestions
**Setup**: Add "500g rice, 300g chicken, 2 carrots, broccoli"
**User Action**: Select "Lunch" and click "Suggest Meals"
**Expected Behavior**:
- 3-5 lunch suggestions appear
- Balanced complexity: not too quick, not too heavy
- Time estimates: 15-40 minutes

**Pass Criteria**: ✓ 3-5 quality lunch suggestions

### Test 2.4: Error - No Inventory
**Setup**: Clear all inventory
**User Action**: Try to get meal suggestions
**Expected Behavior**:
- Error message appears: "No inventory items found" or "Add items to your inventory first"
- Message is clear and actionable
- Button remains clickable for retry

**Console Check**:
- POST /api/chat returns 400 status
- Error message is user-friendly

**Pass Criteria**: ✓ Clear error for empty inventory

### Test 2.5: Error - Connection Failed
**User Action**: Stop backend, then try to get suggestions
**Expected Behavior**:
- Error message: "Connection failed. Is the backend running?"
- User can restart and retry

**Pass Criteria**: ✓ Network errors handled

## Flow 3: Recipe Detail

### Test 3.1: View Full Recipe Details
**Setup**: Add "3 chicken breasts, 2 tomatoes, basil, 500g pasta" and get suggestions
**User Action**:
1. Click on any recipe card (e.g., "Tomato Basil Chicken Pasta")
**Expected Behavior**:
- Loading spinner appears
- Full recipe displays with:
  - Recipe title
  - Description (menu-quality)
  - Time estimate
  - Full ingredients list (each ingredient shows: name, quantity, unit)
  - Step-by-step instructions (numbered list)
- Page smoothly transitions from suggestions to detail view

**Console Check**:
- POST /api/cooking/detail is called with recipe_name, recipe_description, recipe_time_mins
- Response includes full recipe with ingredients array and instructions array
- No hallucinated ingredients (all must be available)

**Pass Criteria**: ✓ Full recipe displays correctly

### Test 3.2: Recipe Uses Only Available Ingredients
**User Action**: Examine the full recipe after clicking on suggestion
**Expected Behavior**:
- Every ingredient in the recipe matches something in your inventory
- If you have "chicken breasts", recipe shows "chicken" (normalized)
- No unexpected ingredients like "garlic", "olive oil", "salt" if not in inventory
- Quantities are reasonable (e.g., if you have 3 chicken breasts, recipe doesn't call for 5)

**Validation Criteria**:
- Go through each ingredient in the recipe
- Cross-reference with inventory list
- All ingredients must exist in inventory

**Pass Criteria**: ✓ No hallucinated ingredients

### Test 3.3: Back Navigation
**User Action**: Click "← Back to Suggestions" button
**Expected Behavior**:
- Returns to suggestions view
- Suggestions list is still visible
- No data is lost

**Pass Criteria**: ✓ Navigation works smoothly

### Test 3.4: Error - Recipe Generation Failed
**Setup**: Add only "salt, pepper" (pantry staples)
**User Action**: Try to view recipe details
**Expected Behavior**:
- Error message appears explaining why recipe can't be generated
- Message is helpful: "Cannot create a recipe with only seasonings"
- Back button still works

**Pass Criteria**: ✓ Graceful error handling

## Flow 4: Cooking Confirmation (The Critical One)

### Test 4.1: Start Cooking Confirmation Dialog
**Setup**: Complete Flow 3 to get full recipe details
**User Action**: Click "Start Cooking" button on recipe detail
**Expected Behavior**:
- Navigates to "Confirm" tab
- Dialog shows:
  - Title: "Confirm Ingredients Used"
  - List of all ingredients to be deducted
  - Each ingredient shows: name, quantity, unit
- Approximate ingredients are highlighted with yellow background and "⚠️ Approx" badge
- Exact ingredients have green background
- Warning message appears if any approximate items: "Approximate quantities detected. Review carefully."
- Two buttons: "Cancel" and "Confirm & Deduct"

**Console Check**:
- POST /api/cooking/start is called
- Response includes session_id and ingredients_to_deduct array
- Each ingredient has: name, quantity, unit, inventory_item_id, confidence

**Pass Criteria**: ✓ Confirmation dialog properly formatted

### Test 4.2: Two-Step Confirmation (Safety Check)
**User Action**:
1. Click "Start Cooking" on recipe
2. Review the confirmation dialog
3. Click "Cancel"
**Expected Behavior**:
- Cooking confirmation is cancelled
- Returns to recipe detail view
- Inventory is NOT changed
- No items are deducted

**Inventory Check**:
- Verify GET /api/inventory returns same quantities as before

**Pass Criteria**: ✓ Cancel prevents accidental deduction

### Test 4.3: Confirm Cooking and Deduct
**Setup**: Recipe with 3 chicken breasts, 2 tomatoes
**Current Inventory**: 3 chicken breasts, 2 tomatoes (exact match)
**User Action**:
1. Click "Start Cooking"
2. Review confirmation
3. Click "Confirm & Deduct"
**Expected Behavior**:
- Loading: "Confirming..." button state
- Success: Message appears "Great job! X ingredients deducted"
- Navigates back to Inventory tab
- Inventory list UPDATES:
  - Items that were fully used are removed or marked as used
  - Items with partial quantities are updated

**Console Check**:
- POST /api/cooking/complete is called with session_id, deduction_confirmed: true
- Response shows deducted_items array with success: true for each
- GET /api/inventory is called after to refresh list

**Pass Criteria**: ✓ Deduction succeeds and inventory updates

### Test 4.4: Approximate Quantity Warning
**Setup**: Recipe with "some basil" (approximate quantity)
**User Action**: Start cooking with approximate ingredients
**Expected Behavior**:
- Approximate item (basil) has yellow background in confirmation
- Warning badge shows "⚠️ Approx"
- Warning message: "You said 'basil' without exact quantity. Verify this amount is correct."
- User sees clear visual distinction between exact and approximate
- User can still confirm (two-step prevents accidents)

**Pass Criteria**: ✓ Approximate items are clearly flagged

### Test 4.5: Deduction with Excess Quantity
**Setup**: Add "10 chicken breasts", recipe needs 3
**User Action**: Complete cooking flow
**Expected Behavior**:
- Confirmation shows: deduct "3 pieces"
- After deduction: Inventory shows remaining "7 chicken breasts"
- Item is NOT removed, quantity is decreased

**Console Check**:
- deductInventory function updates quantity correctly
- GET /api/inventory shows updated quantity

**Pass Criteria**: ✓ Partial deduction works

## Flow 5: Full End-to-End Journey

### Test 5.1: Complete User Journey
**Steps**:
1. Add inventory: "3 chicken breasts, 2 tomatoes, basil, 500g pasta, 6 eggs"
2. Get dinner suggestions → Select "Tomato Basil Pasta"
3. View full recipe → Verify ingredients
4. Start cooking → Confirm deduction
5. Verify inventory updated

**Expected Result**: Full flow completes without errors, inventory correctly reflects what was used

**Console Checks**:
- All API calls succeed (200/201 status)
- No console errors
- No network errors
- Loading states show and clear appropriately

**Pass Criteria**: ✓ Complete journey works end-to-end

### Test 5.2: Multiple Cooking Sessions
**User Action**: Complete cooking flow, then:
1. Add new inventory items
2. Get suggestions again
3. Cook a different recipe

**Expected Result**: Second flow completes independently, inventory correctly reflects both deductions

**Pass Criteria**: ✓ Multiple sessions work correctly

## Summary Checklist

For successful completion of Task 6, all of these must pass:

- [ ] Test 1.1: Add single item
- [ ] Test 1.2: Add multiple items
- [ ] Test 1.3: Deduplication works
- [ ] Test 1.4: Empty input validation
- [ ] Test 1.5: Connection error handling
- [ ] Test 2.1: Dinner suggestions (3-5)
- [ ] Test 2.2: Breakfast suggestions (limited inventory)
- [ ] Test 2.3: Lunch suggestions
- [ ] Test 2.4: No inventory error
- [ ] Test 2.5: Connection error (suggestions)
- [ ] Test 3.1: Full recipe details display
- [ ] Test 3.2: No hallucinated ingredients
- [ ] Test 3.3: Back navigation works
- [ ] Test 3.4: Recipe generation error handling
- [ ] Test 4.1: Confirmation dialog displays correctly
- [ ] Test 4.2: Cancel prevents deduction
- [ ] Test 4.3: Confirm deducts and updates inventory
- [ ] Test 4.4: Approximate quantities are flagged
- [ ] Test 4.5: Partial deduction works
- [ ] Test 5.1: Complete journey works
- [ ] Test 5.2: Multiple sessions work

**Success Criteria**: All 22 tests pass, no console errors, all 5 flows complete end-to-end

---

## Testing Notes

### Performance Expectations
- Add inventory: < 3 seconds
- Get suggestions: 5-10 seconds (LLM call)
- Get recipe details: 5-10 seconds (LLM call)
- Start cooking: < 1 second (session creation)
- Complete cooking: < 2 seconds (deduction)

### Visual Feedback
- Loading spinners should appear for all async operations
- Error messages should be red and clear
- Success states should provide confirmation
- Warning states (approximate) should use yellow
- All buttons should show disabled/loading state during operation

### Data Validation
- Inventory quantities must be positive numbers
- Time estimates must be 5-180 minutes (reasonable range)
- Descriptions must be non-empty strings
- Instructions must be non-empty arrays
- Ingredients must have name, quantity, unit

---

**Created**: Task 6, Day 8
**Last Updated**: 2026-04-06
