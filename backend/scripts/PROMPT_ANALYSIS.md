# Meal Suggestion Prompt Analysis

## Current Prompt (v1)

Located in: `netlify/functions/api/utils/prompts.ts` lines 160-188

### System Prompt Review

```
You are a creative meal suggestion engine. Given a list of available ingredients, suggest 3-5 recipes that can be made.

CRITICAL CONSTRAINT: You can ONLY suggest meals using ONLY these ingredients:
${inventoryList}

Do NOT suggest any meals that require ingredients not in this list.
Do NOT assume the user has salt, oil, butter, spices, water, or any pantry items.
Do NOT add, assume, or suggest any other ingredients.

For each recipe, provide:
1. name: Recipe name
2. description: Menu-style description with health/character notes. Example: "Pan-seared chicken with fresh tomatoes and basil. Light, protein-rich, and naturally fresh."
3. time_estimate_mins: Estimated cooking time in minutes

Return ONLY a JSON object with a "recipes" array, no other text. Example format:
{
  "recipes": [
    {
      "name": "Tomato Basil Salad",
      "description": "Fresh tomatoes and basil. Simple, light, and naturally fresh.",
      "time_estimate_mins": 5
    }
  ]
}

Focus on recipes that:
- Use ingredients from the inventory (prioritize using multiple items)
- Are realistic for a home cook
- Match the meal type (breakfast = quick/light, lunch = balanced, dinner = hearty)
```

### Strengths

1. **Clear JSON format requirement** - "Return ONLY a JSON object with a 'recipes' array, no other text"
   - Helps with parsing reliability
   - Example format provided

2. **Explicit hallucination prevention** - "Do NOT assume the user has salt, oil, butter, spices, water, or any pantry items"
   - Addresses the most common hallucinations
   - Strong language: "CRITICAL CONSTRAINT"

3. **Meal type guidance** - "breakfast = quick/light, lunch = balanced, dinner = hearty"
   - Sets expectations for cooking style
   - Helps with time estimate realism

4. **Multiple ingredient emphasis** - "prioritize using multiple items"
   - Encourages diversity by using more from inventory
   - Reduces repetitive single-ingredient dishes

5. **Realistic constraints** - "Are realistic for a home cook"
   - Prevents overly complex suggestions
   - Grounded in practical cooking

### Potential Weaknesses

1. **Hallucination Prevention Could Be Stronger**
   - Lists common items to avoid (salt, oil, butter, spices, water)
   - But what about milk, cheese, yogurt, soy sauce, vinegar, etc.?
   - Might still hallucinate items that "sound" like they should be available
   - **Severity**: Medium - Testing will reveal if this is a problem

2. **Diversity Not Explicitly Required**
   - "Do NOT repeat the same meal twice" - not mentioned
   - LLM might suggest "Sautéed tomatoes" and "Tomato pasta" as "different"
   - **Severity**: Medium - Could result in similar suggestions

3. **Time Estimates Guidance Is Vague**
   - "quick/light" and "balanced" and "hearty" are subjective
   - "Estimated cooking time in minutes" - but what about prep time?
   - Range not specified: 5-120? 5-30 for breakfast? Unclear
   - **Severity**: Low to Medium - Depends on LLM interpretation

4. **Limited Instructions for Edge Cases**
   - What if inventory has only 2-3 items? Force 3-5 or allow fewer?
   - What if inventory is only pantry staples? Return error or empty array?
   - Currently no guidance on these cases
   - **Severity**: Medium - Needed for robust system

5. **Inventory List Format Might Be Inconsistent**
   - `inventoryList` is formatted as:
     ```
     - chicken breast (3 pieces)
     - tomatoes (2 pieces)
     - basil (available)
     ```
   - This format is clear but LLM might interpret "available" oddly
   - Could say "has basil but no quantity" instead
   - **Severity**: Low - Format seems reasonable

6. **No Guidance on Ingredient Matching Strictness**
   - "Pan-seared" might imply butter/oil even if not listed
   - "Steamed" is safe; "roasted" might imply oil
   - Should LLM avoid cooking methods that imply unlisted ingredients?
   - **Severity**: Low to Medium - Could cause hallucination

## Proposed Improvements

### Improvement 1: Stronger Hallucination Prevention

**Current**:
```
Do NOT assume the user has salt, oil, butter, spices, water, or any pantry items.
```

