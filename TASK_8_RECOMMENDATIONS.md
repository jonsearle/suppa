# Task 8-9 Recommendations
## Based on Real Usage Simulation (Task 7)

---

## Critical Issues for Task 8 (Days 11-12)

### Issue 1: Deduction Model is All-or-Nothing (CRITICAL)

**Problem:** Current deduction marks entire inventory_item as used, even if recipe only uses part of it.

**Example:**
- Inventory: 3 chicken breasts
- Recipe 1: Uses 2 chicken
- After Recipe 1: All 3 chicken marked as date_used (user loses 1 chicken)
- Recipe 2: Suggests chicken, but user can't see the leftover 1

**Impact:** Inventory becomes unreliable after first meal. Shows no items where user has leftovers.

**Root Cause:** Schema uses soft-delete pattern (date_used field) instead of quantity tracking.

**Solution Approach:**

Option A: Quantity Reduction (Simpler, MVP-appropriate)
```typescript
// Current (WRONG)
UPDATE inventory_items SET date_used = now() WHERE id = ?

// Fixed (RIGHT)
UPDATE inventory_items SET quantity_approx = quantity_approx - amount_used
WHERE id = ? AND quantity_approx >= amount_used
```

Option B: Usage Tracking (Better long-term, requires new schema)
```sql
-- New table
CREATE TABLE usage_log (
  id UUID PRIMARY KEY,
  inventory_item_id UUID REFERENCES inventory_items(id),
  cooking_session_id UUID,
  amount_used DECIMAL,
  unit VARCHAR,
  date_used TIMESTAMP DEFAULT now()
)
```

**Recommendation:** Implement Option A for Task 8 (quick fix). Plan Option B for Phase 1 (analytics/audit trail).

**Implementation Steps:**
1. Update deductInventory() in db.ts:
   - Accept amount_to_deduct parameter
   - Reduce quantity_approx instead of setting date_used
   - Return error if insufficient quantity
2. Update cooking.ts complete() endpoint:
   - Pass amount from recipe to deductInventory()
   - Don't allow deduction if insufficient
3. Update frontend CookingConfirm:
   - Show what will remain after deduction
   - Warn if insufficient quantity

**Time Estimate:** 2-3 hours (including tests)

---

### Issue 2: Insufficient Quantity Silently Allowed (CRITICAL)

**Problem:** If recipe needs 2 cups rice but user has "some rice" (≈1 cup), system allows deduction anyway.

**Current Behavior:**
- Code logs warning: "Insufficient quantity for rice: need 2, have 1"
- But continues to deduct anyway
- Result: Deduction succeeds, inventory marked as used, but recipe was actually impossible

**Better Behavior:**
1. During recipe generation: Check quantity feasibility
2. If insufficient: Either (a) adapt recipe, or (b) reject recipe
3. During cooking confirmation: Warn user prominently
4. Only allow deduction if user confirms "Use what I have"

**Solution Approach:**

Phase 1 (Task 8): Block insufficient quantities
```typescript
// In cooking.ts complete()
for (const ingredient of ingredients_to_deduct) {
  const available = inventoryItem.quantity_approx || 0;
  if (available < ingredient.quantity) {
    return res.status(400).json({
      error: 'Insufficient quantity',
      details: `${ingredient.name}: need ${ingredient.quantity}, have ${available}`,
    });
  }
}
```

Phase 2 (Task 9): Suggest alternatives or recipe adaptation
```typescript
// In prompts.ts generateRecipeDetail()
// If ingredient insufficient, ask LLM to adapt recipe
const adapted = await adaptRecipeToInventory(recipe, inventory);
```

**Implementation Steps:**
1. Add quantity check in cooking.ts complete()
2. Return 400 error with clear message
3. Frontend catches error and shows user options
4. Update CookingConfirm to show warnings for borderline quantities

**Time Estimate:** 1-2 hours

---

## High Priority Issues for Task 8

### Issue 3: Hallucination Prevention Not Tested (HIGH)

**Problem:** Parsing prompt says "Do NOT assume oil, salt, spices" but we haven't tested against real LLM.

**Example Failure Case:**
- User: "I have basil and some chicken"
- LLM might interpret: "Oh, basil needs oil. And chicken needs salt and spices"
- Result: Invented oil, salt, spices in inventory

