import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import {
  applyRecipeDetailHandlers,
  mockRecipe,
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
          {
            id: 10,
            name: 'Beans',
            quantity: 500,
            unit: 'g',
            category: 'pantry',
          },
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
          {
            id: 10,
            name: 'Flour',
            quantity: 500,
            unit: 'g',
            category: 'pantry',
          },
        ],
      }),
    });

    renderDetailPage(1, { unitSystem: 'imperial' });

    expect(await screen.findByText('Flour')).toBeInTheDocument();
    expect(screen.getByText(/1\.1 lb/)).toBeInTheDocument();
  });
});