**Proposed**:
```
CRITICAL: Every single ingredient mentioned in your recipes MUST come from this list.
Do NOT mention, assume, or imply the use of:
- Oils, butter, or fats of any kind
- Salt, pepper, or spices
- Water (unless rice/pasta cooking is explicit in inventory as a cooking method)
- Condiments like soy sauce, vinegar, or mayonnaise (unless specifically listed)
- Dairy like milk, cream, or cheese (unless specifically listed)
- Aromatics like garlic or onion (unless specifically listed)

Before suggesting a recipe, verify EVERY ingredient against the inventory list.
```

**Rationale**: More explicit list of common hallucinations + verification instruction

---

### Improvement 2: Explicit Diversity Requirement

**Current**:
```
Focus on recipes that:
- Use ingredients from the inventory (prioritize using multiple items)
```

**Proposed**:
```
DIVERSITY REQUIREMENT: Each recipe must be DISTINCT.
- No two recipes can be variations of the same base dish
- Use different cooking methods: sautéing, baking, raw, grilling, steaming, etc.
- Combine different subsets of ingredients for each recipe
- If suggesting multiple items, vary which items are primary vs. supporting
```

**Rationale**: Prevents "tomato salad" and "tomato pasta" from counting as 2 different recipes

---

### Improvement 3: Time Estimate Guidance

**Current**:
```
Match the meal type (breakfast = quick/light, lunch = balanced, dinner = hearty)
```

**Proposed**:
```
Time estimates should match meal type:
- Breakfast: 5-25 minutes (quick morning meals)
- Lunch: 15-40 minutes (reasonable midday meal)
- Dinner: 20-60 minutes (can be more elaborate, but still practical home cooking)

Include only cooking time, not prep time beyond basic chopping.
```

**Rationale**: Specific time ranges help LLM calibrate estimates

---

### Improvement 4: Edge Case Guidance

**Current**:
```
Suggest 3-5 recipes that can be made.
```

**Proposed**:
```
Return 3-5 recipes if possible. If inventory has:
- Fewer than 3 suitable combinations: Return 2-3 recipes with explanation
- Only pantry staples (no actual ingredients): Return empty array instead of forcing bad suggestions
- Single protein + single vegetable: Still suggest 3-4 variations with different cooking methods
```

**Rationale**: Handles edge cases gracefully without forcing bad suggestions

---

### Improvement 5: Inventory Matching Example

**Current**:
```
Example format: [...]
```

**Proposed**: Add before the example:
```
INVENTORY MATCHING EXAMPLE:
Given inventory: Chicken (2 pieces), tomatoes (3), basil, pasta
Valid recipes:
✓ "Pasta with Chicken and Tomato" - uses chicken, tomato, pasta, basil
✓ "Tomato Basil Chicken" - uses chicken, tomato, basil
✓ "Simple Pasta" - uses pasta, tomato

INVALID recipes:
✗ "Creamy Tomato Pasta" - requires cream (not in inventory)
✗ "Garlic Chicken" - requires garlic (not in inventory)
```

**Rationale**: Concrete examples help LLM understand constraints

---

## Iteration Strategy

### Phase 1: Test Current Prompt (v1)
Run all 5 test cases with current prompt. Document:
- Hallucinations: Any ingredients not in inventory?
- Diversity: Are suggestions different enough?
- Relevance: Do suggestions use the items?
- Time estimates: Are they realistic?
- Edge cases: How does it handle limited/pantry-only inventory?

### Phase 2: Apply Improvements
If Phase 1 reveals issues:
1. Identify which improvements address the issues
2. Apply improvements to prompt
3. Re-test with the same 5 test cases
4. Compare results

### Phase 3: Final Validation
Once all tests pass:
- Run full test suite with API key
- Document results in LEARNING_LOG.md
- Commit to git

## Current Assessment (Without Running)

Based on prompt review:

**Expected Pass Rate**: 70-80%

**Likely Issues**:
1. ✗ **Hallucination** (40% chance): May suggest oil/garlic/onion even with prevention clause
2. ✓ **Diversity** (High): Prompt emphasis on "multiple items" should help
3. ✓ **Relevance** (High): "Use ingredients from inventory" is clear
4. ✓ **Time Estimates** (Medium-High): Meal type guidance should help
5. ? **Edge Cases** (Unknown): Limited inventory handling unclear

**Recommended Action**: Test now, then iterate if failures reveal patterns.
