import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import {
  applyGenerateRecipesHandler,
  applyMealPlanDetailHandlers,
  mockMealPlan,
  mockPlannedMeal,
} from '../../__mocks__/mealPlanHandlers';
import MealPlanDetailPage from '../../pages/MealPlanDetailPage';
import { DAY_LABELS } from '../../lib/mealPlanDays';
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

  it('renders seven day cards and opens a day meal modal', async () => {
    const plan = mockMealPlan({
      id: 1,
      title: 'Spring Week',
      planned_meals: [
        mockPlannedMeal({ id: 10, day_index: 0, meal_name: 'Taco Tuesday' }),
        mockPlannedMeal({ id: 11, day_index: 2, meal_name: 'Pasta Night' }),
      ],
    });
    applyMealPlanDetailHandlers({ plan });

    const user = userEvent.setup();
    renderDetailPage(1);

    expect(await screen.findByRole('heading', { name: 'Spring Week' })).toBeInTheDocument();
    for (const label of DAY_LABELS) {
      expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByText('Taco Tuesday')).toBeInTheDocument();
    expect(screen.getByText('Pasta Night')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /taco tuesday/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /monday meal/i })).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/meal name/i)).toHaveValue('Taco Tuesday');
  });

  it('disables generate when no meals are filled in', async () => {
    const plan = mockMealPlan({
      id: 1,
      planned_meals: [mockPlannedMeal({ day_index: 0, meal_name: 'Monday' })],
    });
    applyMealPlanDetailHandlers({ plan });

    renderDetailPage(1);

    expect(await screen.findByRole('button', { name: /generate recipes/i })).toBeDisabled();
  });

  it('calls generateRecipes and disables the button while pending', async () => {
    const plan = mockMealPlan({
      id: 1,
      planned_meals: [mockPlannedMeal({ meal_name: 'Tacos', day_index: 0 })],
    });
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
