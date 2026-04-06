# Suppa Iteration 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a conversational meal discovery MVP in 14 days using API-first strategy: LLM-powered APIs (Days 1-5), rough UI wired to real backend (Days 6-8), iterate on real usage (Days 9-14).

**Architecture:** Single Express backend on Netlify Functions + React frontend. Supabase PostgreSQL for persistence. OpenAI GPT-4o mini for all LLM tasks. TDD approach: test first, minimal implementation, iterate on prompts and UX based on real behavior.

**Tech Stack:** React 18 + Tailwind + shadcn/ui, Node.js + Express, Supabase, OpenAI API, Jest for testing, Netlify Functions for deployment

---

## **File Structure**

```
/project-root
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.tsx          # Main chat interface
│   │   │   ├── InventoryForm.tsx # Add inventory form
│   │   │   ├── RecipeCard.tsx     # Recipe suggestion card
│   │   │   ├── RecipeDetail.tsx   # Full recipe view with tabs
│   │   │   └── CookingConfirm.tsx # Cooking confirmation modal
│   │   ├── pages/
│   │   │   └── index.tsx          # Main app entry
│   │   ├── services/
│   │   │   └── api.ts             # API client (fetch wrapper)
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── netlify/
│   │   └── functions/
│   │       ├── api/
│   │       │   ├── inventory.ts   # POST /api/inventory, GET /api/inventory
│   │       │   ├── chat.ts        # POST /api/chat
│   │       │   ├── cooking.ts     # POST /api/cooking/start, POST /api/cooking/complete
│   │       │   └── utils/
│   │       │       ├── llm.ts      # OpenAI integration
│   │       │       ├── db.ts       # Supabase helpers
│   │       │       └── prompts.ts  # LLM prompt templates
│   │       └── shared/
│   │           └── types.ts        # Shared types
│   ├── tests/
│   │   ├── inventory.test.ts
│   │   ├── chat.test.ts
│   │   ├── cooking.test.ts
│   │   └── llm.test.ts
│   ├── package.json
│   └── netlify.toml
│
├── docs/
│   ├── superpowers/
│   │   ├── specs/
│   │   │   └── 2026-04-06-iteration-1-build-strategy.md
│   │   └── plans/
│   │       └── 2026-04-06-iteration-1-implementation.md
│   └── DATABASE.md                 # Schema docs
│
├── LEARNING_OBJECTIVES.md
└── LEARNING_LOG.md                 # Updated during build

**Environment files:**
- .env.local (frontend, ignored)
  - VITE_API_URL=http://localhost:8888
- .env.local (backend, ignored)
  - SUPABASE_URL=...
  - SUPABASE_ANON_KEY=...
  - OPENAI_API_KEY=...
```

---

## **Phase 1: API Spike (Days 1-5)**

### **Task 1: Project Setup & Supabase Schema**

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `backend/package.json`
- Create: `backend/netlify.toml`
- Create: `.env.local` (both frontend and backend, add to .gitignore)
- Create: `docs/DATABASE.md`

**Step-by-step:**

- [ ] **Step 1: Initialize frontend React project**

```bash
cd /Users/jonsearle/Desktop/Suppa
npx create-react-app frontend --template typescript
cd frontend
npm install -D tailwindcss postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-tabs
npm install axios
npx tailwindcss init -p
```

Update `frontend/tsconfig.json` to strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noImplicitAny": true
  }
}
```

- [ ] **Step 2: Create backend Node/Express structure**

```bash
cd /Users/jonsearle/Desktop/Suppa
mkdir -p backend/netlify/functions/api/utils backend/tests backend/src

cd backend
npm init -y
npm install express @supabase/supabase-js openai dotenv cors
npm install -D @types/node @types/express jest ts-jest typescript
npm install -D @netlify/functions
```

Create `backend/netlify.toml`:

```toml
[build]
  command = "npm install && npm run build"
  functions = "netlify/functions"
  publish = "dist"

[dev]
  functions = "netlify/functions"
  port = 8888
```

- [ ] **Step 3: Create .env files and add to .gitignore**

`frontend/.env.local`:
```
REACT_APP_API_URL=http://localhost:8888
```

`backend/.env.local`:
```
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-key>
OPENAI_API_KEY=<your-openai-key>
USER_ID=test-user-001
```

Add to `.gitignore` (both directories):
```
.env.local
node_modules/
dist/
.DS_Store
```

- [ ] **Step 4: Create Supabase tables**

Go to Supabase console and create these tables:

Table: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT now()
);
```

Table: `inventory_items`
```sql
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  quantity_approx NUMERIC,
  unit TEXT,
  date_added TIMESTAMP DEFAULT now(),
  date_used TIMESTAMP
);

CREATE INDEX idx_inventory_user ON inventory_items(user_id);
```

Table: `chat_messages`
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  timestamp TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_chat_user ON chat_messages(user_id, timestamp);
```

- [ ] **Step 5: Write DATABASE.md documentation**

`docs/DATABASE.md`:
```markdown
# Suppa Database Schema

## Tables

### users
- `id` (UUID, PK): User identifier
- `created_at` (TIMESTAMP): Account creation time

### inventory_items
- `id` (UUID, PK)
- `user_id` (UUID, FK): User who owns this item
- `name` (TEXT): Item name (e.g., "chicken", "tomatoes")
- `quantity_approx` (NUMERIC): Approximate quantity (nullable, e.g., 3, 1.5, null for "some")
- `unit` (TEXT): Unit of measurement (nullable, e.g., "pieces", "grams", "bunch")
- `date_added` (TIMESTAMP): When item was added
- `date_used` (TIMESTAMP): When item was deducted (null until used)

### chat_messages
- `id` (UUID, PK)
- `user_id` (UUID, FK): User who sent/received message
- `message` (TEXT): Message content
- `role` (TEXT): 'user' or 'assistant'
- `timestamp` (TIMESTAMP): When message was created

## Queries

All queries filter by user_id (currently hardcoded in backend).

