# Frontend Manual Testing Checklist - Task 5

## Setup
- [ ] Backend is running locally on http://localhost:8888
- [ ] Frontend is running on http://localhost:3000
- [ ] Browser console shows no TypeScript errors
- [ ] Network tab shows successful API calls

## Inventory Tab Tests

### Initial Load
- [ ] Page loads without errors
- [ ] "No inventory yet" message appears (if no items exist)
- [ ] "Add Items to Inventory" form is visible
- [ ] Textarea has placeholder text "I have..."

### Add Inventory
- [ ] Type "3 chicken breasts, 2 tomatoes, some salt"
- [ ] Click "Add Items" button
- [ ] Loading indicator appears briefly
- [ ] Items appear in inventory list below
- [ ] Exact quantities show (e.g., "3 pieces")
- [ ] Approximate items show yellow "Approx" badge
- [ ] Textarea clears after successful submission
- [ ] Same items can be added again (duplicates appear)

### Error Handling
- [ ] Leave textarea empty, click "Add Items" → error message appears
- [ ] Disconnect network, try adding items → "Connection failed" message
- [ ] Reconnect network, try again → works
- [ ] Invalid text (random symbols) → backend parsing error message shows

### Inventory Display
- [ ] Items show name, quantity, unit
- [ ] Approximate items highlighted differently than exact items
- [ ] Dates shown in readable format (MM/DD/YYYY)
- [ ] List updates when new items added
- [ ] Scrolls if many items exist

## Suggestions Tab Tests

### Initial State
- [ ] Switch to "Suggestions" tab
- [ ] Meal type selector shows (Breakfast, Lunch, Dinner)
- [ ] "Dinner" is selected by default
- [ ] "Suggest Meals" button visible
- [ ] No recipes shown yet

### Get Suggestions
- [ ] Click "Suggest Meals" button
- [ ] Loading spinner appears
- [ ] After 2-5 seconds, recipe cards appear
- [ ] Each card shows:
  - Recipe name
  - Description
  - Time estimate with ⏱️ icon
  - "View Recipe" button

### Multiple Meal Types
- [ ] Click "Breakfast" button
- [ ] Click "Suggest Meals"
- [ ] Different recipes appear (breakfast-appropriate)
- [ ] Repeat for "Lunch"

### Error Handling (Suggestions)
- [ ] Add only 1 item to inventory
- [ ] Try to get suggestions
- [ ] Either recipes appear OR "No meal suggestions" message shows
- [ ] No API errors in console

## Recipe Detail Tests

### View Recipe
- [ ] Click "View Recipe" on any recipe card
- [ ] Full recipe detail page loads
- [ ] Shows name, description, time estimate prominently
- [ ] Ingredients list visible with quantities
- [ ] Instructions visible (numbered steps)
- [ ] "Back to Suggestions" button visible
- [ ] "Start Cooking" button visible

### Recipe Content
- [ ] Each ingredient shows:
  - Name (e.g., "Chicken")
  - Quantity and unit (e.g., "2 pieces", "3 cups")
- [ ] Each instruction is a separate numbered item
- [ ] Instructions are readable (no truncation)

### Error Handling (Recipe Detail)
- [ ] If recipe generation fails, error message shows
- [ ] "Back to Suggestions" still works

## Cooking Confirmation Tests

### Start Cooking
- [ ] Click "Start Cooking" on recipe detail
- [ ] "Cooking" tab appears in navigation
- [ ] Confirm dialog shows with ingredients to be deducted
- [ ] Each ingredient shows:
  - Name
  - Quantity
  - Yellow "Approx" badge if approximate

### Approximate Item Warning
- [ ] If any items are approximate:
  - [ ] Yellow background highlight appears
  - [ ] Warning badge shows "⚠️ Approx"
  - [ ] Explanation text shows ("You said X without exact quantity")
- [ ] Summary warning at bottom explains approximate count

### Confirm Cooking
- [ ] Click "Confirm & Deduct" button
- [ ] "Confirming..." text appears briefly
- [ ] Dialog closes
- [ ] Returns to Inventory tab
- [ ] Deducted items no longer appear in inventory

### Cancel Cooking
- [ ] While in confirmation dialog, click "Cancel"
- [ ] Dialog closes
- [ ] Returns to recipe detail (or suggestions)
- [ ] Inventory unchanged (items still there)

### Error Handling (Cooking)
- [ ] If deduction fails, error message shows
- [ ] Can retry without losing state

## Navigation Tests

- [ ] Clicking "Inventory" tab switches view
- [ ] Clicking "Suggestions" tab switches view
- [ ] "Cooking" tab only visible during cooking confirmation
- [ ] Can navigate between tabs without losing data
- [ ] Scrolling works in all tabs

## Responsive Design Tests

### Mobile (375px width)
- [ ] App scales to mobile size
- [ ] All buttons remain clickable
- [ ] Text remains readable
- [ ] Inventory list scrolls vertically
- [ ] Recipe cards stack vertically

### Tablet (768px width)
- [ ] Recipe cards display in 2-column grid
- [ ] All content visible without horizontal scroll
- [ ] Forms are usable

### Desktop (1280px width)
- [ ] Recipe cards display in 2-column grid (or more)
- [ ] Content not too wide (max-width container)
- [ ] Spacing feels balanced

## Loading State Tests

- [ ] All async operations show loading indicator
- [ ] Buttons disabled during loading (prevent double-click)
- [ ] Loading text changes (e.g., "Adding..." not "Add Items")
- [ ] Spinner animates

## Error Message Tests

- [ ] Error messages appear near the action (not generic alerts)
- [ ] Error text is readable and actionable
- [ ] Errors don't prevent retrying
- [ ] Network errors clearly state "Connection failed"
- [ ] Timeout errors mention trying again

## Complete Flow Test (Happy Path)

1. [ ] Start on Inventory tab
2. [ ] Add "2 chicken breasts, 3 tomatoes, 1 cup rice, salt, pepper"
3. [ ] Switch to Suggestions tab
4. [ ] Select "Dinner"
5. [ ] Click "Suggest Meals"
6. [ ] Recipe cards appear
7. [ ] Click "View Recipe" on a recipe
8. [ ] Recipe detail loads
9. [ ] Click "Start Cooking"
10. [ ] Confirmation dialog appears
11. [ ] Review ingredients to be deducted
12. [ ] Click "Confirm & Deduct"
13. [ ] Returns to Inventory tab
14. [ ] Verify deducted items are gone
15. [ ] Try adding more items - works
16. [ ] Suggest more meals - works

## Browser Console

- [ ] No TypeScript errors
- [ ] No JavaScript exceptions
- [ ] No 404 errors for assets
- [ ] API calls to localhost:8888 are successful

## Known Limitations (MVP)

These are expected and will be addressed in Phase 1:
- No user authentication (hardcoded USER_ID in backend)
- Cooking sessions lost if browser closed (in-memory only)
- No recipe history tracking
- No favorites/bookmarks
- No recipe scaling (1x portions only)
- No dietary restriction filtering
- No estimated cost display
