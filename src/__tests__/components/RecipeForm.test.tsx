import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  applyCreateRecipeHandler,
  mockRecipe,
} from '../../__mocks__/recipeHandlers';
import { RecipeForm } from '../../components/RecipeForm';
import { renderWithProviders } from '../utils';

describe('RecipeForm', () => {
  afterEach(() => {
    cleanup();
  });

  it('adds and removes ingredient rows', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecipeForm />, {
      authState: { isAuthenticated: true, isLoading: false, unitSystem: 'metric' },
    });

    expect(screen.getAllByLabelText(/^name$/i)).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /add ingredient/i }));
    expect(screen.getAllByLabelText(/^name$/i)).toHaveLength(2);

    const rows = screen.getAllByRole('button', { name: /remove/i });
    await user.click(rows[1]);
    expect(screen.getAllByLabelText(/^name$/i)).toHaveLength(1);
  });

  it('converts imperial quantities to metric on submit', async () => {
    let postedBody: unknown;
    applyCreateRecipeHandler({
      recipe: mockRecipe({ id: 50 }),
      onRequest: (body) => {
        postedBody = body;
      },
    });

    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderWithProviders(<RecipeForm onSuccess={onSuccess} />, {
      authState: { isAuthenticated: true, isLoading: false, unitSystem: 'imperial' },
    });

    await user.clear(screen.getByLabelText(/^title$/i));
    await user.type(screen.getByLabelText(/^title$/i), 'Imperial Stew');
    await user.clear(screen.getByLabelText(/^servings$/i));
    await user.type(screen.getByLabelText(/^servings$/i), '2');
    await user.type(screen.getByLabelText(/^instructions$/i), 'Cook slowly.');

    const nameField = screen.getByLabelText(/^name$/i);
    await user.clear(nameField);
    await user.type(nameField, 'Beef');

    const quantityField = screen.getByLabelText(/^quantity$/i);
    await user.clear(quantityField);
    await user.type(quantityField, '1');

    await user.click(screen.getByLabelText(/^unit$/i));
    await user.click(await screen.findByRole('option', { name: 'lb' }));

    await user.click(screen.getByLabelText(/^category$/i));
    await user.click(await screen.findByRole('option', { name: 'meat' }));

    await user.click(screen.getByRole('button', { name: /create recipe/i }));

    await waitFor(() => {
      expect(postedBody).toMatchObject({
        title: 'Imperial Stew',
        servings: 2,
        ingredients: [
          expect.objectContaining({
            name: 'Beef',
            unit: 'g',
            category: 'meat',
          }),
        ],
      });
    });

    const quantity = (postedBody as { ingredients: { quantity: number }[] })
      .ingredients[0].quantity;
    expect(quantity).toBeCloseTo(453.592, 1);
    expect(onSuccess).toHaveBeenCalled();
  });
});