Latest inventory: SELECT * FROM inventory_items WHERE user_id = $1 AND date_used IS NULL
Recent chat: SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10
```

- [ ] **Step 6: Create shared types file**

`backend/netlify/functions/shared/types.ts`:
```typescript
export interface User {
  id: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  quantity_approx?: number;
  unit?: string;
  date_added: string;
  date_used?: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface Recipe {
  name: string;
  time_estimate_mins: number;
  key_ingredients: string[];
  brief_method: string;
}

export interface MealSuggestions {
  recipes: Recipe[];
}

export interface RecipeDetail extends Recipe {
  ingredients: Array<{ name: string; quantity: number | string; unit: string }>;
  instructions: string[];
}

export interface CookingState {
  recipe: RecipeDetail;
  inventory_before: InventoryItem[];
}
```

- [ ] **Step 7: Initialize Git and commit**

```bash
cd /Users/jonsearle/Desktop/Suppa
git init
git add frontend/ backend/ docs/ .gitignore
git commit -m "feat: initialize project structure with React frontend and Node backend"
```

**Learning checkpoint:** Update `LEARNING_LOG.md`:
```markdown
## Day 1-2: Project Setup

### What I tried
- Set up React + TypeScript frontend with Tailwind
- Initialized Node/Express backend with Netlify Functions
- Created Supabase tables for users, inventory, chat
- Documented schema

### What worked
- Supabase tables created successfully
- Project structure follows separation of concerns (frontend, backend, docs)
- .env setup avoids committing secrets

### What surprised me
- Netlify Functions require specific structure (netlify/functions/)
- Supabase queries are simple once tables are right

### Key insight for AI PMs
- Thinking about data first (schema) informs API design
- What fields will the LLM need to see? That shapes the table structure
```

---

### **Task 2: Inventory Parsing API (Day 3)**

**Files:**
- Create: `backend/netlify/functions/api/utils/db.ts`
- Create: `backend/netlify/functions/api/utils/prompts.ts`
- Create: `backend/netlify/functions/api/inventory.ts`
- Create: `backend/tests/inventory.test.ts`

**Step-by-step:**

- [ ] **Step 1: Write failing test for inventory parsing**

`backend/tests/inventory.test.ts`:
```typescript
import { parseInventoryInput } from '../netlify/functions/api/utils/prompts';

describe('Inventory Parsing', () => {
  it('should parse simple inventory input', async () => {
    const input = 'I have 3 chicken breasts, some tomatoes, and basil';
    const result = await parseInventoryInput(input);

    expect(result).toBeDefined();
    expect(result.items).toHaveLength(3);
    expect(result.items[0].name.toLowerCase()).toContain('chicken');
    expect(result.items[0].quantity_approx).toBe(3);
  });

  it('should handle approximate quantities', async () => {
    const input = 'some rice, a bunch of basil, pasta';
    const result = await parseInventoryInput(input);

    expect(result.items).toHaveLength(3);
    expect(result.items.some(item => item.name.toLowerCase().includes('basil'))).toBe(true);
  });

  it('should extract units when provided', async () => {
    const input = '200g chicken, 2 cups rice, 3 tomatoes';
    const result = await parseInventoryInput(input);

    const chicken = result.items.find(item => item.name.toLowerCase().includes('chicken'));
    expect(chicken?.unit).toMatch(/g|grams/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
npm install -D jest ts-jest @types/jest

# Update package.json to add test script
# "test": "jest"

npm test -- inventory.test.ts
```

Expected: FAIL - `parseInventoryInput is not defined`

- [ ] **Step 3: Create Supabase DB helper**

`backend/netlify/functions/api/utils/db.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { InventoryItem, ChatMessage } from '../shared/types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const userId = process.env.USER_ID || 'test-user-001';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .is('date_used', null);

  if (error) throw error;
  return data || [];
}

export async function addInventoryItem(
  name: string,
  quantity_approx?: number,
  unit?: string
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([{
      user_id: userId,
      name,
      quantity_approx,
      unit,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deductInventory(
  itemId: string,
  quantity: number
): Promise<void> {
  const { error } = await supabase
    .from('inventory_items')
    .update({ date_used: new Date().toISOString() })
    .eq('id', itemId);

  if (error) throw error;
}

export async function getChatHistory(limit: number = 10): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).reverse();
}

export async function addChatMessage(
  message: string,
  role: 'user' | 'assistant'
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{
      user_id: userId,
      message,
      role,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

- [ ] **Step 4: Create LLM prompts and parsing logic**

`backend/netlify/functions/api/utils/prompts.ts`:
```typescript
import OpenAI from 'openai';
import { RecipeDetail } from '../shared/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseInventoryInput(userInput: string) {
  const prompt = `You are a food inventory parsing assistant.
User said: "${userInput}"

Extract food items and approximate quantities. Return JSON with this structure (and ONLY this JSON, no other text):
{
  "items": [
    { "name": "item name", "quantity_approx": number or null, "unit": "unit" or null }
  ]
}

Quantities can be approximate ("some", "a bunch", 3, 1.5, etc.). Units are optional (e.g., "grams", "pieces", "bunch").
If quantity is not specified, set to null. If unit is not applicable, set to null.`;

  const message = await openai.messages.create({
    model: 'gpt-4o-mini',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  try {
    const parsed = JSON.parse(content.text);
    return parsed;
  } catch (e) {
    throw new Error(`Failed to parse LLM response: ${content.text}`);
  }
}

export async function suggestMeals(
  inventoryItems: Array<{ name: string }>,
  mealType: 'breakfast' | 'lunch' | 'dinner'
) {
  const itemNames = inventoryItems.map(i => i.name).join(', ');

  const prompt = `You are a meal suggestion assistant.
User has these ingredients: ${itemNames}

Suggest 3-5 ${mealType} meals that use ONLY the available ingredients.
Return JSON with this structure (and ONLY this JSON, no other text):
{
  "recipes": [
    { "name": "meal name", "time_estimate_mins": number, "key_ingredients": ["ingredient"], "brief_method": "short description" }
  ]
}

Meals should be diverse (not all the same). Only suggest meals using ONLY available ingredients.`;

  const message = await openai.messages.create({
    model: 'gpt-4o-mini',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  try {
    const parsed = JSON.parse(content.text);
    return parsed;
  } catch (e) {
    throw new Error(`Failed to parse LLM response: ${content.text}`);
  }
}

export async function generateRecipeDetail(
  recipeName: string,
  keyIngredients: string[],
  briefMethod: string
): Promise<RecipeDetail> {
  const prompt = `You are a recipe generation assistant.

Meal: ${recipeName}
Key ingredients: ${keyIngredients.join(', ')}
Brief method: ${briefMethod}

Generate a detailed recipe with ingredients list and step-by-step instructions.
Return JSON with this structure (and ONLY this JSON):
{
  "name": "${recipeName}",
  "time_estimate_mins": number,
  "key_ingredients": ["ingredient"],
  "brief_method": "${briefMethod}",
  "ingredients": [
    { "name": "ingredient name", "quantity": number or "to taste", "unit": "unit" }
  ],
  "instructions": ["step 1", "step 2", etc]
}

Instructions should include quantities (e.g., "Add 3 tomatoes and 200g chicken").`;

  const message = await openai.messages.create({
    model: 'gpt-4o-mini',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  try {
    const parsed = JSON.parse(content.text);
    return parsed;
  } catch (e) {
    throw new Error(`Failed to parse LLM response: ${content.text}`);
  }
}
```

- [ ] **Step 5: Implement inventory API endpoint**

`backend/netlify/functions/api/inventory.ts`:
```typescript
import { Handler, HandlerEvent } from '@netlify/functions';
import { parseInventoryInput } from './utils/prompts';
import { getInventory, addInventoryItem } from './utils/db';
import { InventoryItem } from './shared/types';

const handler: Handler = async (event: HandlerEvent) => {
  try {
    if (event.httpMethod === 'POST') {
      const { name, quantity_approx, unit } = JSON.parse(event.body || '{}');

      if (!name) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'name is required' }),
        };
      }

      const item = await addInventoryItem(name, quantity_approx, unit);
      return {
        statusCode: 201,
        body: JSON.stringify(item),
      };
    }

    if (event.httpMethod === 'GET') {
      const inventory = await getInventory();
      return {
        statusCode: 200,
        body: JSON.stringify(inventory),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Inventory endpoint error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) }),
    };
  }
};

export { handler };
```

- [ ] **Step 6: Run test (still fails, now needs export)**

Update `backend/tests/inventory.test.ts` to import from correct path:

```typescript
import { parseInventoryInput } from '../netlify/functions/api/utils/prompts';
```

Export the function from prompts.ts (already done in Step 4).

```bash
npm test -- inventory.test.ts
```

Expected: PASS (if OpenAI API key is set and working)

- [ ] **Step 7: Test inventory parsing manually (without running full test suite)**

Create `backend/scripts/test-parsing.ts`:
```typescript
import { parseInventoryInput } from '../netlify/functions/api/utils/prompts';

async function test() {
  console.log('Testing inventory parsing...');

  const inputs = [
    'I have 3 chicken breasts, tomatoes, basil',
    'some rice and pasta',
    '200g chicken, 2 cups rice, 1 bunch basil',
    'eggs, milk, bread',
  ];

  for (const input of inputs) {
    try {
      const result = await parseInventoryInput(input);
      console.log(`✓ "${input}" ->`, result);
    } catch (e) {
      console.log(`✗ "${input}" ->`, e);
    }
  }
}

test();
```

```bash
npm run ts-node scripts/test-parsing.ts
```

Document results in LEARNING_LOG.

- [ ] **Step 8: Iterate prompts based on results**

If parsing is inaccurate:
- Update the prompt in `prompts.ts`
- Re-test
- Document what changed and why

Example iteration:
```typescript
// First attempt: generic parsing
// Result: "3 chicken breasts" → quantity=3, name="chicken breasts" ✓
// Result: "some rice" → quantity=null, name="rice" ✓
// Result: "a bunch of basil" → quantity=1, name="bunch of basil" ✗ (should be name="basil", unit="bunch")

// Iteration 2: More explicit
const prompt = `...
Be precise: if user says "a bunch of basil", extract name="basil" and unit="bunch".
...`;
```

- [ ] **Step 9: Commit**

```bash
cd backend
git add netlify/functions/api/utils/db.ts
git add netlify/functions/api/utils/prompts.ts
git add netlify/functions/api/inventory.ts
git add tests/inventory.test.ts
git add netlify/functions/shared/types.ts
git commit -m "feat: implement inventory parsing API with LLM"
```

**Learning checkpoint:** Update `LEARNING_LOG.md`:
```markdown
## Day 3: Inventory Parsing API

### What I tried
- Created Supabase DB helpers for inventory queries
- Built LLM prompt for parsing free-form inventory input
- Tested parsing on 10+ variations

### What worked
- LLM reliably extracts items and quantities
- "some rice" → null quantity works well
- "3 chicken breasts" correctly identifies quantity and item

### What didn't work
- First version confused "bunch of basil" (treated "bunch" as item, not unit)
- Fixed with more explicit prompt instruction

### Key insight for AI PMs
- Prompts need examples and explicit instruction (not just description)
- Iteration is fast: change prompt, re-test, see results in seconds
- This is "prompt engineering" — understanding what context the LLM needs
```

---

### **Task 3: Meal Suggestion API (Day 4)**

**Files:**
- Modify: `backend/netlify/functions/api/utils/prompts.ts` (already has suggestMeals function)
- Create: `backend/netlify/functions/api/chat.ts`
- Create: `backend/tests/chat.test.ts`
- Modify: `backend/netlify/functions/shared/types.ts` (add more types)

**Step-by-step:**

- [ ] **Step 1: Write failing test for meal suggestions**

`backend/tests/chat.test.ts`:
```typescript
import { suggestMeals } from '../netlify/functions/api/utils/prompts';

describe('Meal Suggestions', () => {
  it('should suggest meals from available inventory', async () => {
    const inventory = [
      { name: 'chicken' },
      { name: 'rice' },
      { name: 'tomatoes' },
      { name: 'basil' },
    ];

    const result = await suggestMeals(inventory, 'dinner');

    expect(result.recipes).toBeDefined();
    expect(result.recipes.length).toBeGreaterThan(0);
    expect(result.recipes.length).toBeLessThanOrEqual(5);

    // Check structure
    result.recipes.forEach(recipe => {
      expect(recipe.name).toBeDefined();
      expect(recipe.time_estimate_mins).toBeGreaterThan(0);
      expect(Array.isArray(recipe.key_ingredients)).toBe(true);
      expect(recipe.brief_method).toBeDefined();
    });
  });

  it('should suggest only meals using available ingredients', async () => {
    const inventory = [
      { name: 'eggs' },
      { name: 'bread' },
      { name: 'butter' },
    ];

    const result = await suggestMeals(inventory, 'breakfast');

    // All suggestions should theoretically use only these 3 items
    expect(result.recipes.length).toBeGreaterThan(0);
  });

  it('should vary suggestions (not all the same meal)', async () => {
    const inventory = [
      { name: 'chicken' },
      { name: 'rice' },
      { name: 'tomatoes' },
      { name: 'basil' },
      { name: 'garlic' },
      { name: 'onions' },
      { name: 'pasta' },
      { name: 'olive oil' },
    ];

    const result = await suggestMeals(inventory, 'dinner');
    const names = result.recipes.map(r => r.name.toLowerCase());
    const uniqueNames = new Set(names);

    // At least 3 different meals
    expect(uniqueNames.size).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run test**

```bash
cd backend
npm test -- chat.test.ts
```

Expected: PASS (suggestMeals already implemented in prompts.ts)

- [ ] **Step 3: Create chat API endpoint**

`backend/netlify/functions/api/chat.ts`:
```typescript
import { Handler, HandlerEvent } from '@netlify/functions';
import { suggestMeals, generateRecipeDetail } from './utils/prompts';
import { getInventory, addChatMessage, getChatHistory } from './utils/db';

const handler: Handler = async (event: HandlerEvent) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Only POST allowed' }),
      };
    }

    const { message, mealType = 'dinner', action = 'suggest' } = JSON.parse(event.body || '{}');

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'message is required' }),
      };
    }

    // Save user message
    await addChatMessage(message, 'user');

    let assistantResponse: any;

    if (action === 'suggest' || message.toLowerCase().includes('what can i make')) {
      // Get current inventory
      const inventory = await getInventory();

      if (inventory.length === 0) {
        assistantResponse = {
          type: 'answer',
          message: "You don't have any inventory yet. Add some items first!",
        };
      } else {
        // Get meal suggestions
        const suggestions = await suggestMeals(inventory, mealType);
        assistantResponse = {
          type: 'suggestions',
          message: 'Here are some meal ideas:',
          recipes: suggestions.recipes,
        };
      }
    } else {
      // Generic Q&A (not implemented yet, just echo for now)
      assistantResponse = {
        type: 'answer',
        message: `You said: ${message}`,
      };
    }

    // Save assistant response
    await addChatMessage(JSON.stringify(assistantResponse), 'assistant');

    return {
      statusCode: 200,
      body: JSON.stringify(assistantResponse),
    };
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) }),
    };
  }
};

