import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from './authHandlers';
import { server } from './server';
import type {
  RecipeCreate,
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

export const mockRecipe = (overrides: Partial<RecipeRead> = {}): RecipeRead => ({
  id: 1,
  title: 'Tomato Soup',
  servings: 4,
  instructions: 'Simmer and blend.',
  source_model: null,
  created_at: '2026-04-01T00:00:00Z',
  ingredients: [
    {
      id: 10,
      name: 'Tomato',
      quantity: 500,
      unit: 'g',
      category: 'produce',
    },
  ],
  ...overrides,
});

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
          servings: body.servings,
          instructions: body.instructions,
          ingredients: body.ingredients.map((ingredient, index) => ({
            id: 1000 + index,
            ...ingredient,
          })),
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
          ? body.ingredients.map((ingredient, index) => ({
              id: 1000 + index,
              ...ingredient,
            }))
          : recipe.ingredients,
      });
    }),
  );
}
