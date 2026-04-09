# Unit Normalization & Inventory Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement canonical unit storage + intelligent display for inventory items, enabling consistent quantity tracking from add → suggest → adjust → deduct.

**Architecture:** 
- Backend: LLM determines canonical unit per ingredient (cached), converts all user input to canonical units at add-time, uses canonical units in recipe matching and deduction
- Frontend: Shows inventory using semantic display hints (determined once by LLM), allows natural language recipe adjustments
- Database: Add `confidence` field to inventory items, create `ingredient_display_hints` cache table

**Tech Stack:** React 18 + TypeScript, Node.js + Express, Netlify Functions, OpenAI API, PocketBase

---

## File Structure

### Backend
- **`backend/netlify/functions/api/utils/units.ts`** (NEW)
  - Responsibility: Canonical unit logic, conversions, confidence rules
  - Functions: `getCanonicalUnit()`, `convertToCanonical()`, `deductWithConfidence()`

- **`backend/netlify/functions/api/utils/prompts.ts`** (MODIFY)
  - Update `parseInventoryInput()` to return confidence levels
  - Update `suggestMeals()` to use canonical units
  - Add `getDisplayHints()` to determine how to display each ingredient

- **`backend/netlify/functions/api/utils/db.ts`** (MODIFY)
  - Update `addInventoryItem()` to store confidence
  - Update `deductInventoryQuantity()` to use confidence rules
  - Add `getOrCacheDisplayHints()` to fetch/cache LLM display decisions

- **`backend/netlify/functions/shared/types.ts`** (MODIFY)
  - Add `confidence` field to `InventoryItem`
  - Add `IngredientDisplayHints` interface
  - Update `RecipeDetail` ingredient structure

- **`backend/netlify/functions/api/inventory.ts`** (MODIFY)
  - Wire up confidence tracking in add endpoint

- **`backend/netlify/functions/api/cooking.ts`** (MODIFY)
  - Update deduction logic to use canonical units
  - Add confidence-aware deduction

### Frontend
- **`frontend/src/types/index.ts`** (MODIFY)
  - Add `confidence` to InventoryItem type
  - Add `IngredientDisplayHints` interface
  - Add `RecipeAdjustment` interface for parsed changes

- **`frontend/src/components/InventoryForm.tsx`** (MODIFY)
  - Show parsed items with confidence flags
  - Allow inline correction before saving

- **`frontend/src/components/CookingConfirm.tsx`** (MODIFY)
  - Replace per-ingredient clickable UI with single text field
  - Implement adjustment conversation loop
  - Show confirmation grid after parsing

- **`frontend/src/services/api.ts`** (MODIFY)
  - Add `parseRecipeAdjustments()` endpoint call
  - Wire up `getDisplayHints()` cache

### Database
- **`inventory_items` table** (MODIFY)
  - Add `confidence` column (text: 'exact' | 'approximate')

- **`ingredient_display_hints` table** (NEW)
  - Schema: id, ingredient_name, storage_unit, display_unit, display_examples, created_at

---

## Implementation Tasks

### Task 1: Create Unit Normalization Utilities

**Files:**
- Create: `backend/netlify/functions/api/utils/units.ts`
- Modify: `backend/netlify/functions/shared/types.ts`
- Test: `backend/tests/unit-normalization.test.ts`

- [ ] **Step 1: Write failing test for canonical unit lookup**

Create `backend/tests/unit-normalization.test.ts`:

```typescript
import { getCanonicalUnit } from '../src/utils/units';

describe('Unit Normalization', () => {
  it('returns canonical unit for known ingredient', () => {
    const result = getCanonicalUnit('flour');
    expect(result).toBe('g');
  });

  it('returns canonical unit for milk', () => {
    const result = getCanonicalUnit('milk');
    expect(result).toBe('ml');
  });

  it('returns canonical unit for eggs', () => {
    const result = getCanonicalUnit('eggs');
    expect(result).toBe('pieces');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
npm test -- unit-normalization.test.ts
```

Expected: `FAIL - getCanonicalUnit is not defined`

- [ ] **Step 3: Create units.ts with getCanonicalUnit**

Create `backend/netlify/functions/api/utils/units.ts`:

```typescript
/**
 * Unit Normalization Utilities
 * Maps ingredients to canonical storage units determined by LLM
 */

// Cache of ingredient → canonical unit (populated by LLM on first add)
const canonicalUnitCache: Record<string, string> = {};

/**
 * Get canonical unit for an ingredient
 * Returns from cache if available, otherwise returns default based on category
 * Actual canonical unit is determined by LLM on first add
 */
export function getCanonicalUnit(ingredientName: string): string {
  // If we've cached it before, return cached value
  if (canonicalUnitCache[ingredientName.toLowerCase()]) {
    return canonicalUnitCache[ingredientName.toLowerCase()];
  }

  // Default fallbacks while LLM determines canonical units
  // (These will be overridden once LLM has decided)
  const lowerName = ingredientName.toLowerCase();
  
  if (lowerName.includes('milk') || lowerName.includes('water') || 
      lowerName.includes('oil') || lowerName.includes('juice')) {
    return 'ml';
  }
  
  if (lowerName.includes('egg') || lowerName.includes('tomato') || 
      lowerName.includes('onion') || lowerName.includes('potato')) {
    return 'pieces';
  }

  // Default to grams for everything else (flour, sugar, salt, spices, bread, etc.)
  return 'g';
}

/**
 * Cache the LLM-determined canonical unit for an ingredient
 * Called after LLM determines unit for first time
 */
export function cacheCanonicalUnit(ingredientName: string, unit: string): void {
  canonicalUnitCache[ingredientName.toLowerCase()] = unit;
}

/**
 * Convert quantity from user unit to canonical unit
 * Returns { quantity, unit, confidence }
 */
export interface ConversionResult {
  quantity: number;
  unit: string;
  confidence: 'exact' | 'approximate';
}

export function convertToCanonical(
  userQuantity: number | string,
  userUnit: string | null,
  ingredientName: string
): ConversionResult {
  const canonicalUnit = getCanonicalUnit(ingredientName);
  
  // If user didn't specify unit, assume canonical unit
  if (!userUnit) {
    return {
      quantity: typeof userQuantity === 'string' ? parseFloat(userQuantity) : userQuantity,
      unit: canonicalUnit,
      confidence: 'approximate'
    };
  }

  const userUnitLower = userUnit.toLowerCase();
  const qty = typeof userQuantity === 'string' ? parseFloat(userQuantity) : userQuantity;

  // Volume conversions (to ml)
  if (canonicalUnit === 'ml') {
    if (userUnitLower === 'ml') return { quantity: qty, unit: 'ml', confidence: 'exact' };
    if (userUnitLower === 'cup') return { quantity: qty * 240, unit: 'ml', confidence: 'exact' };
    if (userUnitLower === 'tbsp' || userUnitLower === 'tablespoon') return { quantity: qty * 15, unit: 'ml', confidence: 'exact' };
    if (userUnitLower === 'tsp' || userUnitLower === 'teaspoon') return { quantity: qty * 5, unit: 'ml', confidence: 'exact' };
    if (userUnitLower === 'pint') return { quantity: qty * 568, unit: 'ml', confidence: 'exact' }; // UK pint
  }

  // Weight conversions (to g)
  if (canonicalUnit === 'g') {
    if (userUnitLower === 'g' || userUnitLower === 'gram') return { quantity: qty, unit: 'g', confidence: 'exact' };
    if (userUnitLower === 'kg') return { quantity: qty * 1000, unit: 'g', confidence: 'exact' };
    if (userUnitLower === 'oz') return { quantity: qty * 28.35, unit: 'g', confidence: 'exact' };
    if (userUnitLower === 'lb') return { quantity: qty * 454, unit: 'g', confidence: 'exact' };
    if (userUnitLower === 'cup') return { quantity: qty * 125, unit: 'g', confidence: 'exact' }; // Flour
    if (userUnitLower === 'tbsp' || userUnitLower === 'tablespoon') return { quantity: qty * 15, unit: 'g', confidence: 'exact' };
    if (userUnitLower === 'tsp' || userUnitLower === 'teaspoon') return { quantity: qty * 5, unit: 'g', confidence: 'exact' };
  }

  // Count conversions (already in pieces)
  if (canonicalUnit === 'pieces') {
    if (userUnitLower === 'pieces' || userUnitLower === 'piece' || 
        userUnitLower === 'clove' || userUnitLower === 'cloves') {
      return { quantity: qty, unit: 'pieces', confidence: 'exact' };
    }
  }

  // If unit doesn't match canonical, return as-is but mark approximate
  return { quantity: qty, unit: canonicalUnit, confidence: 'approximate' };
}

/**
 * Apply confidence rules for deduction
 * exact - exact = exact
 * approximate - exact = approximate
 * approximate - approximate = approximate
 */
export function deductWithConfidence(
  inventoryConfidence: 'exact' | 'approximate',
  deductionConfidence: 'exact' | 'approximate'
): 'exact' | 'approximate' {
  if (inventoryConfidence === 'exact' && deductionConfidence === 'exact') {
    return 'exact';
  }
  return 'approximate';
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
npm test -- unit-normalization.test.ts
```

Expected: `PASS (3 passing)`

- [ ] **Step 5: Commit**

```bash
cd backend
git add netlify/functions/api/utils/units.ts tests/unit-normalization.test.ts
git commit -m "feat: add unit normalization utilities with canonical unit logic"
```

---

### Task 2: Update Type Definitions

**Files:**
- Modify: `backend/netlify/functions/shared/types.ts`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add confidence field to InventoryItem in backend types**

In `backend/netlify/functions/shared/types.ts`, find the InventoryItem interface and update it:

```typescript
export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  quantity_approx?: number;
  unit?: string;
  confidence: 'exact' | 'approximate';  // NEW FIELD
  date_added: string;
  date_used?: string;
}
```

- [ ] **Step 2: Add IngredientDisplayHints interface to backend types**

In same file, add:

```typescript
export interface IngredientDisplayHints {
  ingredient_name: string;
  storage_unit: string;        // e.g., "g", "ml", "pieces"
  display_unit: string | null; // e.g., "slices", null for "flour"
  display_examples: string[];  // e.g., ["half a loaf", "some bread"]
}
```

- [ ] **Step 3: Update frontend types to match**

In `frontend/src/types/index.ts`, update InventoryItem:

```typescript
export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  quantity_approx?: number;
  unit?: string;
  confidence: 'exact' | 'approximate';  // NEW FIELD
  date_added: string;
  date_used?: string;
}
```

And add IngredientDisplayHints:

```typescript
export interface IngredientDisplayHints {
  ingredient_name: string;
  storage_unit: string;
  display_unit: string | null;
  display_examples: string[];
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/netlify/functions/shared/types.ts frontend/src/types/index.ts
git commit -m "feat: add confidence field and display hints types"
```

---

### Task 3: Update Inventory Parsing Prompt

**Files:**
- Modify: `backend/netlify/functions/api/utils/prompts.ts`
- Test: `backend/tests/inventory.test.ts` (existing, update)

- [ ] **Step 1: Write test for inventory parsing with confidence**

In `backend/tests/inventory.test.ts`, add test:

```typescript
it('parses inventory with confidence levels', async () => {
  const input = '500g flour, some milk, 3 eggs';
  const result = await parseInventoryInput(input);

  expect(result).toEqual([
    { name: 'flour', quantity: 500, unit: 'g', confidence: 'exact' },
    { name: 'milk', quantity: 500, unit: 'ml', confidence: 'approximate' },
    { name: 'eggs', quantity: 3, unit: 'pieces', confidence: 'exact' }
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
npm test -- inventory.test.ts
```

Expected: `FAIL - confidence property missing`

- [ ] **Step 3: Update parseInventoryInput in prompts.ts**

Find and update the function:

```typescript
export async function parseInventoryInput(userInput: string): Promise<any[]> {
  const client = getOpenAIClient();

  const systemPrompt = `You are a food inventory parser. Parse free-form user input into structured inventory items.

For each item, return:
- name: canonical ingredient name (lowercase, singular)
- quantity: number (numeric value, convert from user units)
- unit: canonical unit ('g' for solids, 'ml' for liquids, 'pieces' for countable)
- confidence: 'exact' if user specified precise amount, 'approximate' if vague ("some", "a bit", etc.)

Examples:
"2 cups flour" → { name: "flour", quantity: 250, unit: "g", confidence: "exact" }
"some milk" → { name: "milk", quantity: 500, unit: "ml", confidence: "approximate" }
"3 eggs" → { name: "eggs", quantity: 3, unit: "pieces", confidence: "exact" }

Return ONLY valid JSON array, no markdown or extra text.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-1',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userInput
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const parsed = JSON.parse(content.text);
  return parsed;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