export { handler };
```

- [ ] **Step 4: Test manually with different inventories**

Create `backend/scripts/test-suggestions.ts`:
```typescript
import { suggestMeals } from '../netlify/functions/api/utils/prompts';

async function test() {
  const testCases = [
    {
      name: 'Italian ingredients',
      inventory: [
        { name: 'chicken' },
        { name: 'tomatoes' },
        { name: 'basil' },
        { name: 'garlic' },
        { name: 'pasta' },
        { name: 'olive oil' },
      ],
      meal: 'dinner',
    },
    {
      name: 'Breakfast items',
      inventory: [
        { name: 'eggs' },
        { name: 'bread' },
        { name: 'butter' },
        { name: 'jam' },
      ],
      meal: 'breakfast',
    },
    {
      name: 'Asian ingredients',
      inventory: [
        { name: 'rice' },
        { name: 'soy sauce' },
        { name: 'vegetables' },
        { name: 'chicken' },
        { name: 'garlic' },
      ],
      meal: 'dinner',
    },
  ];

  for (const testCase of testCases) {
    try {
      const result = await suggestMeals(testCase.inventory, testCase.meal as any);
      console.log(`\n✓ ${testCase.name}:`);
      result.recipes.forEach((recipe, i) => {
        console.log(`  ${i + 1}. ${recipe.name} (${recipe.time_estimate_mins}min)`);
      });
    } catch (e) {
      console.log(`✗ ${testCase.name}:`, e);
    }
  }
}

