# **Meal Planning & Inventory System - Phased Development**

## **Iteration 1 (MVP): Core Concept Testing**

The absolute minimum to validate the core premise: *Can a conversational system help users discover meals from their available inventory?*

---

## **Problem Statement**

Households cook the same meals repeatedly because it's easier than thinking of alternatives. Users want **more variety with less mental effort**. The core question: Can an LLM-powered chat interface solve this by suggesting meals from what's already available?

**Success = User discovers and cooks different meals by having easy access to intelligent meal suggestions based on their inventory.**

---

## **Iteration 1 Goals**

1. **Test core premise** — Can the LLM suggest diverse, realistic meals from user inventory?
2. **Validate interaction model** — Is chat-based inventory input + meal suggestions intuitive?
3. **Gather real data** — What meals do users actually cook? What feedback do they give?
4. **Learn what matters next** — Which features (preferences, shopping, waste) should come first?

---

## **Iteration 1 UI/UX Architecture**

### **Layout**

**Main Screen: Chat (Default View)**
- Chat interface at center/full screen
- Chat input at bottom (absolute positioning for mobile UX)
- Meal type shortcuts at top: "Suggest breakfast ideas", "Suggest lunch ideas", "Suggest dinner ideas" (buttons change based on time of day)

**Sidebar Navigation**
- "Inventory" button → opens inventory view
- "+ Add Item" button → voice/text input for adding inventory

**Currently Cooking Indicator**
- Appears at top of chat when recipe is selected
- Shows: "Currently cooking: [recipe name]" + "Back to recipe" button
- Shows "Updating..." state while LLM regenerates modified recipe

**Full-Screen Recipe View** (when user taps "Let's cook this" or "Back to recipe")
- Two tab/view options:
  - **Ingredients tab:** Full list with quantities (scrollable)
  - **Instructions tab:** Step-by-step instructions with quantities embedded in each step (scrollable)
- Buttons at bottom: "I cooked this" + "Cancel"
- Option to return to chat ("← Back to chat" or swipe gesture)

---

## **Iteration 1 Features**

### **Feature 1: Inventory Addition via Chat**

**How it works:**
- User taps "+ Add Item" button
- User speaks/types: "I've got 3 chicken breasts, tomatoes, pasta, cheese, garlic"
- System (LLM): Parses the text → displays: "I found: Chicken (qty: 3), Tomatoes, Pasta, Cheese, Garlic. Correct?"
- User: Confirms, edits, or adds more items
- System: Saves to inventory

**Acceptance criteria:**
- [ ] User can type or voice inventory list in free-form language
- [ ] LLM parses items and quantities (approximately; "some", "a few", exact numbers all acceptable)
- [ ] System displays parsed list for user confirmation
- [ ] User can edit/add/remove items before confirming
- [ ] Inventory is saved and persists
- [ ] Can be done from sidebar at any time

**Technical notes:**
- LLM prompt: "Extract food items and approximate quantities from: [user input]. Return JSON: {items: [{name, quantity_approx, unit}]}"
- UI: Modal or sidebar panel with text input + voice button + confirmation flow
- Supabase table: InventoryItem (id, household_id, name, quantity_approx, unit, date_added)

---

### **Feature 2: Chat-Based Meal Suggestions with Refinement**

**How it works:**
- User taps "Suggest dinner ideas" button (or types "What can I make for dinner?")
- System: Receives current inventory context + meal type
- LLM: Generates 3-5 recipe cards as suggestions
- Each recipe card shows:
  - Meal name
  - Time estimate
  - 2-3 key ingredients
  - "Tap to expand" affordance
- User taps a card to see full details (name, all ingredients, brief method)
- User can refine in chat: "Something spicier?", "Can you use parsley instead?", "Show me something quicker"
- LLM regenerates suggestions based on refinement
- User selects one and taps "Let's cook this" to commit

**Acceptance criteria:**
- [ ] Meal type shortcuts work (breakfast, lunch, dinner contexts)
- [ ] Recipe suggestions display as cards (name, time, key ingredients)
- [ ] User can tap card to expand and see full details
- [ ] User can refine suggestions via chat conversation
- [ ] LLM regenerates based on user constraints
- [ ] Only suggestions using available inventory items
- [ ] Response time <10 seconds per suggestion set
- [ ] Suggestions feel diverse (not repeating same meals)

