import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import {
  applyGenerateRecipesHandler,
  applyMealPlanDetailHandlers,
  mockMealPlan,
  mockPlannedMeal,
} from '../../__mocks__/mealPlanHandlers';
import MealPlanDetailPage from '../../pages/MealPlanDetailPage';
import { renderWithProviders } from '../utils';

function renderDetailPage(planId = 1) {
  return renderWithProviders(
    <Routes>
      <Route path="/meal-plans/:id" element={<MealPlanDetailPage />} />
    </Routes>,
    { initialEntries: [`/meal-plans/${planId}`] },
  );
}

describe('MealPlanDetailPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders planned meals in the weekly grid', async () => {
    const plan = mockMealPlan({
      id: 1,
      title: 'Spring Week',
      planned_meals: [
        mockPlannedMeal({ id: 10, day_index: 0, meal_name: 'Taco Tuesday' }),
        mockPlannedMeal({ id: 11, day_index: 2, meal_name: 'Pasta Night' }),
      ],
    });
    applyMealPlanDetailHandlers({ plan });

    renderDetailPage(1);

    expect(await screen.findByRole('heading', { name: 'Spring Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Taco Tuesday' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pasta Night' })).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Wednesday')).toBeInTheDocument();
  });

  it('calls generateRecipes and disables the button while pending', async () => {
    const plan = mockMealPlan({ id: 1 });
    applyMealPlanDetailHandlers({ plan });

    let generateCalled = false;
    applyGenerateRecipesHandler({
      plan,
      delayMs: 200,
      onRequest: () => {
        generateCalled = true;
      },
    });

    const user = userEvent.setup();
    renderDetailPage(1);

    const generateButton = await screen.findByRole('button', { name: /generate recipes/i });
    await user.click(generateButton);

    expect(generateButton).toBeDisabled();
    await waitFor(() => {
      expect(generateCalled).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate recipes/i })).toBeEnabled();
    });
  });
});
