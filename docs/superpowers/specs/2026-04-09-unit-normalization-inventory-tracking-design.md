# Unit Normalization & Inventory Tracking System - Design Spec

**Date:** 2026-04-09  
**Status:** Approved for Implementation  
**Scope:** MVP (Iteration 1)  
**Author:** Jon Searle + Claude  

---

## Executive Summary

This spec defines how Suppa tracks ingredient quantities consistently across the inventory → recipe suggestion → cooking → deduction flow. The system solves a critical problem: users measure ingredients in different ways (cups, grams, pieces, "some"), and recipes specify quantities in different units, leading to deduction failures and mismatches.

**Solution:** A unified inventory model with canonical units (determined by LLM per ingredient) for internal storage, combined with intelligent display hints so users see quantities in the way they naturally think about them.

**Core principle:** Track everything consistently for the math, display intelligently for the human.

---

## Problem Statement

### Current Issues (Pre-MVP)
1. **Unit mismatch at deduction**: User adds "2 cups flour", recipe needs "500g flour" → system can't deduct
2. **Vague inventory**: User says "some flour" → system guesses amount → low confidence in predictions
3. **Unit inconsistency**: Same ingredient measured differently across inventory, recipes, and deductions
4. **Unpredictable display**: Showing "500g flour" vs "flour" vs "some flour" inconsistently confuses users

### Root Cause
Quantities are stored but not normalized. Units are tracked as labels, not as semantic units. Deduction logic doesn't understand unit compatibility.

### Scope of Solution
- **In scope:** Normalize all quantities to canonical units internally; display intelligently per ingredient type
- **Out of scope:** Substitutions (phase 1+), creative recipe modifications (phase 1+), predictive restocking (phase 1+)

---

## Design Principles

1. **Single inventory model** — Everything tracked the same way (quantity + unit + confidence), not different categories
2. **Canonical units internally** — All storage uses normalized units (grams, ml, pieces); conversions happen at input time
3. **Semantic display externally** — Users see quantities in the way they naturally think about each ingredient
4. **Confidence flags uncertainty** — Track how certain we are about quantities; use to guide UX decisions
5. **Frictionless add, engaging adjust** — Adding inventory is fire-and-forget (LLM estimates); recipe adjustment is conversational (where users are engaged)
6. **One conversation for all adjustments** — Don't make users correct per-ingredient; let them describe all changes at once

---

## Data Model

### Inventory Item (Stored)
```typescript
{
  id: string                          // UUID
  user_id: string                     // UUID
  name: string                        // "flour", "milk", "eggs", "bread"
  quantity: number                    // 450, 500, 6 (always in canonical unit)
  unit: string                        // "g", "ml", "pieces" (canonical, determined by LLM once)
  confidence: "exact" | "approximate" // How certain we are about this quantity
  date_added: timestamp               // When user added it
  date_used: timestamp | null         // When fully consumed/removed
}
```

### Ingredient Display Hints (Cached per ingredient type, determined once by LLM)
```typescript
{
  ingredient_name: string             // "flour"
  storage_unit: string                // "g" (canonical, locked in)
  display_unit: string | null         // null for "flour" (no quantity shown)
  display_examples: string[]          // ["flour", "some flour"]
  
  // Another example:
  ingredient_name: "bread"
  storage_unit: "g"
  display_unit: "slices"
  display_examples: ["half a loaf", "some bread", "a loaf"]
}
```

### Recipe Ingredient
```typescript
{
  name: string                        // "flour"
  quantity: number                    // 500 (always in canonical unit)
  unit: string                        // "g" (canonical)
}
```

### Confidence Rules (Applied at Deduction)
```
exact - exact = exact
  (precise deduction from precise amount → result is precise)

approximate - exact = approximate
  (precise deduction from estimated amount → result is estimated)

approximate - approximate = approximate
  (estimated deduction from estimated amount → result is estimated)
```

---

## Workflow

### 1. Add Inventory (Frictionless)

**User Input:**
Text field (no required fields). User can type one item or many at once (future: voice input).
```
Examples:
- "flour"
- "500g flour, 3 eggs, 1 pint milk"
- "half a loaf of bread, some tomatoes"
```

