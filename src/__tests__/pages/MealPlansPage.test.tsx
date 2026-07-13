import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  applyMealPlansListHandlers,
  mockMealPlan,
} from '../../__mocks__/mealPlanHandlers';
import MealPlansPage from '../../pages/MealPlansPage';
import { renderWithProviders } from '../utils';

describe('MealPlansPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders plan cards from the list query', async () => {
    applyMealPlansListHandlers({
      plans: [
        mockMealPlan({ id: 1, title: 'Spring Week', meal_count: 3 }),
        mockMealPlan({
          id: 2,
          title: 'Summer Week',
          start_date: '2026-07-01',
          end_date: '2026-07-07',
          meal_count: 5,
        }),
      ],
    });

    renderWithProviders(<MealPlansPage />, { initialEntries: ['/'] });

    expect(await screen.findByText('Spring Week')).toBeInTheDocument();
    expect(screen.getByText('Summer Week')).toBeInTheDocument();
    expect(screen.getByText('2026-04-14 to 2026-04-20')).toBeInTheDocument();
    expect(screen.getByText('3 meals')).toBeInTheDocument();
    expect(screen.getByText('5 meals')).toBeInTheDocument();
  });

  it('shows an empty state when there are no plans', async () => {
    applyMealPlansListHandlers({ plans: [] });

    renderWithProviders(<MealPlansPage />, { initialEntries: ['/'] });

    expect(
      await screen.findByText(/no meal plans yet/i),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /new plan/i }).length).toBeGreaterThan(0);
  });

  it('opens the create dialog from the New plan button', async () => {
    applyMealPlansListHandlers({ plans: [] });
    const user = userEvent.setup();

    renderWithProviders(<MealPlansPage />, { initialEntries: ['/'] });

    await screen.findByText(/no meal plans yet/i);
    await user.click(screen.getAllByRole('button', { name: /new plan/i })[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /new meal plan/i })).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/plan title/i)).toBeInTheDocument();
  });
});
