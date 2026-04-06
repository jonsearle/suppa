# Manual Testing Guide for Meal Suggestion API

This guide explains how to manually test the meal suggestion functionality with real OpenAI API calls.

## Prerequisites

1. Obtain an OpenAI API key from https://platform.openai.com/api-keys
2. Set it in the environment:

```bash
export OPENAI_API_KEY="sk-..."
```

## Running Tests

### Option 1: Jest Test Suite (Recommended)

Run the meal suggestion tests with API key set:

```bash
export OPENAI_API_KEY="sk-..." && npm test -- chat.test.ts
```

This will run 5 test suites:
1. **Italian Dinner Suggestions** - Tests with chicken, tomatoes, basil, pasta
2. **Breakfast Suggestions** - Tests with eggs, bread, butter
3. **Asian Lunch Suggestions** - Tests with rice, soy sauce, chicken, garlic, vegetables
4. **Limited Inventory** - Tests with just eggs and bread
5. **Pantry Staples Only** - Tests handling of insufficient ingredients

### Option 2: Comprehensive Script (For Detailed Analysis)

Run the comprehensive test script:

```bash
export OPENAI_API_KEY="sk-..." && npx ts-node scripts/test-suggestions-comprehensive.ts
```

This script tests 5 diverse inventory sets and validates:
- Returns 3-5 suggestions per test case
- Suggestions are diverse (no duplicates)
- No hallucinated ingredients (only uses provided items)
- Descriptions are informative and menu-like
- Time estimates are reasonable and realistic

## Test Cases

### Test 1: Italian Dinner (Diverse Ingredients)
- **Inventory**: Chicken breast (2), tomatoes (3), basil, pasta (500g)
- **Meal Type**: Dinner
- **Expected**: 3-5 pasta/chicken-based Italian dishes
- **Pass Criteria**:
  - All suggestions mention at least one inventory item
  - Time estimates: 15-45 mins (dinner cooking time)
  - No suggestions of olive oil, garlic, or onions (not in inventory)

### Test 2: Breakfast (Limited Ingredients)
- **Inventory**: Eggs (6), bread (1 loaf), butter
- **Meal Type**: Breakfast
- **Expected**: 3-4 quick breakfast dishes
- **Pass Criteria**:
  - All suggestions mention eggs or bread
  - Time estimates: under 30 mins (quick breakfast)
  - Suggestions like: scrambled eggs, French toast, fried eggs on toast

### Test 3: Asian Lunch (Variety)
- **Inventory**: Rice (500g), soy sauce, chicken (300g), garlic, broccoli (200g), carrots (2)
- **Meal Type**: Lunch
- **Expected**: 3-4 Asian-style lunch dishes
- **Pass Criteria**:
  - Mentions rice and chicken prominently
  - Asian cooking styles mentioned (stir-fry, rice bowl, etc.)
  - Time estimates: 15-40 mins (lunch cooking time)

### Test 4: Limited Inventory (Edge Case)
- **Inventory**: Eggs (4), bread (1 loaf)
- **Meal Type**: Breakfast
- **Expected**: 2-3 valid suggestions
- **Pass Criteria**:
  - Should still generate meaningful suggestions
  - Realistic with just eggs and bread
  - No hallucinated ingredients

### Test 5: Pantry Staples Only (Edge Case)
- **Inventory**: Salt, oil, pepper only
- **Meal Type**: Lunch
- **Expected**: Either empty/error or very basic dishes
- **Pass Criteria**:
  - Should either return empty or explain limitation
  - If suggestions given, must acknowledge that only seasoning available

## Evaluation Criteria

For each test, evaluate:

1. **Relevance**: Do suggestions use primarily the provided ingredients?
   - Look for mentions of inventory items in names/descriptions
   - Check if all suggestions are feasible with given ingredients

2. **Diversity**: Are suggestions different from each other?
   - No exact duplicates
   - Different cooking methods/styles
   - Varied dish types

3. **No Hallucination**: Are there unexpected ingredients mentioned?
   - Common hallucinations: olive oil, salt, pepper, garlic, onion, butter, cream
   - If these appear in descriptions but aren't in inventory, flag it
   - Check ingredient lists mention only available items

4. **Description Quality**: Are descriptions menu-like and informative?
   - Should describe taste/character: "light", "hearty", "fresh", etc.
   - Should hint at cooking method: "pan-seared", "stir-fried", etc.
   - Minimum 10 words per description
   - Professional tone

5. **Time Reasonableness**: Are estimates realistic?
   - Breakfast: 5-30 mins (quick)
   - Lunch: 15-40 mins (balanced)
   - Dinner: 20-60 mins (more elaborate)
   - No estimates over 120 mins
   - No estimates under 2 mins

## Common Issues & How to Fix

### Issue 1: Hallucinated Ingredients
**Symptom**: Suggestions mention ingredients not in inventory (e.g., "olive oil" when only "oil" listed)

**Fix in Prompt**: Add explicit constraint:
```
CRITICAL: You can ONLY suggest meals using ONLY these ingredients:
${inventoryList}

Do NOT suggest any meals that require ingredients not in this list.
Do NOT assume the user has salt, oil, butter, spices, water, or any pantry items.
```

**Current Status**: Prompt already includes this. If failing, may need to strengthen with examples.

### Issue 2: Generic Repetitive Suggestions
**Symptom**: Multiple suggestions are essentially the same dish with minor variations

**Fix in Prompt**: Add diversity requirement:
```
Each recipe must be DISTINCT and use different cooking techniques or ingredient combinations.
Do not suggest variations of the same base recipe.
```

### Issue 3: Wrong Meal Type Suggestions
**Symptom**: Breakfast suggestions take 45+ minutes; dinner suggestions are too light

**Fix in Prompt**: Add meal type guidance:
```
Focus on recipes that:
- Use ingredients from the inventory
- Match the meal type:
  - breakfast = quick and light (under 20 mins)
  - lunch = balanced and filling (15-40 mins)
  - dinner = hearty and satisfying (20-60 mins)
```

### Issue 4: Too Few Suggestions
**Symptom**: Only 1-2 suggestions returned instead of 3-5

**Fix in Prompt**: Be explicit:
```
Return ONLY a JSON object with a "recipes" array containing 3-4 recipes.
```

### Issue 5: Not Following JSON Format
**Symptom**: Response contains text outside JSON, parsing fails

**Fix**: Ensure system prompt says:
```
Return ONLY a JSON object with a "recipes" array, no other text.
```

## Next Steps After Testing

1. **Document Results**: Record which test cases pass/fail
2. **Identify Patterns**: Do failures cluster around specific inventory types?
3. **Iterate Prompts**: If issues found, update the systemPrompt in `prompts.ts`
4. **Re-test**: After each prompt change, re-run full test suite
5. **Update LEARNING_LOG.md**: Document findings and iterations
6. **Commit Changes**: When all tests pass, commit to git

## Files Involved

- `netlify/functions/api/utils/prompts.ts` - Main implementation with `suggestMeals()` function
- `tests/chat.test.ts` - Jest test suite (skipped without API key)
- `scripts/test-suggestions-comprehensive.ts` - Manual comprehensive test script
- `.env.local` - Must contain `OPENAI_API_KEY=sk-...`

## Cost Estimate

Each test makes 1-2 API calls to GPT-4o mini:
- ~50 tokens input per call
- ~400 tokens output per call (5 recipes with descriptions)
- Cost: ~$0.0002 per call (GPT-4o mini is very cheap)
- Full test suite: ~5 tests × ~$0.0002 = ~$0.001 per run
