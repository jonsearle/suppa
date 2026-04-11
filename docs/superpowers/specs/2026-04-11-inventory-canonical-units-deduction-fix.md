# Inventory Canonical Units & Deduction Flow - Design Fix

**Date:** 2026-04-11  
**Status:** Approved for Implementation  
**Scope:** MVP Iteration 2 (Fix critical deduction bug)  
**Author:** Jon Searle + Claude  

---

## Executive Summary

The inventory system has a critical bug: when users add inventory (e.g., "500g rice") and then cook a recipe, the deduction uses wrong quantities (deducting 1g instead of 185g). 

Root cause: Canonical units are not cached when inventory is added, so recipe generation doesn't know how to measure rice consistently. Recipe generation falls back to treating "1 cup" as "1 gram".

This spec fixes the deduction flow by:
1. **Caching canonical units at add-time** — when user adds "500g rice", cache that rice = "g"
2. **Requiring recipe ingredients to have units** — recipe generator always includes unit, never omits it
3. **Fixing the adjustment UI flow** — adjustments happen BEFORE "start cooking", not after
4. **Clarifying confidence propagation** — how approximate/exact levels flow through deduction

---

## The Problem

**Current broken flow:**
```
User adds: "500 grams of rice"
  ↓ (canonical unit NOT cached)
Recipe generates: "1 cup rice"  
  ↓ (no unit conversion, recipe doesn't know rice = "g")
Deduction: treats "1" (no unit) as "1 gram"
  ✗ Result: Deducts 1g instead of 125g
```

**Why it happens:**
- `parseInventoryInput` doesn't call `cacheCanonicalUnit()`
- `generateRecipeDetail` can't find cached unit, doesn't convert cups → grams
- `convertToCanonical(1, null, "rice")` returns `{quantity: 1, unit: "g"}` unchanged

---

## Solution: Four Clear Sections

### **Section 1: Canonical Unit Caching**

**When user adds inventory:**
1. LLM parses: `{quantity: 500, unit: "g", name: "rice"}`
2. LLM decides canonical unit: "g" (for dry grains)
3. **Cache immediately:** `canonicalUnitCache["rice"] = "g"`
4. Convert to canonical: already "g", stays 500g
5. Store: `{name: "rice", quantity: 500, unit: "g", confidence: "exact"}`

**Future uses of rice:**
- Recipe needs "1 cup rice"? Look up cache → find "g" → convert 1 cup to 125g
- User adds "2 bags rice"? Look up cache → find "g" → convert 2000g

**Key decision:** Canonical unit is locked at add-time, never regenerated.

---

### **Section 2: Recipe Generation (Metric-Only for UK)**

**Constraints:**
- Recipe LLM prompt includes: **"You are writing for a UK audience. Only use grams, milliliters, and pieces. Never use cups, ounces, pounds, or imperial measures."**
- All recipe ingredients must include a unit field (never omit)
- All recipe ingredients converted to canonical units before being used for deduction

**Viability gating:**
- Only suggest recipes where user has ALL ingredients in sufficient quantity
- No dead ends — user can cook immediately

**Example:**
```
User inventory: 500g rice, 3 eggs, 240ml milk
Recipe suggestion: "Egg Fried Rice" (300g rice, 2 eggs, 100ml milk)
✓ Viable — user has all ingredients
```

---

### **Section 3: Adjustment Flow (Before Cooking)**

**The conversation loop:**

User sees recipe detail view with adjustment panel: "Want to make any changes?"

**User enters:** "I only have 300g rice, milk's gone off, use cod instead of chicken"

**LLM processes each adjustment:**

1. **Quantity adjustment:** "I only have 300g rice"
   - LLM infers context: "inventory correction or recipe constraint?"
   - System asks (with action-specific buttons):
     - **"Update inventory to 300g"** (correction — inventory was wrong)
     - **"Use 300g in this recipe only"** (constraint — I have 500g but only want to use 300g)
     - **"Update inventory AND use in recipe"** (both — I have exactly 300g and using it all)
   - User chooses → action applied

2. **Removal:** "Milk's gone off"
   - System removes from recipe AND inventory automatically
   - LLM checks: is this critical ingredient? (e.g., chicken in chicken curry)
   - If critical: warn "⚠️ This is a chicken curry but you removed chicken. Proceed?"
   - User confirms or picks different recipe

3. **Substitution:** "Use cod instead of chicken"
   - System asks: "Use cod instead of chicken?"
   - User confirms → recipe updated

