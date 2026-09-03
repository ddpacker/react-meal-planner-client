import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import {
  applyNutritionHandlers,
  applyRecipeDetailHandlers,
  mockNutrition,
  mockRecipe,
  mockRecipeIngredient,
} from '../../__mocks__/recipeHandlers';
import RecipeDetailPage from '../../pages/RecipeDetailPage';
import { renderWithProviders } from '../utils';

function renderDetailPage(
  recipeId = 1,
  authState?: { unitSystem?: 'metric' | 'imperial' },
) {
  return renderWithProviders(
    <Routes>
      <Route path="/recipes/:id" element={<RecipeDetailPage />} />
    </Routes>,
    {
      initialEntries: [`/recipes/${recipeId}`],
      authState: {
        isAuthenticated: true,
        isLoading: false,
        unitSystem: authState?.unitSystem ?? 'metric',
      },
    },
  );
}

describe('RecipeDetailPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders ingredients with metric formatting and an AI badge', async () => {
    applyRecipeDetailHandlers({
      recipe: mockRecipe({
        id: 1,
        title: 'AI Chili',
        source_model: 'gpt-4',
        ingredients: [
          mockRecipeIngredient({
            id: 10,
            quantity: 500,
            unit: 'gram',
            ingredient: { id: 2, name: 'Beans', category: 'Pantry' },
          }),
        ],
      }),
    });

    renderDetailPage(1);

    expect(await screen.findByRole('heading', { name: 'AI Chili' })).toBeInTheDocument();
    expect(screen.getByText('AI-generated')).toBeInTheDocument();
    expect(screen.getByText('Beans')).toBeInTheDocument();
    expect(screen.getByText(/500 g/)).toBeInTheDocument();
  });

  it('formats ingredient quantities for imperial preference', async () => {
    applyRecipeDetailHandlers({
      recipe: mockRecipe({
        ingredients: [
          mockRecipeIngredient({
            id: 10,
            quantity: 500,
            unit: 'gram',
            ingredient: { id: 3, name: 'Flour', category: 'Pantry' },
          }),
        ],
      }),
    });

    renderDetailPage(1, { unitSystem: 'imperial' });

    expect(await screen.findByText('Flour')).toBeInTheDocument();
    expect(screen.getByText(/1\.1 lb/)).toBeInTheDocument();
  });

  it('renders nested ingredient name with a plain numeric quantity', async () => {
    applyRecipeDetailHandlers({
      recipe: mockRecipe({
        ingredients: [
          mockRecipeIngredient({
            id: 224,
            quantity: 700,
            unit: 'gram',
            ingredient: {
              id: 34,
              name: 'ground beef (80/20)',
              category: 'Meat',
            },
          }),
        ],
      }),
    });

    renderDetailPage(1);

    expect(await screen.findByText('ground beef (80/20)')).toBeInTheDocument();
    expect(screen.getByText(/700 g/)).toBeInTheDocument();
    expect(screen.getByText(/\(Meat\)/)).toBeInTheDocument();
  });

  it('renders ordered steps below ingredients', async () => {
    applyRecipeDetailHandlers({
      recipe: mockRecipe({
        steps: [
          {
            id: 146,
            step_number: 2,
            text: 'Make the sriracha mayo.',
          },
          {
            id: 145,
            step_number: 1,
            text: 'Make the quick pickled slaw.',
          },
        ],
      }),
    });

    renderDetailPage(1);

    expect(await screen.findByRole('heading', { name: 'Steps' })).toBeInTheDocument();
    expect(screen.getByText('Make the quick pickled slaw.')).toBeInTheDocument();
    expect(screen.getByText('Make the sriracha mayo.')).toBeInTheDocument();

    const stepTexts = screen
      .getAllByText(/Make the/)
      .map((node) => node.textContent);
    expect(stepTexts[0]).toMatch(/pickled slaw/);
    expect(stepTexts[1]).toMatch(/sriracha mayo/);
  });

  it('switches to the Nutrition tab and shows the facts label', async () => {
    applyRecipeDetailHandlers({ recipe: mockRecipe({ id: 1 }) });
    applyNutritionHandlers({
      recipeId: 1,
      nutrition: mockNutrition({ calories: 275, fat_g: null }),
    });

    const user = userEvent.setup();
    renderDetailPage(1);

    expect(await screen.findByRole('heading', { name: 'Tomato Soup' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Nutrition' }));

    expect(await screen.findByLabelText('Nutrition facts')).toBeInTheDocument();
    expect(screen.getByText('275')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows a calculate CTA on Nutrition when data is missing', async () => {
    applyRecipeDetailHandlers({ recipe: mockRecipe({ id: 1 }) });
    applyNutritionHandlers({ recipeId: 1, nutrition: null });

    const user = userEvent.setup();
    renderDetailPage(1);

    expect(await screen.findByRole('heading', { name: 'Tomato Soup' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Nutrition' }));

    expect(
      await screen.findByRole('button', { name: /Calculate nutrition/i }),
    ).toBeInTheDocument();
  });
});