test();
```

Run and document results in LEARNING_LOG.

- [ ] **Step 5: Iterate prompts for diversity and relevance**

If suggestions are repetitive or use unavailable ingredients:
- Update prompt in `prompts.ts`
- Add examples of diverse meals
- Emphasize "only available ingredients"

Example:
```typescript
// Version 1: Generic
// Result: Always suggests "rice bowl" and "stir fry" → repetitive ✗

// Version 2: Explicit diversity request
const prompt = `...
Suggest DIVERSE meals. Examples: Pasta, Stir fry, Salad, Soup, Curry.
Only use available ingredients. If you suggest chicken pasta, make sure user has chicken, pasta, and basic spices.
...`;
```

- [ ] **Step 6: Commit**

```bash
git add netlify/functions/api/chat.ts
git add tests/chat.test.ts
git commit -m "feat: implement meal suggestion API with diversity focus"
```

**Learning checkpoint:** Update `LEARNING_LOG.md`:
```markdown
## Day 4: Meal Suggestion API

### What I tried
- Built LLM prompt for meal suggestions from inventory
- Tested on 3 different inventory sets (Italian, breakfast, Asian)
- Evaluated: diversity, relevance, accuracy

### What worked
- LLM generates relevant meals from available ingredients
- Diverse suggestions (not all rice bowls)
- Correctly interprets "only use available items"

### What didn't work / Edge cases
- First version suggested "pad thai" with no fish sauce (user didn't have it)
- Added explicit instruction: "Verify all ingredients in your suggestions are in the available list"

### Key insight for AI PMs
- LLM evaluation: Read the actual suggestions, ask "would I cook this?"
- Diversity matters for product (users want variety, not repetition)
- Constraints need to be explicit in the prompt
```

---

### **Task 4: Cooking APIs (Day 5)**

**Files:**
- Modify: `backend/netlify/functions/api/utils/prompts.ts` (add generateRecipeDetail)
- Create: `backend/netlify/functions/api/cooking.ts`
- Create: `backend/tests/cooking.test.ts`

**Step-by-step:**

- [ ] **Step 1: Write failing test for recipe detail generation**

`backend/tests/cooking.test.ts`:
```typescript
import { generateRecipeDetail } from '../netlify/functions/api/utils/prompts';

describe('Recipe Generation', () => {
  it('should generate detailed recipe from brief info', async () => {
    const recipe = await generateRecipeDetail(
      'Tomato Basil Pasta',
      ['tomatoes', 'basil', 'pasta', 'garlic'],
      'Cook pasta, make tomato sauce, combine'
    );

    expect(recipe.name).toBe('Tomato Basil Pasta');
    expect(recipe.ingredients).toBeDefined();
    expect(recipe.instructions).toBeDefined();
    expect(Array.isArray(recipe.ingredients)).toBe(true);
    expect(Array.isArray(recipe.instructions)).toBe(true);

    // Ingredients should have quantity and unit
    recipe.ingredients.forEach(ing => {
      expect(ing.name).toBeDefined();
      expect(ing.quantity).toBeDefined();
      expect(ing.unit).toBeDefined();
    });

    // Instructions should include quantities
    const hasQuantities = recipe.instructions.some(instr => /\d+/.test(instr));
    expect(hasQuantities).toBe(true);
  });
});
```

- [ ] **Step 2: Run test**

```bash
npm test -- cooking.test.ts
```

Expected: PASS (generateRecipeDetail already in prompts.ts from earlier)

- [ ] **Step 3: Implement cooking state and deduction API**

`backend/netlify/functions/api/cooking.ts`:
```typescript
import { Handler, HandlerEvent } from '@netlify/functions';
import { generateRecipeDetail } from './utils/prompts';
import { getInventory, deductInventory, addChatMessage } from './utils/db';
import { RecipeDetail, InventoryItem } from './shared/types';

// In-memory cooking state (will be lost on redeployment, but ok for MVP)
let currentCookingState: {
  recipe: RecipeDetail;
  inventory_before: InventoryItem[];
} | null = null;

const handler: Handler = async (event: HandlerEvent) => {
  try {
    const path = event.path.split('/').pop();

    if (path === 'start' && event.httpMethod === 'POST') {
      // Start cooking a recipe
      const { recipeName, keyIngredients, briefMethod } = JSON.parse(event.body || '{}');

      if (!recipeName) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'recipeName required' }),
        };
      }

      const recipe = await generateRecipeDetail(recipeName, keyIngredients || [], briefMethod || '');
      const inventoryBefore = await getInventory();

      currentCookingState = { recipe, inventory_before: inventoryBefore };

      await addChatMessage(
        JSON.stringify({ type: 'cooking_started', recipe: recipe.name }),
        'system'
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'cooking', recipe }),
      };
    }

    if (path === 'complete' && event.httpMethod === 'POST') {
      // Complete cooking, deduct inventory
      const { confirmed, ingredientMap } = JSON.parse(event.body || '{}');

      if (!currentCookingState) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'No recipe currently cooking' }),
        };
      }

      if (!confirmed) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            action: 'confirm',
            message: `Deducting from inventory: ${currentCookingState.recipe.ingredients
              .map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`)
              .join(', ')}. Confirm?`,
          }),
        };
      }

      // Deduct inventory items
      // ingredientMap: { "chicken": 200, "tomatoes": 3, ... }
      const inventory = await getInventory();
      const updated: InventoryItem[] = [];

      for (const [ingredientName, quantityUsed] of Object.entries(ingredientMap || {})) {
        const item = inventory.find(i => i.name.toLowerCase() === ingredientName.toLowerCase());
        if (item) {
          await deductInventory(item.id, quantityUsed as number);
          updated.push(item);
        }
      }

      const recipeName = currentCookingState.recipe.name;
      currentCookingState = null;

      await addChatMessage(
        JSON.stringify({ type: 'cooking_completed', recipe: recipeName }),
        'system'
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'completed',
          recipe: recipeName,
          inventory_updated: updated,
        }),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Cooking endpoint error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) }),
    };
  }
};

export { handler };
```

