import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from './authHandlers';
import { server } from './server';
import type { NutritionInfoRead } from '../types/nutrition';
import type {
  RecipeCreate,
  RecipeIngredientCreate,
  RecipeIngredientRead,
  RecipeRead,
  RecipeSummaryRead,
  RecipeUpdate,
} from '../types/recipe';

export const mockRecipeSummary = (
  overrides: Partial<RecipeSummaryRead> = {},
): RecipeSummaryRead => ({
  id: 1,
  title: 'Tomato Soup',
  servings: 4,
  source_model: null,
  created_at: '2026-04-01T00:00:00Z',
  ...overrides,
});

export const mockRecipeIngredient = (
  overrides: Partial<RecipeIngredientRead> & {
    ingredient?: Partial<RecipeIngredientRead['ingredient']>;
  } = {},
): RecipeIngredientRead => {
  const { ingredient, ...rest } = overrides;
  return {
    id: 10,
    quantity: 500,
    unit: 'gram',
    ingredient: {
      id: 1,
      name: 'Tomato',
      category: 'Produce',
      ...ingredient,
    },
    ...rest,
  };
};

export const mockRecipe = (overrides: Partial<RecipeRead> = {}): RecipeRead => ({
  id: 1,
  title: 'Tomato Soup',
  servings: 4,
  instructions: 'Simmer and blend.',
  source_model: null,
  created_at: '2026-04-01T00:00:00Z',
  ingredients: [mockRecipeIngredient()],
  steps: [
    {
      id: 100,
      step_number: 1,
      text: 'Simmer tomatoes until soft.',
    },
    {
      id: 101,
      step_number: 2,
      text: 'Blend until smooth.',
    },
  ],
  ...overrides,
});

function toIngredientRead(
  ingredient: RecipeIngredientCreate,
  index: number,
): RecipeIngredientRead {
  return {
    id: 1000 + index,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    ingredient: {
      id: 2000 + index,
      name: ingredient.name,
      category: ingredient.category ?? null,
    },
  };
}

type ListHandlersOptions = {
  recipes?: RecipeSummaryRead[];
};

export function applyRecipesListHandlers({
  recipes = [mockRecipeSummary()],
}: ListHandlersOptions = {}): void {
  server.use(
    http.get(`${API_BASE_URL}/recipes`, () => HttpResponse.json(recipes)),
  );
}

type DetailHandlersOptions = {
  recipe?: RecipeRead;
};

export function applyRecipeDetailHandlers({
  recipe = mockRecipe(),
}: DetailHandlersOptions = {}): void {
  server.use(
    http.get(`${API_BASE_URL}/recipes/${recipe.id}`, () =>
      HttpResponse.json(recipe),
    ),
  );
}

type DeleteHandlersOptions = {
  id?: number;
  onRequest?: () => void;
};

export function applyDeleteRecipeHandler({
  id = 1,
  onRequest,
}: DeleteHandlersOptions = {}): void {
  server.use(
    http.delete(`${API_BASE_URL}/recipes/${id}`, () => {
      onRequest?.();
      return new HttpResponse(null, { status: 204 });
    }),
  );
}

type CreateHandlersOptions = {
  recipe?: RecipeRead;
  onRequest?: (body: RecipeCreate) => void;
};

export function applyCreateRecipeHandler({
  recipe = mockRecipe({ id: 99 }),
  onRequest,
}: CreateHandlersOptions = {}): void {
  server.use(
    http.post(`${API_BASE_URL}/recipes`, async ({ request }) => {
      const body = (await request.json()) as RecipeCreate;
      onRequest?.(body);
      return HttpResponse.json(
        {
          ...recipe,
          title: body.title,
          servings: body.servings ?? recipe.servings,
          instructions: body.instructions ?? recipe.instructions,
          ingredients: body.ingredients.map(toIngredientRead),
        },
        { status: 201 },
      );
    }),
  );
}

type UpdateHandlersOptions = {
  recipe?: RecipeRead;
  onRequest?: (body: RecipeUpdate) => void;
};

export function applyUpdateRecipeHandler({
  recipe = mockRecipe(),
  onRequest,
}: UpdateHandlersOptions = {}): void {
  server.use(
    http.put(`${API_BASE_URL}/recipes/${recipe.id}`, async ({ request }) => {
      const body = (await request.json()) as RecipeUpdate;
      onRequest?.(body);
      return HttpResponse.json({
        ...recipe,
        ...body,
        ingredients: body.ingredients
          ? body.ingredients.map(toIngredientRead)
          : recipe.ingredients,
      });
    }),
  );
}

export const mockNutrition = (
  overrides: Partial<NutritionInfoRead> = {},
): NutritionInfoRead => ({
  id: 1,
  recipe_id: 1,
  calories: 320,
  protein_g: 18,
  carbs_g: 40,
  fat_g: 10,
  fiber_g: 6,
  sugar_g: 8,
  sodium_mg: 480,
  micro_nutrients_json: [
    { nutrient_id: 1087, name: 'Calcium, Ca', unit: 'MG', amount: 45 },
  ],
  per_serving: true,
  source: 'usda',
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
  ...overrides,
});

type NutritionHandlersOptions = {
  recipeId?: number;
  nutrition?: NutritionInfoRead | null;
  generated?: NutritionInfoRead;
};

export function applyNutritionHandlers({
  recipeId = 1,
  nutrition = mockNutrition({ recipe_id: recipeId }),
  generated = mockNutrition({ recipe_id: recipeId, id: 2 }),
}: NutritionHandlersOptions = {}): void {
  server.use(
    http.get(`${API_BASE_URL}/recipes/${recipeId}/nutrition`, () => {
      if (nutrition == null) {
        return HttpResponse.json(
          { detail: 'Nutrition info not found for this recipe' },
          { status: 404 },
        );
      }
      return HttpResponse.json(nutrition);
    }),
    http.post(`${API_BASE_URL}/recipes/${recipeId}/nutrition`, () =>
      HttpResponse.json(generated, { status: 201 }),
    ),
  );
}
