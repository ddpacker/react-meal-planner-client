import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMealPlan,
  deleteMealPlan,
  fetchMealPlan,
  fetchMealPlans,
  generateRecipes,
  updateMealPlan,
  updatePlannedMeal,
} from '../lib/api/mealPlans';
import { mealPlanKeys, recipeKeys } from '../lib/queryKeys';
import type {
  MealPlanWeekCreate,
  MealPlanWeekUpdate,
  PlannedMealUpdate,
} from '../types/mealPlan';

export function useMealPlans() {
  return useQuery({
    queryKey: mealPlanKeys.lists(),
    queryFn: fetchMealPlans,
  });
}

export function useMealPlan(id: number) {
  return useQuery({
    queryKey: mealPlanKeys.detail(id),
    queryFn: () => fetchMealPlan(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: MealPlanWeekCreate) => createMealPlan(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mealPlanKeys.lists() });
    },
  });
}

export function useUpdateMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: MealPlanWeekUpdate }) =>
      updateMealPlan(id, body),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(id) });
    },
  });
}

export function useDeleteMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteMealPlan(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mealPlanKeys.lists() });
    },
  });
}

export function useUpdatePlannedMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      mealId,
      body,
    }: {
      planId: number;
      mealId: number;
      body: PlannedMealUpdate;
    }) => updatePlannedMeal(planId, mealId, body),
    onSuccess: (_data, { planId }) => {
      void queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(planId) });
    },
  });
}

export function useGenerateRecipes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: number) => generateRecipes(planId),
    onSuccess: (_data, planId) => {
      void queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(planId) });
      void queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}
