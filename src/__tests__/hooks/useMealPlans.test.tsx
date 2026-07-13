import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import {
  applyGenerateRecipesHandler,
  mockMealPlan,
} from '../../__mocks__/mealPlanHandlers';
import { useGenerateRecipes } from '../../hooks/useMealPlans';
import { mealPlanKeys, recipeKeys } from '../../lib/queryKeys';
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

describe('useGenerateRecipes', () => {
  it('invalidates meal plan detail and recipe list keys on success', async () => {
    const plan = mockMealPlan({ id: 7 });
    applyGenerateRecipesHandler({ plan });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useGenerateRecipes(), {
      wrapper: createHookWrapper(queryClient),
    });

    await result.current.mutateAsync(7);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mealPlanKeys.detail(7) });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: recipeKeys.lists() });
    });
  });
});
