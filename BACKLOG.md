# Suppa Product Backlog

**Last Updated:** 2026-04-09
**Total Items:** 22
**By Priority:** 2 Critical | 3 High | 13 Medium | 4 Low

---

## Overview

This backlog captures all known work items for Suppa, prioritized by impact and urgency. Items are organized by priority level, with effort estimates and dependencies clearly marked.

**Status Legend:**
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Done
- ⏸️ Blocked
- 📌 Backlog

---

## 🔴 CRITICAL (Do This Sprint)

### 1. Task 8: Manual Testing & Validation
**Status:** 🔴 Not Started (Ready to execute)
**Effort:** M (Medium, ~2-3 hours)
**Priority:** Critical
**Description:**
Validate the two CRITICAL fixes implemented in Task 8:
- Partial deduction works correctly (remainder items created)
- Insufficient quantity is properly blocked
- Error messages display correctly in frontend
- Database state remains consistent

**What to Do:**
1. Run 6 test scenarios from `docs/TASK_8_TEST_PLAN.md`
2. Execute database audit queries to verify state
3. Test frontend error display and retry logic
4. Document any bugs found

**Success Criteria:**
- All 6 scenarios pass
- No inventory corruption
- Error messages clear and actionable
- Remainder items properly tracked

**Related Files:**
- `docs/TASK_8_TEST_PLAN.md` - Complete test scenarios
- `docs/TASK_8_PROGRESS.md` - Implementation details
- `backend/netlify/functions/api/utils/db.ts` - Deduction logic
- `frontend/src/components/CookingConfirm.tsx` - Error display

---

### 2. Task 9: Polish & Final Iteration
**Status:** 🔴 Not Started (Depends on Task 8)
**Effort:** L (Large, ~4-6 hours)
**Priority:** Critical
**Description:**
Final polish phase after Task 8 testing:
- Fix any bugs discovered during testing
- UX refinements based on real usage
- Performance optimization if needed
- Final documentation review
- Deployment readiness verification

**What to Do:**
1. Process bugs from Task 8 testing
2. Refine UI based on feedback
3. Run performance tests
4. Update deployment docs
5. Final code review

**Success Criteria:**
- All Task 8 bugs fixed
- App ready for production deployment
- Documentation complete and accurate
- Performance acceptable

**Related Files:**
- All implementation files
- `docs/` folder - all documentation

---

## 🟠 HIGH (Do Soon)

### 3. Recipe Filtering by Inventory Availability
**Status:** 🔴 Not Started (Recently identified)
**Effort:** M (Medium, ~2-3 hours)
**Priority:** High
**Depends On:** Task 8 completion
**Description:**
Currently the system shows ALL recipes, then errors if user lacks ingredients. Instead, only show recipes where user has sufficient inventory already.

**Problem Being Solved:**
- User sees recipe: "Tomato Basil Chicken"
- Clicks it, gets to confirmation
- ERROR: "You don't have enough tomatoes"
- User has to add inventory and retry
- Bad UX

**Solution:**
- Meal suggestion endpoint checks inventory before suggesting
- Only returns recipes user can actually cook right now
- Better UX, prevents error states

**What to Do:**
1. Update `/api/chat` endpoint to filter by ingredient availability
2. Modify meal suggestion prompt to only suggest feasible recipes
3. Add inventory check logic before returning suggestions
4. Test that filtering works correctly