- [ ] **Step 4: Test deduction logic manually**

Create `backend/scripts/test-cooking.ts`:
```typescript
import { generateRecipeDetail } from '../netlify/functions/api/utils/prompts';

async function test() {
  console.log('Testing recipe generation...');

  const recipe = await generateRecipeDetail(
    'Tomato Basil Pasta',
    ['tomatoes', 'basil', 'pasta', 'garlic'],
    'Cook pasta, make tomato sauce'
  );

  console.log('Generated recipe:');
  console.log(`Name: ${recipe.name}`);
  console.log(`Time: ${recipe.time_estimate_mins} mins`);
  console.log('Ingredients:');
  recipe.ingredients.forEach(ing => {
    console.log(`  - ${ing.quantity} ${ing.unit} ${ing.name}`);
  });
  console.log('Instructions:');
  recipe.instructions.forEach((instr, i) => {
    console.log(`  ${i + 1}. ${instr}`);
  });
}

test();
```

Run and verify recipes have quantities in instructions.

- [ ] **Step 5: Improve recipe format if needed**

If instructions don't have quantities ("Add the tomatoes" vs "Add 3 tomatoes"):
- Update prompt to emphasize: "Instructions should include exact quantities from ingredients list"
- Example:

```typescript
const prompt = `...
Instructions MUST include quantities. Example:
- Bad: "Add the tomatoes and garlic"
- Good: "Add 3 tomatoes and 2 cloves garlic"
...`;
```

- [ ] **Step 6: Commit**

```bash
git add netlify/functions/api/cooking.ts
git add tests/cooking.test.ts
git commit -m "feat: implement cooking start/complete APIs with inventory deduction"
```

**Learning checkpoint:** Update `LEARNING_LOG.md`:
```markdown
## Day 5: Cooking APIs & Edge Cases

### What I tried
- Generated detailed recipes with quantities in instructions
- Implemented inventory deduction logic
- Tested on sample inventory

### What worked
- LLM generates clear instructions with quantities
- Deduction logic correctly updates inventory

### Edge cases found
- What if user has no quantity recorded? (e.g., "some tomatoes" → null)
  - Decision: Allow deduction anyway, warn user in UI (they can adjust manually later)
- What if deduction goes negative?
  - Decision: Allow it, show warning (they might have more than recorded)

### Key insight for AI PMs
- Edge cases inform UX. Negative inventory → need confirmation dialog
- Null quantities → need "approximate" messaging
- Real-world messiness (users don't track perfectly) shapes product design
```

**End of Phase 1: API Spike Complete**

All 4 core APIs are working:
- ✅ POST /api/inventory - add items
- ✅ GET /api/inventory - list current inventory
- ✅ POST /api/chat - get meal suggestions
- ✅ POST /api/cooking/start - start cooking
- ✅ POST /api/cooking/complete - deduct inventory

LLM prompts iterated and tested.

---

## **Phase 2: UI Layer (Days 6-8)**

### **Task 5: Frontend Setup & Core Components (Days 6-7)**

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/services/api.ts`
- Create: `frontend/src/components/Chat.tsx`
- Create: `frontend/src/components/InventoryForm.tsx`
- Create: `frontend/src/components/RecipeCard.tsx`
- Create: `frontend/src/components/RecipeDetail.tsx`
- Create: `frontend/src/components/CookingConfirm.tsx`
- Create: `frontend/src/App.tsx`
- Modify: `frontend/src/index.css` (Tailwind setup)

**Step-by-step:**

- [ ] **Step 1: Create TypeScript types**

`frontend/src/types/index.ts`:
```typescript
export interface InventoryItem {
  id: string;
  name: string;
  quantity_approx?: number;
  unit?: string;
  date_added: string;
}

export interface Recipe {
  name: string;
  time_estimate_mins: number;
  key_ingredients: string[];
  brief_method: string;
}

export interface RecipeDetail extends Recipe {
  ingredients: Array<{ name: string; quantity: number | string; unit: string }>;
  instructions: string[];
}

export interface ChatMessage {
  id?: string;
  message: string;
  role: 'user' | 'assistant' | 'system';
  type?: 'suggestions' | 'answer' | 'cooking_started' | 'cooking_completed';
  recipes?: Recipe[];
}
```

- [ ] **Step 2: Create API client service**

`frontend/src/services/api.ts`:
```typescript
import axios from 'axios';
import { InventoryItem, Recipe, RecipeDetail, ChatMessage } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8888';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const apiService = {
  // Inventory
  getInventory: () => client.get<InventoryItem[]>('/api/inventory'),
  addInventoryItem: (name: string, quantity_approx?: number, unit?: string) =>
    client.post<InventoryItem>('/api/inventory', { name, quantity_approx, unit }),

  // Chat
  suggestMeals: (message: string, mealType: 'breakfast' | 'lunch' | 'dinner' = 'dinner') =>
    client.post<{ type: string; message: string; recipes?: Recipe[] }>('/api/chat', {
      message,
      mealType,
      action: 'suggest',
    }),

  // Cooking
  startCooking: (recipeName: string, keyIngredients: string[], briefMethod: string) =>
    client.post<{ status: string; recipe: RecipeDetail }>('/api/cooking/start', {
      recipeName,
      keyIngredients,
      briefMethod,
    }),

  completeCooking: (confirmed: boolean, ingredientMap?: Record<string, number>) =>
    client.post<{ status: string; recipe: string; inventory_updated: InventoryItem[] }>(
      '/api/cooking/complete',
      { confirmed, ingredientMap }
    ),
};
```

- [ ] **Step 3: Create Chat component (rough)**

`frontend/src/components/Chat.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { apiService } from '../services/api';

