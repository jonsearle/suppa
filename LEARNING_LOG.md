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

---

## Day 4: Meal Suggestion API Testing & Iteration

### What I tried

- Created comprehensive Jest test suite for meal suggestion API (`tests/chat.test.ts`)
- Implemented 5 test cases covering diverse inventory scenarios:
  1. Italian dinner (chicken, tomatoes, basil, pasta)
  2. Breakfast (eggs, bread, butter)
  3. Asian lunch (rice, soy sauce, chicken, garlic, vegetables)
  4. Limited inventory (eggs and bread only)
  5. Pantry staples only (edge case)
- Built comprehensive manual testing script (`scripts/test-suggestions-comprehensive.ts`)
- Fixed import path issues in prompts.ts (relative path to shared/types)
- Set up Jest environment configuration to load .env.local with API key
- Created detailed testing documentation:
  - `MANUAL_TEST_GUIDE.md`: Instructions for running tests and evaluating results
  - `PROMPT_ANALYSIS.md`: Deep analysis of current prompt with proposed improvements

### Current State (Pre-Testing)

**Implementation Status**: Complete
- `suggestMeals()` function exists in `prompts.ts`
- System prompt includes hallucination prevention
- JSON-only response format enforced
- Meal type guidance included (breakfast/lunch/dinner)

**Test Suite Status**: Ready but Skipped
- Jest tests created and configured
- Tests skip by default (no OPENAI_API_KEY in environment)
- To run: `export OPENAI_API_KEY="sk-..." && npm test -- chat.test.ts`

**Manual Script Status**: Ready to execute
- `test-suggestions-comprehensive.ts` validates:
  - 3-5 suggestions per test (or fail gracefully for edge cases)
  - Diversity (no duplicate meal names)
  - No hallucinated ingredients
  - Informative descriptions (10+ chars minimum)
  - Reasonable time estimates (1-120 mins)
- Run with: `export OPENAI_API_KEY="sk-..." && npx ts-node scripts/test-suggestions-comprehensive.ts`

### Testing Approach

Tests are blocked on needing an actual OpenAI API key. The testing would follow this flow:

1. **Phase 1: Run Tests**
   - Execute Jest test suite with 5 test cases
   - Run comprehensive manual script
   - Document pass/fail results

2. **Phase 2: Analyze Results**
   - Identify patterns in failures (hallucination? diversity? time estimates?)
   - Evaluate response quality manually
   - Compare against evaluation criteria in MANUAL_TEST_GUIDE.md

3. **Phase 3: Iterate Prompts (if needed)**
   - Proposed improvements documented in PROMPT_ANALYSIS.md:
     - Improvement 1: Stronger hallucination prevention with explicit ingredient lists
     - Improvement 2: Explicit diversity requirement (no recipe variations)
     - Improvement 3: Specific time estimate ranges by meal type
     - Improvement 4: Edge case guidance (limited inventory, pantry-only)
     - Improvement 5: Concrete inventory matching examples

4. **Phase 4: Re-test and Document**
   - After each prompt change, re-run full test suite
   - Document findings in LEARNING_LOG.md
   - Commit changes once all tests pass

### Key Insights from Analysis

**Prompt Strengths**:
1. Clear JSON format requirement with examples
2. Explicit hallucination prevention lists (salt, oil, butter, spices, water)
3. Meal type guidance for time realism
4. Multiple ingredient emphasis for diversity
5. Realism constraint for home cooking

**Identified Weaknesses** (to watch during testing):
1. Hallucination prevention might not cover all cases (what about milk, cheese, vinegar, soy sauce?)
2. Diversity not explicitly required - might get variations of same recipe
3. Time estimate ranges not specific (unclear if "breakfast = quick/light" means 5-15 or 5-30 mins)
4. No guidance for edge cases (limited inventory, pantry-only scenarios)
5. Inventory format could be clearer (using "available" vs explicit "no quantity" notation)

### Technical Decisions

1. **Jest + ts-node hybrid approach**: Jest for structured tests (easier CI/CD), ts-node script for manual exploration
2. **Test blocking**: Tests skip gracefully when OPENAI_API_KEY not set, no hard failure
3. **Detailed documentation**: Created guides for non-technical testing and detailed prompt analysis
4. **Validation criteria**: Clear pass/fail criteria in comprehensive script (3-5 recipes, diversity, no hallucinations, reasonable times)

### What's Next

**To Complete Task 3**:
1. Obtain OPENAI_API_KEY from environment/secrets
2. Run tests: `export OPENAI_API_KEY="sk-..." && npm test -- chat.test.ts`
3. Run manual script: `export OPENAI_API_KEY="sk-..." && npx ts-node scripts/test-suggestions-comprehensive.ts`
4. Evaluate results against MANUAL_TEST_GUIDE.md criteria
5. If failures detected:
   - Identify root cause (hallucination, diversity, time estimates, etc.)
   - Apply relevant improvements from PROMPT_ANALYSIS.md
   - Update prompts.ts with improved systemPrompt
   - Re-run tests
6. Document all findings in LEARNING_LOG.md with:
   - What was tested
   - What worked/didn't work
   - Any prompt iterations and their impact
   - Key learnings about LLM evaluation

**Estimated Time to Complete**:
- Testing: 5-10 minutes (API calls are fast)
- Analysis: 10-15 minutes (manual review of results)
- Iteration (if needed): 10-20 minutes per cycle (prompt update + re-test)
- Documentation: 5 minutes (update LEARNING_LOG.md)

### Code Quality Notes

- All test cases have clear docstrings explaining what's being tested
- Comprehensive manual script has detailed validation criteria comments
- Prompt analysis document provides concrete before/after examples
- No mocking of OpenAI API - tests use real API calls for realistic evaluation
- Test infrastructure is DRY: reusable inventory item creation helper function
- Error handling covers both API failures and test assertion failures
