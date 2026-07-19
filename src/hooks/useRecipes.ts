import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRecipe,
  deleteRecipe,
  fetchRecipe,
  fetchRecipes,
  fetchRecipesByMeal,
  type FetchRecipesParams,
  updateRecipe,
} from '../lib/api/recipes';
import { recipeKeys } from '../lib/queryKeys';
import type { RecipeCreate, RecipeUpdate } from '../types/recipe';

export function useRecipes(params?: FetchRecipesParams) {
  return useQuery({
    queryKey: params ? recipeKeys.list(params) : recipeKeys.lists(),
    queryFn: () => fetchRecipes(params),
  });
}

export function useRecipe(id: number) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => fetchRecipe(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useRecipesByMeal(mealId: number) {
  return useQuery({
    queryKey: recipeKeys.byMeal(mealId),
    queryFn: () => fetchRecipesByMeal(mealId),
    enabled: Number.isFinite(mealId) && mealId > 0,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: RecipeCreate) => createRecipe(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: RecipeUpdate }) =>
      updateRecipe(id, body),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: recipeKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteRecipe(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}
