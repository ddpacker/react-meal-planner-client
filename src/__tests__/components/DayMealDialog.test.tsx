import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import {
  applyGenerateCourseRecipeHandler,
  applyMealPlanDetailHandlers,
  applyUpdateMealPlanHandler,
  mockMealPlan,
  mockPlannedMeal,
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

  it('generates a recipe for a course and then shows a view link', async () => {
    const plan = mockMealPlan({
      id: 1,
      title: 'Week of July 13th',
      planned_meals: [
        mockPlannedMeal({
          id: 10,
          day_index: 0,
          meal_name: 'Taco Tuesday',
          courses: [
            {
              id: 100,
              role: 'entree',
              description: 'crispy tacos',
              recipe_id: null,
              created_at: '2026-04-14T00:00:00Z',
              updated_at: '2026-04-14T00:00:00Z',
            },
          ],
        }),
      ],
    });
    applyMealPlanDetailHandlers({ plan });

    let generateCalled = false;
    applyGenerateCourseRecipeHandler({
      plan,
      mealId: 10,
      courseId: 100,
      onRequest: () => {
        generateCalled = true;
      },
    });

    const user = userEvent.setup();
    renderDetailPage(1);

    await screen.findByRole('heading', { name: 'Week of July 13th' });
    await user.click(screen.getByRole('button', { name: /taco tuesday/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /generate recipe/i }));

    await waitFor(() => {
      expect(generateCalled).toBe(true);
    });

    expect(await within(dialog).findByText('Generated Tacos')).toBeInTheDocument();
    const viewLink = within(dialog).getByRole('link', { name: /view recipe/i });
    expect(viewLink).toHaveAttribute('href', '/recipes/501');
    expect(within(dialog).queryByLabelText(/description/i)).not.toBeInTheDocument();
  });

  it('spins only the course that is generating', async () => {
    const courseStamp = {
      created_at: '2026-04-14T00:00:00Z',
      updated_at: '2026-04-14T00:00:00Z',
    };
    const plan = mockMealPlan({
      id: 1,
      title: 'Week of July 13th',
      planned_meals: [
        mockPlannedMeal({
          id: 10,
          day_index: 0,
          meal_name: 'Taco Tuesday',
          courses: [
            {
              id: 100,
              role: 'entree',
              description: 'tacos',
              recipe_id: null,
              ...courseStamp,
            },
            {
              id: 101,
              role: 'side',
              description: 'rice',
              recipe_id: null,
              ...courseStamp,
            },
          ],
        }),
      ],
    });
    applyMealPlanDetailHandlers({ plan });
    applyGenerateCourseRecipeHandler({
      plan,
      mealId: 10,
      courseId: 100,
      delayMs: 400,
    });

    const user = userEvent.setup();
    renderDetailPage(1);

    await screen.findByRole('heading', { name: 'Week of July 13th' });
    await user.click(screen.getByRole('button', { name: /taco tuesday/i }));

    const dialog = await screen.findByRole('dialog');
    const generateButtons = within(dialog).getAllByRole('button', { name: /generate recipe/i });
    expect(generateButtons).toHaveLength(2);

    await user.click(generateButtons[0]);

    await waitFor(() => {
      expect(within(generateButtons[0]).getByRole('progressbar')).toBeInTheDocument();
    });
    expect(within(generateButtons[1]).queryByRole('progressbar')).not.toBeInTheDocument();
    expect(generateButtons[1]).not.toBeDisabled();
    expect(within(dialog).getByLabelText(/meal name/i)).not.toBeDisabled();
  });
});