**Technical notes:**
- LLM system prompt: "You are a meal suggestion assistant. User has [inventory items]. User wants [meal type: breakfast/lunch/dinner]. User's constraint: [optional refinement]. Suggest 3-5 meals using ONLY available items. Format each as: {name, time_estimate_mins, key_ingredients: [], brief_method: string}. Return as JSON array."
- Recipe cards: React component with expandable details
- OpenAI API integration (GPT-4o)

---

### **Feature 3: Recipe Display & Cooking**

**How it works:**
- User taps "Let's cook this" on a recipe suggestion
- Full-screen recipe view opens with two tabs: Ingredients & Instructions
- **Ingredients tab:** Shows complete ingredient list with quantities (e.g., "3 tomatoes", "200g chicken")
- **Instructions tab:** Shows step-by-step cooking instructions with quantities embedded (e.g., "Add the 3 tomatoes and 2 cloves garlic, simmer 10 minutes")
- User can toggle between tabs while cooking
- At bottom: "I cooked this" button to confirm cooking + "Cancel" button to abandon recipe
- User can return to chat at any time (← Back to chat) to ask questions or request recipe modifications

**Acceptance criteria:**
- [ ] Recipe displays ingredients with clear quantities
- [ ] Recipe displays instructions with quantities embedded (not just "add the tomatoes")
- [ ] User can toggle between ingredients and instructions tabs
- [ ] Full recipe visible on one screen (scrollable if needed)
- [ ] "I cooked this" and "Cancel" buttons accessible at bottom
- [ ] User can return to chat mid-cooking without losing recipe state
- [ ] Recipe state persists when returning from chat

**Technical notes:**
- Data passed from chat: {recipe_id, meal_name, ingredients: [{name, quantity, unit}], instructions: []}
- LLM generates instructions with quantities embedded: "Add [quantity] [ingredient]..." not "Add the [ingredient]"
- UI: Full-screen modal or view with two scrollable tabs
- State management: Keep current recipe in Redux/Context while cooking

---

### **Feature 4: Recipe Modification Mid-Cooking**

**How it works:**
- User is on recipe screen, sees "Use parsley instead of basil"
- User taps "← Back to chat"
- User types: "I don't have basil, can I use parsley?"
- System sends to LLM with context: "User is currently cooking [recipe name]. Current recipe has [ingredients]. User says: [message]"
- LLM understands this is a modification request (not a new recipe suggestion)
- LLM returns: Updated recipe with parsley substituted, updated instructions if needed
- Recipe screen refreshes with modified recipe
- User can review changes and continue cooking

**Acceptance criteria:**
- [ ] LLM understands user is modifying current recipe (not asking for new suggestions)
- [ ] Recipe is updated with substitutions/changes
- [ ] Instructions regenerate if ingredient changes affect cooking steps
- [ ] User sees updated recipe on recipe screen
- [ ] Modification appears in currently cooking indicator (shows "Updating..." during regeneration)
- [ ] User can abandon changes or confirm modification

**Technical notes:**
- LLM context includes: "The user is currently cooking [full current recipe]. They want to modify it. Their request: [user message]. Provide the modified recipe with the same JSON structure."
- Chat context: Prepend current recipe state to every user message while cooking
- State update: Refresh recipe display when LLM responds with modified recipe
- Supabase: No recipe persistence needed in Iteration 1 (recipes are ephemeral, only used during cooking session)

---

### **Feature 5: Inventory Deduction on Cooking Confirmation**

**How it works:**
- User finishes cooking and taps "I cooked this" on recipe screen
- System shows confirmation: "Deducting from inventory: 3 tomatoes, 200g chicken, 1 bunch basil. Confirm?"
- User confirms or cancels
- If confirmed: Inventory is updated (items deducted based on modified recipe)
- If cancelled: Cooking is not recorded, inventory unchanged
- Chat indicator "Currently cooking: [recipe]" clears
- User returns to chat (blank if >1 hour since first message, or full history if <1 hour)

**Acceptance criteria:**
- [ ] System shows user what will be deducted before confirming
- [ ] Deduction is based on MODIFIED recipe (if user made changes)
- [ ] User can confirm or cancel deduction
- [ ] User cannot override/adjust quantities (simple yes/no)
- [ ] Inventory updates accurately upon confirmation
- [ ] Currently cooking state clears after deduction
- [ ] No meal history logged (only inventory change is persisted)

