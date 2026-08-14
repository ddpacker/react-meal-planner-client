import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMealPlan,
  deleteMealPlan,
  fetchMealPlan,
  fetchMealPlans,
  generateCourseRecipe,
  generateRecipes,
  updateMealPlan,
  updatePlannedMeal,
} from '../lib/api/mealPlans';
import { isFilledPlannedMeal, toPlannedMealCreates } from '../lib/mealPlanDays';
import { mealPlanKeys, recipeKeys } from '../lib/queryKeys';
import type {
  MealPlanWeekCreate,
  MealPlanWeekRead,
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
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(id) });
      await queryClient.refetchQueries({ queryKey: mealPlanKeys.detail(id) });
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
    onSuccess: async (_data, { planId }) => {
      await queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(planId) });
      await queryClient.refetchQueries({ queryKey: mealPlanKeys.detail(planId) });
    },
  });
}

export class NoFilledMealsError extends Error {
  constructor() {
    super('NO_FILLED_MEALS');
    this.name = 'NoFilledMealsError';
  }
}

type GenerateRecipesVars = {
  planId: number;
  plannedMeals: MealPlanWeekRead['planned_meals'];
};

export function useGenerateRecipes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, plannedMeals }: GenerateRecipesVars) => {
      const filled = plannedMeals.filter(isFilledPlannedMeal);
      if (filled.length === 0) {
        throw new NoFilledMealsError();
      }

      // Drop weekday placeholder rows so the backend only generates for named meals.
      if (filled.length < plannedMeals.length) {
        await updateMealPlan(planId, {
          planned_meals: toPlannedMealCreates(filled),
        });
      }

      return generateRecipes(planId);
    },
    onSuccess: (_data, { planId }) => {
      void queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(planId) });
      void queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

type GenerateCourseRecipeVars = {
  planId: number;
  mealId: number;
  courseId: number;
};

const generateCourseRecipeKey = ['generateCourseRecipe'] as const;

export function useGenerateCourseRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: generateCourseRecipeKey,
    mutationFn: async ({ planId, mealId, courseId }: GenerateCourseRecipeVars) => {
      const recipe = await generateCourseRecipe(planId, mealId, courseId);
      // Invalidate here so in-flight generations still refresh cache if the dialog unmounts.
      await queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(planId) });
      await queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipe.id) });
      return recipe;
    },
  });
}

export function useIsCourseRecipeGenerating(courseId: number | undefined): boolean {
  const pendingCourseIds = useMutationState({
    filters: { mutationKey: generateCourseRecipeKey, status: 'pending' },
    select: (mutation) =>
      (mutation.state.variables as GenerateCourseRecipeVars | undefined)?.courseId,
  });
  return typeof courseId === 'number' && pendingCourseIds.includes(courseId);
}