npm test -- inventory.test.ts
```

Expected: `PASS`

- [ ] **Step 5: Add getDisplayHints LLM function**

In same `prompts.ts` file, add:

```typescript
export async function getDisplayHints(ingredientName: string): Promise<IngredientDisplayHints> {
  const client = getOpenAIClient();

  const systemPrompt = `You determine how users naturally think about quantities of ingredients.
Given an ingredient name, return a JSON object with:
- storage_unit: canonical unit we store it in ('g', 'ml', or 'pieces')
- display_unit: what users naturally say (null if no unit used, e.g., "flour" has no unit)
- display_examples: 3-4 examples of how users naturally describe quantities

Examples:
"flour" → { storage_unit: "g", display_unit: null, display_examples: ["flour", "some flour"] }
"bread" → { storage_unit: "g", display_unit: "slices", display_examples: ["half a loaf", "some bread", "a few slices"] }
"eggs" → { storage_unit: "pieces", display_unit: "pieces", display_examples: ["3 eggs", "a dozen eggs", "6 eggs"] }

Return ONLY valid JSON, no markdown.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-1',
    max_tokens: 256,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: ingredientName
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const hints = JSON.parse(content.text);
  return {
    ingredient_name: ingredientName,
    storage_unit: hints.storage_unit,
    display_unit: hints.display_unit,
    display_examples: hints.display_examples
  };
}
```

- [ ] **Step 6: Commit**

```bash
git add netlify/functions/api/utils/prompts.ts tests/inventory.test.ts
git commit -m "feat: update inventory parsing to return confidence levels and add display hints LLM"
```

---

### Task 4: Create Ingredient Display Hints Cache

**Files:**
- Modify: `backend/netlify/functions/api/utils/db.ts`
- Create: `backend/tests/display-hints.test.ts`

- [ ] **Step 1: Write test for caching display hints**

Create `backend/tests/display-hints.test.ts`:

```typescript
import { getOrCacheDisplayHints } from '../src/utils/db';

describe('Display Hints Cache', () => {
  it('retrieves or caches display hints for ingredient', async () => {
    const hints = await getOrCacheDisplayHints('flour');
    
    expect(hints.ingredient_name).toBe('flour');
    expect(hints.storage_unit).toBe('g');
    expect(hints.display_unit).toBeNull();
    expect(hints.display_examples.length).toBeGreaterThan(0);
  });

  it('caches display hints and returns cached version on second call', async () => {
    await getOrCacheDisplayHints('bread');
    const cached = await getOrCacheDisplayHints('bread');
    
    expect(cached.ingredient_name).toBe('bread');
    expect(cached.storage_unit).toBe('g');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
npm test -- display-hints.test.ts
```

Expected: `FAIL - getOrCacheDisplayHints is not defined`

- [ ] **Step 3: Implement getOrCacheDisplayHints in db.ts**

In `backend/netlify/functions/api/utils/db.ts`, add:

```typescript
import { getDisplayHints } from './prompts';
import { IngredientDisplayHints } from '../shared/types';

/**
 * Get display hints for an ingredient from cache, or fetch from LLM if not cached
 * Caches result in database for future use
 */
export async function getOrCacheDisplayHints(ingredientName: string): Promise<IngredientDisplayHints> {
  const lowerName = ingredientName.toLowerCase();

  // Check if already in cache (in-memory or database)
  // For MVP, use simple in-memory cache. Phase 1: move to database
  const cachedHints = displayHintsMemoryCache.get(lowerName);
  if (cachedHints) {
    return cachedHints;
  }

  // Not cached, ask LLM
  const hints = await getDisplayHints(ingredientName);
  
  // Cache for future calls
  displayHintsMemoryCache.set(lowerName, hints);

  return hints;
}

// Simple in-memory cache (MVP only, phase 1: move to database)
const displayHintsMemoryCache = new Map<string, IngredientDisplayHints>();
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
npm test -- display-hints.test.ts
```

Expected: `PASS`

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/api/utils/db.ts tests/display-hints.test.ts
git commit -m "feat: add display hints caching with LLM lookup"
```

---

### Task 5: Update Inventory Add Endpoint

**Files:**
- Modify: `backend/netlify/functions/api/inventory.ts`
- Modify: `backend/netlify/functions/api/utils/db.ts`

- [ ] **Step 1: Update addInventoryItem to include confidence**

In `backend/netlify/functions/api/utils/db.ts`, find the `addInventoryItem` function and update it to accept and store confidence:

```typescript
export async function addInventoryItem(item: {
  name: string;
  quantity: number;
  unit: string;
  confidence: 'exact' | 'approximate';
}): Promise<InventoryItem> {
  const userId = getUserId();

  const newItem = await pocketbaseFetch(
    `/collections/inventory_items/records`,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        name: item.name,
        quantity_approx: item.quantity,
        unit: item.unit,
        confidence: item.confidence,  // NEW
        date_added: new Date().toISOString(),
      }),
    },
    'auto'
  );

  return newItem as InventoryItem;
}
```

- [ ] **Step 2: Update POST /api/inventory endpoint to use confidence**

In `backend/netlify/functions/api/inventory.ts`, update the router.post('/') handler:

```typescript
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_input } = req.body;

    if (!user_input || typeof user_input !== 'string' || !user_input.trim()) {
      return res.status(400).json({
        error: 'Missing or invalid user_input field',
        details: 'user_input must be a non-empty string',
      });
    }

    // Parse with confidence levels
    const parsedItems = await parseInventoryInput(user_input.trim());

    // Store each with confidence
    const storedItems: InventoryItem[] = [];
    const failedItems: Array<{ name: string; reason: string }> = [];
    
    for (const item of parsedItems) {
      try {
        const stored = await addInventoryItem({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          confidence: item.confidence || 'approximate'  // Default to approximate if not specified
        });
        storedItems.push(stored);
      } catch (error) {
        console.error(`Failed to store item ${item.name}:`, error);
        failedItems.push({
          name: item.name,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (storedItems.length === 0) {
      return res.status(409).json({
        error: 'No inventory items were added',
        details:
          failedItems.length > 0
            ? failedItems.map((item) => `${item.name}: ${item.reason}`).join(' | ')
            : 'No parsable inventory items were found in the request.',
        failed_items: failedItems,
      });
    }

    res.status(201).json({
      data: storedItems,
      count: storedItems.length,
      failed_count: failedItems.length,
      failed_items: failedItems,
      message: `Parsed and stored ${storedItems.length} inventory items`,
    });
  } catch (error) {
    console.error('Error in POST /api/inventory:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg.includes('SUPABASE') || errorMsg.includes('OPENAI')) {
      return res.status(500).json({
        error: 'Service configuration error',
        details: errorMsg,
      });
    }

    res.status(400).json({
      error: 'Failed to parse inventory',
      details: errorMsg,
    });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add netlify/functions/api/inventory.ts netlify/functions/api/utils/db.ts
git commit -m "feat: add confidence field to inventory storage"
```

---

### Task 6: Update Recipe Filtering by Inventory

**Files:**
- Modify: `backend/netlify/functions/api/chat.ts`

- [ ] **Step 1: Update meal suggestion prompt to filter by inventory**

In `backend/netlify/functions/api/chat.ts`, find the `suggestMeals` function. Update the system prompt to include inventory filtering:

```typescript
export async function suggestMeals(
  inventoryItems: InventoryItem[],
  mealType: 'breakfast' | 'lunch' | 'dinner'
): Promise<Recipe[]> {
  const client = getOpenAIClient();

  // Format inventory for LLM
  const inventoryList = inventoryItems
    .map(item => `${item.name}: ${item.quantity}${item.unit}`)
    .join('\n');

  const systemPrompt = `You are a meal discovery assistant. Your job is to suggest recipes the user can cook RIGHT NOW with their available inventory.

CRITICAL RULES:
1. Only suggest recipes where the user has ALL ingredients
2. Check quantities - if recipe needs 500g flour but user only has 300g, do NOT suggest it
3. If fewer than 3 viable recipes exist, say so - suggest nothing rather than suggest recipes they can't cook
4. Return ONLY valid JSON array with recipe objects
5. Do NOT hallucinate ingredients not in the inventory

User's available inventory:
${inventoryList}

Return JSON array of 1-5 recipes (or empty array if none viable):
[
  {
    "name": "Recipe Name",
    "description": "Brief description with character",
    "time_estimate_mins": 30,
    "key_ingredients": ["flour", "milk", "eggs"]
  }
]

Return ONLY JSON, no markdown or extra text.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-1',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Suggest ${mealType} recipes.`
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const recipes = JSON.parse(content.text);
    return Array.isArray(recipes) ? recipes : [];
  } catch (error) {
    console.error('Failed to parse recipe suggestions:', error);
    return [];
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add netlify/functions/api/chat.ts
git commit -m "feat: update meal suggestions to filter by inventory availability"
```

---

### Task 7: Implement Recipe Adjustment Conversation in Backend

**Files:**
- Modify: `backend/netlify/functions/api/cooking.ts`
- Create: `backend/tests/recipe-adjustment.test.ts`

- [ ] **Step 1: Write test for parsing recipe adjustments**

Create `backend/tests/recipe-adjustment.test.ts`:

```typescript
import { parseRecipeAdjustments } from '../src/utils/prompts';

describe('Recipe Adjustments', () => {
  it('parses quantity adjustment', async () => {
    const userInput = 'I only have 300g flour';
    const result = await parseRecipeAdjustments(userInput, {
      ingredients: [{ name: 'flour', quantity: 500, unit: 'g' }]
    });

    expect(result).toContainEqual(
      expect.objectContaining({
        type: 'quantity',
        ingredient: 'flour',
        quantity: 300
      })
    );
  });

  it('parses ingredient removal', async () => {
    const userInput = 'The milk is gone off';
    const result = await parseRecipeAdjustments(userInput, {
      ingredients: [{ name: 'milk', quantity: 300, unit: 'ml' }]
    });

    expect(result).toContainEqual(
      expect.objectContaining({
        type: 'removal',
        ingredient: 'milk'
      })
    );
  });

  it('parses multiple adjustments', async () => {
    const userInput = 'I have 300g flour, milk is gone, 6 eggs';
    const result = await parseRecipeAdjustments(userInput, {
      ingredients: [
        { name: 'flour', quantity: 500, unit: 'g' },
        { name: 'milk', quantity: 300, unit: 'ml' },
        { name: 'eggs', quantity: 2, unit: 'pieces' }
      ]
    });

    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
npm test -- recipe-adjustment.test.ts
```

Expected: `FAIL - parseRecipeAdjustments is not defined`

- [ ] **Step 3: Implement parseRecipeAdjustments in prompts.ts**

In `backend/netlify/functions/api/utils/prompts.ts`, add:

```typescript
export interface RecipeAdjustment {
  type: 'quantity' | 'removal' | 'substitution' | 'uncertain';
  ingredient: string;
  quantity?: number;
  unit?: string;
  substitute_with?: string;
  reason?: string;
  confidence?: 'exact' | 'approximate';
}

export async function parseRecipeAdjustments(
  userInput: string,
  recipeContext: { ingredients: Array<{ name: string; quantity: number; unit: string }> }
): Promise<RecipeAdjustment[]> {
  const client = getOpenAIClient();

  const recipeIngredients = recipeContext.ingredients
    .map(ing => `- ${ing.name}: ${ing.quantity}${ing.unit}`)
    .join('\n');

  const systemPrompt = `Parse user input about recipe adjustments. The user is describing what they actually have of the recipe ingredients.

Recipe ingredients:
${recipeIngredients}

For each ingredient mentioned in user input, return:
- type: 'quantity' (user specifies how much they have), 'removal' (ingredient not available), 'substitution' (use different ingredient), 'uncertain' (can't parse)
- ingredient: which recipe ingredient they're adjusting
- quantity/unit: if quantity adjustment
- substitute_with: if substitution
- confidence: 'exact' if user specified precise amount, 'approximate' if vague
- reason: if removal (e.g., 'gone_off', 'dont_have')

Examples:
"I only have 300g flour" → { type: 'quantity', ingredient: 'flour', quantity: 300, unit: 'g', confidence: 'exact' }
"milk is gone off" → { type: 'removal', ingredient: 'milk', reason: 'gone_off' }
"use cod instead of chicken" → { type: 'substitution', ingredient: 'chicken', substitute_with: 'cod', confidence: 'exact' }

Return ONLY valid JSON array.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-1',
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userInput
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const parsed = JSON.parse(content.text);
  return Array.isArray(parsed) ? parsed : [];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend
npm test -- recipe-adjustment.test.ts
```

Expected: `PASS`

- [ ] **Step 5: Update cooking.ts to use adjustment parsing**

In `backend/netlify/functions/api/cooking.ts`, update the POST /api/cooking/start endpoint to handle adjustments. Find the route handler and update it to accept adjustment conversation:

```typescript
router.post('/start', async (req: Request, res: Response) => {
  // ... existing code ...
  
  // After generating recipe detail and before creating session, 
  // note that adjustments will be sent in /api/cooking/confirm endpoint
  
  // Store in session for later adjustment
  const sessionId = `cooking-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  cookingSessions[sessionId] = {
    recipe: recipeDetail,
    inventory_before: currentInventory,
    started_at: new Date().toISOString(),
    awaiting_adjustments: true  // NEW: waiting for user adjustments
  };

  res.status(201).json({
    data: {
      session_id: sessionId,
      recipe: recipeDetail,
      message: 'Recipe ready! Want to make any adjustments? (quantities, ingredients, etc.)'
    }
  });
});
```

- [ ] **Step 6: Add adjustment confirmation endpoint**

Add new endpoint to handle adjustment confirmation:

```typescript
/**
 * POST /api/cooking/confirm-adjustments
 * User confirms adjustments to recipe
 */
router.post('/confirm-adjustments', async (req: Request, res: Response) => {
  try {
    const { session_id, adjustments } = req.body;

    if (!session_id) {
      return res.status(400).json({
        error: 'Missing session_id',
        details: 'session_id is required'
      });
    }

    if (!adjustments || !Array.isArray(adjustments)) {
      return res.status(400).json({
        error: 'Missing adjustments',
        details: 'adjustments must be an array'
      });
    }

    const session = cookingSessions[session_id];
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        details: `Session ${session_id} does not exist`
      });
    }

    // Apply adjustments to recipe
    let updatedRecipe = session.recipe;
    let updatedInventory = [...session.inventory_before];

    for (const adjustment of adjustments) {
      if (adjustment.type === 'quantity') {
        // Update ingredient quantity in recipe
        const ingredientIndex = updatedRecipe.ingredients.findIndex(
          ing => ing.name.toLowerCase() === adjustment.ingredient.toLowerCase()
        );
        if (ingredientIndex !== -1) {
          updatedRecipe.ingredients[ingredientIndex] = {
            ...updatedRecipe.ingredients[ingredientIndex],
            quantity: adjustment.quantity,
            unit: adjustment.unit || updatedRecipe.ingredients[ingredientIndex].unit
          };
        }
      } else if (adjustment.type === 'removal') {
        // Remove ingredient from recipe
        updatedRecipe.ingredients = updatedRecipe.ingredients.filter(
          ing => ing.name.toLowerCase() !== adjustment.ingredient.toLowerCase()
        );
      } else if (adjustment.type === 'substitution') {
        // Replace ingredient in recipe
        const ingredientIndex = updatedRecipe.ingredients.findIndex(
          ing => ing.name.toLowerCase() === adjustment.ingredient.toLowerCase()
        );
        if (ingredientIndex !== -1) {
          updatedRecipe.ingredients[ingredientIndex] = {
            ...updatedRecipe.ingredients[ingredientIndex],
            name: adjustment.substitute_with
          };
        }
      }
    }

    // Regenerate instructions with adjusted recipe
    updatedRecipe = await generateRecipeDetail(
      updatedRecipe.name,
      updatedRecipe.description,
      updatedInventory,
      updatedRecipe.ingredients // Pass adjusted ingredients
    );

    // Update session with adjusted recipe
    session.recipe = updatedRecipe;
    session.awaiting_adjustments = false;

    // Map recipe ingredients to inventory for deduction
    const ingredientsToDeduct = updatedRecipe.ingredients.map((ingredient) => {
      const inventoryItem = updatedInventory.find(
        (item) => item.name.toLowerCase() === ingredient.name.toLowerCase()
      );

      if (!inventoryItem) {
        throw new Error(
          `Recipe ingredient "${ingredient.name}" not found in inventory. ` +
          `User may have removed it during adjustment.`
        );
      }

      return {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        inventory_item_id: inventoryItem.id,
        confidence: inventoryItem.confidence,
      };
    });

    session.ingredients_to_deduct = ingredientsToDeduct;

    res.status(200).json({
      data: {
        session_id: sessionId,
        recipe: updatedRecipe,
        ingredients_to_deduct: ingredientsToDeduct,
        message: 'All set! Ready to cook?'
      }
    });
  } catch (error) {
    console.error('Error in POST /api/cooking/confirm-adjustments:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(400).json({
      error: 'Failed to confirm adjustments',
      details: errorMsg
    });
  }
});
```

- [ ] **Step 7: Commit**

```bash
git add netlify/functions/api/cooking.ts netlify/functions/api/utils/prompts.ts tests/recipe-adjustment.test.ts
git commit -m "feat: implement recipe adjustment parsing and confirmation"
```

---

### Task 8: Update Deduction Logic with Confidence Rules

**Files:**
- Modify: `backend/netlify/functions/api/utils/db.ts`
- Modify: `backend/netlify/functions/api/cooking.ts`
- Test: `backend/tests/deduction-confidence.test.ts`

- [ ] **Step 1: Write test for deduction with confidence rules**

Create `backend/tests/deduction-confidence.test.ts`:

```typescript
import { deductWithConfidence } from '../src/utils/units';

describe('Deduction with Confidence Rules', () => {
  it('exact - exact = exact', () => {
    const result = deductWithConfidence('exact', 'exact');
    expect(result).toBe('exact');
  });

  it('approximate - exact = approximate', () => {
    const result = deductWithConfidence('approximate', 'exact');
    expect(result).toBe('approximate');
  });

  it('approximate - approximate = approximate', () => {
    const result = deductWithConfidence('approximate', 'approximate');
    expect(result).toBe('approximate');
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
cd backend
npm test -- deduction-confidence.test.ts
```

Expected: `PASS`

- [ ] **Step 3: Update deductInventoryQuantity to apply confidence rules**

In `backend/netlify/functions/api/utils/db.ts`, update the function:

```typescript
export async function deductInventoryQuantity(
  itemId: string,
  quantityToDeduct?: number
): Promise<{ deducted_item: InventoryItem; remainder_item_id?: string }> {
  const userId = getUserId();

  // Fetch the item
  const item = await pocketbaseFetch(
    `/collections/inventory_items/records/${itemId}`,
    undefined,
    'auto'
  ) as InventoryItem;

  // Boolean items: just mark as used
  if (item.has_item === true && quantityToDeduct === undefined) {
    const deductedItem = await pocketbaseFetch(
      `/collections/inventory_items/records/${itemId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ date_used: new Date().toISOString() }),
      },
      'auto'
    );

    return { deducted_item: deductedItem as InventoryItem };
  }

  // Quantity-based items
  if (quantityToDeduct !== undefined && item.quantity_approx !== null) {
    const available = item.quantity_approx;

    // Block if insufficient
    if (available < quantityToDeduct) {
      throw new Error(
        `Insufficient quantity: need ${quantityToDeduct} ${item.unit || 'units'}, ` +
        `have ${available}. User must review recipe or add more inventory.`
      );
    }

    // Exact match or very close: mark entire item as used
    if (Math.abs(available - quantityToDeduct) < 0.01) {
      const deductedItem = await pocketbaseFetch(
        `/collections/inventory_items/records/${itemId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            date_used: new Date().toISOString(),
            confidence: item.confidence  // Keep original confidence
          }),
        },
        'auto'
      );

      return { deducted_item: deductedItem as InventoryItem };
    }

    // Partial deduction: create remainder
    const remainder = available - quantityToDeduct;

    // NEW: Apply confidence rules
    import { deductWithConfidence } from './units';
    const deductionConfidence = 'exact'; // Recipe specifies exact amount
    const remainderConfidence = deductWithConfidence(item.confidence, deductionConfidence);

    const remainderItem = await pocketbaseFetch(
      `/collections/inventory_items/records`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          name: item.name,
          quantity_approx: remainder,
          unit: item.unit,
          confidence: remainderConfidence,  // NEW: apply confidence rule
          has_item: false,
          date_added: new Date().toISOString(),
        }),
      },
      'auto'
    );

    // Mark original as used
    const deductedItem = await pocketbaseFetch(
      `/collections/inventory_items/records/${itemId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          date_used: new Date().toISOString(),
          confidence: item.confidence
        }),
      },
      'auto'
    );

    return {
      deducted_item: deductedItem as InventoryItem,
      remainder_item_id: remainderItem.id,
    };
  }

  // No quantity specified
  const deductedItem = await pocketbaseFetch(
    `/collections/inventory_items/records/${itemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        date_used: new Date().toISOString(),
        confidence: item.confidence
      }),
    },
    'auto'
  );

  return { deducted_item: deductedItem as InventoryItem };
}
```

- [ ] **Step 4: Update POST /api/cooking/complete to use confidence**

In `backend/netlify/functions/api/cooking.ts`, the complete endpoint already deducts, just verify it uses the updated function:

```typescript
// The deductInventoryQuantity call will now automatically handle confidence
for (const ingredient of session.ingredients_to_deduct) {
  try {
    const result = await deductInventoryQuantity(
      ingredient.inventory_item_id,
      ingredient.quantity
    );
    // ... rest of existing code
```

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/api/utils/db.ts netlify/functions/api/utils/units.ts tests/deduction-confidence.test.ts
git commit -m "feat: apply confidence rules to deductions and remainders"
```

---

### Task 9: Update Frontend Types & Services

**Files:**
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add RecipeAdjustment type to frontend**

In `frontend/src/types/index.ts`, add:

```typescript
export interface RecipeAdjustment {
  type: 'quantity' | 'removal' | 'substitution' | 'uncertain';
  ingredient: string;
  quantity?: number;
  unit?: string;
  substitute_with?: string;
  reason?: string;
  confidence?: 'exact' | 'approximate';
}

export interface IngredientDisplayHints {
  ingredient_name: string;
  storage_unit: string;
  display_unit: string | null;
  display_examples: string[];
}
```

- [ ] **Step 2: Add API service methods**

In `frontend/src/services/api.ts`, add methods:

```typescript
export async function parseRecipeAdjustments(
  userInput: string,
  recipeIngredients: Array<{ name: string; quantity: number; unit: string }>
): Promise<RecipeAdjustment[]> {
  const response = await fetch(`${API_URL}/api/cooking/parse-adjustments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_input: userInput,
      recipe_context: { ingredients: recipeIngredients }
    })
  });

  if (!response.ok) {
    throw new ApiError(`Failed to parse adjustments: ${response.statusText}`);
  }

  return response.json();
}