**After all adjustments confirmed:**
- Recipe regenerates with adjusted ingredients
- Instructions rewritten for new quantities/ingredients
- User presses "Start cooking"

**Then deduction:**
- Show confirmation screen: what will be deducted
- User confirms → deduct from inventory

---

### **Section 4: Deduction & Confidence Levels**

**Deduction logic:**
- Deduct exact quantities specified in adjusted recipe from inventory
- If partial use (e.g., used 300g of 500g rice):
  - Original item marked as used
  - Remainder created: `{name: "rice", quantity: 200, unit: "g"}`
- Remainder inherits confidence level from original

**Confidence propagation:**
```
exact - exact = exact
  (precise deduction from precise inventory → result is precise)

approximate - exact = approximate
  (precise deduction from estimated inventory → result is estimated)

approximate - approximate = approximate
  (estimated deduction from estimated inventory → result is estimated)
```

**Example:**
```
User added: "500g rice" (exact)
Recipe uses: "300g rice" (exact, from recipe)
Remainder: "200g rice" (exact) — inherits exact from both sources
```

**No date tracking in MVP.** `date_used`, `date_added`, and expiration tracking deferred to phase 1+.

---

## Implementation Notes

### Changed Files
1. **`backend/netlify/functions/api/utils/prompts.ts`**
   - `parseInventoryInput()`: call `cacheCanonicalUnit()` after LLM decides unit
   - `generateRecipeDetail()`: ensure LLM prompt requires units; validate units present in response

2. **`backend/netlify/functions/api/utils/units.ts`**
   - Ensure `convertToCanonical()` never receives null/undefined units from recipe
   - Add validation: if unit missing, return error (don't silently default to quantity)

3. **`backend/netlify/functions/api/cooking.ts`**
   - Adjustment flow: implement three-button choice for quantity adjustments
   - Removal logic: check if critical ingredient, show warning
   - Keep deduction logic as-is (already correct)

4. **Frontend:** 
   - Move adjustment panel into recipe detail view (before "start cooking" button)
   - Implement three-button UI for quantity adjustments
   - Implement removal/substitution confirmation buttons

### Database Changes
- No schema changes needed
- `canonical_units_cache` already exists in `units.ts` (in-memory)
- Could persist to database later, but in-memory is sufficient for MVP

---

## Success Criteria

- [ ] Canonical unit cached when inventory is added
- [ ] Recipe ingredients always include unit (never null/undefined)
- [ ] Cup/imperial conversions work correctly (1 cup rice → 125g)
- [ ] Adjustment panel in recipe detail view, before "start cooking"
- [ ] Quantity adjustment shows three-button choice
- [ ] Removal shows warning for critical ingredients
- [ ] Deduction calculates correct amounts (e.g., 125g not 1g)
- [ ] Remainder items created with correct confidence levels
- [ ] Test: User adds "500g rice" → recipes suggest rice-based dishes → adjust to "300g" → deduct 300g → remainder is 200g ✓

---

## Testing Plan

**Unit test scenarios:**
1. Add "500g rice" → canonical unit "g" is cached
2. Add "1 cup rice" → converts to 125g, canonical unit "g" cached
3. Add "2 bags rice" → LLM estimates 1000g/bag, stores 2000g
4. Recipe with "1 cup rice" → converts to 125g in recipe
5. Adjust "I only have 300g" → three-button choice shown
6. Adjust "milk's gone" → warning shown if milk is critical
7. Deduct 125g from 500g rice → remainder 375g is created

**Integration test:**
- End-to-end: add rice → suggest recipe → adjust quantities → cook → deduct → verify remainder

---

## Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| When to cache canonical unit? | At add-time | Locks in consistency for lifetime of ingredient |
| Can canonical unit change? | No, never | Different measurements over time breaks deduction |
| Should recipe include units? | Always required | Prevents "1" being treated as "1g" |
| Metric only for UK? | Yes | Cups are US-centric; UK uses g/ml |
| When do adjustments happen? | Before "start cooking" | User is engaged, intentional, can preview changes |
| How many adjustment options for quantity? | Three buttons | Covers all scenarios: correct inventory, adjust recipe, or both |
| Track date_used in MVP? | No, defer | Not needed for MVP; phase 1+ for predictions |
| Create remainder items? | Yes, always | Necessary to track current inventory state |

---

## Sign-Off

**Designed by:** Jon Searle + Claude  
**Design reviewed by:** Jon Searle  
**Status:** ✅ Approved for implementation  
**Date approved:** 2026-04-11  

**Next step:** Implementation planning (writing-plans skill)
