---
name: meal
overview: >
  Weekly meal planning UI. Covers the meal plan list (MealPlansPage), the plan detail view
  (MealPlanDetailPage) showing all planned meals, creating/editing plans, managing course
  slots per meal, and triggering AI recipe generation. Mirrors the backend meal plan API.
todos:
  - id: meal-plan-types
    content: >
      Create src/types/mealPlan.ts with types mirroring the backend schemas:
        MealCourseRole (enum: starter | entree | side | dessert)
        PlannedMealCourseRead, PlannedMealCourseCreate
        PlannedMealRead, PlannedMealCreate
        MealPlanWeekRead, MealPlanWeekCreate, MealPlanWeekUpdate
      Include summary fields meal_count and has_grocery_list on MealPlanWeekRead (pending
      backend support — treat as optional for now).
    status: completed

  - id: meal-plan-api
    content: >
      Create src/lib/api/mealPlans.ts with typed functions for all meal plan endpoints:
        fetchMealPlans() -> MealPlanWeekRead[]
        fetchMealPlan(id) -> MealPlanWeekRead
        createMealPlan(body: MealPlanWeekCreate) -> MealPlanWeekRead
        updateMealPlan(id, body: MealPlanWeekUpdate) -> MealPlanWeekRead
        deleteMealPlan(id) -> void
        updatePlannedMeal(planId, mealId, body) -> PlannedMealRead
        generateRecipes(planId) -> MealPlanWeekRead
    status: completed
    dependencies:
      - meal-plan-types

  - id: meal-plan-query-keys
    content: >
      Add mealPlanKeys to src/lib/queryKeys.ts:
        all, lists(), detail(id), meals(planId), meal(planId, mealId)
    status: completed
    dependencies:
      - meal-plan-api

  - id: meal-plan-hooks
    content: >
      Create src/hooks/useMealPlans.ts with:
        useMealPlans() — useQuery on fetchMealPlans()
        useMealPlan(id) — useQuery on fetchMealPlan(id)
        useCreateMealPlan() — useMutation; onSuccess: invalidate lists()
        useUpdateMealPlan() — useMutation; onSuccess: invalidate detail(id)
        useDeleteMealPlan() — useMutation; onSuccess: invalidate lists()
        useUpdatePlannedMeal() — useMutation; onSuccess: invalidate detail(planId)
        useGenerateRecipes() — useMutation; onSuccess: invalidate detail(planId) + recipe keys
    status: completed
    dependencies:
      - meal-plan-query-keys

  - id: meal-plans-page
    content: >
      Create src/pages/MealPlansPage.tsx. Displays a list of MealPlanWeekRead cards using
      useMealPlans(). Each card shows the plan title, date range, and a meal count badge.
      Includes a "New plan" button that opens a create dialog. Empty state when no plans exist.
    status: completed
    dependencies:
      - meal-plan-hooks

  - id: meal-plan-card
    content: >
      Create src/components/MealPlanCard.tsx. Displays a single MealPlanWeekRead summary:
      title, start_date to end_date, meal_count, and a button to navigate to the detail page.
      Include a delete action with a confirmation dialog.
    status: completed
    dependencies:
      - meal-plans-page

  - id: create-meal-plan-dialog
    content: >
      Create src/components/CreateMealPlanDialog.tsx. A Dialog form with:
        - Plan title (text field)
        - Start date (date picker or text input, validated as ISO date)
        - Up to 7 planned meals, each with a name and optional courses
          (default: one entree slot per meal)
      Uses React Hook Form + Zod. On submit, calls useCreateMealPlan(); on success, navigates
      to the new plan's detail page.
    status: completed
    dependencies:
      - meal-plan-hooks

  - id: meal-plan-detail-page
    content: >
      Create src/pages/MealPlanDetailPage.tsx. Shows a MealPlanWeekRead fetched by useMealPlan(id).
      Displays all PlannedMeals as a weekly grid (Monday–Sunday). Each meal slot shows the meal
      name, course roles, and linked recipe titles (once generated). Includes a prominent
      "Generate recipes" button that calls useGenerateRecipes(). Disable the button and show
      a loading spinner while generation is in progress (mutation isPending).
      Link to the grocery list if one exists for this plan.
    status: completed
    dependencies:
      - meal-plan-hooks

  - id: planned-meal-slot
    content: >
      Create src/components/PlannedMealSlot.tsx. Renders one PlannedMealRead within the weekly
      grid: meal name, list of PlannedMealCourse rows (role + optional description), and linked
      recipe title links. Clicking the meal name opens an inline edit for the name and status.
      Clicking a recipe title navigates to /recipes/:id.
    status: completed
    dependencies:
      - meal-plan-detail-page

  - id: meal-plan-tests
    content: >
      Tests for:
        - MealPlansPage: renders plan cards, shows empty state, opens create dialog
        - MealPlanDetailPage: renders meals, calls generateRecipes, disables button while pending
        - CreateMealPlanDialog: form validation, submit calls mutation, navigates on success
        - useGenerateRecipes: invalidates recipe keys on success (test via MSW)
      Use renderWithProviders; MSW handlers for /meal-plans GET/POST and /generate-recipes POST.
    status: pending
    dependencies:
      - meal-plan-detail-page
      - create-meal-plan-dialog
---

## Roadmap

| Status | Task |
|--------|------|
| ✅ Done | TypeScript types (MealPlanWeek, PlannedMeal, PlannedMealCourse) |
| ✅ Done | Meal plan API functions |
| ✅ Done | Query keys |
| ✅ Done | Custom hooks |
| ✅ Done | MealPlansPage (list + new plan button) |
| ✅ Done | MealPlanCard component |
| ✅ Done | CreateMealPlanDialog |
| ✅ Done | MealPlanDetailPage (weekly grid + generate button) |
| ✅ Done | PlannedMealSlot component |
| ⏳ Pending | Tests |

---

## Implementation notes

### Weekly grid layout

Render the 7 meal slots (day_index 0–6 = Mon–Sun) in a responsive grid. On mobile: single
column, each slot stacked vertically. On md+: two columns or a 7-column scrollable row.

### Course role display

Map `MealCourseRole` to readable labels: `starter → Starter`, `entree → Main`,
`side → Side`, `dessert → Dessert`. Show as small Chips within the meal slot.

### Generate recipes UX

The generate endpoint is potentially slow (AI call). Show a `CircularProgress` inside the
button and disable it while `isPending`. Invalidate both `mealPlanKeys.detail(id)` and
`recipeKeys.lists()` on success so the recipe library and meal plan both refresh.

### day_index convention

`0 = Monday … 6 = Sunday`. The display order should always follow Mon–Sun regardless of
locale. Do not rely on JavaScript's `Date.getDay()` (which starts on Sunday) without
remapping.

### Planned backend features

Some fields (meal_count, has_grocery_list on the list response) are pending backend
implementation (see backend meal.plan.md). Treat them as `optional` in the type and hide
their UI until the backend supports them.
