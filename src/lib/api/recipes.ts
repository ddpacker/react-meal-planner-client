import { getResponseStatus } from '../getResponseStatus';
import { apiClient } from './client';
import type { NutritionInfoRead } from '../../types/nutrition';
import type {
  RecipeCreate,
  RecipeRead,
  RecipeSummaryRead,
  RecipeUpdate,
} from '../../types/recipe';

export type FetchRecipesParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function fetchRecipes(
  params?: FetchRecipesParams,
): Promise<RecipeSummaryRead[]> {
  const { data } = await apiClient.get<RecipeSummaryRead[]>('/recipes', {
    params: {
      search: params?.search,
      page: params?.page,
      page_size: params?.pageSize,
    },
  });
  return data;
}

export async function fetchRecipe(id: number): Promise<RecipeRead> {
  const { data } = await apiClient.get<RecipeRead>(`/recipes/${id}`);
  return data;
}

export async function fetchRecipesByMeal(mealId: number): Promise<RecipeRead[]> {
  const { data } = await apiClient.get<RecipeRead[]>(`/meals/${mealId}/recipes`);
  return data;
}

export async function createRecipe(body: RecipeCreate): Promise<RecipeRead> {
  const { data } = await apiClient.post<RecipeRead>('/recipes', body);
  return data;
}

export async function updateRecipe(
  id: number,
  body: RecipeUpdate,
): Promise<RecipeRead> {
  const { data } = await apiClient.put<RecipeRead>(`/recipes/${id}`, body);
  return data;
}

export async function deleteRecipe(id: number): Promise<void> {
  await apiClient.delete(`/recipes/${id}`);
}

export async function fetchNutrition(
  recipeId: number,
): Promise<NutritionInfoRead | null> {
  try {
    const { data } = await apiClient.get<NutritionInfoRead>(
      `/recipes/${recipeId}/nutrition`,
    );
    return data;
  } catch (error) {
    if (getResponseStatus(error) === 404) {
      return null;
    }
    throw error;
  }
}

export async function generateNutrition(
  recipeId: number,
): Promise<NutritionInfoRead> {
  const { data } = await apiClient.post<NutritionInfoRead>(
    `/recipes/${recipeId}/nutrition`,
  );
  return data;
}