**Success Criteria:**
- User never sees recipe they can't cook
- Filtering is transparent (user doesn't know it happened)
- Suggestions still diverse and high quality
- No performance degradation

**Related Files:**
- `backend/netlify/functions/api/chat.ts` - Meal suggestions
- `backend/netlify/functions/api/utils/prompts.ts` - Prompt engineering
- `backend/netlify/functions/api/utils/db.ts` - Inventory checks

---

### 4. Hallucination Prevention Testing
**Status:** 🔴 Not Started (Identified in Task 7)
**Effort:** M (Medium, ~2-3 hours)
**Priority:** High
**Description:**
Test and verify that the LLM never suggests ingredients not in user's inventory.

**Problem Being Solved:**
- LLM might suggest recipes using ingredients user doesn't have
- Currently relies on validation to catch this
- Need to test this edge case thoroughly

**What to Do:**
1. Create test scenarios with unusual ingredients
2. Verify LLM doesn't hallucinate unavailable items
3. Test canonical name matching (potato vs potatoes)
4. Document any failures found
5. Add guards if needed

**Success Criteria:**
- LLM never suggests unavailable ingredients
- Canonical name matching works
- Edge cases handled gracefully

**Related Files:**
- `backend/netlify/functions/api/utils/prompts.ts` - Recipe generation
- `docs/TASK_8_TEST_PLAN.md` - Test methodology

---

### 5. Boolean Item Deduction Testing
**Status:** 🔴 Not Started (Known edge case)
**Effort:** S (Small, ~1 hour)
**Priority:** High
**Depends On:** Task 8 testing
**Description:**
Verify that boolean items (salt, spices, oils) are handled correctly during deduction - they should deduct regardless of quantity since they're just "yes/no" items.

**What to Do:**
1. Add inventory: Salt with `has_item=true`
2. Cook recipe that needs "pinch of salt"
3. Verify deduction succeeds
4. Verify salt marked as used
5. No quantity validation needed

**Success Criteria:**
- Boolean items deduct without quantity check
- Edge cases handled (user has salt, recipe asks for "pinch")
- No errors or unexpected behavior

**Related Files:**
- `docs/TASK_8_TEST_PLAN.md` - Test scenario 4
- `backend/netlify/functions/api/utils/db.ts` - Deduction logic

---

## 🟡 MEDIUM (Backlog - Do in Phase 1)

### 6. Plural/Singular Ingredient Matching
**Status:** 🔴 Not Started
**Effort:** M (Medium, ~2-3 hours)
**Priority:** Medium
**Description:**
Handle variations like "tomato" vs "tomatoes", "chicken breast" vs "chicken breasts" in ingredient matching.

**Current Approach:**
Uses canonical names (potato → potato, chicken → chicken) but doesn't handle plurals.

**Better Approach:**
Normalize plurals so "tomatoes", "tomato", "TOMATO" all map to "tomato".

**What to Do:**
1. Create plural normalization utility
2. Update canonical name mapping
3. Test common plurals (tomato/tomatoes, carrot/carrots, etc.)
4. Handle exceptions (data/data, lettuce/lettuce)

**Success Criteria:**
- Plural variations recognized as same ingredient
- No false positives
- Performance acceptable

**Related Files:**
- `backend/netlify/functions/api/utils/canonical-foods.ts` - Food mapping
- `backend/netlify/functions/api/utils/db.ts` - Matching logic

---

### 7. Unit Conversion Support
**Status:** 🔴 Not Started
**Effort:** L (Large, ~4-6 hours)
**Priority:** Medium
**Description:**
Support recipes that need quantities in different units than user provided.

**Examples:**
- User has: "1 cup flour"
- Recipe needs: "500g flour"
- Should work: Need conversion logic

**Current Approach:**
Blocks deduction if units don't match (safe but limiting).

**Better Approach:**
Convert between common units (cups ↔ grams, ounces ↔ grams, etc.).

**What to Do:**
1. Create unit conversion table
2. Implement conversion logic (cups to grams, etc.)
3. Handle unit ambiguity (cup of what?)
4. Test common conversions
5. Add tolerance for approximate conversions

**Complexity Notes:**
- Different ingredients have different densities (1 cup flour ≠ 1 cup sugar by weight)
- Approximate quantities complicate this
- May require AI to infer ingredient and density

**Success Criteria:**
- Common unit conversions work
- Handles ambiguity gracefully
- Falls back to blocking if unsure

**Related Files:**
- `backend/netlify/functions/api/utils/db.ts` - Deduction validation
- `backend/netlify/functions/api/utils/canonical-foods.ts` - Conversions

---

### 8. Session Persistence (Cooking Sessions)
**Status:** 🔴 Not Started
**Effort:** M (Medium, ~2-3 hours)
**Priority:** Medium
**Description:**
Currently cooking sessions are stored in memory (`cookingSessions` object). If server restarts, session is lost.

**Problem:**
- User cooking a recipe
- Server restarts or crashes
- Session lost, user has to start over

**Solution:**
- Persist cooking_sessions to database
- Retrieve session if server restarts
- Clean up old sessions

**What to Do:**
1. Create `cooking_sessions` table in database
2. Update `startCooking()` to save to DB
3. Update `completeCooking()` to fetch from DB
4. Add cleanup for old sessions (>24 hours)
5. Test session persistence across restarts

**Success Criteria:**
- Sessions survive server restarts
- Old sessions cleaned up automatically
- Performance acceptable
- No data loss

**Related Files:**
- `backend/netlify/functions/api/cooking.ts` - Cooking endpoints
- `backend/netlify/functions/api/utils/db.ts` - Database logic
- `docs/DATABASE.md` - Schema

---

### 9. Error Message Localization
**Status:** 🔴 Not Started
**Effort:** M (Medium, ~2-3 hours)
**Priority:** Medium
**Description:**
Currently all error messages are in English. For future international support, add i18n infrastructure.

**What to Do:**
1. Create error message constants file
2. Extract all hardcoded messages
3. Set up i18n structure (for future translations)
4. Replace hardcoded strings with references
5. Test with multiple languages (optional for MVP)

**Success Criteria:**
- All messages in one place
- Easy to add new languages later
- No hardcoded strings in code

**Related Files:**
- Backend error handling files
- Frontend component files

---

### 10. Input Validation Enhancements
**Status:** 🔴 Not Started
**Effort:** S (Small, ~1-2 hours)
**Priority:** Medium
**Description:**
Add more robust validation for edge cases:
- Empty inventory when requesting recipe
- Very large quantities (1000kg flour)
- Special characters in item names
- Whitespace handling

**What to Do:**
1. Add input sanitization
2. Add quantity bounds checking
3. Add length limits on strings
4. Test edge cases
5. Document constraints

**Success Criteria:**
- App handles edge cases gracefully
- No crashes from unexpected input
- Clear error messages for invalid input

**Related Files:**
- `backend/netlify/functions/api/inventory.ts` - Input validation

---

### 11. Performance Optimization
**Status:** 🔴 Not Started
**Effort:** M (Medium, ~2-3 hours)
**Priority:** Medium
**Depends On:** Task 8 testing
**Description:**
After testing, identify performance bottlenecks and optimize:
- Database queries (add indexes, batch operations)
- API response times
- Frontend rendering

**What to Do:**
1. Profile API endpoints (measure response time)
2. Identify slow queries
3. Optimize database indexes
4. Consider caching frequently used data
5. Test with larger datasets

**Success Criteria:**
- API responses <200ms
- No N+1 query problems
- Database queries efficient
- Frontend renders quickly

**Related Files:**
- All API endpoint files
- Database schema files

---

### 12. Voice Input for Inventory
**Status:** 🔴 Not Started
**Effort:** M (Medium, ~2-3 hours)
**Priority:** Medium
**Description:**
Allow users to add inventory via voice instead of text. Users can speak naturally while walking around kitchen: "flour, a pack of pasta, three tomatoes, some milk, half a lemon..."

**Current State:** Text input only (MVP)

**What to Do:**
1. Add voice recording button to inventory form
2. Transcribe speech to text (use browser Speech API or external service)
3. Parse transcribed text same way as text input
4. Show parsed items for confirmation

**Success Criteria:**
- Voice input works on mobile
- Transcription accurate for common food names
- Falls back to text input if voice unavailable
- User can correct transcribed text

**Related Files:**
- `frontend/src/components/InventoryForm.tsx`

---

### 13. Recipe Adjustments: General Comments
**Status:** 🔴 Not Started
**Effort:** M (Medium, ~2-3 hours)
**Priority:** Medium
**Description:**
Allow users to make general comments about recipes during cooking, separate from ingredient/quantity adjustments. Example: "I think this could use more garlic" or "I'd prefer this less spicy."

**Current State:** Only quantity/removal/substitution parsing (MVP)

**What to Do:**
1. Extend recipe adjustment conversation to capture preferences
2. Have LLM understand and incorporate comments
3. Regenerate recipe instructions with preferences applied
4. Test with various comment types

**Success Criteria:**
- Preferences captured and applied
- Recipe regenerated appropriately
- Instructions reflect user's adjustments
- UX remains simple (still just one text field)

**Related Files:**
- `backend/netlify/functions/api/cooking.ts`
- `backend/netlify/functions/api/utils/prompts.ts`

---

### 14. Recipe Adjustments: Creative Additions
**Status:** 🔴 Not Started
**Effort:** M (Medium, ~2-3 hours)
**Priority:** Medium
**Description:**
Allow users to suggest adding new ingredients to recipes creatively. Example: "Can I add some apple to this? I love apple in savory dishes."

**Current State:** Only inventory matching and substitutions (MVP)

**What to Do:**
1. Parse ingredient addition suggestions in adjustment conversation
2. Check if ingredient exists in inventory
3. If not in inventory, offer to add it + ask user to confirm quantity
4. Regenerate recipe instructions with new ingredient
5. Have LLM provide feedback on the addition

**Success Criteria:**
- Users can suggest additions
- System validates ingredient availability
- Recipes updated with new ingredients
- Instructions regenerated appropriately
- LLM feedback helpful and encouraging

**Related Files:**
- `backend/netlify/functions/api/cooking.ts`
- `backend/netlify/functions/api/utils/prompts.ts`
- `backend/netlify/functions/api/inventory.ts`

---

### 15. Inventory Confidence: Move Approximate → Exact
**Status:** 🔴 Not Started
**Effort:** M (Medium, ~2-3 hours)
**Priority:** Medium
**Description:**
Improve inventory confidence over time by asking users to confirm or refine approximate quantities. This helps build predictive models for when items will run out.

**Current State:** Confidence tracked but not actively improved

**What to Do:**
1. Create "confidence improvement" flow
2. When suggesting recipes with approximate ingredients, ask: "You said 'some flour' — do you think you have at least 500g?"
3. User confirms exact or provides new estimate
4. Update confidence level based on response
5. Over time, build pattern of exact quantities

**Success Criteria:**
- Users can improve confidence
- Data becomes more exact over time
- Predictions improve as confidence improves
- Doesn't interrupt user flow (ask at moments of engagement)

**Related Files:**
- `backend/netlify/functions/api/chat.ts`
- `frontend/src/components/Chat.tsx`

---

### 16. Track Best-Before Dates & Expiration Alerts
**Status:** 🔴 Not Started
**Effort:** M (Medium, ~2-3 hours)
**Priority:** Medium
**Description:**
Track best-before/expiration dates on inventory items and suggest recipes with ingredients expiring soon. Helps users cook things before they go off and reduces food waste.

**Current State:** `date_added` tracked but not best-before dates

**What to Do:**
1. Add `best_before_date` field to inventory items
2. When user adds inventory, prompt for best-before if known
3. When suggesting recipes, prioritize recipes using soon-to-expire items
4. Show "Use soon" badge on expiring items
5. Suggest recipes: "Use your yogurt before it expires on 2026-04-15"

**Success Criteria:**
- Best-before dates stored
- Expiring soon items highlighted
- Recipe suggestions consider expiration
- Users see alerts for items about to go bad
- Reduces food waste

**Related Files:**
- `backend/netlify/functions/shared/types.ts` - Add field
- `backend/netlify/functions/api/chat.ts` - Prioritize in suggestions
- `frontend/src/components/InventoryForm.tsx` - Input for date

---

### 17. Cooking State Flexibility & Error Recovery
**Status:** 🔴 Not Started
**Effort:** L (Large, ~4-6 hours)
**Priority:** Medium
**Description:**
Handle the blurry line between prep and cooking states. Users may start cooking, realize they made a mistake, need to pause, or adapt mid-recipe. Currently assumes linear flow: review → cook → deduct.

**Examples of edge cases:**
- User burns something mid-recipe, needs to skip ingredient
- User forgets to add ingredient partway through
- User pauses cooking, comes back later
- User realizes they don't have something when already cooking
- User wants to partially deduct (used 1 egg, not 2)

**Current State:** Linear flow only (MVP)

**What to Do:**
1. Allow pausing cooking state
2. Allow mid-recipe adjustments without restarting
3. Allow partial deductions with explanations
4. Track "cooking state" with timestamps
5. Let users recover from mistakes without loss
6. Consider: should canceled recipes NOT deduct?

**Success Criteria:**
- Users can adapt mid-cooking without friction
- State persists across app closures
- Mistakes can be recovered from
- Deductions reflect actual usage (not all-or-nothing)

**Related Files:**
- `backend/netlify/functions/api/cooking.ts`
- `backend/netlify/functions/shared/types.ts` - Extend CookingState

---

### 18. Predictive Restocking Alerts
**Status:** 🔴 Not Started
**Effort:** M (Medium, ~2-3 hours)
**Priority:** Medium
**Description:**
Track inventory consumption patterns and predict when items will run out. Alert users to restock before they actually need to.

**Example:**
- User bought 300g flour on 2026-01-15
- Cooked recipes using: 100g, 80g, 60g flour (3 uses)
- Current: ~60g remaining
- Average: ~80g per use
- Prediction: Will run out in ~1 week
- Alert: "Add flour to shopping list (needed by 2026-04-16)"

**Current State:** Data is tracked but not analyzed (MVP)

**What to Do:**
1. Build usage pattern analysis (after 2-3 deductions)
2. Calculate average consumption per use
3. Estimate depletion date
4. Show predictions in inventory view
5. Send restocking alerts/suggestions
6. Consider confidence (approximate vs exact affects predictions)

**Success Criteria:**
- Predictions are reasonably accurate
- Users see alerts before they run out
- Reduces need to check inventory manually
- Helps with meal planning ("I need to buy flour soon")

**Related Files:**
- `backend/netlify/functions/api/utils/db.ts` - Tracking
- `backend/netlify/functions/api/inventory.ts` - Predictions
- `frontend/src/components/InventoryForm.tsx` - Display alerts

---

## 🟢 LOW (Backlog - Nice to Have)

### 12. Cooking History Tracking
**Status:** 🔴 Not Started
**Effort:** M (Medium, ~2-3 hours)
**Priority:** Low
**Description:**
Track what the user has cooked to show history and usage patterns.

**What to Do:**
1. Create `cooking_history` table
2. Log completed cooking sessions
3. Show history in UI
4. Analytics on cooking patterns

**Success Criteria:**
- History persists
- Can view past meals
- Useful for repeat cooking

---

### 13. Favorite Recipes
**Status:** 🔴 Not Started
**Effort:** S (Small, ~1 hour)
**Priority:** Low
**Description:**
Let users favorite recipes for quick access.

**What to Do:**
1. Add `is_favorite` flag to recipes
2. Store favorite list in database
3. Show favorites in separate tab

**Success Criteria:**
- Can favorite/unfavorite recipes
- Favorites persist
- Easy to find favorites

---

### 14. Recipe Ratings
**Status:** 🔴 Not Started
**Effort:** S (Small, ~1 hour)
**Priority:** Low
**Description:**
Let users rate recipes to improve recommendations.

**What to Do:**
1. Add rating system (1-5 stars)
2. Store ratings in database
3. Consider ratings in suggestions

**Success Criteria:**
- Can rate recipes
- Ratings persist
- Ratings influence suggestions (optional)

---

### 15. Meal Planning (Future Phase)
**Status:** 🔴 Not Started
**Effort:** XL (Extra Large, Future project)
**Priority:** Low
**Description:**
Plan meals for the week based on available inventory.

**Scope:** Too large for MVP, consider for Phase 2+

---

## 📊 Summary by Status

| Status | Count | Items |
|--------|-------|-------|
| 🔴 Not Started | 22 | All items |
| 🟡 In Progress | 0 | — |
| 🟢 Done | 0 | — |
| ⏸️ Blocked | 0 | — |

---

## 📈 Effort Distribution

| Effort | Count | Items |
|--------|-------|-------|
| XS | 0 | — |
| S | 3 | #5, #19, #20 |
| M | 16 | #1, #3, #4, #6, #12, #13, #14, #15, #16, #8, #9, #10, #11, #18, and others |
| L | 2 | #2, #17 |
| XL | 1 | #21 |

**Total Estimated Effort:** ~50-60 hours

---

## 🗺️ Roadmap

### Phase 0 (Current - MVP)
- ✅ Task 8: Error Handling & Refinements (75% complete)
- ⏳ Task 9: Polish & Final Iteration
- ⏳ Manual Testing & Validation

### Phase 1 (Production Ready + Near-term Enhancements)
- #3: Recipe filtering by inventory
- #4: Hallucination prevention testing
- #5: Boolean item testing
- #6: Plural/singular matching
- #8: Session persistence
- #11: Performance optimization
- #12: Voice input for inventory
- #15: Inventory confidence improvement
- #16: Best-before dates & expiration alerts

### Phase 2 (Feature Enhancements & Creativity)
- #7: Unit conversion (see also: UNIT_NORMALIZATION_SYSTEM.md)
- #9: Error localization
- #13: Recipe adjustments - general comments
- #14: Recipe adjustments - creative additions
- #18: Cooking history
- #19: Favorite recipes
- #20: Recipe ratings
- #17: Cooking state flexibility & error recovery (might be earlier)

### Phase 3+ (Long-term)
- #21: Meal planning

---

## 🔄 How to Use This Backlog

### Adding New Items
1. Add to appropriate priority section
2. Use template:
   ```
   ### N. [Title]
   **Status:** 🔴 Not Started
   **Effort:** [XS/S/M/L/XL]
   **Priority:** [Critical/High/Medium/Low]
   **Description:** [Clear description]
   **What to Do:** [Numbered steps]
   **Success Criteria:** [Measurable outcomes]
   ```
3. Update the summary numbers at top

### Moving Items
- Change Status emoji as you progress
- Update Last Updated date
- Move to done when complete

### Prioritizing
- Keep CRITICAL and HIGH at top
- Only 2-3 CRITICAL items at a time
- Move to MEDIUM when ready to defer
- LOW items are future phases

---

## 🎓 PM Learning Value

This backlog demonstrates:
- ✅ Prioritization based on impact & urgency
- ✅ Clear acceptance criteria (how to know when done)
- ✅ Effort estimation for planning
- ✅ Dependency tracking
- ✅ Roadmap planning across phases
- ✅ Risk identification (hallucination, unit conversion complexity)

**Great for your PM portfolio!**

---

**Last Updated:** 2026-04-09 by Claude (added items from unit normalization & inventory tracking design)
**Next Review:** After design approval and implementation planning