**LLM Processing:**
1. Parse all items in input
2. For EACH item, determine:
   - `name`: canonical ingredient name ("flour", "milk", "bread")
   - `quantity_estimated`: rough amount (e.g., 500 for "some flour")
   - `storage_unit`: what canonical unit to use (LLM decides, cached after first use)
   - `confidence`: "exact" if user gave specific amount, "approximate" if estimated

3. Convert user quantity to canonical unit
   - User says "2 cups flour" → LLM determines flour uses grams → converts 2 cups (250g) → store as 250g
   - User says "some milk" → LLM determines milk uses ml → estimates "some" (500ml) → store as 500ml

**Display Back to User:**
Show parsed items for confirmation. User can correct if needed.
```
You added:
✓ Flour
✓ 3 eggs
✓ Some milk
```

User can tap to correct: "Actually it's 300g flour, not 500g"

**Storage:**
```
{ name: "flour", quantity: 250, unit: "g", confidence: "exact" }
{ name: "eggs", quantity: 3, unit: "pieces", confidence: "exact" }
{ name: "milk", quantity: 500, unit: "ml", confidence: "approximate" }
```

**Design principle:** Assume LLM's estimates are reasonable. No interruptions. Corrections are optional.

---

### 2. Suggest Recipes (Strict Gate)

**Input:** User asks for meal suggestions (breakfast/lunch/dinner)

**System Check:**
- Fetch all active inventory items
- Query LLM: "Given this inventory, suggest 3-5 recipes the user can cook right now"
- LLM filters to only recipes where:
  - User has ALL ingredients in sufficient quantity
  - Recipe is realistic/not silly

**Output:**
- If 1+ viable recipes exist: Show up to 4 recipes
- If 0 viable recipes: "Sorry, no recipes available. You need to go shopping."

**Design principle:** Only suggest recipes users can actually make. No dead ends.

---

### 3. Review Recipe + Make Adjustments (Conversational)

**Display Recipe:**
Show the suggested recipe with ingredients and estimated quantities.

**Call to Action:**
Single text field: "Want to make any changes? (quantities, ingredients, preferences)"

**User Input (Examples):**
- "I only have 300g flour"
- "That bread's gone off"
- "I've got 6 eggs"
- "Can I use the cod instead of chicken?"
- "Actually I don't have milk"

**LLM Processing:**
1. Parse all adjustments in one go
2. Categorize each:
   - **Quantity adjustment:** "300g flour" → { ingredient: "flour", quantity: 300 }
   - **Removal:** "gone off" → { ingredient: "bread", action: "remove" }
   - **Substitution:** "cod instead of chicken" → { ingredient: "chicken", substitute_with: "cod" }
   - **Inventory discovery:** "the cod I've got" → check inventory; if not present, ask what kind of cod

3. For each parsed item, ask confirmation:
   ```
   "So you have 300g flour? [Y] [N]"
   "Bread is gone off (remove)? [Y] [N]"
   "Use cod instead of chicken? [Y] [N]"
   ```

4. If user answers NO, ask for clarification:
   ```
   User: "No" (to 300g flour)
   System: "Got it. How much flour do you actually have?"
   ```

5. Continue until confident

**Updates (Real-time):**
- As each adjustment is confirmed, update inventory and recipe
- For removals: set quantity to 0 (or remove item)
- For substitutions: swap ingredient, check if substitute exists in inventory
  - If not in inventory: "You mentioned cod but we don't have it listed. Do you have cod?" → add to inventory

**Recipe Regeneration:**
Once all adjustments confirmed:
1. LLM regenerates recipe instructions with adjusted ingredients
2. Flag any risky adjustments: "⚠️ This bread recipe typically needs 200g+ flour. You have 300g, which is tight. Still want to proceed?"
3. Show final adjusted recipe to user

**Display Final Adjusted Recipe:**
Show the updated ingredient list and regenerated instructions. Include any warnings.

**User Action:**
Tap "I cooked this" to proceed to deduction.

