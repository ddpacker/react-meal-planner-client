export const userKeys = {
  all: ['users'] as const,
  me: () => [...userKeys.all, 'me'] as const,
  preferences: () => [...userKeys.all, 'preferences'] as const,
};

export const mealPlanKeys = {
  all: ['mealPlans'] as const,
  lists: () => [...mealPlanKeys.all, 'list'] as const,
  detail: (id: number) => [...mealPlanKeys.all, 'detail', id] as const,
  meals: (planId: number) => [...mealPlanKeys.detail(planId), 'meals'] as const,
  meal: (planId: number, mealId: number) =>
    [...mealPlanKeys.meals(planId), mealId] as const,
};

/** Recipe library, detail, meal-linked, and nutrition query keys. */
export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (params: object) => [...recipeKeys.lists(), params] as const,
  detail: (id: number) => [...recipeKeys.all, 'detail', id] as const,
  byMeal: (mealId: number) => [...recipeKeys.all, 'byMeal', mealId] as const,
  nutrition: (recipeId: number) =>
    [...recipeKeys.all, 'nutrition', recipeId] as const,
};
