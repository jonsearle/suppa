# Frontend Architecture - Suppa

## Overview

The Suppa frontend is a single-page React application built with TypeScript and Tailwind CSS. It provides a tab-based interface for:
1. Managing food inventory (natural language input)
2. Getting meal suggestions based on available ingredients
3. Viewing full recipe details
4. Confirming ingredient deductions before cooking

## Directory Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── InventoryForm.tsx     # Add and display inventory
│   │   ├── Chat.tsx              # Get meal suggestions
│   │   ├── RecipeCard.tsx        # Recipe summary card
│   │   ├── RecipeDetail.tsx      # Full recipe view
│   │   ├── CookingConfirm.tsx    # Confirm ingredients before deduction
│   │   └── index.ts              # Component exports
│   ├── services/            # API communication
│   │   └── api.ts                # Backend API client
│   ├── types/               # TypeScript interfaces
│   │   └── index.ts              # All shared types
│   ├── App.tsx              # Main app layout with tabs
│   ├── App.css              # App-level styles (mostly Tailwind)
│   ├── index.tsx            # React entry point
│   └── index.css            # Global styles with Tailwind directives
├── public/
│   └── index.html           # HTML entry point
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
└── TESTING_CHECKLIST.md     # Manual testing guide
```

## Component Architecture

### InventoryForm
- **Purpose**: Allow users to add inventory using natural language
- **Props**: `onInventoryUpdate?: (items: InventoryItem[]) => void`
- **Features**:
  - Textarea input for natural language inventory
  - Calls `addInventory()` API on submit
  - Displays active inventory list
  - Shows approximate items with visual badge
  - Handles loading and error states

### Chat
- **Purpose**: Get meal suggestions based on meal type
- **Props**: `onSelectRecipe?: (recipe: Recipe) => void`
- **Features**:
  - Meal type selector (breakfast/lunch/dinner)
  - "Suggest Meals" button triggers API call
  - Displays recipe cards in responsive grid
  - Loading spinner during API call
  - Empty state message if no suggestions

### RecipeCard
- **Purpose**: Display recipe summary in grid
- **Props**:
  - `recipe: Recipe`
  - `onSelect?: () => void`
- **Features**:
  - Shows name, description, time estimate
  - "View Recipe" button
  - Hover effect
  - Simple, compact design

### RecipeDetail
- **Purpose**: Show full recipe with ingredients and instructions
- **Props**:
  - `recipe: Recipe`
  - `onStartCooking?: (sessionId, ingredients) => void`
  - `onBack?: () => void`
- **Features**:
  - Loads full recipe via `getRecipeDetail()` API
  - Lists all ingredients with quantities
  - Step-by-step numbered instructions
  - "Start Cooking" button initiates cooking flow
  - "Back" button returns to suggestions

### CookingConfirm
- **Purpose**: Confirm ingredients before deducting from inventory
- **Props**:
  - `sessionId: string`
  - `recipeName: string`
  - `ingredientsToDeduct: InventoryItem[]`
  - `onConfirm?: () => void`
  - `onCancel?: () => void`
- **Features**:
  - Lists ingredients with quantities
  - Highlights approximate items in yellow
  - Warning message for approximate items
  - "Confirm & Deduct" calls `completeCooking()` API
  - "Cancel" button exits without changes
  - Implements recoverability principle

### App
- **Purpose**: Main layout with tab-based navigation
- **State**:
  - `currentTab`: 'inventory' | 'suggestions' | 'cooking'
  - `selectedRecipe`: Current recipe being viewed
  - `cookingState`: Active cooking session details
- **Features**:
  - Three tabs: Inventory, Suggestions, Cooking (conditional)
  - Renders appropriate component per tab
  - Manages state transitions
  - Responsive header and footer

## API Client Service

**Location**: `src/services/api.ts`

### Functions

```typescript
// Add inventory items from natural language input
addInventory(userInput: string): Promise<InventoryItem[]>

// Get current active inventory
getInventory(): Promise<InventoryItem[]>

// Get meal suggestions for a meal type
suggestMeals(mealType: 'breakfast' | 'lunch' | 'dinner'): Promise<MealSuggestions>

// Get full recipe details
getRecipeDetail(recipe: Recipe): Promise<RecipeDetail>

// Start cooking - returns ingredients to deduct
startCooking(recipe: RecipeDetail): Promise<{ sessionId: string; ingredientsToDeduct: InventoryItem[] }>

