import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from './authHandlers';
import { server } from './server';
import type {
  MealPlanWeekCreate,
  MealPlanWeekRead,
  PlannedMealRead,
} from '../types/mealPlan';

export const mockPlannedMeal = (overrides: Partial<PlannedMealRead> = {}): PlannedMealRead => ({
  id: 10,
  day_index: 0,
  meal_name: 'Taco Tuesday',
  status: 'draft',
  created_at: '2026-04-14T00:00:00Z',
  updated_at: '2026-04-14T00:00:00Z',
  courses: [
    {
      id: 100,
      role: 'entree',
      description: null,
      created_at: '2026-04-14T00:00:00Z',
      updated_at: '2026-04-14T00:00:00Z',
    },
  ],
  ...overrides,
});

export const mockMealPlan = (overrides: Partial<MealPlanWeekRead> = {}): MealPlanWeekRead => ({
  id: 1,
  title: 'Spring Week',
  start_date: '2026-04-14',
  end_date: '2026-04-20',
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
  planned_meals: [mockPlannedMeal()],
  meal_count: 1,
  ...overrides,
});

type ListHandlersOptions = {
  plans?: MealPlanWeekRead[];
};

export function applyMealPlansListHandlers({
  plans = [mockMealPlan()],
}: ListHandlersOptions = {}): void {
  server.use(
    http.get(`${API_BASE_URL}/meal-plans`, () => HttpResponse.json(plans)),
  );
}

type DetailHandlersOptions = {
  plan?: MealPlanWeekRead;
};

export function applyMealPlanDetailHandlers({
  plan = mockMealPlan(),
}: DetailHandlersOptions = {}): void {
  server.use(
    http.get(`${API_BASE_URL}/meal-plans/${plan.id}`, () => HttpResponse.json(plan)),
  );
}

type CreateHandlerOptions = {
  plan?: MealPlanWeekRead;
  onRequest?: (body: MealPlanWeekCreate) => void;
};

export function applyCreateMealPlanHandler({
  plan = mockMealPlan({ id: 42, title: 'New Week' }),
  onRequest,
}: CreateHandlerOptions = {}): void {
  server.use(
    http.post(`${API_BASE_URL}/meal-plans`, async ({ request }) => {
      const body = (await request.json()) as MealPlanWeekCreate;
      onRequest?.(body);
      return HttpResponse.json(plan, { status: 201 });
    }),
  );
}

type GenerateHandlerOptions = {
  plan?: MealPlanWeekRead;
  delayMs?: number;
  onRequest?: () => void;
};

export function applyGenerateRecipesHandler({
  plan = mockMealPlan({
    planned_meals: [mockPlannedMeal({ status: 'planned' })],
  }),
  delayMs = 0,
  onRequest,
}: GenerateHandlerOptions = {}): void {
  server.use(
    http.post(`${API_BASE_URL}/meal-plans/${plan.id}/generate-recipes`, async () => {
      onRequest?.();
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      return HttpResponse.json(plan);
    }),
  );
}
