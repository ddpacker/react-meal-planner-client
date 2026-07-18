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

/** Minimal recipe keys so meal-plan mutations can invalidate the recipe library. */
export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
};
