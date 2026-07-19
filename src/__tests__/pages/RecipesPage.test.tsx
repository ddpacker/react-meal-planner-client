import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import {
  applyRecipesListHandlers,
  mockRecipeSummary,
} from '../../__mocks__/recipeHandlers';
import RecipesPage from '../../pages/RecipesPage';
import { renderWithProviders } from '../utils';

function renderRecipesPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/recipes" element={<RecipesPage />} />
    </Routes>,
    { initialEntries: ['/recipes'] },
  );
}

describe('RecipesPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders recipe cards from the list query', async () => {
    applyRecipesListHandlers({
      recipes: [
        mockRecipeSummary({ id: 1, title: 'Tomato Soup', servings: 4 }),
        mockRecipeSummary({
          id: 2,
          title: 'Pasta Primavera',
          servings: 2,
          source_model: 'gpt-4',
        }),
      ],
    });

    renderRecipesPage();

    expect(await screen.findByText('Tomato Soup')).toBeInTheDocument();
    expect(screen.getByText('Pasta Primavera')).toBeInTheDocument();
    expect(screen.getByText('4 servings')).toBeInTheDocument();
    expect(screen.getByText('2 servings')).toBeInTheDocument();
    expect(screen.getByText('AI-generated')).toBeInTheDocument();
  });

  it('shows an empty state when there are no recipes', async () => {
    applyRecipesListHandlers({ recipes: [] });

    renderRecipesPage();

    expect(await screen.findByText(/no recipes yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /new recipe/i }).length).toBeGreaterThan(0);
  });

  it('filters the list by debounced search', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    applyRecipesListHandlers({
      recipes: [
        mockRecipeSummary({ id: 1, title: 'Tomato Soup' }),
        mockRecipeSummary({ id: 2, title: 'Pasta Primavera' }),
      ],
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderRecipesPage();

    expect(await screen.findByText('Tomato Soup')).toBeInTheDocument();
    expect(screen.getByText('Pasta Primavera')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/search recipes/i), 'pasta');
    await vi.advanceTimersByTimeAsync(350);

    await waitFor(() => {
      expect(screen.queryByText('Tomato Soup')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Pasta Primavera')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
