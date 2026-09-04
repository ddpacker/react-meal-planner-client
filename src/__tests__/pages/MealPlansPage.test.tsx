import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import {
  applyCreateMealPlanHandler,
  applyMealPlansListHandlers,
  mockMealPlan,
  mockMealPlanSummary,
} from '../../__mocks__/mealPlanHandlers';
import MealPlansPage from '../../pages/MealPlansPage';
import { renderWithProviders } from '../utils';

function PathProbe() {
  const { pathname } = useLocation();
  return <div data-testid="pathname">{pathname}</div>;
}

function renderMealPlansPage() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={
          <>
            <PathProbe />
            <MealPlansPage />
          </>
        }
      />
      <Route path="/meal-plans/:id" element={<PathProbe />} />
    </Routes>,
    { initialEntries: ['/'] },
  );
}

describe('MealPlansPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 6, 13, 12, 0, 0)); // Monday Jul 13, 2026
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders week-of titles for carousel slots', async () => {
    applyMealPlansListHandlers({
      plans: [
        mockMealPlanSummary({
          id: 1,
          start_date: '2026-07-13',
          end_date: '2026-07-19',
          meal_count: 3,
        }),
        mockMealPlanSummary({
          id: 2,
          start_date: '2026-06-29',
          end_date: '2026-07-05',
          meal_count: 5,
        }),
      ],
    });

    renderMealPlansPage();

    expect(await screen.findByText('Week of July 13th')).toBeInTheDocument();
    expect(screen.getByText('Week of June 29th')).toBeInTheDocument();
    expect(screen.getByText('3 meals')).toBeInTheDocument();
    expect(screen.getByText('5 meals')).toBeInTheDocument();
    expect(screen.getByText('Week of July 20th')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new plan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('navigates to an existing plan when its card is clicked', async () => {
    applyMealPlansListHandlers({
      plans: [
        mockMealPlanSummary({
          id: 7,
          start_date: '2026-07-13',
          end_date: '2026-07-19',
          meal_count: 2,
        }),
      ],
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderMealPlansPage();

    await screen.findByText('Week of July 13th');
    await user.click(screen.getByRole('button', { name: /week of july 13th/i }));

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/meal-plans/7');
    });
  });

  it('creates a plan when an empty forward slot is clicked', async () => {
    applyMealPlansListHandlers({ plans: [] });
    let postedBody: unknown;
    applyCreateMealPlanHandler({
      plan: mockMealPlan({
        id: 42,
        title: 'Week of July 20th',
        start_date: '2026-07-20',
        end_date: '2026-07-26',
      }),
      onRequest: (body) => {
        postedBody = body;
      },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderMealPlansPage();

    await screen.findByText('Week of July 20th');
    await user.click(screen.getByRole('button', { name: /week of july 20th/i }));

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/meal-plans/42');
    });

    expect(postedBody).toMatchObject({
      title: 'Week of July 20th',
      start_date: '2026-07-20',
      end_date: '2026-07-26',
      planned_meals: [],
    });
  });

  it('creates the current week (Monday of this week) when that empty slot is clicked', async () => {
    vi.setSystemTime(new Date(2026, 6, 14, 12, 0, 0)); // Tuesday Jul 14
    applyMealPlansListHandlers({ plans: [] });
    let postedBody: unknown;
    applyCreateMealPlanHandler({
      plan: mockMealPlan({ id: 43, title: 'Week of July 13th' }),
      onRequest: (body) => {
        postedBody = body;
      },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderMealPlansPage();

    await screen.findByText('Week of July 13th');
    await user.click(screen.getByRole('button', { name: /week of july 13th/i }));

    await waitFor(() => {
      expect(postedBody).toMatchObject({
        title: 'Week of July 13th',
        start_date: '2026-07-13',
        end_date: '2026-07-19',
      });
    });
  });
});
