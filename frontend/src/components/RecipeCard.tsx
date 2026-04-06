import React from 'react';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {recipe.name}
        </h3>

        <p className="text-gray-600 text-sm mb-4 flex-grow">
          {recipe.description}
        </p>

        <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-200">
          <div className="flex items-center text-gray-500 text-sm">
            <span className="mr-1">⏱️</span>
            {recipe.time_estimate_mins} mins
          </div>
        </div>

        <button
          onClick={onSelect}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          View Recipe
        </button>
      </div>
    </div>
  );
};

export default RecipeCard;