**Solution Approach:**

1. Run real tests with OpenAI API:
```bash
# backend/scripts/test-hallucinations.ts
const testCases = [
  "basil and chicken",
  "pasta and tomatoes",
  "eggs and bread",
  "rice and vegetables"
];
// For each case, verify NO hallucinated items
```

2. If hallucinations occur, strengthen prompt:
```
// Current (may not be strong enough)
Do NOT assume the user has salt, oil, butter, spices, water, or any pantry items.

// Better (explicit list)
Do NOT include any of these unless explicitly mentioned by user:
- Oils, butter, cooking spray, fats
- Salt, pepper, spices, herbs (unless explicitly named)
- Water, stock, sauce, condiments
- Garlic, onion, cheese (unless explicitly named)
```

3. Add validation layer:
```typescript
// In parseInventoryInput post-processing
const hallucinations = detectHallucinations(parsed);
if (hallucinations.length > 0) {
  console.warn('Hallucinated items detected:', hallucinations);
  // Remove them before returning
  return parsed.filter(item => !isHallucination(item.name));
}
```

**Implementation Steps:**
1. Create test script with 10+ test cases
2. Run against real OpenAI API
3. Document results (pass rate %)
4. If failures > 5%, strengthen prompt
5. Re-test and document

**Time Estimate:** 2 hours (1 hour testing + 1 hour iteration if needed)

---

### Issue 4: Empty Inventory Guidance is Reactive (HIGH)

**Problem:** Error appears after user clicks button on wrong tab. Should warn proactively.

**Current UX:**
1. User opens app (no inventory yet)
2. User clicks "Suggestions" tab
3. User clicks "Suggest Meals" button
4. Error message: "No inventory items found"
5. User confused, has to go back to Inventory tab

**Better UX:**
1. User opens app (no inventory yet)
2. Inventory tab shows: "Add some items to get started"
3. Suggestions tab shows: "You need inventory items first" (disabled state)
4. No error, just guidance

**Solution Approach:**

In Chat.tsx:
```typescript
if (inventory.length === 0) {
  return (
    <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
      <p className="text-blue-800 font-semibold">Get started with inventory</p>
      <p className="text-blue-700 text-sm mt-2">
        Add some items to your kitchen first, then we can suggest meals.
      </p>
      <button
        onClick={() => onNavigateToInventory?.()}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        → Add Inventory Items
      </button>
    </div>
  );
}
```

In App.tsx:
```typescript
// Load inventory on mount
const [inventory, setInventory] = useState<InventoryItem[]>([]);
useEffect(() => {
  loadInventory();
}, []);

// Pass to Chat component
<Chat
  onSelectRecipe={...}
  onNavigateToInventory={() => setCurrentTab('inventory')}
/>
```

**Implementation Steps:**
1. Load inventory on app mount
2. Pass inventory state to Chat component
3. Show proactive message if empty
4. Disable "Suggest Meals" button when empty
5. Add navigation link to Inventory tab

**Time Estimate:** 1 hour

---

### Issue 5: Ingredient Name Matching May Fail (HIGH)

**Problem:** "tomato" vs "tomatoes" mismatch could cause recipe validation to fail.

**Current Code:**
```typescript
const matches = item.name.toLowerCase() === ingredient.name.toLowerCase();
```

**Issue:**
- Inventory: "tomatoes" (user said "2 tomatoes")
- Recipe ingredient: "tomato" (singular)
- Result: No match, recipe rejected

**Solution Approach:**

Create normalization function:
```typescript
function normalizeName(name: string): string {
  // Remove trailing 's' (plural)
  let normalized = name.toLowerCase().replace(/s$/, '');
  // Remove adjectives and articles
  normalized = normalized.replace(/^(fresh|extra|virgin|organic|whole)\s+/, '');
  // Handle common variations
  const variations: Record<string, string> = {
    'tomato': 'tomato',
    'tomatoes': 'tomato',
    'chicken breast': 'chicken',
    'chicken': 'chicken',
    'rice white': 'rice',
    'rice brown': 'rice',
  };
  return variations[normalized] || normalized;
}

// Then in validation
const normItem = normalizeName(item.name);
const normIngredient = normalizeName(ingredient.name);
const matches = normItem === normIngredient;
```