// Complete cooking and deduct ingredients
completeCooking(sessionId: string, recipeName: string, ingredientsUsed: Array<{ inventory_item_id: string; quantity: number }>): Promise<void>
```

### Error Handling

All functions throw `ApiError` on failure:
- Network failures: "Connection failed. Is the backend running?"
- Server errors: Forwarded error message from backend
- JSON parse failures: "An unexpected error occurred"

## Type Definitions

**Location**: `src/types/index.ts`

### Backend Models
- `User`, `InventoryItem`, `ChatMessage`
- `Recipe`, `RecipeDetail`, `MealSuggestions`
- `CookingState`, `ApiError`, `ApiSuccess`

### API Requests
- `AddInventoryRequest`, `SuggestMealsRequest`
- `StartCookingRequest`, `CompleteCookingRequest`

### UI State
- `UiState`, `InventoryFormState`, `SuggestionsState`
- `CookingConfirmState`

## State Management

**Approach**: React hooks (no external state management)

Each component manages its own state:
- `useState` for component data (input, loaded recipes, etc.)
- `useEffect` for side effects (loading data on mount)

App-level state in App.tsx:
- `currentTab`: Which tab is active
- `selectedRecipe`: Selected recipe for detail view
- `cookingState`: Active cooking session

This approach is sufficient for MVP. Phase 1 can add Redux/Zustand if state becomes complex.

## Styling

**Approach**: Tailwind CSS utility-first

### Color Scheme
- Primary: Blue (`bg-blue-600`, `text-blue-600`)
- Success: Green (`bg-green-600`)
- Warning: Yellow (`bg-yellow-100`, `text-yellow-800`)
- Error: Red (`bg-red-50`, `text-red-700`)

### Spacing
- Uses Tailwind spacing scale (p-4, m-2, gap-3, etc.)
- Mobile-first responsive design

### Components
- Cards: `rounded-lg shadow-md`
- Buttons: `rounded-lg font-medium py-2 px-4`
- Inputs: `border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500`
- Badges: `inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded`

## Data Flow

```
Inventory Tab:
User Input → addInventory() → API → items displayed

Suggestions Tab:
Meal Type Selected → suggestMeals() → API → recipe cards displayed

Recipe Detail:
Recipe Card Selected → getRecipeDetail() → API → full recipe displayed

Cooking:
Start Cooking → startCooking() → API → confirmation dialog
Confirm → completeCooking() → API → inventory updated
```

## Responsive Design

Built mobile-first with Tailwind:
- **Mobile (< 640px)**: Single column, full-width
- **Tablet (640px - 1024px)**: 2-column layout for cards
- **Desktop (> 1024px)**: 2-column cards, max-width container

Key responsive classes:
- `grid grid-cols-1 md:grid-cols-2` for recipe card grid
- `max-w-6xl mx-auto` for container max-width
- `px-4 sm:px-6 lg:px-8` for responsive padding

## Loading States

All async operations show feedback:
- Button: disabled state + "Loading..." text
- Page sections: spinning animation + message
- Never silently fail - always show error message

## Error Handling

Error display strategy:
1. **Near the action**: Errors appear by the button that caused them
2. **Specific messages**: "Connection failed" vs "Invalid input"
3. **Actionable**: Tell user how to recover ("Try again", "Check network")
4. **Non-blocking**: Errors don't prevent retrying

## Performance Considerations

- **Bundle size**: ~50KB (React + Tailwind, no optimization yet)
- **API latency**: 1-2 seconds (mostly LLM generation)
- **Component render**: <100ms (simple state, no complex computations)
- **Loading feedback**: Spinner helps perceived performance

## Accessibility (MVP)

- Semantic HTML (buttons, forms, lists)
- Alt text for icons (using emoji for now)
- Keyboard navigation (no custom handlers needed)
- Color not sole indicator of state (text + color used)

Phase 1 enhancements:
- ARIA labels
- Focus management
- Keyboard shortcuts
- Screen reader testing

## Testing

**Current**: Manual testing via checklist (see TESTING_CHECKLIST.md)

**Phase 1 improvements**:
- Unit tests (React Testing Library)
- Integration tests (component interaction)
- E2E tests (Playwright/Cypress)
- Visual regression tests

## Environment Variables

```bash
# Backend API URL (defaults to http://localhost:8888)
REACT_APP_API_URL=http://localhost:8888
```

## Running the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server (port 3000)
npm start

# Build for production
npm build

# Run tests (when added)
npm test
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- IE11 not supported (React 18 requirement)

## Future Enhancements (Phase 1+)

1. **Authentication**: Replace hardcoded USER_ID with real auth
2. **Persistent sessions**: Store cooking sessions in DB
3. **Recipe history**: Track completed meals
4. **Favorites**: Bookmark favorite recipes
5. **Recipe scaling**: Adjust portions
6. **Dietary filters**: Filter by restrictions
7. **Cost estimates**: Show estimated meal cost
8. **Real-time updates**: WebSocket for collaborative cooking
9. **Offline support**: Service worker for PWA
10. **Dark mode**: Theme toggle

## Troubleshooting

### Backend not connecting
- Ensure backend running on http://localhost:8888
- Check REACT_APP_API_URL environment variable
- Look for CORS errors in console

### Components not rendering
- Check TypeScript errors (npm run build)
- Verify API response format matches types
- Check browser console for React warnings

### API calls failing
- Verify backend endpoints are implemented
- Check request/response types in api.ts
- Look at Network tab in DevTools

## Code Style

- TypeScript strict mode enabled
- Functional components with hooks
- No class components
- Props destructured in function parameters
- Component names PascalCase
- Functions camelCase
- No `any` types

## Next Steps

See main README.md and LEARNING_LOG.md for project context and decision rationale.
