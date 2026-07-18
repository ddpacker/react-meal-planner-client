import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import {
  applyDeleteRecipeHandler,
  applyRecipesListHandlers,
} from '../../__mocks__/recipeHandlers';
import { useDeleteRecipe } from '../../hooks/useRecipes';
import { recipeKeys } from '../../lib/queryKeys';
import { createTestQueryClient } from '../utils';

function createHookWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MemoryRouter>
    );
  };
}

describe('useDeleteRecipe', () => {
  it('invalidates recipe list keys on success', async () => {
    applyRecipesListHandlers();
    applyDeleteRecipeHandler({ id: 3 });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteRecipe(), {
      wrapper: createHookWrapper(queryClient),
    });

    await result.current.mutateAsync(3);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: recipeKeys.lists(),
      });
    });
  });
});
