# Iteration 1 Build Strategy & Design

**Date:** 2026-04-06
**Status:** Approved
**Timeline:** 14 days
**Strategy:** API-Spike + UI Layer (De-risk LLM early, iterate UX with real backend)

---

## **Executive Summary**

Build Suppa's core loop in 2 weeks by:
1. **Days 1-5:** Build all 4 APIs, test LLM prompts exhaustively
2. **Days 6-8:** Build rough UI, wire to APIs, see full loop working
3. **Days 9-14:** Iterate on UX/prompts based on real usage, polish, reflect

This strategy front-loads LLM risk, gives 5 days to refine UX (designer strength), and captures learning throughout via LEARNING_LOG.md.

---

## **Iteration 1 Scope: Core Loop Only**

**What we're building:**
- Add inventory via natural language input
- Get meal suggestions from inventory
- View full recipe
- Confirm cooking + deduct from inventory

**What we're NOT building (Phase 1+):**
- Voice input, recipe modification, session boundaries, preferences, shopping list, receipt parsing

---

## **Build Timeline: Strategy 3 (14 days)**

### **PHASE 1: API Spike (Days 1-5)**

**Goal:** All 4 core APIs working. LLM prompts iterated and tested.

#### **Day 1-2: Setup**
- [ ] Initialize project (React + Node.js + Netlify Functions)
- [ ] Supabase: Create tables (User, InventoryItem, ChatMessage)
- [ ] API skeleton (Express endpoints)
- [ ] OpenAI API integration
- **Learning checkpoint:** Document data model assumptions in LEARNING_LOG

#### **Day 3: Inventory Parsing API**
- [ ] Build `POST /api/inventory` endpoint
- [ ] LLM prompt: Parse free-form input → extract items, quantities
- [ ] Test on 10+ variations: "3 chicken breasts, tomatoes, basil", "some rice and pasta", etc.
- [ ] Handle edge cases: quantities are optional, units are flexible
- **Learning checkpoint:** "What made inventory parsing work?"

#### **Day 4: Meal Suggestion API**
- [ ] Build `POST /api/chat` endpoint
- [ ] LLM prompt: Take inventory + meal type → generate 3-5 recipes
- [ ] Test on multiple inventory sets (10+ variations)
- [ ] Evaluate: Do suggestions use only available items? Are they diverse?
- [ ] Iterate prompts until suggestions feel natural
- **Learning checkpoint:** "How I evaluate meal suggestion quality"

#### **Day 5: Cooking APIs (Start + Complete)**
- [ ] Build `POST /api/cooking/start` (save recipe to state)
- [ ] Build `POST /api/cooking/complete` (deduct ingredients, update inventory)
- [ ] Test deduction logic: negative inventory handling, accuracy
- [ ] Test LLM recipe generation: can it format recipes clearly?
- **Learning checkpoint:** "Edge cases and failures in LLM behavior"

**Success criteria for Phase 1:**
- [ ] All 4 APIs return valid responses
- [ ] LLM prompts iterated at least 3-5 times each
- [ ] 80%+ accuracy on inventory parsing
- [ ] Meal suggestions use only available items (100% accuracy)
- [ ] Deduction logic is correct

---

### **PHASE 2: UI Layer (Days 6-8)**

**Goal:** Rough but functional UI wired to real APIs. See full loop working.

#### **Day 6-7: Build UI Components**
- [ ] Chat interface (message list + input)
- [ ] Inventory addition form
- [ ] Recipe cards (name, time, key ingredients)
- [ ] Recipe detail view (two tabs: ingredients + instructions)
- [ ] Cooking confirmation flow
- **Design note:** Rough styling is fine. Focus on functionality.
- **Learning checkpoint:** "What surprised me about real latency?"

#### **Day 8: Wire Everything + First Full Loop**
- [ ] Connect UI to all 4 APIs
- [ ] Test end-to-end: add inventory → suggest meals → pick meal → view recipe → cook → deduct
- [ ] Identify clunky UX moments
- [ ] Note where latency affects experience (loading states needed?)
- **Learning checkpoint:** "How the feedback loop feels when you actually use it"

**Success criteria for Phase 2:**
- [ ] Full loop works end-to-end
- [ ] UI is rough but functional
- [ ] You've cooked at least 1 meal suggested by the system
- [ ] Latency surprises captured in LEARNING_LOG

---

### **PHASE 3: UX Iteration & Polish (Days 9-14)**

#### **Days 9-10: Iterate on Real Loop**
- [ ] Test the system yourself for 2 days (multiple inventories, different meals)
- [ ] Refine UI based on friction points
- [ ] Iterate on prompts based on what you discover
- [ ] Fix obvious bugs
- **Learning checkpoint:** "What would I do differently?"

#### **Days 11-12: Add Refinements**
- [ ] Error handling (LLM fails, negative inventory, malformed input)
- [ ] Loading states + feedback ("Updating...", "Thinking...")
- [ ] Session boundaries (1-hour reset logic)
- [ ] Edge case handling (empty inventory, no suggestions, etc.)

#### **Days 13-14: Polish + Reflection**
- [ ] UX polish (now that you understand the flow, make it feel good)
- [ ] Final testing
- [ ] Write Iteration 1 reflection in LEARNING_LOG
- [ ] Plan Phase 1 (receipt parsing, preferences, agents)

**Success criteria for Phase 3:**
- [ ] System feels usable and not frustrating
- [ ] Error states are handled gracefully
- [ ] You'd actually use this app regularly
- [ ] LEARNING_LOG has 8+ substantive entries

---

## **Learning Objectives Integration**

### **How Each Objective Gets Addressed**

