import { apiClient } from './client';
import type {
  MealPlanWeekCreate,
  MealPlanWeekRead,
  MealPlanWeekSummaryRead,
  MealPlanWeekUpdate,
  PlannedMealRead,
  PlannedMealUpdate,
} from '../../types/mealPlan';
import type { RecipeRead } from '../../types/recipe';

export async function fetchMealPlans(): Promise<MealPlanWeekSummaryRead[]> {
  const { data } = await apiClient.get<MealPlanWeekSummaryRead[]>('/meal-plans');
  return data;
}

export async function fetchMealPlan(id: number): Promise<MealPlanWeekRead> {
  const { data } = await apiClient.get<MealPlanWeekRead>(`/meal-plans/${id}`);
  return data;
}

export async function createMealPlan(body: MealPlanWeekCreate): Promise<MealPlanWeekRead> {
  const { data } = await apiClient.post<MealPlanWeekRead>('/meal-plans', body);
  return data;
}

export async function updateMealPlan(
  id: number,
  body: MealPlanWeekUpdate,
): Promise<MealPlanWeekRead> {
  const { data } = await apiClient.put<MealPlanWeekRead>(`/meal-plans/${id}`, body);
  return data;
}

export async function updatePlannedMeal(
  planId: number,
  mealId: number,
  body: PlannedMealUpdate,
): Promise<PlannedMealRead> {
  const { data } = await apiClient.patch<PlannedMealRead>(
    `/meal-plans/${planId}/meals/${mealId}`,
    body,
  );
  return data;
}

export async function generateRecipes(planId: number): Promise<MealPlanWeekRead> {
  const { data } = await apiClient.post<MealPlanWeekRead>(
    `/meal-plans/${planId}/generate-recipes`,
  );
  return data;
}

export async function generateCourseRecipe(
  planId: number,
  mealId: number,
  courseId: number,
): Promise<RecipeRead> {
  const { data } = await apiClient.post<RecipeRead>(
    `/meal-plans/${planId}/meals/${mealId}/courses/${courseId}/generate-recipe`,
  );
  return data;
}
