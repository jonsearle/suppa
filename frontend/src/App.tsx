import React, { useState } from 'react';
import type { Recipe, RecipeDetail, InventoryItem } from './types';
import { InventoryForm } from './components/InventoryForm';
import { Chat } from './components/Chat';
import { RecipeDetail as RecipeDetailComponent } from './components/RecipeDetail';
import { CookingConfirm } from './components/CookingConfirm';
import './App.css';

type AppTab = 'inventory' | 'suggestions' | 'cooking';

interface CookingState {
  sessionId: string;
  recipeName: string;
  ingredients: InventoryItem[];
}

function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('inventory');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cookingState, setCookingState] = useState<CookingState | null>(null);

  const handleRecipeSelected = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCurrentTab('suggestions');
  };

  const handleStartCooking = (sessionId: string, ingredients: InventoryItem[]) => {
    setCookingState({
      sessionId,
      recipeName: selectedRecipe?.name || '',
      ingredients,
    });
    setCurrentTab('cooking');
  };

  const handleCookingComplete = () => {
    setSelectedRecipe(null);
    setCookingState(null);
    setCurrentTab('inventory');
  };

  const handleCancel = () => {
    setSelectedRecipe(null);
    setCookingState(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">🍽️ Suppa</h1>
            <p className="text-gray-600 mt-2">Conversational AI meal discovery</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 bg-white rounded-t-lg shadow-sm">
          <button
            onClick={() => setCurrentTab('inventory')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              currentTab === 'inventory'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📦 Inventory
          </button>
          <button
            onClick={() => setCurrentTab('suggestions')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              currentTab === 'suggestions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ✨ Suggestions
          </button>
          {cookingState && (
            <button
              onClick={() => setCurrentTab('cooking')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                currentTab === 'cooking'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🍳 Confirm
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg shadow-sm p-8">
          {currentTab === 'inventory' && (
            <InventoryForm onInventoryUpdate={() => {}} />
          )}

          {currentTab === 'suggestions' && !selectedRecipe && (
            <Chat onSelectRecipe={handleRecipeSelected} />
          )}

          {currentTab === 'suggestions' && selectedRecipe && (
            <RecipeDetailComponent
              recipe={selectedRecipe}
              onStartCooking={handleStartCooking}
              onBack={() => {
                setSelectedRecipe(null);
              }}
            />
          )}

          {currentTab === 'cooking' && cookingState && (
            <div className="flex items-center justify-center min-h-96">
              <CookingConfirm
                sessionId={cookingState.sessionId}
                recipeName={cookingState.recipeName}
                ingredientsToDeduct={cookingState.ingredients}
                onConfirm={handleCookingComplete}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-600">
          <p>Suppa - MVP Version • Day 6-7 Frontend</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