**Design principle:** One conversation for all changes. Natural language. Clarify ambiguity, then confirm. Update as you go.

---

### 4. Deduct + Track

**Confirmation:**
Show what will be deducted:
```
We'll deduct from your inventory:
- 300g flour ✓
- 0ml milk (removed)
- 2 eggs ✓
- 300g cod (new ingredient) ✓

Ready? [Confirm] [Cancel]
```

**Deduction Logic:**
For each ingredient in the recipe:
1. Check: do we have enough?
   - If `available_quantity >= recipe_quantity`: proceed
   - If `available_quantity < recipe_quantity`: block and show error
2. Deduct exact amount from inventory
3. If partial deduction (used 100g of 250g): create remainder item
4. Mark original item with `date_used` = today
5. Store usage with confidence level

**Inventory Update (Example):**
```
Before:
  { name: "flour", quantity: 300, unit: "g", confidence: "approximate" }

After:
  Original: { name: "flour", quantity: 300, unit: "g", date_used: today }
  Remainder: { name: "flour", quantity: 200, unit: "g", confidence: "approximate" }
```

**Confidence After Deduction:**
```
Recipe specified: 100g flour (exact)
Inventory was: 300g (approximate)
Result: 200g remaining (approximate)
  → confidence stays "approximate" because source was approximate
```

**Tracking:**
- Store deduction with `date_used`
- Keep history of what was used when
- Build usage patterns over time (for phase 1 predictions)

**Design principle:** Clear confirmation before deduction. One-way operation (can't undo, but can add back later).

---

## Display Logic

**How to display inventory to users:**

Use the cached `display_hints` per ingredient to decide what to show.

**Case 1: No quantity display**
```
Ingredient: flour
display_unit: null
Display: "Flour" (no quantity)
```

**Case 2: Semantic display (slices, loaves)**
```
Ingredient: bread
Internal: 300g
display_unit: "slices"
Display: "Some bread" or "~1/2 loaf"
  (deterministic mapping: 0-200g → "some", 200-400g → "half", 400+ → "full loaf")
```

**Case 3: Exact quantities**
```
Ingredient: eggs
Internal: 6 pieces
display_unit: "pieces"
Display: "6 eggs"
```

**Principle:** Show what makes sense for that ingredient. Don't show imprecise gram measurements if they'll confuse the user.

---

## Implementation Details

### LLM Calls

**Call 1: Parse inventory input (at add-time)**
```
Input: "2 cups flour, some milk, 3 eggs"
Output: [
  { name: "flour", quantity: 250, unit: "g", confidence: "exact" },
  { name: "milk", quantity: 500, unit: "ml", confidence: "approximate" },
  { name: "eggs", quantity: 3, unit: "pieces", confidence: "exact" }
]
```

**Call 2: Determine storage unit + display hints (one-time, cached)**
```
Input: { ingredient: "flour" }
Output: {
  storage_unit: "g",
  display_unit: null,
  display_examples: ["flour", "some flour"]
}
```

**Call 3: Filter recipes by inventory availability (at suggestion)**
```
Input: { inventory: [...], meal_type: "dinner" }
Output: [viable recipes only]
```

**Call 4: Parse recipe adjustments (at review stage)**
```
Input: "I only have 300g flour, milk's gone off, 6 eggs. Can I use cod?"
Output: [
  { type: "quantity", ingredient: "flour", quantity: 300, confidence: "exact" },
  { type: "removal", ingredient: "milk", reason: "gone_off" },
  { type: "confirmation", ingredient: "eggs", quantity: 6, confidence: "exact" },
  { type: "substitution", from: "chicken", to: "cod", confidence: "uncertain" }
]
```

**Call 5: Regenerate recipe instructions (after adjustments confirmed)**
```
Input: { original_recipe: {...}, adjustments: [...] }
Output: { updated_instructions: [...], warnings: [...] }
```

---

## Edge Cases & Decisions

### What if user adds an ingredient we've never seen before?
- Store it with LLM-determined storage unit
- Cache that decision for future uses
- Example: User adds "curry paste" → LLM decides it's grams → store as grams forever

### What if user removes an ingredient during cooking?
- Set quantity to 0
- Mark as `date_used` = today
- Don't create a remainder (it's gone)

