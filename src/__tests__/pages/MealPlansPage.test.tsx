import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import {
  applyCreateMealPlanHandler,
  applyMealPlansListHandlers,
  mockMealPlan,
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

    renderMealPlansPage();

    expect(await screen.findByText('Spring Week')).toBeInTheDocument();
    expect(screen.getByText('Summer Week')).toBeInTheDocument();
    expect(screen.getByText('2026-04-14 to 2026-04-20')).toBeInTheDocument();
    expect(screen.getByText('3 meals')).toBeInTheDocument();
    expect(screen.getByText('5 meals')).toBeInTheDocument();
  });

  it('shows an empty state when there are no plans', async () => {
    applyMealPlansListHandlers({ plans: [] });

    renderMealPlansPage();

    expect(await screen.findByText(/no meal plans yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /new plan/i }).length).toBeGreaterThan(0);
  });

  it('creates a week starting this Monday and navigates to the new plan', async () => {
    applyMealPlansListHandlers({ plans: [] });
    let postedBody: unknown;
    applyCreateMealPlanHandler({
      plan: mockMealPlan({ id: 42, title: 'Week of July 13th' }),
      onRequest: (body) => {
        postedBody = body;
      },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderMealPlansPage();

    await screen.findByText(/no meal plans yet/i);
    await user.click(screen.getAllByRole('button', { name: /new plan/i })[0]);

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/meal-plans/42');
    });

    expect(postedBody).toMatchObject({
      title: 'Week of July 13th',
      start_date: '2026-07-13',
      end_date: '2026-07-19',
      planned_meals: [],
    });
  });

  it('uses the following Monday when today is not Monday', async () => {
    vi.setSystemTime(new Date(2026, 6, 14, 12, 0, 0)); // Tuesday Jul 14
    applyMealPlansListHandlers({ plans: [] });
    let postedBody: unknown;
    applyCreateMealPlanHandler({
      plan: mockMealPlan({ id: 43, title: 'Week of July 20th' }),
      onRequest: (body) => {
        postedBody = body;
      },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderMealPlansPage();

    await screen.findByText(/no meal plans yet/i);
    await user.click(screen.getAllByRole('button', { name: /new plan/i })[0]);

    await waitFor(() => {
      expect(postedBody).toMatchObject({
        title: 'Week of July 20th',
        start_date: '2026-07-20',
        end_date: '2026-07-26',
      });
    });
  });
});
