import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  applyNutritionHandlers,
  mockNutrition,
} from '../../__mocks__/recipeHandlers';
import { NutritionFactsPanel } from '../../components/NutritionFactsPanel';
import { renderWithProviders } from '../utils';

describe('NutritionFactsPanel', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders macros and micros for loaded nutrition', async () => {
    applyNutritionHandlers({
      recipeId: 1,
      nutrition: mockNutrition({
        calories: 320,
        fat_g: null,
        micro_nutrients_json: [
          { nutrient_id: 1087, name: 'Calcium, Ca', unit: 'MG', amount: 45 },
        ],
      }),
    });

    renderWithProviders(
      <NutritionFactsPanel recipeId={1} servings={4} />,
      {
        authState: { isAuthenticated: true, isLoading: false },
      },
    );

    expect(await screen.findByLabelText('Nutrition facts')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Calcium, Ca')).toBeInTheDocument();
    expect(screen.getByText(/45 mg/i)).toBeInTheDocument();
  });

  it('shows a calculate CTA when nutrition is missing', async () => {
    applyNutritionHandlers({
      recipeId: 2,
      nutrition: null,
      generated: mockNutrition({ recipe_id: 2, calories: 200 }),
    });

    const user = userEvent.setup();
    renderWithProviders(
      <NutritionFactsPanel recipeId={2} servings={2} />,
      {
        authState: { isAuthenticated: true, isLoading: false },
      },
    );

    expect(
      await screen.findByText(/Nutrition has not been calculated/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Calculate nutrition/i }),
    );

    expect(await screen.findByLabelText('Nutrition facts')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });
});
