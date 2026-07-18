import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import {
  applyMealPlanDetailHandlers,
  applyUpdateMealPlanHandler,
  mockMealPlan,
} from '../../__mocks__/mealPlanHandlers';
import MealPlanDetailPage from '../../pages/MealPlanDetailPage';
import type { MealPlanWeekUpdate } from '../../types/mealPlan';
import { renderWithProviders } from '../utils';

function renderDetailPage(planId = 1) {
  return renderWithProviders(
    <Routes>
      <Route path="/meal-plans/:id" element={<MealPlanDetailPage />} />
    </Routes>,
    { initialEntries: [`/meal-plans/${planId}`] },
  );
}

describe('DayMealDialog persistence', () => {
  afterEach(() => {
    cleanup();
  });

  it('persists a newly added meal name on the day card', async () => {
    const plan = mockMealPlan({
      id: 1,
      title: 'Week of July 13th',
      planned_meals: [],
    });
    applyMealPlanDetailHandlers({ plan });

    let putBody: MealPlanWeekUpdate | undefined;
    applyUpdateMealPlanHandler({
      plan,
      onRequest: (body) => {
        putBody = body;
      },
    });

    const user = userEvent.setup();
    renderDetailPage(1);

    await screen.findByRole('heading', { name: 'Week of July 13th' });
    await user.click(screen.getByRole('button', { name: /monday.*add meal/i }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/meal name/i), 'Chicken Tacos');
    await user.click(within(dialog).getByRole('button', { name: /save meal/i }));

    await waitFor(() => {
      expect(putBody?.planned_meals).toEqual([
        expect.objectContaining({
          day_index: 0,
          meal_name: 'Chicken Tacos',
        }),
      ]);
    });

    expect(await screen.findByText('Chicken Tacos')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