**Implementation Steps:**
1. Create utils/normalize-names.ts with normalizeName() function
2. Add test cases for common variations
3. Update ingredient matching in cooking.ts to use it
4. Test with real inventory + recipe data

**Time Estimate:** 1-2 hours

---

### Issue 6: Unit Conversions Not Handled (HIGH)

**Problem:** Recipe wants "1 cup rice" but inventory shows "500g rice". Names match but units incompatible.

**Example Failure:**
- Inventory: "500g rice" (exact)
- Recipe: Uses "2 cups rice"
- Current: Validation passes (name matches)
- User tries to cook: "Need 2 cups but I only have 500g. Is that enough?"

**Solution Approach:**

Create unit conversion table:
```typescript
const unitConversions: Record<string, Record<string, number>> = {
  'rice': {
    'g': 1,
    'cup': 250, // 1 cup = 250g
    'tbsp': 15,
  },
  'flour': {
    'g': 1,
    'cup': 120,
    'tbsp': 8,
  },
  'milk': {
    'ml': 1,
    'cup': 240,
    'tbsp': 15,
  },
  // ... more items
};

// Usage in validation
function canFulfillRecipe(recipe: Recipe, inventory: Inventory): boolean {
  for (const ingredient of recipe.ingredients) {
    const inventoryItem = findInventoryItem(ingredient.name);
    if (!inventoryItem) return false;

    const recipeAmount = convertToBaseUnit(ingredient.quantity, ingredient.unit, ingredient.name);
    const inventoryAmount = convertToBaseUnit(inventoryItem.quantity_approx, inventoryItem.unit, ingredient.name);

    if (recipeAmount > inventoryAmount) {
      console.warn(`Insufficient ${ingredient.name}: need ${recipeAmount}, have ${inventoryAmount}`);
      return false;
    }
  }
  return true;
}
```

**Implementation Steps:**
1. Create utils/unit-conversions.ts with conversion table
2. Add common items (rice, flour, milk, oil, etc.)
3. Create convertToBaseUnit() function
4. Use in recipe generation to check feasibility
5. Add tests for common conversions

**Implementation Path:** Task 8 (basic table) → Phase 1 (comprehensive list + user calibration)

**Time Estimate:** 2-3 hours

---

## Medium Priority Issues for Task 8

### Issue 7: Quantity Feasibility Not Checked

**Problem:** Recipe suggests using 2 cups of something, but inventory shows "some" (≈1).

**Solution:** Add feasibility check in generateRecipeDetail():
```typescript
// Check each ingredient against inventory quantities
const feasible = recipeDetail.ingredients.every(ing => {
  const inv = currentInventory.find(i => matches(i, ing));
  if (!inv) return false;
  return inv.quantity_approx >= ing.quantity; // Rough check
});

if (!feasible) {
  // Option 1: Reject (ask user to get more)
  // Option 2: Adapt recipe (reduce portions)
  // Recommendation: For Task 8, use Option 1. Phase 1 uses Option 2
  throw new Error('Insufficient ingredients for this recipe');
}
```

**Time Estimate:** 1-2 hours

---

### Issue 8: Approximate Quantity Deduction Imprecise

**Problem:** User says "some rice" (quantity_approx=1), recipe deducts entire amount, but "1" is ambiguous.

**Solution:** Before CookingConfirm, ask user to confirm approximate quantities:

```typescript
// In RecipeDetail.tsx before calling startCooking()
const approximateItems = ingredientsToDeduct.filter(i => i.confidence === 'approximate');
if (approximateItems.length > 0) {
  // Show dialog: "You said 'some rice'. About how much did you use? (1 cup, 2 tbsp, etc.)"
  // Get user input
  // Pass actual quantities to CookingConfirm
}
```

**Frontend Changes:**
1. After startCooking() succeeds, check for approximate items
2. If any, show dialog asking for actual quantities
3. Update ingredientsToDeduct with user-confirmed amounts
4. Then show CookingConfirm with confirmed amounts

**Time Estimate:** 2-3 hours

---

### Issue 9: Session Timeout Not Handled

**Problem:** If browser closes after start() but before complete(), session lost. User gets "Session not found" with no recovery.

**Short-term (Task 8):** Add clear error messaging
```typescript
// In CookingConfirm.tsx error handling
if (error.includes('Session not found')) {
  setError('Your cooking session expired. No items were deducted. Start over?');
}
```