**Technical notes:**
- Deduction logic: For each ingredient in final recipe, reduce inventory_approx by that amount
- If inventory item would go negative, warn user but allow (they might have more than recorded)
- Supabase update: UPDATE InventoryItem SET quantity_approx = quantity_approx - [amount] WHERE id = [item_id]
- No MealRecord table (meals not persisted in Iteration 1)
- Chat returns to normal flow after deduction

---

### **Feature 6: Chat Session Management**

**How it works:**
- User opens app and enters chat
- Chat displays previous conversation if opened within 1 hour of last message
- If opened >1 hour later: Chat shows blank with "See earlier messages" button at top
- User can tap "See earlier messages" to load and view previous conversation
- User can ask new questions or start fresh meal planning
- Chat history is always kept (deleted on purpose in later phases, not in Iteration 1)

**Acceptance criteria:**
- [ ] Chat remembers conversation within 1-hour window
- [ ] Chat feels "fresh" after 1-hour gap but history is recoverable
- [ ] "See earlier messages" button loads full previous conversation
- [ ] No conversation data is lost
- [ ] Works intuitively for typical usage (same meal session vs. next meal time)

**Technical notes:**
- Timestamp last_message_timestamp on every ChatMessage
- On chat load: Check (now - last_message_timestamp) > 3600 seconds
- If true: Show blank chat + "See earlier messages" button
- If false: Load and display all messages since first message of session
- Supabase: ChatMessage table with user_id, message, role, timestamp
- Session boundary is 1 hour; no automatic archiving or deletion

---

## **Iteration 1 Non-Goals**

- **No Meal Plan view** — Focus on discovering meals "right now" from current inventory (Phase 1+)
- **No meal history/logging** — Don't track which meals were cooked (only inventory changes matter) (Phase 1+)
- **No recipe persistence** — Recipes are ephemeral, generated on-demand (Phase 1: favorites feature)
- **No receipt parsing** — Users manually add inventory via chat/voice (Phase 1)
- **No price tracking** — No cost estimation, no budget awareness (Phase 2)
- **No preference learning** — No thumbs up/down, no feedback on recipes (Phase 1)
- **No shopping list** — No "what to buy" recommendations (Phase 1)
- **No smart inventory simulation** — Can't plan meals across multiple days with predicted inventory changes (Phase 1+)
- **No multi-user** — Single user per session (Phase 1+)
- **No waste tracking** — No "thrown away" events (Phase 2+)

---

## **Iteration 1 Success Metrics**

### **Can users add inventory via chat?**
- [ ] User successfully adds 5+ items in one natural language input
- [ ] Parsing accuracy >80% (system understands what user said)
- [ ] User feels it's faster/easier than form entry

### **Can LLM suggest realistic meals from inventory?**
- [ ] Suggestions use only items in inventory (0 false suggestions)
- [ ] Suggestions feel diverse (not same meal twice)
- [ ] User cooks at least 1 suggested meal in week 1

### **Does iteration 1 create a feedback loop?**
- [ ] User opens chat >2x per week
- [ ] User marks meals as cooked when they cook them
- [ ] System suggests improve (fewer repeats, better matches)

---

## **Iteration 1 Tech Stack**

- **Frontend:** React + shadcn/ui + Tailwind CSS
- **State Management:** React Context API
- **Backend:** Node.js + Express
- **Deployment:** Netlify Functions (frontend + backend)
- **Database:** Supabase (PostgreSQL)
- **LLM:** OpenAI API (GPT-4o mini — single model for all tasks)
- **Authentication:** Hardcoded user_id (no auth for Iteration 1)
- **Testing:** Manual only (no unit/integration tests)
- **Cost Tracking:** Log OpenAI token usage per request
- **Timeline:** 2 weeks

---

## **Iteration 1 API Endpoints**

**Backend runs on Netlify Functions (Node.js + Express)**

