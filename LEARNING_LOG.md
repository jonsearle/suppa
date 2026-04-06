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

### What's next

- Implement inventory parsing endpoint (Task 2) - use OpenAI to extract items from natural language
- Implement meal suggestion endpoint (Task 3) - use inventory to suggest recipes
- Build frontend components with real API integration (Task 4+)
- Iterate on UX based on actual usage patterns