### What if user mentions an ingredient not in inventory?
- During recipe adjustment, ask: "You mentioned cod but we don't have it listed. Do you have cod?"
- User confirms → add to inventory with estimated quantity
- User says no → skip the substitution

### What if recipe asks for something impossible?
- Example: "2 chicken breasts" but user only has 1
- Show warning: "⚠️ This is the main protein. Recipe may not work."
- User can still proceed (their choice)
- Deduction will proceed with what they have

### What if confidence is "approximate" but recipe needs exact?
- Proceed anyway, but mark result as approximate
- Example: Added "some flour" (approx) → used exact 200g → remaining is approx
- System doesn't block, just tracks uncertainty

---

## Success Criteria

### MVP (Iteration 1)
- [ ] Inventory items can be added with flexible input (single unit or batch)
- [ ] Quantities normalize to canonical units internally
- [ ] Display hints determined by LLM and cached per ingredient
- [ ] Recipes only suggested if user has all ingredients
- [ ] Recipe review allows natural language adjustments
- [ ] Adjustments parsed and confirmed before applying
- [ ] Deduction succeeds when quantities match
- [ ] Confidence levels tracked through deductions
- [ ] Inventory updated with correct remainder items

### Testing
- [ ] Test with UK-specific units (teaspoons, tablespoons, pints)
- [ ] Test with countable items (eggs, tomatoes, lemons)
- [ ] Test with approximate quantities ("some flour", "a few slices")
- [ ] Test partial deductions (use 100g of 300g flour)
- [ ] Test substitutions with inventory discovery
- [ ] Test recipe filtering (no suggestions if no viable recipes)
- [ ] Test confidence rules (exact - exact = exact, etc.)

---

## Backlog Items (Phase 1+)

1. **Voice input for inventory** — Users can speak instead of type
2. **Recipe adjustments: General comments** — "More garlic would be good"
3. **Recipe adjustments: Creative additions** — "Can I add apple to this?"
4. **Inventory confidence improvement** — Move approximate → exact through user feedback
5. **Best-before dates & expiration alerts** — Suggest recipes with expiring items
6. **Cooking state flexibility** — Pause, resume, mid-recipe adjustments
7. **Predictive restocking alerts** — When will you need more flour?

---

## Technical Notes

### Database Schema
- `inventory_items` table with: id, user_id, name, quantity, unit, confidence, date_added, date_used
- Cached `ingredient_hints` table with: ingredient_name, storage_unit, display_unit, display_examples

### API Endpoints Used
- `POST /api/inventory` — Add items (with LLM parsing)
- `GET /api/inventory` — Fetch current items
- `POST /api/chat` — Get recipe suggestions (with filtering)
- `POST /api/cooking/detail` — Get recipe details
- `POST /api/cooking/start` — Begin cooking (validate adjustments)
- `POST /api/cooking/complete` — Deduct and update inventory

### Frontend Components Affected
- `InventoryForm.tsx` — Input and display
- `Chat.tsx` — Meal suggestions
- `RecipeDetail.tsx` — Recipe viewing
- `CookingConfirm.tsx` — Adjustment conversation + confirmation

---

## Open Questions & Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| Who determines canonical units? | LLM, cached per ingredient | Flexible per ingredient, not rigid categories |
| Do we show exact grams for everything? | No, use display hints | "500g bread" confuses users; "half a loaf" is natural |
| What if recipe needs more than available? | Block deduction, show error | Prevent inventory corruption; user adds more or picks different recipe |
| Can users undo deductions? | Not in MVP | Would add complexity; they can add more inventory if needed |
| How many recipes shown? | Up to 4 | Enough choice, not overwhelming |
| Do approximate quantities block cooking? | No, proceed with warning | User is engaged; they can decide |

---

## Sign-Off

**Designed by:** Jon Searle + Claude  
**Design reviewed by:** Jon Searle  
**Status:** ✅ Approved for implementation  
**Date approved:** 2026-04-09  

**Next step:** Implementation planning (superpowers:writing-plans skill)