```
POST /api/inventory
  → Add item to inventory
  → Input: { name, quantity_approx, unit }
  → Output: { id, name, quantity_approx, unit, date_added }

GET /api/inventory
  → Get all inventory items (for LLM context)
  → Output: [{ id, name, quantity_approx, unit, date_added }]

PUT /api/inventory/:id
  → Update inventory item quantity
  → Input: { quantity_approx, unit }
  → Output: updated item

POST /api/chat
  → Send message, get LLM response
  → Input: { message, current_recipe_state (optional) }
  → Output: { role: 'assistant', message, type: 'suggestions|answer|modified_recipe' }
  → Saves both user and assistant messages to database

GET /api/chat/history
  → Load chat messages (paginated)
  → Query: ?limit=20&offset=0
  → Output: [{ id, message, role, timestamp }]

POST /api/cooking/start
  → User taps "Let's cook this"
  → Input: { recipe }
  → Output: { status: 'cooking', recipe }
  → Saves recipe to "currently cooking" state

POST /api/cooking/complete
  → User taps "I cooked this" with confirmation
  → Input: { recipe, confirmed: boolean }
  → If confirmed=false: Returns { action: 'confirm', message: 'Removing X from inventory' }
  → If confirmed=true: Deducts ingredients, clears cooking state, returns { status: 'completed', inventory_updated: [...] }
```

---

## **Iteration 1 LLM Strategy**

**Model:** OpenAI GPT-4o mini (single model for all tasks)

**Context Structure:** When sending messages to LLM:

```
System: "You are a helpful meal discovery assistant.

[If user is cooking a recipe:]
USER IS ACTIVELY COOKING:
{
  "recipe_name": "Tomato Basil Pasta",
  "ingredients": [
    {"name": "tomato", "quantity": 3, "unit": "whole"},
    {"name": "basil", "quantity": 1, "unit": "bunch"}
  ],
  "instructions": [...]
}

[If user is in suggestion mode:]
USER'S CURRENT INVENTORY:
[list of items]

RECENT CONVERSATION CONTEXT:
[last 10 chat messages]

[Task-specific instruction:]
- If user is suggesting meals: Generate 3-5 meal options using only available ingredients
- If user is modifying recipe: Return MODIFIED_RECIPE in same JSON format
- If user is asking question: Answer based on recipe/inventory context"

User: [message]
```

**Tasks & Prompts:**

1. **Recipe Suggestion:**
   - Context: Inventory + meal type + (optional) last 10 messages
   - Return: JSON array of 3-5 recipes with name, time, ingredients, method

2. **Inventory Parsing:**
   - Context: User's voice/text input only
   - Return: JSON with parsed items and quantities (flexible: "some", "3", "bunch" all valid)
   - Simple duplicates allowed in Iteration 1 (Phase 2: implement semantic matching)

3. **Recipe Modification:**
   - Context: Current recipe + last 10 messages + user's request
   - Return: MODIFIED_RECIPE in same JSON format
   - Only modify affected steps, keep structure

4. **Cooking Q&A:**
   - Context: Current recipe + last 10 messages
   - Return: Natural language answer using recipe context

**Token Logging:** Log tokens used per request for cost tracking and evals

---

## **Iteration 1 Frontend State (Context API)**

**Global state structure:**

```
{
  // Chat
  chatMessages: [...],              // All messages from this session
  lastMessageTimestamp: null,        // For 1-hour session boundary

  // Currently cooking
  currentRecipe: null,               // Active recipe object (if cooking)
  recipeModifyingState: false,       // "Updating..." flag

  // Context
  mealType: 'dinner',                // breakfast | lunch | dinner

  // Inventory
  inventoryItems: [...]              // Current inventory list
}
```

**Key behaviors:**
- On app open: Load last 10-20 chat messages
- Check lastMessageTimestamp: if >1 hour old, show blank chat + "See earlier messages" button
- When recipe selected: currentRecipe is set, persists across navigation
- When modifying recipe: recipeModifyingState = true, show "Updating...", then display updated recipe
- When cooking confirmed: deduct from inventory, clear currentRecipe, continue chat

---

## **Iteration 1 Error Handling**

**Scenario 1: LLM call fails**
- Show user: "Oops, that didn't work. Try again?"
- User can retry in chat
- Log error for debugging

**Scenario 2: Inventory deduction goes negative**
- Show user: "Our system thought you had 3 tomatoes. You just used all of them. Setting to 0. You can adjust manually anytime."
- Allow deduction to proceed
- User can manually adjust via PUT /api/inventory/:id in future

**Scenario 3: Malformed data**
- Validate strictly (good data in, bad data rejected)
- Show user friendly error if needed
- Log error for debugging

---

## **Iteration 1 Data Model**

**Supabase Tables:**

