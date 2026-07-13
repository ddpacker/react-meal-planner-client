import { apiClient } from './client';
import type {
  MealPlanWeekCreate,
  MealPlanWeekRead,
  MealPlanWeekUpdate,
  PlannedMealRead,
  PlannedMealUpdate,
} from '../../types/mealPlan';

export async function fetchMealPlans(): Promise<MealPlanWeekRead[]> {
  const { data } = await apiClient.get<MealPlanWeekRead[]>('/meal-plans');
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

export async function deleteMealPlan(id: number): Promise<void> {
  await apiClient.delete(`/meal-plans/${id}`);
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
