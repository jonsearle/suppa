import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CookingConfirm } from './CookingConfirm';
import * as api from '../services/api';
import type { RecipeDetail } from '../types';

// Mock the API service
jest.mock('../services/api');

const mockRecipe: RecipeDetail = {
  name: 'Simple Pasta',
  description: 'A simple pasta dish',
  time_estimate_mins: 20,
  ingredients: [
    { name: 'flour', quantity: 300, unit: 'g' },
    { name: 'eggs', quantity: 2, unit: 'pieces' },
    { name: 'milk', quantity: 200, unit: 'ml' }
  ],
  instructions: ['Cook pasta', 'Add sauce']
};

describe('CookingConfirm - Recipe Adjustment Conversation', () => {
  const defaultProps = {
    sessionId: 'test-session-123',
    recipe: mockRecipe,
    onComplete: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State - Adjustment Input', () => {
    it('displays recipe details with name and ingredients', () => {
      render(<CookingConfirm {...defaultProps} />);

      expect(screen.getByText('Simple Pasta')).toBeInTheDocument();
      expect(screen.getByText(/flour/i)).toBeInTheDocument();
      expect(screen.getByText(/eggs/i)).toBeInTheDocument();
      expect(screen.getByText(/milk/i)).toBeInTheDocument();
    });

    it('displays adjustment input field with helpful placeholder', () => {
      render(<CookingConfirm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Examples.*only have/i) as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe('');
    });

    it('displays Continue button that is enabled by default', () => {
      render(<CookingConfirm {...defaultProps} />);

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      expect(continueBtn).toBeInTheDocument();
      expect(continueBtn).not.toBeDisabled();
    });

    it('displays Cancel button', () => {
      render(<CookingConfirm {...defaultProps} />);

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      expect(cancelBtn).toBeInTheDocument();
    });

    it('calls onCancel when Cancel button is clicked', () => {
      render(<CookingConfirm {...defaultProps} />);

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Processing Adjustments', () => {
    it('goes to deduction step when no adjustment text is entered', async () => {
      render(<CookingConfirm {...defaultProps} />);

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText(/ready to cook/i)).toBeInTheDocument();
      });
    });

    it('calls confirmRecipeAdjustments when user enters adjustment text', async () => {
      const mockUpdatedRecipe: RecipeDetail = {
        ...mockRecipe,
        ingredients: [
          { name: 'flour', quantity: 250, unit: 'g' },
          { name: 'eggs', quantity: 2, unit: 'pieces' },
          { name: 'milk', quantity: 200, unit: 'ml' }
        ]
      };

      (api.confirmRecipeAdjustments as jest.Mock).mockResolvedValue({
        recipe: mockUpdatedRecipe,
        ingredients_to_deduct: mockUpdatedRecipe.ingredients
      });

      render(<CookingConfirm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Examples.*only have/i);
      fireEvent.change(textarea, { target: { value: 'I only have 250g flour' } });

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(api.confirmRecipeAdjustments).toHaveBeenCalledWith(
          'test-session-123',
          'I only have 250g flour'
        );
      });
    });

    it('disables button while processing adjustments', async () => {
      (api.confirmRecipeAdjustments as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          recipe: mockRecipe,
          ingredients_to_deduct: mockRecipe.ingredients as any
        }), 100))
      );

      render(<CookingConfirm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Examples.*only have/i);
      fireEvent.change(textarea, { target: { value: 'Some adjustment' } });

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      expect(continueBtn).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText(/ready to cook/i)).toBeInTheDocument();
      });
    });

    it('displays error message when confirmRecipeAdjustments fails', async () => {
      (api.confirmRecipeAdjustments as jest.Mock).mockRejectedValue(
        new Error('Failed to confirm adjustments')
      );

      render(<CookingConfirm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Examples.*only have/i);
      fireEvent.change(textarea, { target: { value: 'Some adjustment' } });

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText(/failed to confirm adjustments/i)).toBeInTheDocument();
      });
    });
  });

  describe('Deduction Step', () => {
    it('displays deduction confirmation after successful adjustment', async () => {
      const mockUpdatedRecipe: RecipeDetail = {
        ...mockRecipe,
        ingredients: [
          { name: 'flour', quantity: 250, unit: 'g' },
          { name: 'eggs', quantity: 2, unit: 'pieces' },
          { name: 'milk', quantity: 200, unit: 'ml' }
        ]
      };

      (api.confirmRecipeAdjustments as jest.Mock).mockResolvedValue({
        recipe: mockUpdatedRecipe,
        ingredients_to_deduct: mockUpdatedRecipe.ingredients
      });

      render(<CookingConfirm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Examples.*only have/i);
      fireEvent.change(textarea, { target: { value: 'I only have 250g flour' } });

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText(/ready to cook/i)).toBeInTheDocument();
        expect(screen.getByText(/250g flour/)).toBeInTheDocument();
      });
    });

    it('displays original recipe ingredients when no adjustments made', async () => {
      render(<CookingConfirm {...defaultProps} />);

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText(/ready to cook/i)).toBeInTheDocument();
        expect(screen.getByText(/300g flour/)).toBeInTheDocument();
      });
    });

    it('calls completeCooking when Complete & Deduct button is clicked', async () => {
      (api.completeCooking as jest.Mock).mockResolvedValue({
        recipeName: 'Simple Pasta',
        deductedItems: [],
        inventoryAfter: []
      });

      render(<CookingConfirm {...defaultProps} />);

      // Go to deduction step
      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText(/ready to cook/i)).toBeInTheDocument();
      });

      // Find and click Complete & Deduct button
      const completeBtn = screen.getByRole('button', { name: /complete.*deduct/i });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(api.completeCooking).toHaveBeenCalledWith('test-session-123', 'Simple Pasta', []);
      });
    });

    it('calls onComplete callback after successful deduction', async () => {
      (api.completeCooking as jest.Mock).mockResolvedValue({
        recipeName: 'Simple Pasta',
        deductedItems: [],
        inventoryAfter: []
      });

      render(<CookingConfirm {...defaultProps} />);

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText(/ready to cook/i)).toBeInTheDocument();
      });

      const completeBtn = screen.getByRole('button', { name: /complete.*deduct/i });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('displays error when completeCooking fails', async () => {
      (api.completeCooking as jest.Mock).mockRejectedValue(
        new Error('Failed to complete cooking')
      );

      render(<CookingConfirm {...defaultProps} />);

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText(/ready to cook/i)).toBeInTheDocument();
      });

      const completeBtn = screen.getByRole('button', { name: /complete.*deduct/i });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(screen.getByText(/failed to complete cooking/i)).toBeInTheDocument();
      });
    });

    it('allows user to go back to input step', async () => {
      render(<CookingConfirm {...defaultProps} />);

      const continueBtn = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText(/ready to cook/i)).toBeInTheDocument();
      });

      const backBtn = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backBtn);

      await waitFor(() => {
        expect(screen.getByText(/want to make any adjustments/i)).toBeInTheDocument();
      });
    });
  });
});
