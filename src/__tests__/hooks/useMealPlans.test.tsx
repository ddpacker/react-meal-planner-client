import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import {
  applyGenerateRecipesHandler,
  applyUpdateMealPlanHandler,
  mockMealPlan,
  mockPlannedMeal,
} from '../../__mocks__/mealPlanHandlers';
import { NoFilledMealsError, useGenerateRecipes } from '../../hooks/useMealPlans';
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
    const plan = mockMealPlan({
      id: 7,
      planned_meals: [mockPlannedMeal({ meal_name: 'Tacos', day_index: 0 })],
    });
    applyGenerateRecipesHandler({ plan });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useGenerateRecipes(), {
      wrapper: createHookWrapper(queryClient),
    });

    await result.current.mutateAsync({
      planId: 7,
      plannedMeals: plan.planned_meals,
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mealPlanKeys.detail(7) });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: recipeKeys.lists() });
    });
  });

  it('prunes placeholder meals before generating', async () => {
    const plan = mockMealPlan({
      id: 8,
      planned_meals: [
        mockPlannedMeal({ id: 1, day_index: 0, meal_name: 'Tacos' }),
        mockPlannedMeal({ id: 2, day_index: 1, meal_name: 'Tuesday' }),
      ],
    });

    let putBody: unknown;
    applyUpdateMealPlanHandler({
      plan,
      onRequest: (body) => {
        putBody = body;
      },
    });
    applyGenerateRecipesHandler({ plan });

    const { result } = renderHook(() => useGenerateRecipes(), {
      wrapper: createHookWrapper(createTestQueryClient()),
    });

    await result.current.mutateAsync({
      planId: 8,
      plannedMeals: plan.planned_meals,
    });

    expect(putBody).toMatchObject({
      planned_meals: [expect.objectContaining({ day_index: 0, meal_name: 'Tacos' })],
    });
    expect((putBody as { planned_meals: unknown[] }).planned_meals).toHaveLength(1);
  });

  it('throws when no meals have real names', async () => {
    const plan = mockMealPlan({
      id: 9,
      planned_meals: [mockPlannedMeal({ day_index: 0, meal_name: 'Monday' })],
    });

    const { result } = renderHook(() => useGenerateRecipes(), {
      wrapper: createHookWrapper(createTestQueryClient()),
    });

    await expect(
      result.current.mutateAsync({
        planId: 9,
        plannedMeals: plan.planned_meals,
      }),
    ).rejects.toBeInstanceOf(NoFilledMealsError);
  });
});