| Objective | Timeline | Evidence |
|-----------|----------|----------|
| **Prompt Engineering** | Days 3-5, 9-10 | Prompt iteration log in LEARNING_LOG, API responses |
| **LLM Evaluation** | Days 3-8, ongoing | Spot-check logs, test results, quality assessments |
| **AI-Aware Design** | Days 6-8, 9-14 | UI decisions, loading states, error handling |
| **Data Literacy** | Days 1-5 | Schema design decisions, context window analysis |
| **Strategic Thinking** | Days 6-8, 13-14 | Full loop reflection, feedback mechanism design |
| **Communication** | Throughout | This design doc, LEARNING_LOG, clear commit messages |
| **Agent Design (Phase 1 prep)** | Days 13-14 | Phase 1 planning, refactoring notes |

### **Learning Log Checkpoints**
- Day 3: Inventory parsing insights
- Day 4: Meal suggestion evaluation
- Day 5: LLM edge cases
- Day 7: Latency surprise
- Day 8: Full loop feels
- Day 10: Iteration learnings
- Day 12: Error handling patterns
- Day 14: Final reflection + Phase 1 plan

---

## **Technical Approach**

### **Architecture: Single LLM Model**

All tasks use GPT-4o mini for simplicity:
- Inventory parsing
- Meal suggestions
- Recipe generation
- Cooking Q&A (future)

**Why:** Single model is simpler to reason about. Phase 1 will refactor to multi-agent pattern.

### **Data Model**

```
User
├─ id (UUID, PK)
├─ created_at

InventoryItem
├─ id (UUID, PK)
├─ user_id (FK)
├─ name (string)
├─ quantity_approx (numeric, nullable)
├─ unit (string, nullable)
├─ date_added (timestamp)
└─ date_used (timestamp, nullable)

ChatMessage
├─ id (UUID, PK)
├─ user_id (FK)
├─ message (text)
├─ role ('user' | 'assistant')
└─ timestamp (timestamp)
```

**Note:** No Meal, MealPlan, or RecipeHistory tables (ephemeral in Iteration 1).

### **API Endpoints (4 Core)**

```
POST /api/inventory
  Input: { name, quantity_approx?, unit? }
  Output: { id, name, quantity_approx, unit, date_added }

GET /api/inventory
  Output: [{ id, name, quantity_approx, unit }]

POST /api/chat
  Input: { message, current_recipe_state? }
  Output: { message, type: 'suggestions' | 'answer' }

POST /api/cooking/complete
  Input: { recipe, confirmed: boolean }
  Output: { status, inventory_updated }
```

### **LLM Strategy**

**Single prompt system:** Inventory context + conversation context → LLM decision

```
System: "You are a meal discovery assistant.
User's inventory: [items]
Recent conversation: [last 5 messages]
Task: [generate suggestions | parse inventory | answer question]"
```

**Prompt iteration targets:**
- Meal suggestions should be diverse (not repeating same meals)
- Should use ONLY available inventory (0% false suggestions)
- Should understand approximations ("some", "a bunch", exact numbers)

---

## **UX Flow (Iteration 1)**

### **Main Chat Screen**
- Meal type buttons at top (breakfast/lunch/dinner)
- Chat conversation in center
- Chat input at bottom
- Recipe cards embedded in chat when suggestions appear

### **Recipe Screen**
- Two tabs: Ingredients | Instructions
- Both show quantities clearly
- "I cooked this" + "Cancel" buttons at bottom

### **Inventory Screen**
- List of current items
- Ability to add more via "+ Add Item"

---

## **Success Criteria**

### **Shipping Success**
- [ ] All 4 core APIs working
- [ ] UI is rough but fully functional
- [ ] Full loop works: add inventory → suggest → cook → deduct
- [ ] You've actually used it and cooked 1+ suggested meals

### **Learning Success**
- [ ] LEARNING_LOG has 8+ substantive entries (not just "works" or "done")
- [ ] Each entry captures: what you tried, what surprised you, why it matters
- [ ] Clear evidence of prompt iteration (before/after examples)
- [ ] Clear evidence of LLM evaluation (how you knew something worked)

### **Portfolio Success**
- [ ] Spec clearly documents AI-specific design decisions
- [ ] LEARNING_LOG shows thinking, not just shipping
- [ ] Phase 1 plan demonstrates agent architecture thinking
- [ ] Clear narrative: "Here's what I learned about AI product management"

---

## **Risks & Mitigation**

| Risk | Mitigation |
|------|-----------|
| LLM prompts take longer to iterate | Allocate extra time in Days 3-5; test early |
| Inventory parsing ambiguous | Test on 20+ variations; accept "good enough" |
| UI wiring takes longer than expected | Use shadcn/ui to speed up component building |
| Full loop reveals API gaps | Be ready to refactor APIs days 9-10 |
| Learning documentation falls behind | Schedule 30-min reflection at end of each feature |

---

## **Next Steps After This Doc**

1. ✅ Design approved
2. → Invoke `superpowers:writing-plans` to create detailed implementation plan
3. → Execute plan with `superpowers:executing-plans`
4. → At each learning checkpoint, update LEARNING_LOG.md
5. → End of Phase 1: Review learnings, iterate prompts
6. → End of Iteration 1: Write final reflection, plan Phase 1

---

## **Key Insight**

This strategy prioritizes:
- **De-risking the unknown first** (LLM, Days 1-5)
- **Iteration time where you're strong** (UX, Days 9-14)
- **Learning throughout** (checkpoints, LEARNING_LOG)
- **Portfolio quality** (clear narrative of thinking, not just shipping)

By the end of 2 weeks, you'll have:
- A working product
- Deep understanding of LLM prompts and evaluation
- Evidence of AI product thinking
- Foundation for Phase 1 agent architecture