```
User
├─ id (UUID, PK)
├─ email
├─ created_at

InventoryItem
├─ id (UUID, PK)
├─ user_id (FK → User)
├─ name (string)
├─ quantity_approx (numeric, nullable - user can say "some" or "3")
├─ unit (string, nullable - "pieces", "grams", "bunch", etc.)
├─ date_added (timestamp)
└─ date_used (timestamp, nullable - set when deducted from inventory)

ChatMessage
├─ id (UUID, PK)
├─ user_id (FK → User)
├─ message (text)
├─ role (enum: 'user' | 'assistant')
└─ timestamp (timestamp)
```

**Key Notes:**
- **Single user scope (Iteration 1)** — all data is per-user (no household/multi-user)
- **NO Household table** — will be added in Phase 1 when multi-user coordination begins
- **NO Meal or MealPlan tables** — recipes are generated on-demand, not persisted
- **NO RecipeHistory table** — we don't track which meals were cooked (only inventory changes)
- **InventoryItem.date_used** — set when user confirms "I cooked this" and deduction is applied
- **ChatMessage** — persists full conversation history (no deletion in Iteration 1)
- Data structure is simple and user-scoped; ready to scale to household level in Phase 1

---

---

## **Phase 1: Receipt Parsing + Shopping + Preferences**

*(Build this after Iteration 1 ships and you have real data)*

### **Phase 1 Features**

#### **Receipt Email Forwarding**
- User forwards Tesco receipt email
- System parses items (no prices yet)
- Adds to inventory automatically
- Reduces manual inventory entry friction

#### **Shopping List**
- User can say "Add to shopping list" during meal chat
- Shopping list shows: items to buy + context (why they're buying it)
- Persistent until user clears

#### **Preference Extraction**
- User gives thumbs up/down (👍/👎) on cooked meals
- System extracts ingredients as preferences
- Future suggestions learn from patterns

#### **Favorites**
- User can save a meal as favorite
- Favorites are accessible and referenceable

---

---

## **Phase 2: Smart Shopping + Agents + RAG**

*(Build after Phase 1, when you understand what users actually need)*

### **Phase 2 Features**

#### **Price Tracking**
- Extract prices from parsed receipts
- Track average prices over time
- Show cost estimates for meal suggestions

#### **Shopping Coaching**
- User says "I'm buying X"
- System suggests: "If you also buy Y, you unlock meal Z"
- Real-time coaching during Tesco ordering

#### **Agent Orchestration**
- Meal Planner Agent (suggest from inventory)
- Budget Optimizer Agent (rank by cost efficiency)
- Shopping List Agent (find alternatives)
- Waste Predictor Agent (use expiring items)

#### **RAG (Retrieval Augmented Generation)**
- Pull live prices from Tesco API
- Pull recipes from recipe databases
- Richer meal suggestions

#### **Semantic Item Matching**
- Upgrade from exact string matching to LLM-based
- "Cherry tomatoes" = "tomatoes"
- Better meal suggestions despite ingredient variations

---

---

## **Phase 3+: Advanced Features**

- Waste tracking & analytics
- Nutritional tracking
- Multi-user coordination
- Dietary preferences/restrictions
- Social sharing
- Mobile native app

---

---

## **Implementation Order**

1. **Iteration 1 (Weeks 1-2):** Manual inventory chat + meal suggestions
2. **Phase 1 (Weeks 3-4):** Receipt parsing + shopping list + preferences + favorites
3. **Phase 2 (Weeks 5-8):** Agents + RAG + smart shopping
4. **Phase 3+:** Everything else

---

---

## **Success Criteria**

### **Iteration 1 = Success if:**
- System is live and usable
- Chat-based inventory input works intuitively
- LLM meal suggestions feel relevant and diverse
- User discovers and cooks meals they wouldn't have chosen manually
- User uses it 2+ times per week after first week

### **Iteration 1 = Failure if:**
- Chat feels clunky or confusing
- LLM suggestions feel generic or repetitive
- User stops using after week 1
- Inventory parsing misunderstands users consistently

---

## **Key Insight**

**By starting with just inventory + suggestions, you:**
- Ship in 2 weeks instead of 4+
- Test the core hypothesis immediately with real data
- Learn what users actually want before building complexity
- Build subsequent phases informed by real usage, not assumptions
- Keep momentum and energy high

**Everything else can come after you validate the core.**
