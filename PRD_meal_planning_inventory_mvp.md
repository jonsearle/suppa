# **PRD — Meal Discovery & Inventory System**

## **Iteration 1: Core Concept (MVP)**

Build the **absolute minimum to test:** *Can a conversational system help users discover different meals from their available inventory?*

Success = User discovers and cooks meals they wouldn't have thought of, using only what they have.

---

## **1. Summary (Iteration 1 Purpose)**

A **conversational meal discovery system** that:

* Lets users add inventory via natural language (chat/voice)
* Suggests relevant meals based on what's available
* Confirms when a meal is cooked (updates inventory)
* Maintains full conversation history within 1-hour sessions

**Core loop:** Chat → Suggest meals → Pick one → Refine it → Cook → Deduct ingredients → Repeat

**NOT included in Iteration 1:** Shopping list, receipts, prices, waste tracking, preferences, favorites, meal planning/scheduling

---

## **2. Problem Statement**

Users want **more meal variety with less mental effort**, but:

* It's easier to repeat familiar meals than think of alternatives
* Remembering what's in the cupboard is friction
* Finding a recipe that uses what you have takes effort

**Core insight:** If an LLM can see your inventory, it can suggest relevant meals in seconds. This reduces friction and enables discovery.

---

## **3. Goals (Iteration 1)**

### Primary goal:
* **Test core premise:** Can chat-based meal discovery from inventory actually work and drive behavior change?

### Secondary goals:
* Validate that users find the interaction intuitive
* Gather data on which meals users actually cook
* Learn what users want next (will inform Phase 1 roadmap)

### Non-goals (Iteration 1):
* Shopping lists, price tracking, budget awareness
* Preference learning or favorites
* Meal planning/scheduling (future phases)
* Recipe database or complex cooking instructions

---

## **4. Target User (Iteration 1)**

### Primary:
* Jon (single user testing the core hypothesis)
* People who cook regularly (3-7 times per week)
* Frustrated by meal repetition and lack of inspiration

**Note:** Iteration 1 is single-user only. Multi-user/household coordination comes in Phase 1.

### Key behaviors:
* Repeat familiar meals because it's easier to decide
* Want meal variety but don't have energy to browse recipes
* Cook fresh meals (not heavy pre-made users)
* Want low-friction UX

---

## **5. Core User Loop (Iteration 1)**

1. **Add inventory** — User says/types: "I've got chicken, tomatoes, basil, rice"
2. **Chat: Suggest meals** — User asks: "What can I make for dinner?"
3. **Get suggestions** — System shows 3-5 recipe cards (name, time, key ingredients)
4. **Refine** — User: "Something spicier?" or "I don't have basil"
5. **Regenerate** — System adapts suggestions
6. **Choose recipe** — User taps "Let's cook this" on a recipe
7. **View recipe** — Full-screen ingredients + step-by-step instructions (with quantities)
8. **Adapt if needed** — User: "I'll use parsley instead" → LLM updates recipe
9. **Cook** — User follows recipe
10. **Confirm cooking** — User taps "I cooked this" → system deducts ingredients from inventory
11. **Repeat** — Next meal: inventory is fresher, new suggestions are more relevant

---

## **6. Core Features (Iteration 1)**

### **6.1 Inventory Addition via Chat/Voice**

**What it does:**
User can add inventory by typing or speaking natural language. System parses it into structured items.

**User interaction:**
- User taps "+ Add Item" button
- User speaks/types: "I've got 3 chicken breasts, tomatoes, a bunch of basil, rice"
- System: Shows parsed list: "Chicken (qty: 3), Tomatoes, Basil (bunch), Rice"
- User: Confirms, edits, or adds more items
- System: Saves to inventory

**Key details:**
* Approximate quantities are fine ("some", "3", "a bunch")
* No units required (system can infer)
* User can add items at any time via "+ Add Item" button
* Voice input supported (speech-to-text)

**What it does NOT do (Iteration 1):**
* No price tracking
* No category tagging
* No expiry dates
* No quantity depletion tracking until meals are cooked

---

### **6.2 Chat-Based Meal Suggestions**

**What it does:**
User asks "What should I cook?" and LLM suggests relevant meals based on available inventory.

**User interaction:**
- User taps meal type button: "Suggest dinner ideas"
- System: Shows 3-5 recipe cards (name, time estimate, key ingredients)
- User: Taps a card to see full details (all ingredients + brief method)
- User: Can refine in chat: "Something spicier?", "What else uses chicken?"
- System: Regenerates suggestions based on refinement
- User: Taps "Let's cook this" to commit to a recipe