export async function confirmRecipeAdjustments(
  sessionId: string,
  adjustments: RecipeAdjustment[]
): Promise<{ recipe: RecipeDetail; ingredients_to_deduct: any[] }> {
  const response = await fetch(`${API_URL}/api/cooking/confirm-adjustments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, adjustments })
  });

  if (!response.ok) {
    throw new ApiError(`Failed to confirm adjustments: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

export async function getDisplayHints(
  ingredientName: string
): Promise<IngredientDisplayHints> {
  const response = await fetch(`${API_URL}/api/ingredient-hints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredient_name: ingredientName })
  });

  if (!response.ok) {
    throw new ApiError(`Failed to get display hints: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/api.ts frontend/src/types/index.ts
git commit -m "feat: add recipe adjustment and display hints types and API methods"
```

---

### Task 10: Update InventoryForm Component

**Files:**
- Modify: `frontend/src/components/InventoryForm.tsx`

- [ ] **Step 1: Update to show parsed items with confidence**

Replace the InventoryForm component:

```typescript
import React, { useState } from 'react';
import { addInventory, getInventory } from '../services/api';
import { InventoryItem } from '../types';

export function InventoryForm() {
  const [input, setInput] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<any[]>([]);

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await addInventory(input.trim());
      setParsedItems(response.data);
      setInput('');
      
      // Fetch updated inventory
      const updated = await getInventory();
      setInventory(updated.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectItem = async (itemName: string, correctedQuantity: string) => {
    // For MVP, user can re-add with corrected amount
    // Phase 1: inline editing
    setInput(`${correctedQuantity} ${itemName}`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Inventory</h2>

      <form onSubmit={handleAddInventory} className="space-y-2">
        <label className="block">
          <span className="text-sm font-medium">Add inventory items</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Examples: "500g flour, some milk, 3 eggs" or just list items'
            className="w-full p-2 border rounded mt-1"
            rows={3}
            disabled={loading}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Items'}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}

      {/* Show parsed items for review before saving */}
      {parsedItems.length > 0 && (
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-semibold mb-2">Parsed items:</h3>
          <ul className="space-y-1 text-sm">
            {parsedItems.map((item, idx) => (
              <li key={idx} className="flex justify-between items-center">
                <span>
                  {item.name}
                  {item.quantity && ` - ${item.quantity}${item.unit}`}
                  {item.confidence === 'approximate' && ' (approx)'}
                </span>
                {item.confidence === 'approximate' && (
                  <button
                    onClick={() => handleCorrectItem(item.name, '')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Correct
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Current inventory */}
      {inventory.length > 0 && (
        <div className="p-3 bg-green-50 rounded border border-green-200">
          <h3 className="font-semibold mb-2">Your inventory:</h3>
          <ul className="space-y-1 text-sm">
            {inventory.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.name}</span>
                <span className="text-gray-600">
                  {item.confidence === 'approximate' ? '✓ ~' : '✓ '}
                  {item.quantity_approx}{item.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/InventoryForm.tsx
git commit -m "feat: update InventoryForm to show parsed items with confidence"
```

---

### Task 11: Implement Recipe Adjustment Conversation UI

**Files:**
- Modify: `frontend/src/components/CookingConfirm.tsx`

- [ ] **Step 1: Replace per-ingredient UI with single text field**

Replace `CookingConfirm.tsx`:

```typescript
import React, { useState } from 'react';
import { confirmRecipeAdjustments, completeCooking } from '../services/api';
import { RecipeDetail, RecipeAdjustment } from '../types';

interface CookingConfirmProps {
  sessionId: string;
  recipe: RecipeDetail;
  onComplete: () => void;
  onCancel: () => void;
}

export function CookingConfirm({
  sessionId,
  recipe,
  onComplete,
  onCancel
}: CookingConfirmProps) {
  const [adjustmentInput, setAdjustmentInput] = useState('');
  const [parsedAdjustments, setParsedAdjustments] = useState<RecipeAdjustment[]>([]);
  const [confirmationStep, setConfirmationStep] = useState<'input' | 'confirm' | 'deduct'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParseAdjustments = async () => {
    if (!adjustmentInput.trim()) {
      // No adjustments, go straight to deduction
      setConfirmationStep('deduct');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const adjustments = await parseRecipeAdjustments(
        adjustmentInput.trim(),
        recipe.ingredients
      );
      setParsedAdjustments(adjustments);
      setConfirmationStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse adjustments');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAdjustments = async () => {
    setLoading(true);
    setError(null);

    try {
      const { recipe: updatedRecipe, ingredients_to_deduct } = 
        await confirmRecipeAdjustments(sessionId, parsedAdjustments);
      
      // Show deduction confirmation
      setConfirmationStep('deduct');
      // Store for deduction step
      (window as any).__cookingState = { updatedRecipe, ingredients_to_deduct };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm adjustments');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDeduction = async () => {
    setLoading(true);
    setError(null);

    try {
      const state = (window as any).__cookingState || {};
      await completeCooking(sessionId, true);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete cooking');
    } finally {
      setLoading(false);
    }
  };

  if (confirmationStep === 'input') {
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded">
        <h2 className="text-lg font-semibold">Review Recipe</h2>

        <div className="bg-white p-3 rounded border">
          <h3 className="font-semibold mb-2">{recipe.name}</h3>
          <div className="space-y-1 text-sm">
            <div><strong>Time:</strong> {recipe.time_estimate_mins} mins</div>
            <div><strong>Ingredients:</strong></div>
            <ul className="list-disc list-inside ml-2">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx}>
                  {ing.name}: {ing.quantity}{ing.unit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium">Want to make any adjustments?</span>
            <span className="text-xs text-gray-500 block mt-1">
              Describe quantities you actually have, ingredients that are gone off, or substitutions
            </span>
            <textarea
              value={adjustmentInput}
              onChange={(e) => setAdjustmentInput(e.target.value)}
              placeholder='Examples: "I only have 300g flour", "milk is gone off", "use cod instead of chicken"'
              className="w-full p-2 border rounded mt-1 text-sm"
              rows={3}
              disabled={loading}
            />
          </label>
        </div>

        {error && (
          <div className="p-2 bg-red-100 text-red-800 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleParseAdjustments}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Parsing...' : 'Continue'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (confirmationStep === 'confirm') {
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded">
        <h2 className="text-lg font-semibold">Confirm Adjustments</h2>

        <div className="space-y-2">
          {parsedAdjustments.map((adj, idx) => (
            <div key={idx} className="p-2 bg-white rounded border">
              {adj.type === 'quantity' && (
                <div>
                  You have {adj.quantity}{adj.unit} {adj.ingredient}
                  <span className="ml-2 text-xs text-gray-600">
                    (recipe needs {recipe.ingredients.find(i => i.name === adj.ingredient)?.quantity})
                  </span>
                  <div className="text-xs mt-1">
                    <button
                      onClick={() => setParsedAdjustments(parsedAdjustments.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:underline"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              )}
              {adj.type === 'removal' && (
                <div>
                  ❌ {adj.ingredient} (not available)
                  <div className="text-xs mt-1">
                    <button
                      onClick={() => setParsedAdjustments(parsedAdjustments.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:underline"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              )}
              {adj.type === 'substitution' && (
                <div>
                  Use {adj.substitute_with} instead of {adj.ingredient}
                  <div className="text-xs mt-1">
                    <button
                      onClick={() => setParsedAdjustments(parsedAdjustments.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:underline"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="p-2 bg-red-100 text-red-800 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleConfirmAdjustments}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Confirming...' : 'Confirm & Continue'}
          </button>
          <button
            onClick={() => {
              setConfirmationStep('input');
              setAdjustmentInput('');
              setParsedAdjustments([]);
            }}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Deduction confirmation step
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded">
      <h2 className="text-lg font-semibold">Ready to Cook!</h2>

      <div className="bg-white p-3 rounded border">
        <p className="text-sm mb-2">We'll deduct from your inventory:</p>
        <ul className="space-y-1 text-sm">
          {recipe.ingredients.map((ing, idx) => (
            <li key={idx} className="flex justify-between">
              <span>{ing.name}</span>
              <span>{ing.quantity}{ing.unit}</span>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="p-2 bg-red-100 text-red-800 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleCompleteDeduction}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Cooking...' : 'I cooked this!'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/CookingConfirm.tsx
git commit -m "feat: implement single-field recipe adjustment conversation UI"
```

---

### Task 12: Create Database Migration

**Files:**
- Create: `backend/migrations/001-add-confidence-field.sql`

- [ ] **Step 1: Create migration file**

Create `backend/migrations/001-add-confidence-field.sql`:

```sql
-- Add confidence field to inventory_items table
ALTER TABLE inventory_items ADD COLUMN confidence TEXT DEFAULT 'approximate' CHECK (confidence IN ('exact', 'approximate'));

-- Create ingredient_display_hints cache table
CREATE TABLE ingredient_display_hints (
  id TEXT PRIMARY KEY,
  ingredient_name TEXT NOT NULL UNIQUE,
  storage_unit TEXT NOT NULL,
  display_unit TEXT,
  display_examples TEXT NOT NULL, -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for quick lookups
CREATE INDEX idx_ingredient_display_hints_name ON ingredient_display_hints(ingredient_name);
```

- [ ] **Step 2: Document in DATABASE.md**

In `docs/DATABASE.md`, add section:

```markdown
## Changes for Unit Normalization

### inventory_items
- Added `confidence` field (TEXT, default 'approximate'): tracks certainty about quantity
- Values: 'exact' (user specified or measured) | 'approximate' (LLM estimated)

### ingredient_display_hints (new table)
Caches LLM decisions about how to display each ingredient
- `id`: primary key
- `ingredient_name`: e.g., "flour"
- `storage_unit`: canonical unit ("g", "ml", "pieces")
- `display_unit`: how users naturally say it (null, "slices", etc.)
- `display_examples`: JSON array of example phrases
- `created_at`: when cached

Index on ingredient_name for fast lookups.
```

- [ ] **Step 3: Commit**

```bash
git add backend/migrations/001-add-confidence-field.sql docs/DATABASE.md
git commit -m "feat: add database migration for confidence and display hints"
```

---

### Task 13: Integration Testing

**Files:**
- Create: `backend/tests/integration.test.ts`

- [ ] **Step 1: Write end-to-end test**

Create `backend/tests/integration.test.ts`:

```typescript
describe('Unit Normalization Integration', () => {
  it('complete flow: add → suggest → adjust → deduct', async () => {
    // 1. Add inventory
    const addResponse = await fetch('/api/inventory', {
      method: 'POST',
      body: JSON.stringify({ user_input: '500g flour, some milk, 3 eggs' })
    });
    const { data: inventory } = await addResponse.json();
    
    expect(inventory).toHaveLength(3);
    expect(inventory[0].confidence).toBe('exact');
    expect(inventory[1].confidence).toBe('approximate');

    // 2. Get recipes
    const suggestResponse = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ meal_type: 'breakfast' })
    });
    const { data: recipes } = await suggestResponse.json();
    
    expect(recipes.length).toBeGreaterThan(0);

    // 3. Start cooking
    const startResponse = await fetch('/api/cooking/start', {
      method: 'POST',
      body: JSON.stringify({
        recipe_name: recipes[0].name,
        recipe_description: recipes[0].description,
        recipe_time_mins: recipes[0].time_estimate_mins
      })
    });
    const { data: cookingSession } = await startResponse.json();
    
    expect(cookingSession.session_id).toBeDefined();

    // 4. Adjust recipe
    const adjustResponse = await fetch('/api/cooking/confirm-adjustments', {
      method: 'POST',
      body: JSON.stringify({
        session_id: cookingSession.session_id,
        adjustments: [
          { type: 'quantity', ingredient: 'flour', quantity: 300, unit: 'g', confidence: 'exact' }
        ]
      })
    });
    const { data: adjustedCooking } = await adjustResponse.json();
    
    expect(adjustedCooking.ingredients_to_deduct).toBeDefined();

    // 5. Complete cooking
    const completeResponse = await fetch('/api/cooking/complete', {
      method: 'POST',
      body: JSON.stringify({
        session_id: cookingSession.session_id,
        deduction_confirmed: true
      })
    });
    const { data: completed } = await completeResponse.json();
    
    expect(completed.deducted_items.length).toBeGreaterThan(0);

    // 6. Check inventory updated
    const inventoryResponse = await fetch('/api/inventory');
    const { data: updatedInventory } = await inventoryResponse.json();
    
    // Should have remainder items and marked used items
    expect(updatedInventory.length).toBeGreaterThanOrEqual(inventory.length);
  });
});
```

- [ ] **Step 2: Run integration test**

```bash
cd backend
npm test -- integration.test.ts
```

Expected: `PASS`

- [ ] **Step 3: Commit**

```bash
git add backend/tests/integration.test.ts
git commit -m "test: add end-to-end integration test for unit normalization"
```

---

## Success Criteria

- [ ] All inventory items store confidence levels
- [ ] Canonical units determined by LLM and cached
- [ ] User input converts to canonical units on add
- [ ] Recipe suggestions only show recipes user can make
- [ ] Recipe adjustment conversation parses natural language
- [ ] Deduction applies confidence rules correctly
- [ ] Remainder items created with correct confidence
- [ ] Frontend shows semantic display hints (not raw grams)
- [ ] All tests pass
- [ ] Integration test covers full flow

---

## Testing Checklist

- [ ] Add inventory: "500g flour" → stored as { quantity: 500, unit: "g", confidence: "exact" }
- [ ] Add inventory: "some milk" → stored as { quantity: 500, unit: "ml", confidence: "approximate" }
- [ ] Add inventory: "3 eggs" → stored as { quantity: 3, unit: "pieces", confidence: "exact" }
- [ ] Suggest recipes: Only shows recipes where all ingredients are available in sufficient quantities
- [ ] Suggest recipes: Shows message if no viable recipes
- [ ] Recipe adjustment: Parse "I only have 300g flour" correctly
- [ ] Recipe adjustment: Parse "milk is gone off" correctly
- [ ] Recipe adjustment: Parse "use cod instead of chicken" and check if cod exists in inventory
- [ ] Recipe adjustment: Regenerate instructions after adjustments
- [ ] Deduction: exact - exact = exact (flour: 300 - 300 = 0, exact)
- [ ] Deduction: approximate - exact = approximate (milk: 500 approx - 300 exact = 200 approx)
- [ ] Frontend: Show "Flour" without quantity
- [ ] Frontend: Show "some bread" or "half a loaf" not "300g bread"
- [ ] Frontend: Show "6 eggs" (exact count)

---

## Estimated Effort

- **Backend core logic:** 4-6 hours
- **Frontend integration:** 2-3 hours
- **Database & migration:** 30 mins
- **Testing:** 2-3 hours
- **Total:** ~9-12 hours

---

## Rollback Plan

If critical issues found during integration testing:
1. Revert to previous commit before confidence field added
2. Unit normalization can be added incrementally in phase 1
3. Core inventory add/suggest/deduct works without confidence tracking

---

## Next Phase (Phase 1+)

- Move display hints cache to database
- Add voice input for inventory
- Implement predictive restocking alerts
- Handle cooking state flexibility
- Add general comments on recipes
- Support creative ingredient additions
