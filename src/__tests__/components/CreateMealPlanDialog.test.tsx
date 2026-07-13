import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import {
  applyCreateMealPlanHandler,
  mockMealPlan,
} from '../../__mocks__/mealPlanHandlers';
import { CreateMealPlanDialog } from '../../components/CreateMealPlanDialog';
import { renderWithProviders } from '../utils';

function PathProbe() {
  const { pathname } = useLocation();
  return <div data-testid="pathname">{pathname}</div>;
}

function renderDialog() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={
          <>
            <PathProbe />
            <CreateMealPlanDialog open onClose={() => {}} />
          </>
        }
      />
      <Route path="/meal-plans/:id" element={<PathProbe />} />
    </Routes>,
    { initialEntries: ['/'] },
  );
}

describe('CreateMealPlanDialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('validates required fields before submit', async () => {
    const user = userEvent.setup();
    renderDialog();

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /create plan/i }));

    expect(await within(dialog).findByText('Title is required')).toBeInTheDocument();
    expect(within(dialog).getByText('Start date is required')).toBeInTheDocument();
  });

  it('submits the mutation and navigates to the new plan on success', async () => {
    let postedBody: unknown;
    applyCreateMealPlanHandler({
      plan: mockMealPlan({ id: 42, title: 'New Week' }),
      onRequest: (body) => {
        postedBody = body;
      },
    });

    const user = userEvent.setup();
    renderDialog();

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/plan title/i), 'New Week');
    await user.type(within(dialog).getByLabelText(/start date/i), '2026-04-14');
    await user.type(within(dialog).getByLabelText(/monday meal/i), 'Tacos');
    await user.click(within(dialog).getByRole('button', { name: /create plan/i }));

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/meal-plans/42');
    });

    expect(postedBody).toMatchObject({
      title: 'New Week',
      start_date: '2026-04-14',
      end_date: '2026-04-20',
      planned_meals: [
        expect.objectContaining({
          day_index: 0,
          meal_name: 'Tacos',
          courses: [{ role: 'entree', description: null }],
        }),
      ],
    });
  });
});
