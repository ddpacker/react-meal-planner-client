---
name: nutrition
overview: >
  Per-recipe nutrition display. A NutritionPanel renders inside RecipeDetailPage, showing
  macro breakdown (calories, protein, carbs, fat, fiber, sugar, sodium) per serving.
  Users trigger a fetch via a button (USDA lookup is slow). Null macro fields display as
  "—" (unknown), not "0".
todos:
  - id: nutrition-types
    content: >
      Create src/types/nutrition.ts with types mirroring the backend schemas:
        NutritionInfoRead (id, recipe_id, calories, protein_g, carbs_g, fat_g, fiber_g,
          sugar_g, sodium_mg — all number | null, per_serving: boolean, source: string,
          created_at: string)
    status: pending

  - id: nutrition-api
    content: >
      Create functions in src/lib/api/recipes.ts (co-located with recipe API):
        fetchNutrition(recipeId) -> NutritionInfoRead | null  (404 → null)
        generateNutrition(recipeId) -> NutritionInfoRead      (POST triggers USDA lookup)
    status: pending
    dependencies:
      - nutrition-types

  - id: nutrition-query-keys
    content: >
      Add nutritionKeys to src/lib/queryKeys.ts:
        nutrition(recipeId)
    status: pending
    dependencies:
      - nutrition-api

  - id: nutrition-hooks
    content: >
      Create src/hooks/useNutrition.ts with:
        useNutrition(recipeId) — useQuery on fetchNutrition; enabled when recipeId is defined.
          If the backend returns 404 (no nutrition yet), resolve to null (do not throw).
        useGenerateNutrition() — useMutation on generateNutrition;
          onSuccess: invalidate nutritionKeys.nutrition(recipeId).
    status: pending
    dependencies:
      - nutrition-query-keys

  - id: nutrition-panel
    content: >
      Create src/components/NutritionPanel.tsx. Renders inside RecipeDetailPage.
      States:
        - No data: show "Fetch nutrition data" button that calls useGenerateNutrition().
        - Fetching: show CircularProgress inside the button while isPending.
        - Data available: show a macro grid (calories, protein, carbs, fat, fiber, sugar, sodium).
          Each macro shows the value + unit (e.g., "32 g", "450 kcal") or "—" when null.
          Show "per serving" label when per_serving is true.
          Show source badge ("USDA") and a refresh button to re-fetch.
      Do not show separate loading state for the initial GET — the panel just shows the
      fetch button until data is available.
    status: pending
    dependencies:
      - nutrition-hooks

  - id: nutrition-macro-row
    content: >
      Create src/components/MacroRow.tsx (or render inline in NutritionPanel). Displays
      one macro: label, value (formatted to 1 decimal place), unit, and a dash "—" when
      the value is null. Keep accessible — use a definition list or table with proper headers.
    status: pending
    dependencies:
      - nutrition-panel

  - id: nutrition-tests
    content: >
      Tests for:
        - NutritionPanel: shows fetch button when no data; shows spinner while pending;
          renders macro values; renders "—" for null macros.
        - MacroRow: renders value with unit; renders "—" for null.
        - useGenerateNutrition: invalidates nutritionKeys on success.
      MSW handlers for GET /recipes/:id/nutrition (200 with data, 404 for no data),
      POST /recipes/:id/nutrition.
    status: pending
    dependencies:
      - nutrition-macro-row
---

## Roadmap

| Status | Task |
|--------|------|
| ⏳ Pending | TypeScript types (NutritionInfoRead) |
| ⏳ Pending | Nutrition API functions |
| ⏳ Pending | Query keys |
| ⏳ Pending | Custom hooks |
| ⏳ Pending | NutritionPanel component |
| ⏳ Pending | MacroRow component |
| ⏳ Pending | Tests |

---

## Implementation notes

### Null vs zero

The backend returns `null` for macros where USDA had no data (unmatched ingredient), not `0`.
`0` would incorrectly imply an ingredient has zero calories/protein. Display `null` as `—`.

### USDA latency

The nutrition POST triggers one USDA API call per ingredient. A recipe with 10 ingredients
takes ~10 USDA calls. The button should show a spinner for the full duration. Consider adding
an explanatory tooltip: "Nutrition data is fetched from USDA FoodData Central."

### Per-serving display

When `per_serving` is true, add a "per serving" label. Show `Recipe.servings` alongside
the panel so users understand the portion size.

### 404 handling in useNutrition

The backend returns 404 when no NutritionInfo exists yet (before the first POST). Handle
this in the query by mapping the 404 error to a `null` return rather than an error state:

```ts
queryFn: async () => {
  try {
    return await fetchNutrition(recipeId);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
},
```

### Pending backend feature

`POST /recipes/:id/nutrition?include_nutrition=true` auto-generation during recipe generation
is pending (see backend nutrition.plan.md). Once available, the panel could pre-populate
immediately after generation rather than requiring a manual button press.
