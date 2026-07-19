import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import {
  applyDeleteRecipeHandler,
  applyRecipesListHandlers,
  mockRecipeSummary,
} from '../../__mocks__/recipeHandlers';
import { RecipeCard } from '../../components/RecipeCard';
import { renderWithProviders } from '../utils';

function PathProbe() {
  const { pathname } = useLocation();
  return <div data-testid="pathname">{pathname}</div>;
}

function renderCard() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/recipes"
        element={
          <>
            <PathProbe />
            <ul>
              <RecipeCard
                recipe={mockRecipeSummary({ id: 7, title: 'Tomato Soup' })}
              />
            </ul>
          </>
        }
      />
      <Route path="/recipes/:id" element={<PathProbe />} />
    </Routes>,
    { initialEntries: ['/recipes'] },
  );
}

describe('RecipeCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('navigates to the recipe detail on click', async () => {
    applyRecipesListHandlers();
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('link', { name: /open recipe tomato soup/i }));

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/recipes/7');
    });
  });

  it('deletes after confirmation', async () => {
    applyRecipesListHandlers();
    let deleted = false;
    applyDeleteRecipeHandler({
      id: 7,
      onRequest: () => {
        deleted = true;
      },
    });

    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(await screen.findByText(/delete “tomato soup”/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(deleted).toBe(true);
    });
  });
});
