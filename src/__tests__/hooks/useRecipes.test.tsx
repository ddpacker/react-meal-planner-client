import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import {
  applyDeleteRecipeHandler,
  applyNutritionHandlers,
  applyRecipesListHandlers,
  mockNutrition,
} from '../../__mocks__/recipeHandlers';
import {
  useDeleteRecipe,
  useGenerateNutrition,
  useNutrition,
} from '../../hooks/useRecipes';
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

describe('useNutrition', () => {
  it('returns nutrition data when present', async () => {
    applyNutritionHandlers({
      recipeId: 1,
      nutrition: mockNutrition({ calories: 250 }),
    });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useNutrition(1), {
      wrapper: createHookWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.calories).toBe(250);
  });

  it('returns null when nutrition is missing', async () => {
    applyNutritionHandlers({ recipeId: 1, nutrition: null });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useNutrition(1), {
      wrapper: createHookWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toBeNull();
  });
});

describe('useGenerateNutrition', () => {
  it('writes generated nutrition into the query cache', async () => {
    applyNutritionHandlers({
      recipeId: 1,
      nutrition: null,
      generated: mockNutrition({ id: 9, calories: 410 }),
    });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useGenerateNutrition(), {
      wrapper: createHookWrapper(queryClient),
    });

    await result.current.mutateAsync(1);

    await waitFor(() => {
      expect(queryClient.getQueryData(recipeKeys.nutrition(1))).toMatchObject({
        id: 9,
        calories: 410,
      });
    });
  });
});