**Key details:**
* Meal type buttons (breakfast, lunch, dinner) change based on time of day
* Recipe cards show summary; tap to expand
* Full recipe shows ingredients with quantities
* User can refine via natural conversation in chat
* LLM ensures suggestions use ONLY available items

**What it does NOT do (Iteration 1):**
* No cost estimates
* No shopping list integration
* No preference learning (Phase 1+)
* No recipe persistence (recipes generated fresh each time)

---

### **6.3 Recipe Display & Cooking**

**What it does:**
User sees full recipe with ingredients and step-by-step instructions, formatted for cooking.

**User interaction:**
- User taps "Let's cook this" on a recipe card
- Full-screen recipe opens with two tabs:
  - **Ingredients tab:** Complete list with quantities (e.g., "3 tomatoes", "200g chicken")
  - **Instructions tab:** Step-by-step instructions with quantities embedded in steps
- User toggles between tabs while cooking
- User can return to chat to ask questions or modify the recipe
- When done cooking, user taps "I cooked this" to confirm
- System prompts for confirmation of what will be deducted from inventory

**Key details:**
* Quantities appear in BOTH ingredients list AND instructions (not just one)
* Full recipe visible (scrollable if long)
* User can return to chat mid-cooking without losing recipe state
* Recipe state persists until explicitly cooked or cancelled

**What it does NOT do (Iteration 1):**
* No photos or videos
* No timer/alerts
* No progress tracking
* No notes or annotations

---

### **6.4 Recipe Modification Mid-Cooking**

**What it does:**
User can modify recipe while cooking if they don't have an ingredient or want to adapt it.

**User interaction:**
- User is cooking, goes back to chat, types: "I don't have basil, can I use parsley?"
- System: Understands this is a modification request (not a new suggestion)
- LLM: Regenerates recipe with parsley instead of basil
- Recipe screen: Updates with modified recipe
- User: Continues cooking with updated instructions

**Key details:**
* LLM gets full context: which recipe is being cooked + user's modification request
* Only instructions that are affected by the change get updated
* User sees "Updating..." state while LLM regenerates
* User can continue with modified recipe or cancel

**What it does NOT do (Iteration 1):**
* No tracking of which modifications users make (not recorded)
* No optimization ("add more basil to compensate")
* No learning from modifications

---

### **6.5 Cooking Confirmation & Inventory Deduction**

**What it does:**
When user finishes cooking, system confirms what will be removed from inventory and deducts it.

**User interaction:**
- User finishes cooking, taps "I cooked this" on recipe screen
- System shows: "Confirm: Removing from inventory: 3 tomatoes, 200g chicken, 1 bunch basil"
- User: Confirms or cancels
- If confirmed: Inventory is updated (quantities reduced)
- "Currently cooking" indicator clears from chat

**Key details:**
* Simple yes/no confirmation (no haggling)
* Deduction based on MODIFIED recipe (if user changed ingredients)
* If inventory would go negative, warning but still allowed (user might have more than recorded)
* No meal history logged (only inventory change matters)

**What it does NOT do (Iteration 1):**
* No tracking of actual ingredients used
* No recording of which meals were cooked
* No smart inventory reconciliation

---

### **6.6 Chat Persistence with Session Boundaries**

**What it does:**
Chat history is kept but "resets" after 1 hour of inactivity, making it feel fresh while keeping data.

**User interaction:**
- User opens app and converses within 1 hour: Full chat history visible
- User comes back >1 hour later: Chat appears blank with "See earlier messages" button at top
- User taps button: Full previous conversation loads
- User can continue asking questions or start planning next meal

**Key details:**
* Threshold: 1 hour since last message
* "See earlier messages" is always available if history exists
* All data is kept (no deletion)
* Meal type context resets (so next session has fresh meal type)

**What it does NOT do (Iteration 1):**
* No archiving or deletion
* No named chat threads/sessions
* No search within conversation
* No export of chat history

---

## **7. UI/UX Structure (Iteration 1)**

### **Main Chat Screen (Default)**
- Meal type shortcuts at top: "Suggest breakfast ideas", "Suggest lunch ideas", "Suggest dinner ideas"
- Chat conversation in center (scrollable)
- Chat input at absolute bottom
- Recipe cards embedded in chat (tap to expand)
- Currently cooking indicator at top (when recipe selected)

### **Sidebar Navigation**
- "Inventory" → opens inventory view
- "+ Add Item" → adds inventory via voice/text

