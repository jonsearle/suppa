# Suppa Learning Log

## Day 1-2: Project Setup & Supabase Schema

### What I tried

- Set up React 18 + TypeScript frontend with Tailwind CSS
- Initialized Node.js/Express backend with Netlify Functions structure
- Created comprehensive Supabase schema documentation
- Documented all shared TypeScript types for backend and frontend
- Created project structure following separation of concerns principles
- Set up environment configuration with .env.local for both frontend and backend

### What worked

- Project structure is clean and scalable with clear separation between frontend, backend, and documentation
- TypeScript strict mode configuration ensures type safety from the start
- Supabase schema is well-thought-out with proper foreign keys and indexes for performance
- .env.local setup properly excludes secrets from version control
- Shared types file provides single source of truth for data structures
- Database.md documentation makes schema clear and queryable

### What surprised me

- Netlify Functions require specific directory structure (netlify/functions/) for deployment to work
- Supabase's UUID generation and timestamp defaults simplify backend code significantly
- The soft-delete pattern (using date_used instead of DELETE) makes audit trails natural
- TypeScript interfaces mirror database schema almost 1:1 - good data flow architecture

### Key insight for AI PMs

- Thinking about data first (schema) informs API design - what fields will the LLM need to see? That shapes the table structure
- Having complete type definitions before implementing endpoints prevents runtime type errors
- Clear documentation of the schema (DATABASE.md) makes it easy for frontend team to understand queries
- Environment configuration matters early - can't test anything without proper secrets setup

### Technical decisions made

1. **UUID for all primary keys** - Better for distributed systems and Supabase's native support
2. **Soft delete pattern** - inventory_items marked with date_used instead of DELETE - preserves audit trail
3. **Append-only chat messages** - Never modify messages, only add new ones
4. **Hardcoded USER_ID for MVP** - Testing with fixed user before implementing RLS policies
5. **Single Express server** - One api.ts file, split into functions later as needed
6. **Shared types file** - Single source of truth prevents frontend/backend type mismatches

---

## Day 3: Inventory Parsing API with LLM

### What I tried

- Implemented TDD approach: wrote failing tests first before implementing functionality
- Built Supabase database helper module with CRUD operations for inventory items and chat history
- Created LLM prompt utilities using OpenAI GPT-4o mini with detailed system prompts
- Implemented Express inventory endpoints (POST to add items, GET to fetch inventory)
- Created manual testing script to validate parsing accuracy on real-world inputs
- Focused on prompt engineering to ensure LLM returns JSON-only responses

### What worked

- **TDD approach is powerful**: Writing tests first forced me to think about the API contract before implementing. Tests document expected behavior clearly
- **Separation of concerns**: Database helpers (db.ts), LLM utilities (prompts.ts), and API routes (inventory.ts) are completely decoupled
- **Prompt engineering is critical**: Using system prompts to define clear JSON output format prevents parsing failures. Examples in prompts help LLM understand edge cases
- **Error handling**: Graceful error messages distinguish between parsing errors, DB errors, and missing config
- **TypeScript's Omit utility**: Used Omit<InventoryItem, ...> to clarify which fields the DB adds (id, user_id, date_added)
- **Environment variables for configuration**: Keeps secrets out of code and makes deployment flexible

### What surprised me

- **JSON extraction from LLM responses is fragile**: The LLM might wrap JSON in markdown code blocks or add extra text. Regex extraction with fallback validation is necessary
- **Approximate quantities are tricky**: "Some" could mean 1 or could mean 3. The prompt needs explicit guidance (some = 1, a bunch = 1-2, etc.). This needs testing
- **Unit normalization is important**: Accepting "tbsp", "tablespoon", "T", "tsp" all means parsing logic must normalize to a standard. Starting with grams, ml, cups, tbsp, pieces is good
- **OpenAI SDK pattern differs from Anthropic**: Uses chat.completions.create not messages.create. Need to match the installed SDK

### Key insight for AI PMs

- **Prompt engineering is iterative**: A single well-crafted system prompt with clear examples beats many attempts to patch bad prompts. Invest early in getting the prompt right
- **Testing LLM output is different**: Can't write unit tests that mock the LLM response initially. Need manual testing with real API calls, then iterate on prompts
- **Edge cases in parsing are predictable**: Adjectives ("fresh mozzarella", "extra virgin olive oil"), compound units ("tablespoons of"), and approximate words ("bunch", "pinch") all need explicit handling in prompts
- **Database design validates API design**: The schema's quantity_approx and unit fields exactly match what the LLM needs to output. Good schema thinking prevents API mismatch issues

### Technical decisions made

1. **OpenAI GPT-4o mini model**: Good balance of cost and capability for parsing tasks
2. **JSON-only responses from LLM**: System prompt explicitly requests JSON array/object only. Regex extraction finds JSON in response
3. **Approximate quantities as integers**: "Some rice" becomes {quantity_approx: 1, unit: null}. Works for simple comparisons and UI display
4. **Standardized unit abbreviations**: grams=g, milliliters=ml, cups=cup, tablespoons=tbsp, pieces=pieces. Easy to normalize in UI
5. **Manual testing script**: Separate from unit tests. Tests real OpenAI API responses on diverse inputs
6. **Graceful error handling**: Parsing failures don't fail the request if DB save succeeds. Partial success is better than total failure

### What's next

- **Run manual tests with real OpenAI key**: Need to validate parsing accuracy on test cases. Iterate prompt if accuracy < 80%
- **Common parsing failures to watch for**:
  - "A bunch of basil" should parse unit as "bunch", not treat "bunch" as separate item
  - "2 tablespoons of oil" should extract unit as "tbsp" and quantity as 2
  - Adjectives like "fresh", "extra virgin" should be stripped or normalized
- **Prompt iteration strategy**: If tests fail, update systemPrompt in prompts.ts with more explicit examples and edge case handling
- **Integration test**: Once parsing is reliable, integrate with frontend inventory form (Task 4)
- **Meal suggestion endpoint**: Task 3 uses parseInventoryInput output to suggest recipes based on available ingredients

### Testing approach

Test file structure: `backend/tests/inventory.test.ts` with 3 test suites:
1. Simple quantities: "3 chicken breasts, 2 tomatoes" - tests basic parsing
2. Approximate quantities: "some rice, a bunch of spinach" - tests interpretation of vague language
3. Unit extraction: "200g beef, 2 cups flour" - tests metric and standard measurements

Manual testing: `backend/scripts/test-parsing.ts` runs 5 real-world test cases and reports pass rate. Goal is 80%+ accuracy before moving to Task 3.

### Code quality notes

- All utility functions are pure (no side effects) except client initialization
- Error messages are descriptive and help with debugging
- Type safety throughout: leveraging TypeScript's Omit, Partial, Pick utilities
- Comments explain the "why" not the "what" - code is self-documenting
- Consistent async/await pattern for all async operations
