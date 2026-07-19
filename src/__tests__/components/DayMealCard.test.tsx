import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { DayMealCard } from '../../components/DayMealCard';
import { mockPlannedMeal } from '../../__mocks__/mealPlanHandlers';
import { renderWithProviders } from '../utils';

describe('DayMealCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('links courses with recipe_id to recipe detail pages', () => {
    const meal = mockPlannedMeal({
      meal_name: 'Chinese Night',
      courses: [
        {
          id: 21,
          role: 'entree',
          description: 'Chicken Teriyaki',
          recipe_id: 16,
          created_at: '2026-07-14T00:32:46.766345Z',
          updated_at: '2026-07-14T00:32:46.766345Z',
        },
        {
          id: 22,
          role: 'side',
          description: 'Fried Rice',
          recipe_id: 17,
          created_at: '2026-07-14T00:32:46.766345Z',
          updated_at: '2026-07-14T00:32:46.766345Z',
        },
      ],
    });

    renderWithProviders(
      <Routes>
        <Route
          path="/meal-plans/1"
          element={<DayMealCard dayIndex={0} meal={meal} onOpen={() => {}} />}
        />
      </Routes>,
      { initialEntries: ['/meal-plans/1'] },
    );

    const teriyaki = screen.getByRole('link', { name: 'Chicken Teriyaki' });
    const friedRice = screen.getByRole('link', { name: 'Fried Rice' });
    expect(teriyaki).toHaveAttribute('href', '/recipes/16');
    expect(friedRice).toHaveAttribute('href', '/recipes/17');
  });

  it('shows no-recipes state when courses lack recipe_id', () => {
    const meal = mockPlannedMeal({
      meal_name: 'Draft Night',
      courses: [
        {
          id: 21,
          role: 'entree',
          description: 'Something tasty',
          recipe_id: null,
          created_at: '2026-07-14T00:32:46.766345Z',
          updated_at: '2026-07-14T00:32:46.766345Z',
        },
      ],
    });

    renderWithProviders(
      <DayMealCard dayIndex={0} meal={meal} onOpen={() => {}} />,
    );

    expect(screen.getByText(/no recipes yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
