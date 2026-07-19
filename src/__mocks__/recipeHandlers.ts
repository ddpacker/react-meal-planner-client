import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from './authHandlers';
import { server } from './server';
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