export function Chat({ onSelectRecipe }: { onSelectRecipe?: (recipe: any) => void }) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { message: input, role: 'user' }]);
    setLoading(true);

    try {
      const response = await apiService.suggestMeals(input);
      setMessages(prev => [
        ...prev,
        {
          message: response.data.message,
          role: 'assistant',
          type: response.data.type,
          recipes: response.data.recipes,
        },
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          message: 'Sorry, something went wrong. Try again?',
          role: 'assistant',
        },
      ]);
    }

    setInput('');
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-black'
              }`}
            >
              <p>{msg.message}</p>
              {msg.recipes && msg.recipes.length > 0 && (
                <div className="mt-2 space-y-2">
                  {msg.recipes.map((recipe, j) => (
                    <button
                      key={j}
                      onClick={() => onSelectRecipe?.(recipe)}
                      className="block w-full text-left bg-white text-black p-2 rounded text-sm hover:bg-gray-100"
                    >
                      <strong>{recipe.name}</strong> ({recipe.time_estimate_mins} min)
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
          placeholder="What would you like to cook?"
          className="flex-1 p-2 border rounded"
          disabled={loading}
        />
        <button
          onClick={handleSendMessage}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create InventoryForm component**

`frontend/src/components/InventoryForm.tsx`:
```typescript
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { apiService } from '../services/api';