### **Full-Screen Views**
- **Inventory View:** List of items, can tap to mark used/delete
- **Recipe Screen:** Two tabs (Ingredients / Instructions), with "I cooked this" + "Cancel" buttons

---

## **8. Technical Overview (Iteration 1)**

**Frontend:** React + Tailwind CSS + shadcn/ui
**State Management:** React Context API
**Backend:** Node.js + Express on Netlify Functions
**Database:** Supabase (PostgreSQL)
**LLM:** OpenAI GPT-4o mini (single model for all tasks)
**Authentication:** Hardcoded user_id (no auth for Iteration 1)
**Testing:** Manual only
**Timeline:** 2 weeks

**Data:**
- Supabase tables: User, InventoryItem, ChatMessage
- NO Meals/MealPlan tables (recipes are ephemeral)
- NO price history or cost tracking
- NO Household table (single-user only in Iteration 1)

**API:**
- 7 core endpoints (inventory CRUD, chat, cooking state)
- All requests include user_id (hardcoded for now)
- LLM context: last 10 chat messages + current recipe (when cooking)

---

## **9. Success Metrics (Iteration 1)**

### Engagement:
* Does user return to app 2+ times in first week?
* How often do they ask for meal suggestions (frequency)?
* Do they actually cook the suggested meals?

### Behavior:
* Do suggestions lead to meal variety (different meals each time)?
* Do users feel the interaction is intuitive (qualitative feedback)?
* Do users successfully add inventory and refine suggestions?

### System:
* Does LLM parsing work reliably (80%+ accuracy)?
* Do recipe suggestions use only available items (0 false suggestions)?
* Are recipe modifications working as expected?

---

## **10. Known Limitations (Iteration 1)**

* No learning from user behavior (preferences come in Phase 1)
* No cost awareness or budget tracking
* No shopping list (comes in Phase 1)
* No favorites/recipe saving
* No multi-user coordination (Phase 1+)
* LLM suggestions can be repetitive (will improve with feedback)
* Approximate quantities only (no precise tracking)

---

## **11. Phase 1: Enhancements (After Iteration 1 ships)**

Based on real user feedback, Phase 1 will add:
* Receipt parsing (Tesco emails) for inventory auto-population
* Preferences/favorites (thumbs up/down on recipes)
* Shopping list (what to buy next)
* Smart inventory simulation (plan meals across multiple days)
* Meal history logging (optional, for learning)

---

## **12. Phase 2+: Advanced Features**

* Price learning from receipts
* Budget-aware meal suggestions
* Agent orchestration (multiple LLM agents)
* RAG integration (live recipes, prices)
* Waste tracking & analytics
* Multi-user coordination
* Dietary preferences/restrictions

---

## **13. Implementation Approach (Iteration 1)**

**Philosophy:** Ship fast, learn by doing, iterate based on real usage.

**Key decisions:**
- **No authentication** — hardcoded user_id for simplicity
- **Single LLM model** — GPT-4o mini handles all tasks (recipe suggestion, parsing, modification, Q&A)
- **Simple state management** — React Context API (no Redux/Zustand)
- **Manual testing** — no unit tests, test by cooking with the app
- **Minimal error handling** — show errors, let user retry
- **Duplicate inventory handling** — allow duplicates in Iteration 1, implement semantic matching in Phase 2
- **Context over perfection** — last 10 messages + current recipe is "good enough"

**What we're NOT doing in Iteration 1:**
- Authentication/multi-user
- Recipe persistence/favorites
- Semantic ingredient matching
- Budget/cost awareness
- RAG or live recipe APIs
- Agent orchestration
- Comprehensive error recovery

**What we ARE doing:**
- Testing core hypothesis: does LLM meal discovery work?
- Learning by doing: prompt engineering, state management, failure modes
- Building evaluable: log token usage, track what breaks, iterate
- Shipping on schedule: 2 weeks, focused scope

---

## **14. Next Steps After Iteration 1**

Once you've tested with yourself (Jon) for 1-2 weeks:

1. **Data review** — what meals did you actually cook? What suggestions worked?
2. **Prompt iteration** — what LLM prompts need tweaking?
3. **Semantic matching** — implement in Phase 2 if duplicates are a problem
4. **Phase 1 planning** — receipts, shopping list, favorites, multi-user (Danielle)
5. **Agent orchestration** — Phase 2, if needed based on real usage

---

## **Final Definition**

> A conversational meal discovery tool that helps you eat differently by suggesting recipes based on what you already have. Simple, intuitive, focused on reducing decision friction. Test the core hypothesis: does this actually help people cook more variety? Learn through building, iterate based on real usage.