**Long-term (Task 9):** Persist to DB
```sql
CREATE TABLE cooking_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  recipe_id UUID,
  session_id VARCHAR UNIQUE,
  ingredients_to_deduct JSONB,
  started_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

**Time Estimate:**
- Task 8: 30 mins (error messaging)
- Task 9: 3-4 hours (DB persistence + cleanup job)

---

## Testing Plan for Task 8

### 1. Real API Testing (2-3 hours)

Need actual Supabase + OpenAI API keys.

```bash
# Test parsing
npm test -- inventory.test.ts

# Test meal suggestions
npm test -- chat.test.ts

# Manual testing of 5 scenarios
npx ts-node scripts/test-5-scenarios.ts
```

### 2. Create Test Script for 5 Scenarios

```typescript
// scripts/test-5-scenarios.ts
interface TestResult {
  scenario: string;
  passed: boolean;
  issues: string[];
  notes: string;
}

const results: TestResult[] = [];

// Scenario 1: First-time user
// → Verify error message helpful
// → Verify navigation guidance clear

// Scenario 2: Messy input
// → Verify 4 items parsed
// → Verify approximate quantities flagged
// → Verify no hallucinations

// Scenario 3: Meal diversity
// → Verify 3-5 diverse recipes
// → Verify no recipe variations
// → Verify times match meal type

// Scenario 4: Recipe quality
// → Verify all ingredients in inventory
// → Verify no hallucinations
// → Verify units compatible

// Scenario 5: Full cooking workflow
// → Verify inventory updated correctly
// → Verify quantities match (not all-or-nothing)
// → Verify approximate items flagged

console.log(results);
```

### 3. Bug Reproduction Tests

For each critical bug, create reproducible test:

**Test: Deduction all-or-nothing**
```typescript
// Add inventory: 3 chicken
// Cook recipe using 2 chicken
// Verify: 1 chicken remains in inventory (NOT all deleted)
```

**Test: Hallucination prevention**
```typescript
// Parse: "basil"
// Verify: Only basil in result (no oil, salt, spices)
```

**Test: Ingredient matching**
```typescript
// Inventory: "tomatoes"
// Recipe: "tomato"
// Verify: Match succeeds (not rejected)
```

---

## Timeline for Task 8

**Day 11 (4 hours):**
- AM: Fix deduction model (Issue 1)
- PM: Block insufficient quantities (Issue 2)
- Testing: Verify both fixes work

**Day 12 (4 hours):**
- AM: Test hallucination prevention with real LLM (Issue 3)
- AM: Fix ingredient name matching (Issue 5)
- PM: Add unit conversions (Issue 6)
- Afternoon: Test all 5 scenarios, verify issues resolved

**Deliverables:**
- Updated REAL_USAGE_REPORT.md with test results
- Fixed code with critical issues resolved
- New tests in backend/scripts/
- Updated LEARNING_LOG.md with findings

---

## Timeline for Task 9

**Day 13 (3-4 hours):**
- AM: Polish UX (proactive inventory guidance, approximate quantity confirmation)
- PM: Persist cooking sessions to DB
- Add session timeout handling

**Day 14 (3-4 hours):**
- AM: Add recipe diversity validation
- PM: Add cooking history tracking
- Final polish + documentation

---

## Success Criteria

**Task 8 (Bugs Fixed):**
- [ ] Deduction model tracking quantities, not all-or-nothing
- [ ] Insufficient quantities blocked before deduction
- [ ] Ingredient matching handles plurals
- [ ] Unit conversions work for common items
- [ ] All 5 scenarios pass without critical issues
- [ ] Hallucination rate < 5% (tested with real LLM)

**Task 9 (Polish):**
- [ ] Empty inventory guidance proactive
- [ ] Approximate quantities confirmed before deduction
- [ ] Session persistence working
- [ ] Cooking history tracked
- [ ] Full end-to-end workflow smooth
- [ ] User can cook 3+ meals without inventory breaking

---

## Key Insight

**The deduction model is the foundation of everything else.** Get it right (quantity tracking), and the rest falls into place. Get it wrong (all-or-nothing), and no amount of UI polish helps. Prioritize Issue 1 above everything else.