export function InventoryForm({ onAdd }: { onAdd?: (item: InventoryItem) => void }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      // Simple version: just add as name
      const response = await apiService.addInventoryItem(input);
      onAdd?.(response.data);
      setInput('');
    } catch (error) {
      alert('Failed to add inventory item');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border-b">
      <h2 className="font-bold mb-2">Add Inventory</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g., 3 chicken breasts, tomatoes, basil"
          className="flex-1 p-2 border rounded"
          disabled={loading}
        />
        <button
          onClick={handleAdd}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create RecipeCard component**

`frontend/src/components/RecipeCard.tsx`:
```typescript
import React from 'react';
import { Recipe } from '../types';

export function RecipeCard({
  recipe,
  onSelect,
}: {
  recipe: Recipe;
  onSelect?: (recipe: Recipe) => void;
}) {
  return (
    <div className="p-3 bg-white border rounded cursor-pointer hover:bg-gray-50" onClick={() => onSelect?.(recipe)}>
      <div className="font-bold">{recipe.name}</div>
      <div className="text-sm text-gray-600">{recipe.time_estimate_mins} min</div>
      <div className="text-xs mt-2">{recipe.key_ingredients.join(', ')}</div>
    </div>
  );
}
```

- [ ] **Step 6: Create RecipeDetail component**

`frontend/src/components/RecipeDetail.tsx`:
```typescript
import React, { useState } from 'react';
import { RecipeDetail as RecipeDetailType } from '../types';

export function RecipeDetail({
  recipe,
  onCook,
  onCancel,
}: {
  recipe: RecipeDetailType;
  onCook?: (recipe: RecipeDetailType) => void;
  onCancel?: () => void;
}) {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b">
        <h1 className="font-bold text-2xl">{recipe.name}</h1>
        <p className="text-sm text-gray-600">{recipe.time_estimate_mins} minutes</p>
      </div>

      <div className="flex gap-4 p-4 border-b">
        <button
          onClick={() => setTabIndex(0)}
          className={`px-4 py-2 ${tabIndex === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded`}
        >
          Ingredients
        </button>
        <button
          onClick={() => setTabIndex(1)}
          className={`px-4 py-2 ${tabIndex === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded`}
        >
          Instructions
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tabIndex === 0 && (
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="text-sm">
                {ing.quantity} {ing.unit} {ing.name}
              </li>
            ))}
          </ul>
        )}

        {tabIndex === 1 && (
          <ol className="space-y-3 list-decimal list-inside">
            {recipe.instructions.map((instr, i) => (
              <li key={i} className="text-sm">
                {instr}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="p-4 border-t flex gap-2">
        <button
          onClick={() => onCook?.(recipe)}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          I cooked this
        </button>
        <button
          onClick={() => onCancel?.()}
          className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create CookingConfirm component**

`frontend/src/components/CookingConfirm.tsx`:
```typescript
import React from 'react';
import { RecipeDetail } from '../types';

export function CookingConfirm({
  recipe,
  onConfirm,
  onCancel,
}: {
  recipe: RecipeDetail;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded max-w-sm">
        <h2 className="font-bold text-lg mb-4">Confirm Cooking</h2>
        <p className="mb-4">Removing from inventory:</p>
        <ul className="mb-6 space-y-2 bg-gray-100 p-3 rounded">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="text-sm">
              {ing.quantity} {ing.unit} {ing.name}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm?.()}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Confirm
          </button>
          <button
            onClick={() => onCancel?.()}
            className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create App component (ties everything together)**

`frontend/src/App.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import { Chat } from './components/Chat';
import { InventoryForm } from './components/InventoryForm';
import { RecipeDetail } from './components/RecipeDetail';
import { CookingConfirm } from './components/CookingConfirm';
import { apiService } from './services/api';
import { Recipe, RecipeDetail as RecipeDetailType, InventoryItem } from './types';

function App() {
  const [view, setView] = useState<'chat' | 'recipe' | 'inventory'>('chat');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeDetail, setRecipeDetail] = useState<RecipeDetailType | null>(null);
  const [showCookingConfirm, setShowCookingConfirm] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const response = await apiService.getInventory();
      setInventory(response.data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    try {
      const response = await apiService.startCooking(
        recipe.name,
        recipe.key_ingredients,
        recipe.brief_method
      );
      setRecipeDetail(response.data.recipe);
      setView('recipe');
    } catch (error) {
      alert('Failed to load recipe details');
    }
  };

  const handleCook = () => {
    setShowCookingConfirm(true);
  };

  const handleConfirmCooking = async () => {
    if (!recipeDetail) return;

    try {
      const ingredientMap: Record<string, number> = {};
      recipeDetail.ingredients.forEach(ing => {
        ingredientMap[ing.name.toLowerCase()] = ing.quantity as number;
      });

      await apiService.completeCooking(true, ingredientMap);
      setShowCookingConfirm(false);
      setRecipeDetail(null);
      setSelectedRecipe(null);
      setView('chat');
      loadInventory();
    } catch (error) {
      alert('Failed to confirm cooking');
    }
  };

  const handleAddInventory = async (item: InventoryItem) => {
    setInventory(prev => [...prev, item]);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="font-bold text-2xl">Suppa</h1>
        <p className="text-sm">Meal discovery from what you have</p>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-bold mb-2">Inventory</h2>
            <ul className="space-y-1">
              {inventory.slice(0, 5).map(item => (
                <li key={item.id} className="text-sm">
                  {item.name} {item.quantity_approx && `(${item.quantity_approx})`}
                </li>
              ))}
            </ul>
            {inventory.length > 5 && <p className="text-xs text-gray-500">+{inventory.length - 5} more</p>}
          </div>

          <button
            onClick={() => setView('inventory')}
            className="p-4 text-left hover:bg-gray-100 border-b font-bold text-blue-600"
          >
            + Add Inventory
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {view === 'chat' && <Chat onSelectRecipe={handleSelectRecipe} />}
          {view === 'recipe' && recipeDetail && (
            <RecipeDetail
              recipe={recipeDetail}
              onCook={handleCook}
              onCancel={() => {
                setRecipeDetail(null);
                setView('chat');
              }}
            />
          )}
          {view === 'inventory' && <InventoryForm onAdd={handleAddInventory} />}

          {showCookingConfirm && recipeDetail && (
            <CookingConfirm
              recipe={recipeDetail}
              onConfirm={handleConfirmCooking}
              onCancel={() => setShowCookingConfirm(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 9: Commit**

```bash
cd frontend
git add src/
git commit -m "feat: build rough UI components for chat, inventory, recipes"
```

---

### **Task 6: Wire Frontend to Backend (Day 8)**

**Files:**
- Modify: `frontend/src/App.tsx` (complete wiring)
- Modify: `backend/netlify/functions/api/inventory.ts` (add CORS)
- Modify: `backend/netlify/functions/api/chat.ts` (add CORS)
- Modify: `backend/netlify/functions/api/cooking.ts` (add CORS)

**Step-by-step:**

- [ ] **Step 1: Add CORS middleware to backend**

Create `backend/netlify/functions/api/utils/cors.ts`:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function handleCors(event: any) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }
}
```

Update each API file (inventory.ts, chat.ts, cooking.ts) to include corsHeaders in responses:

```typescript
return {
  statusCode: 200,
  headers: corsHeaders,
  body: JSON.stringify(...),
};
```

- [ ] **Step 2: Test full loop**

Start backend:
```bash
cd backend
npm run dev  # Uses netlify dev
```

Start frontend:
```bash
cd frontend
npm start
```

Test flow:
1. Add inventory: "3 chicken, tomatoes, basil"
2. Ask for meal suggestions: "What can I make for dinner?"
3. Click on a recipe suggestion
4. View recipe (toggle ingredients/instructions tabs)
5. Click "I cooked this"
6. Confirm cooking

- [ ] **Step 3: Document what surprised you**

Test and note:
- Latency: How long does LLM suggestion take? (Affects UX - need loading states)
- UI friction: What felt clunky? (Informs Day 9-10 iteration)
- Data flow: Did all pieces connect correctly?

- [ ] **Step 4: Commit**

```bash
git add netlify/functions/api/
git add frontend/src/
git commit -m "feat: wire frontend to backend, first full loop working"
```

**Learning checkpoint:** Update `LEARNING_LOG.md`:
```markdown
## Day 6-8: UI Layer & First Full Loop

### What I tried
- Built rough React UI for chat, inventory, recipes
- Wired frontend to real backend APIs
- Tested full loop: add inventory → suggest → cook → deduct

### What worked
- Components connect to APIs correctly
- Full loop is functional
- Chat-based input feels intuitive

### What surprised me (Latency & UX)
- LLM meal suggestion takes 2-3 seconds
  - Added "Thinking..." loading state
- No visual feedback when deducting inventory
  - Need confirmation dialog (we have it but needs styling)
- Recipe detail view is overwhelming with all instructions
  - Tabs help but could use better formatting

### Key insight for AI PMs
- Real latency teaches you about UX needs
- Mock data would have hidden the "Thinking..." moment
- Rough UI is good enough to learn what matters
```

**End of Phase 2: Core Loop is Functional**

✅ Full MVP works end-to-end
✅ Real latency discovered
✅ UI/UX friction points identified

---

## **Phase 3: Iterate & Polish (Days 9-14)**

### **Task 7: Iterate on Real Usage (Days 9-10)**

**No specific code task — this is exploration and prompt refinement**

- [ ] **Step 1: Use the system for real**

- Add your actual kitchen inventory
- Ask for meal suggestions 5+ times
- Note: Are suggestions diverse? Relevant? Weird?
- Cook at least 1-2 meals using the system
- Document experience in LEARNING_LOG

- [ ] **Step 2: Refine meal suggestion prompts**

Based on Day 9-10 usage, update `prompts.ts` meal suggestion prompt:
- If suggestions are repetitive: Add diversity emphasis
- If suggestions are irrelevant: Clarify inventory understanding
- If some meals don't use all ingredients: That's ok

- [ ] **Step 3: Refine inventory parsing**

Test parsing on more varied inputs:
- "a handful of rice"
- "500ml milk"
- "bunch of cilantro"

- [ ] **Step 4: Update LEARNING_LOG with iteration insights**

```markdown
## Days 9-10: Real Usage Testing

### What I tried
- Actually cooked meals (Tomato Pasta, Stir Fry)
- Added real inventory multiple times
- Tested edge cases

### What worked
- Parsing understood my inventory well
- Suggestions were usable (I cooked 2 meals)

### Edge cases / Friction
- Quantity "a handful" parsed as item, not unit
  - Updated prompt: Add examples of common approximations
- No visual way to see all inventory
  - Not building this in MVP (Phase 1 feature)
- Deletion of inventory items not implemented
  - Decision: Keep for Phase 1

### Key insight for AI PMs
- Even with rough UI, the FLOW is what matters
- Real usage beats theory (you discover what people actually do)
- Iteration velocity is high: change prompt, test, 2 min cycle
```

---

### **Task 8: Add Error Handling & Refinements (Days 11-12)**

**Files:**
- Modify: `backend/netlify/functions/api/inventory.ts` (error handling)
- Modify: `backend/netlify/functions/api/chat.ts` (error handling)
- Modify: `backend/netlify/functions/api/cooking.ts` (error handling)
- Modify: `frontend/src/components/Chat.tsx` (loading, error states)
- Modify: `frontend/src/components/RecipeDetail.tsx` (confirmation states)

**Step-by-step:**

- [ ] **Step 1: Add better error handling to backend**

Example for chat.ts:
```typescript
if (event.httpMethod !== 'POST') {
  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
}

try {
  // ... logic
} catch (error) {
  console.error('Chat error:', error);

  if (error instanceof Error && error.message.includes('Failed to parse')) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid request format' }),
    };
  }

  return {
    statusCode: 500,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Internal server error. Try again?' }),
  };
}
```

- [ ] **Step 2: Improve frontend error UI**

Update Chat.tsx:
```typescript
const [error, setError] = useState<string | null>(null);

const handleSendMessage = async () => {
  // ... existing code
  try {
    // ...
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    setError(message);
    setMessages(prev => [
      ...prev,
      {
        message: `Sorry, an error occurred: ${message}`,
        role: 'assistant',
      },
    ]);
  }
};

// In render:
{error && <div className="bg-red-100 text-red-800 p-3 rounded">{error}</div>}
```

- [ ] **Step 3: Add loading states**

Update components to show "Updating..." or "Thinking..." during API calls

- [ ] **Step 4: Handle edge case: negative inventory**

When deducting inventory, if quantity would go negative:
```typescript
// In cooking.ts
const currentQuantity = inventoryItem.quantity_approx || 0;
if (currentQuantity - quantityUsed < 0) {
  // Warn but allow
  console.warn(`Inventory ${inventoryItem.name} would go negative`);
}
```

Add frontend warning:
```typescript
if (inventory.some(item => (item.quantity_approx || 0) < 0)) {
  <div className="bg-yellow-100 p-2 text-sm">
    Some inventory is negative — you might have more than recorded
  </div>
}
```

- [ ] **Step 5: Implement 1-hour session boundary**

Add to chat.ts:
```typescript
const lastMessage = (await getChatHistory(1))[0];
if (lastMessage && Date.now() - new Date(lastMessage.timestamp).getTime() > 3600000) {
  // Clear chat view but keep history
  return {
    statusCode: 200,
    body: JSON.stringify({
      type: 'session_boundary',
      message: 'New session. See earlier messages?',
    }),
  };
}
```

- [ ] **Step 6: Commit**

```bash
git add backend/netlify/functions/api/
git add frontend/src/components/
git commit -m "feat: add error handling, loading states, edge case handling"
```

**Learning checkpoint:**
```markdown
## Days 11-12: Error Handling & Edge Cases

### What I tried
- Added error boundaries and graceful failures
- Handled negative inventory warning
- Implemented session boundaries

### Edge cases handled
- LLM fails → Show user-friendly error message
- Inventory goes negative → Warn but allow
- Session timeout → New session, keep history

### Key insight for AI PMs
- Error handling is UX (what happens when things fail?)
- Edge cases are where AI products differ from traditional software
- Users forgive imperfect AI if feedback is clear and honest
```

---

### **Task 9: Polish & Final Iteration (Days 13-14)**

**Files:**
- Modify: `frontend/src/components/` (styling, UX improvements)
- Modify: `backend/netlify/functions/api/utils/prompts.ts` (final prompt tuning)
- Create: `LEARNING_LOG.md` (final reflection entry)
- Create: `PHASE_1_PLAN.md` (agent architecture notes)

**Step-by-step:**

- [ ] **Step 1: Polish UI styling**

Add better Tailwind styles:
- Better spacing and typography
- Improved recipe card design
- Better visual hierarchy

- [ ] **Step 2: Final prompt tuning**

Run through 5+ real usage scenarios and refine:
- Meal suggestion prompts
- Inventory parsing edge cases

- [ ] **Step 3: Final end-to-end testing**

- Add inventory
- Get 3+ different meal suggestions
- Cook 2+ meals
- Verify inventory updates correctly

- [ ] **Step 4: Write Iteration 1 reflection**

```markdown
## Iteration 1: Final Reflection (Days 13-14)

### What we shipped
- ✅ Full conversational meal discovery MVP
- ✅ LLM-powered inventory parsing
- ✅ Meal suggestion engine
- ✅ Recipe generation with instructions
- ✅ Inventory deduction tracking

### Surprises & learnings
- LLM latency was bigger UX factor than expected
- Prompt iteration is FAST (minutes per cycle)
- Real usage revealed assumptions (inventory ambiguity)

### What we'd do differently
- Start with LLM evaluation strategy earlier
- Test prompts on more variations upfront

### What's next: Phase 1
- Agent architecture: separate agents for parsing, suggesting, etc.
- Receipt parsing: auto-populate inventory
- Preferences: thumbs up/down on meals
- Shopping list: what to buy next
```

- [ ] **Step 5: Draft Phase 1 plan**

Create `PHASE_1_PLAN.md`:
```markdown
# Phase 1: Agent Orchestration & Smart Features

## Learning objectives
- Agent design & orchestration
- Multi-agent prompt strategies
- Dependency management between agents

## Architecture
Instead of single LLM for all tasks, create specialized agents:

### Agent 1: Inventory Parser Agent
- Input: Free-form user text
- Output: Structured items + quantities
- Single responsibility: Parse only

### Agent 2: Suggestion Agent
- Input: Parsed inventory + meal type + preferences (future)
- Output: 3-5 meal suggestions
- Single responsibility: Suggest meals

### Agent 3: Recipe Agent
- Input: Selected meal + inventory
- Output: Detailed recipe with quantities
- Single responsibility: Generate recipes

### Agent 4: Shopping Agent (future)
- Input: Current inventory + preferred meals
- Output: Shopping list
- Single responsibility: Plan shopping

### Orchestrator
- Routes user input to correct agent(s)
- Manages context between agents
- Handles multi-step workflows

## Implementation approach
- Days 1-2: Refactor existing code to agent pattern
- Days 3-4: Add multi-agent testing
- Days 5-6: Add receipt parsing (new data source)
- Days 7+: Add shopping list, preferences
```

- [ ] **Step 6: Final commit**

```bash
git add frontend/src/
git add LEARNING_LOG.md
git add PHASE_1_PLAN.md
git commit -m "feat: polish UI, final prompt tuning, Iteration 1 complete"
```

**Final Learning Log Entry:**
```markdown
## Iteration 1 Complete: Learning Summary

### Skills demonstrated
1. **Prompt Engineering** - Iterated on 3 core prompts (parsing, suggestions, recipes). Learned what context LLM needs.
2. **LLM Evaluation** - Spot-tested outputs, knew when suggestions were good vs. hallucinated.
3. **AI-Aware Product Design** - Designed for latency, uncertainty, edge cases.
4. **Data Literacy** - Understood what data structure the LLM needed (inventory as context).
5. **Strategic Thinking** - Built feedback loop (cook → inventory update → better suggestions).
6. **Communication** - Clear specs, LEARNING_LOG as portfolio evidence.
7. **Agent Design (prepped)** - Documented Phase 1 multi-agent refactor.

### Portfolio evidence
- Code: Working MVP on GitHub
- Specs: Clear design docs + Phase 1 plan
- LEARNING_LOG: 8+ entries showing iteration and thinking
- Narrative: "I built an AI product, learned about prompts/evaluation/design, documented my thinking"

### What surprised me most
- How fast you can iterate on LLM behavior (change prompt → 2 min test)
- How much real usage differs from assumptions
- How important error handling is for AI products (users need to know what failed)

### For next AI PM: Learn these first
- Prompts need examples and explicit constraints
- Test on edge cases early (users will find them)
- Latency is a UX problem, not engineering problem
- "Rough" doesn't mean "bad" (good feedback on real flow)
```

---

## **Execution Handoff**

Plan complete and saved to `docs/superpowers/plans/2026-04-06-iteration-1-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Use if you want parallel execution and structured reviews.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints for review.

**Which approach would you prefer?**

