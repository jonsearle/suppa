# Inventory Canonical Units & Deduction Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the critical inventory deduction bug where "1 cup rice" deducts as "1 gram" instead of 125 grams.

**Architecture:** Cache canonical units when inventory is added, require recipe ingredients to always have units, move adjustment UI before cooking, and propagate confidence levels through deduction.

**Tech Stack:** TypeScript (backend), React (frontend), Jest (testing), Express (API)

---

## File Structure

**Backend files to modify:**
- `backend/netlify/functions/api/utils/prompts.ts` — cache canonical units, validate recipe units
- `backend/netlify/functions/api/utils/units.ts` — add validation for missing units
- `backend/netlify/functions/api/cooking.ts` — implement adjustment flow with three-button choice and removal warnings
- `backend/tests/units.test.ts` — new tests for canonical unit caching
- `backend/tests/cooking.test.ts` — new tests for adjustment flow

**Frontend files to modify:**
- `frontend/src/components/RecipeDetail.tsx` — move adjustment panel here (before "start cooking")
- `frontend/src/components/CookingConfirm.tsx` — remove adjustment panel (moved to RecipeDetail)

---

## Phase 1: Backend - Canonical Unit Caching

### Task 1: Add cacheCanonicalUnit call to parseInventoryInput

**Files:**
- Modify: `backend/netlify/functions/api/utils/prompts.ts:205-304`
- Test: `backend/tests/prompts.test.ts` (create if doesn't exist)

- [ ] **Step 1: Write failing test for canonical unit caching**

```typescript
// In backend/tests/prompts.test.ts (add to existing tests)
import { parseInventoryInput } from '../netlify/functions/api/utils/prompts';
import { getCanonicalUnit } from '../netlify/functions/api/utils/units';

describe('parseInventoryInput - Canonical Unit Caching', () => {
  beforeEach(() => {
    // Clear cache before each test
    jest.clearAllMocks();
  });

  test('should cache canonical unit when parsing inventory', async () => {
    const input = '500g rice';
    await parseInventoryInput(input);
    
    // After parsing, canonical unit for rice should be cached
    const cachedUnit = getCanonicalUnit('rice');
    expect(cachedUnit).toBe('g');
  });

  test('should cache unit for different ingredient types', async () => {
    await parseInventoryInput('240ml milk');
    expect(getCanonicalUnit('milk')).toBe('ml');
    
    await parseInventoryInput('3 eggs');
    expect(getCanonicalUnit('eggs')).toBe('pieces');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
npm test -- tests/prompts.test.ts -t "should cache canonical unit"
```

Expected: FAIL — "getCanonicalUnit is not being populated"

- [ ] **Step 3: Locate parseInventoryInput function and add caching**

In `backend/netlify/functions/api/utils/prompts.ts`, find the section where parsed items are returned (around line 290):

```typescript
return parsed.map((item: any) => ({
  name: item.name || '',
  canonical_name: item.canonical_name || getCanonicalName(item.name || ''),
  has_item: item.has_item || false,
  quantity_approx: item.quantity_approx || null,
  unit: item.unit || null,
  confidence: item.confidence || 'approximate',
}));
```

Add this after the map:

```typescript
// Cache canonical unit for each ingredient
const { convertToCanonical } = await import('./units');
parsed.forEach((item: any) => {
  const canonicalResult = convertToCanonical(
    item.quantity_approx || 1,
    item.unit,
    item.name
  );
  cacheCanonicalUnit(item.name, canonicalResult.unit);
});
```

Also add the import at the top:

```typescript
import { convertToCanonical, cacheCanonicalUnit } from './units';
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
npm test -- tests/prompts.test.ts -t "should cache canonical unit"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/netlify/functions/api/utils/prompts.ts backend/tests/prompts.test.ts
git commit -m "feat: cache canonical units when inventory is parsed

When user adds inventory (e.g., '500g rice'), the canonical unit is now
cached immediately so future uses of rice know to use grams, not cups."
```

---

### Task 2: Validate that recipe ingredients always have units

**Files:**
- Modify: `backend/netlify/functions/api/utils/prompts.ts:424-554`
- Modify: `backend/netlify/functions/api/utils/units.ts:56-137`
- Test: `backend/tests/prompts.test.ts`

- [ ] **Step 1: Write failing test for missing recipe units**

```typescript
// Add to backend/tests/prompts.test.ts
describe('generateRecipeDetail - Unit Validation', () => {
  test('should require all recipe ingredients to have units', async () => {
    const mockInventory = [
      { id: '1', name: 'rice', quantity_approx: 500, unit: 'g', confidence: 'exact' as const },
      { id: '2', name: 'eggs', quantity_approx: 3, unit: 'pieces', confidence: 'exact' as const }
    ];

    // This should throw if any ingredient lacks a unit
    const recipe = await generateRecipeDetail(
      'Egg Fried Rice',
      'Simple rice with eggs',
      mockInventory
    );

    // Verify all ingredients have units
    recipe.ingredients.forEach((ing: any) => {
      expect(ing.unit).toBeDefined();
      expect(ing.unit).not.toBeNull();
      expect(ing.unit).not.toBe('');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
npm test -- tests/prompts.test.ts -t "should require all recipe ingredients"
```

Expected: FAIL — some ingredients have null/empty units

- [ ] **Step 3: Update generateRecipeDetail to validate units**

In `backend/netlify/functions/api/utils/prompts.ts`, after the LLM response is parsed (around line 516), add validation:

```typescript
const parsed = JSON.parse(jsonMatch[0]);

// NEW: Validate all ingredients have units
parsed.ingredients.forEach((ing: any) => {
  if (!ing.unit || ing.unit === '' || ing.unit === null) {
    throw new Error(
      `Recipe ingredient "${ing.name}" is missing a unit. ` +
      `All recipe ingredients must specify units (e.g., "g", "ml", "pieces").`
    );
  }
});
```

- [ ] **Step 4: Update convertToCanonical to error on missing units from recipes**

In `backend/netlify/functions/api/utils/units.ts`, modify the section at line 64-71:

**Before:**
```typescript
if (!userUnit) {
  return {
    quantity: qty,
    unit: canonicalUnit,
    confidence: 'approximate'
  };
}
```

**After:**
```typescript
if (!userUnit) {
  throw new Error(
    `Missing unit for ingredient "${ingredientName}". ` +
    `Recipe ingredients must always include a unit (e.g., "g", "ml", "pieces").`
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend
npm test -- tests/prompts.test.ts -t "should require all recipe ingredients"
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/netlify/functions/api/utils/prompts.ts backend/netlify/functions/api/utils/units.ts backend/tests/prompts.test.ts
git commit -m "feat: validate recipe ingredients always have units

Prevents silent failures where recipe units are missing. Now throws
a clear error if any ingredient lacks a unit field."
```

---

## Phase 2: Backend - Adjustment Flow

### Task 3: Implement three-button choice for quantity adjustments

**Files:**
- Modify: `backend/netlify/functions/api/cooking.ts:412-555` (confirm-adjustments endpoint)
- Test: `backend/tests/cooking.test.ts`

- [ ] **Step 1: Write failing test for quantity adjustment choices**

```typescript
// Add to backend/tests/cooking.test.ts
describe('parseRecipeAdjustments - Quantity Adjustment Types', () => {
  test('should distinguish between inventory correction and recipe constraint', async () => {
    const recipeContext = {
      ingredients: [
        { name: 'rice', quantity: 500, unit: 'g' }
      ]
    };

    // Mock LLM response that includes adjustment type
    const adjustments = await parseRecipeAdjustments(
      'I only have 300g rice',
      recipeContext
    );

    // Should return adjustment with explicit type indicator
    expect(adjustments[0]).toHaveProperty('adjustment_type');
    expect(['inventory_correction', 'recipe_constraint', 'both']).toContain(
      adjustments[0].adjustment_type
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
npm test -- tests/cooking.test.ts -t "should distinguish between inventory"
```

Expected: FAIL — adjustment_type doesn't exist

- [ ] **Step 3: Update parseRecipeAdjustments prompt to include adjustment type**

In `backend/netlify/functions/api/utils/prompts.ts`, find the systemPrompt for parseRecipeAdjustments (around line 604). Update the examples section:

**Before:**
```typescript
Examples:
"I only have 300g flour" → { type: 'quantity', ingredient: 'flour', quantity: 300, unit: 'g', confidence: 'exact' }
```

**After:**
```typescript
Examples:
"I only have 300g flour" → { 
  type: 'quantity', 
  ingredient: 'flour', 
  quantity: 300, 
  unit: 'g', 
  confidence: 'exact',
  adjustment_type: 'inventory_correction'  // or 'recipe_constraint' or 'both'
}
```

And add clarification:
```
For quantity adjustments, infer adjustment_type:
- 'inventory_correction': "I only have X" (inventory was wrong, needs updating)
- 'recipe_constraint': "I only want to use X" (recipe adjustment only)
- 'both': "I have exactly X and using it all" (update inventory AND recipe)
```

- [ ] **Step 4: Update RecipeAdjustment interface**

In `backend/netlify/functions/api/utils/prompts.ts`, find the RecipeAdjustment interface (around line 560):

```typescript
export interface RecipeAdjustment {
  type: 'quantity' | 'removal' | 'substitution' | 'uncertain';
  ingredient: string;
  quantity?: number;
  unit?: string;
  substitute_with?: string;
  reason?: string;
  confidence?: 'exact' | 'approximate';
  adjustment_type?: 'inventory_correction' | 'recipe_constraint' | 'both'; // ADD THIS
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend
npm test -- tests/cooking.test.ts -t "should distinguish between inventory"
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/netlify/functions/api/utils/prompts.ts backend/tests/cooking.test.ts
git commit -m "feat: add adjustment_type to recipe adjustments

Distinguishes between inventory corrections and recipe constraints.
LLM now infers whether user means to correct inventory, adjust recipe only,
or both (when using exactly what they have)."
```

---

### Task 4: Implement removal with critical ingredient checking

**Files:**
- Modify: `backend/netlify/functions/api/utils/prompts.ts` (add new function)
- Modify: `backend/netlify/functions/api/cooking.ts:412-555`
- Test: `backend/tests/cooking.test.ts`

- [ ] **Step 1: Write failing test for critical ingredient detection**

```typescript
// Add to backend/tests/cooking.test.ts
describe('Critical Ingredient Detection', () => {
  test('should identify critical ingredients in a recipe', async () => {
    const recipe = {
      name: 'Chicken Curry',
      description: 'Spiced curry with chicken',
      ingredients: [
        { name: 'chicken', quantity: 500, unit: 'g' },
        { name: 'coconut milk', quantity: 400, unit: 'ml' },
        { name: 'salt', quantity: 1, unit: 'to taste' }
      ],
      instructions: ['Cook chicken...', 'Add coconut milk...']
    };

    // Should detect that chicken is critical
    const isCritical = await isIngredientCritical('chicken', recipe);
    expect(isCritical).toBe(true);

    // Salt is probably not critical
    const isSaltCritical = await isIngredientCritical('salt', recipe);
    expect(isSaltCritical).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
npm test -- tests/cooking.test.ts -t "should identify critical ingredients"
```

Expected: FAIL — function doesn't exist

- [ ] **Step 3: Create isIngredientCritical function**

In `backend/netlify/functions/api/utils/prompts.ts`, add this new function:

```typescript
/**
 * Determine if an ingredient is critical to a recipe
 * Critical = main protein/carb/fat, not just seasoning
 */
export async function isIngredientCritical(
  ingredientName: string,
  recipe: { name: string; description: string; ingredients: Array<{ name: string; quantity: number; unit: string }> }
): Promise<boolean> {
  if (!hasOpenAiApiKey()) {
    // Local fallback: check if ingredient is in first half of ingredients (usually the main ones)
    const mainIngredients = recipe.ingredients.slice(0, Math.ceil(recipe.ingredients.length / 2));
    return mainIngredients.some(ing => ing.name.toLowerCase() === ingredientName.toLowerCase());
  }

  const client = getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 100,
      messages: [
        {
          role: 'system',
          content: `You are a culinary expert. Determine if an ingredient is critical to a recipe.
          
Critical ingredients = main protein, carb, or fat that the recipe depends on
Non-critical = seasonings, garnishes, flavor additions that can be substituted or omitted

Reply with ONLY "yes" or "no".`
        },
        {
          role: 'user',
          content: `Recipe: ${recipe.name} - ${recipe.description}
Ingredients: ${recipe.ingredients.map(i => `${i.name}`).join(', ')}

Is "${ingredientName}" critical to this recipe?`
        }
      ]
    });

    const answer = response.choices[0].message.content?.toLowerCase().trim() ?? 'no';
    return answer.includes('yes');
  } catch (error) {
    console.error('Error checking critical ingredient:', error);
    // Fallback: assume main ingredients (first half) are critical
    const mainIngredients = recipe.ingredients.slice(0, Math.ceil(recipe.ingredients.length / 2));
    return mainIngredients.some(ing => ing.name.toLowerCase() === ingredientName.toLowerCase());
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
npm test -- tests/cooking.test.ts -t "should identify critical ingredients"
```

Expected: PASS

- [ ] **Step 5: Update confirm-adjustments endpoint to use critical check**

In `backend/netlify/functions/api/cooking.ts`, find the removal handling section (around line 462-466):

**Before:**
```typescript
} else if (adjustment.type === 'removal') {
  // Remove ingredient from recipe
  updatedIngredients = updatedIngredients.filter(
    (ing) => ing.name.toLowerCase() !== adjustment.ingredient.toLowerCase()
  );
}
```

**After:**
```typescript
} else if (adjustment.type === 'removal') {
  // Check if this is a critical ingredient
  const isCritical = await isIngredientCritical(adjustment.ingredient, session.recipe);
  
  // Store warning in adjustment response for frontend
  if (isCritical) {
    adjustment.warning = `⚠️ This is a critical ingredient. Recipe may not work without ${adjustment.ingredient}.`;
  }
  
  // Remove ingredient from recipe
  updatedIngredients = updatedIngredients.filter(
    (ing) => ing.name.toLowerCase() !== adjustment.ingredient.toLowerCase()
  );
}
```

Add import at top:
```typescript
import { isIngredientCritical } from './utils/prompts';
```

- [ ] **Step 6: Commit**

```bash
git add backend/netlify/functions/api/utils/prompts.ts backend/netlify/functions/api/cooking.ts backend/tests/cooking.test.ts
git commit -m "feat: add critical ingredient detection for removals

When user removes an ingredient, system checks if it's critical to the recipe.
If critical (e.g., chicken from chicken curry), shows warning to user."
```

---

## Phase 3: Backend - Testing & Validation

### Task 5: Add integration test for full deduction flow

**Files:**
- Create: `backend/tests/integration/inventory-deduction.test.ts`
- Test all phases working together

- [ ] **Step 1: Create integration test file**

Create file `backend/tests/integration/inventory-deduction.test.ts`:

```typescript
import { parseInventoryInput } from '../../netlify/functions/api/utils/prompts';
import { getCanonicalUnit } from '../../netlify/functions/api/utils/units';
import { generateRecipeDetail } from '../../netlify/functions/api/utils/prompts';
import { parseRecipeAdjustments } from '../../netlify/functions/api/utils/prompts';

describe('Full Inventory Deduction Flow', () => {
  test('should cache canonical unit and use it for recipe deduction', async () => {
    // Step 1: User adds "500g rice"
    const parsedInventory = await parseInventoryInput('500 grams of rice');
    expect(parsedInventory[0].quantity_approx).toBe(500);
    expect(parsedInventory[0].unit).toBe('g');

    // Step 2: Canonical unit should be cached
    const cachedUnit = getCanonicalUnit('rice');
    expect(cachedUnit).toBe('g');

    // Step 3: Generate recipe with 1 cup rice
    const mockInventory = [
      {
        id: '1',
        name: 'rice',
        quantity_approx: 500,
        unit: 'g',
        confidence: 'exact' as const
      }
    ];

    const recipe = await generateRecipeDetail(
      'Fried Rice',
      'Simple rice with oil',
      mockInventory
    );

    // Recipe should have converted 1 cup to 125g using cached unit
    const riceIngredient = recipe.ingredients.find(i => i.name === 'rice');
    expect(riceIngredient).toBeDefined();
    expect(riceIngredient?.unit).toBe('g');
    expect(riceIngredient?.quantity).toBeGreaterThan(0);
  });

  test('should handle quantity adjustments correctly', async () => {
    const recipeContext = {
      ingredients: [
        { name: 'rice', quantity: 500, unit: 'g' },
        { name: 'milk', quantity: 240, unit: 'ml' }
      ]
    };

    // User says they only have 300g rice
    const adjustments = await parseRecipeAdjustments(
      'I only have 300g rice',
      recipeContext
    );

    expect(adjustments.length).toBeGreaterThan(0);
    expect(adjustments[0].type).toBe('quantity');
    expect(adjustments[0].ingredient).toBe('rice');
    expect(adjustments[0].quantity).toBe(300);
  });
});
```

- [ ] **Step 2: Run integration test**

```bash
cd backend
npm test -- tests/integration/inventory-deduction.test.ts
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/integration/inventory-deduction.test.ts
git commit -m "test: add integration test for inventory deduction flow

Tests the full cycle: add inventory with canonical units, generate recipe
that uses correct unit conversions, handle adjustments."
```

---

## Phase 4: Frontend - Adjustment UI

### Task 6: Move adjustment panel to recipe detail view

**Files:**
- Modify: `frontend/src/components/RecipeDetail.tsx`
- Modify: `frontend/src/components/CookingConfirm.tsx` (remove adjustment panel)

- [ ] **Step 1: Identify RecipeDetail component structure**

Read `frontend/src/components/RecipeDetail.tsx` to understand current layout. It should have:
- Recipe name, description, time
- Ingredients list
- Instructions
- Button to start cooking

- [ ] **Step 2: Add adjustment panel to RecipeDetail**

In `frontend/src/components/RecipeDetail.tsx`, add this section before the "Start cooking" button:

```typescript
// Add to component state
const [adjustmentInput, setAdjustmentInput] = useState('');
const [pendingAdjustments, setPendingAdjustments] = useState<any[]>([]);
const [showAdjustmentPanel, setShowAdjustmentPanel] = useState(false);

// Add this function
const handleAdjustmentSubmit = async () => {
  if (!adjustmentInput.trim()) return;

  // Call backend to parse adjustments
  const response = await fetch('/api/cooking/confirm-adjustments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      user_input: adjustmentInput
    })
  });

  const result = await response.json();
  setPendingAdjustments(result.data.adjustments);
  setAdjustmentInput('');
};

// Add JSX before the "Start cooking" button:
{showAdjustmentPanel && (
  <div className="border-t pt-4 mt-4">
    <h3 className="font-semibold mb-2">Make any changes?</h3>
    <textarea
      value={adjustmentInput}
      onChange={(e) => setAdjustmentInput(e.target.value)}
      placeholder="e.g., 'I only have 300g flour, milk's gone off'"
      className="w-full p-2 border rounded mb-2"
    />
    <button
      onClick={handleAdjustmentSubmit}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Apply Adjustments
    </button>
  </div>
)}

{pendingAdjustments.length > 0 && (
  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mt-4">
    <p className="text-sm font-semibold">Adjustments to confirm:</p>
    {pendingAdjustments.map((adj, i) => (
      <div key={i} className="text-sm mt-1">
        {adj.type === 'quantity' && `${adj.ingredient}: ${adj.quantity}${adj.unit}`}
        {adj.type === 'removal' && `Remove: ${adj.ingredient}`}
        {adj.type === 'substitution' && `Use ${adj.substitute_with} instead of ${adj.ingredient}`}
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 3: Replace "Start cooking" button click handler**

Find the "Start cooking" button and update its onClick:

**Before:**
```typescript
onClick={() => navigate('/cooking-confirm', { state: { recipe, sessionId } })}
```

**After:**
```typescript
onClick={() => {
  if (!showAdjustmentPanel) {
    setShowAdjustmentPanel(true);
  } else {
    navigate('/cooking-confirm', { state: { recipe, sessionId } });
  }
}}
```

- [ ] **Step 4: Test the UI change locally**

```bash
cd frontend
npm start
# Navigate to a recipe detail page
# Verify adjustment panel appears before "Start cooking"
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/RecipeDetail.tsx
git commit -m "feat: move adjustment panel to recipe detail view

Adjustments now happen BEFORE 'start cooking', not after.
Users see a panel to make changes (quantities, removals, substitutions)
right in the recipe view."
```

---

### Task 7: Implement three-button choice for quantity adjustments

**Files:**
- Modify: `frontend/src/components/RecipeDetail.tsx` (adjustment confirmation UI)

- [ ] **Step 1: Create QuantityAdjustmentChoice component**

In `frontend/src/components`, create new file `QuantityAdjustmentChoice.tsx`:

```typescript
interface Props {
  ingredient: string;
  inventory_quantity: number;
  inventory_unit: string;
  recipe_quantity: number;
  onChoice: (choice: 'inventory' | 'recipe' | 'both') => void;
}

export function QuantityAdjustmentChoice({
  ingredient,
  inventory_quantity,
  inventory_unit,
  recipe_quantity,
  onChoice
}: Props) {
  return (
    <div className="border p-3 rounded bg-blue-50 mb-3">
      <p className="text-sm font-semibold mb-2">
        You said: {inventory_quantity}{inventory_unit} {ingredient}
      </p>
      <p className="text-xs text-gray-600 mb-3">
        Recipe needs: {recipe_quantity}{inventory_unit}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onChoice('inventory')}
          className="flex-1 bg-orange-500 text-white px-3 py-2 rounded text-sm"
        >
          Update my inventory to {inventory_quantity}{inventory_unit}
        </button>
        <button
          onClick={() => onChoice('recipe')}
          className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm"
        >
          Use {inventory_quantity}{inventory_unit} in this recipe only
        </button>
        <button
          onClick={() => onChoice('both')}
          className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm"
        >
          Both (I have exactly {inventory_quantity}{inventory_unit})
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrate QuantityAdjustmentChoice into RecipeDetail**

In `frontend/src/components/RecipeDetail.tsx`, update the adjustment handling:

```typescript
import { QuantityAdjustmentChoice } from './QuantityAdjustmentChoice';

// Add to state
const [confirming, setConfirming] = useState<{
  adjustment: any;
  inventoryQty: number;
  recipeQty: number;
} | null>(null);

// Update handleAdjustmentSubmit to process adjustments
const handleAdjustmentSubmit = async () => {
  if (!adjustmentInput.trim()) return;

  const response = await fetch('/api/cooking/confirm-adjustments', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      user_input: adjustmentInput
    })
  });

  const result = await response.json();
  
  // Check if any adjustments need the three-button choice
  const quantityAdj = result.data.adjustments.find((a: any) => a.type === 'quantity');
  if (quantityAdj && quantityAdj.adjustment_type === 'ambiguous') {
    // Show three-button choice
    setConfirming({
      adjustment: quantityAdj,
      inventoryQty: quantityAdj.quantity,
      recipeQty: recipe.ingredients.find((i: any) => i.name === quantityAdj.ingredient)?.quantity
    });
  } else {
    setPendingAdjustments(result.data.adjustments);
  }
};

// Add render for confirmation choice
{confirming && (
  <QuantityAdjustmentChoice
    ingredient={confirming.adjustment.ingredient}
    inventory_quantity={confirming.inventoryQty}
    inventory_unit={confirming.adjustment.unit}
    recipe_quantity={confirming.recipeQty}
    onChoice={async (choice) => {
      // Call backend to apply choice
      const response = await fetch('/api/cooking/confirm-adjustments', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          user_input: adjustmentInput,
          adjustment_type_choice: choice
        })
      });
      
      const result = await response.json();
      setPendingAdjustments(result.data.adjustments);
      setConfirming(null);
    }}
  />
)}
```

- [ ] **Step 3: Test the three-button flow**

```bash
cd frontend
npm start
# Navigate to recipe
# Make a quantity adjustment
# Verify three buttons appear
# Click each button to verify behavior
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/RecipeDetail.tsx frontend/src/components/QuantityAdjustmentChoice.tsx
git commit -m "feat: implement three-button choice for quantity adjustments

When user adjusts a quantity, system offers three options:
1. Update inventory to the new amount
2. Use the new amount in just this recipe
3. Both (inventory equals recipe amount)

Buttons use clear action language."
```

---

## Phase 5: Testing & Final Validation

### Task 8: Run full test suite

**Files:**
- Test all modified files

- [ ] **Step 1: Run backend unit tests**

```bash
cd backend
npm test
```

Expected: All tests PASS

- [ ] **Step 2: Run frontend tests (if applicable)**

```bash
cd frontend
npm test -- --watchAll=false
```

Expected: All tests PASS

- [ ] **Step 3: Manual end-to-end test**

```bash
# Start backend
cd backend && npm run dev

# In another terminal, start frontend
cd frontend && npm start

# Test scenario:
# 1. Add "500 grams of rice" to inventory
# 2. Request dinner recipe
# 3. See recipe with rice (should be in grams)
# 4. Click "Make changes"
# 5. Type "I only have 300g rice"
# 6. See three-button choice
# 7. Click "Use 300g in this recipe only"
# 8. See recipe updated to use 300g
# 9. Press "Start cooking"
# 10. Deduct 300g
# 11. Verify remainder is 200g rice
```

- [ ] **Step 4: Commit test results**

```bash
git add -A
git commit -m "test: validate full inventory deduction flow

All unit tests pass. Integration tests pass. Manual e2e testing confirms:
- Canonical units cached at add time
- Recipe generation uses correct units
- Adjustments work with three-button choice
- Deduction calculates correct amounts"
```

---

## Success Checklist

- [ ] Canonical units cached when inventory added (Task 1)
- [ ] Recipe ingredients always have units (Task 2)
- [ ] Three-button choice for quantity adjustments (Tasks 3, 7)
- [ ] Critical ingredient detection (Task 4)
- [ ] Adjustment panel in recipe detail view (Task 6)
- [ ] All unit tests pass (Task 5, 8)
- [ ] Manual e2e test passes (Task 8)
- [ ] No "1g rice" deductions anymore ✓

---

## Commits Summary

1. Cache canonical units on inventory parse
2. Validate recipe units always present
3. Add adjustment_type to adjustments
4. Implement critical ingredient detection
5. Integration test for full flow
6. Move adjustment panel to RecipeDetail
7. Implement three-button UI
8. Final validation and tests

Total: ~8 focused commits, each small and testable.
