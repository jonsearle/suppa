# Suppa - Conversational Meal Discovery MVP

A conversational AI meal planning assistant that helps users discover recipes based on their available ingredients.

**Tech Stack:** React 18 + TypeScript + Tailwind (frontend), Node.js + Express on Netlify Functions (backend), Supabase PostgreSQL, OpenAI API

**Status:** Iteration 1 - Project structure and schema setup complete

## Project Setup

### Prerequisites

- Node.js v18+ and npm
- Supabase account (https://supabase.com/)
- OpenAI API key (https://platform.openai.com/)

### Quick Start

1. **Install dependencies**

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

2. **Set up Supabase**

- Create a Supabase project
- Go to SQL Editor and run the setup script from `docs/DATABASE.md`
- Copy your project URL and anon key

3. **Configure environment variables**

**frontend/.env.local:**
```
REACT_APP_API_URL=http://localhost:8888
```

**backend/.env.local:**
```
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-key>
OPENAI_API_KEY=<your-openai-key>
USER_ID=test-user-001
```

4. **Run development servers**

```bash
# Terminal 1: Backend (Netlify Functions)
cd backend
npm run dev

# Terminal 2: Frontend (React dev server)
cd frontend
npm start
```

Frontend will be at `http://localhost:3000`
Backend will be at `http://localhost:8888`

## Project Structure

```
.
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components (Chat, InventoryForm, etc.)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   ├── types/        # TypeScript interfaces
│   │   └── App.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── backend/               # Node/Express backend
│   ├── netlify/
│   │   └── functions/
│   │       ├── api.ts    # Main server
│   │       ├── api/      # Endpoint handlers
│   │       └── shared/   # Shared types
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── netlify.toml
│
└── docs/
    └── DATABASE.md       # Schema documentation
```

## Development

### Running Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

## Database Schema

See `docs/DATABASE.md` for complete schema documentation.

**Main tables:**
- `users` - User accounts
- `inventory_items` - Available ingredients
- `chat_messages` - Conversation history

## API Endpoints (To be implemented)

- `POST /api/inventory` - Add inventory items
- `GET /api/inventory` - Get active inventory
- `POST /api/chat` - Send chat message
- `POST /api/cooking/start` - Start cooking
- `POST /api/cooking/complete` - Mark cooking complete

## Next Steps

- Implement inventory parsing endpoint (Task 2)
- Implement meal suggestion endpoint (Task 3)
- Build frontend components (Task 4+)
- Iterate on UX based on real usage
