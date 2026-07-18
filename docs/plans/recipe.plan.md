---
name: recipe
overview: >
  Recipe management UI. Covers the recipe library (RecipesPage with search and pagination),
  the recipe detail view (RecipeDetailPage showing ingredients, chat, and nutrition), manual
  recipe creation, and recipe editing/deletion. Recipes are central — they link meal plans,
  chat sessions, and nutrition data.
todos:
  - id: recipe-types
    content: >
      Create src/types/recipe.ts with types mirroring the backend schemas:
        RecipeIngredientRead, RecipeIngredientCreate
        RecipeRead (full: includes ingredients array)
        RecipeSummaryRead (list: id, title, servings, source_model, created_at — no ingredients)
        RecipeCreate, RecipeUpdate
      source_model is null for manually created recipes and the AI model name for generated ones.
    status: completed

  - id: recipe-api
    content: >
      Create src/lib/api/recipes.ts with typed functions:
        fetchRecipes(params?: { search?, page?, pageSize? }) -> RecipeSummaryRead[]
        fetchRecipe(id) -> RecipeRead
        fetchRecipesByMeal(mealId) -> RecipeRead[]
        createRecipe(body: RecipeCreate) -> RecipeRead
        updateRecipe(id, body: RecipeUpdate) -> RecipeRead
        deleteRecipe(id) -> void
        fetchNutrition(recipeId) -> NutritionInfoRead
        generateNutrition(recipeId) -> NutritionInfoRead
    status: completed
    dependencies:
      - recipe-types

  - id: recipe-query-keys
    content: >
      Add recipeKeys to src/lib/queryKeys.ts:
        all, lists(), list(params), detail(id), byMeal(mealId), nutrition(recipeId)
    status: completed
    dependencies:
      - recipe-api

  - id: recipe-hooks
    content: >
      Create src/hooks/useRecipes.ts with:
        useRecipes(params?) — useQuery on fetchRecipes
        useRecipe(id) — useQuery on fetchRecipe(id)
        useRecipesByMeal(mealId) — useQuery on fetchRecipesByMeal
        useCreateRecipe() — useMutation; onSuccess: invalidate lists()
        useUpdateRecipe() — useMutation; onSuccess: invalidate detail(id) + lists()
        useDeleteRecipe() — useMutation; onSuccess: invalidate lists()
    status: completed
    dependencies:
      - recipe-query-keys

  - id: recipe-card
    content: >
      Create src/components/RecipeCard.tsx. Displays a RecipeSummaryRead:
      title, servings, an AI-generated badge (when source_model is not null), and a delete
      button with confirmation. Clicking the card navigates to /recipes/:id.
    status: completed
    dependencies:
      - recipe-hooks

  - id: recipes-page
    content: >
      Create src/pages/RecipesPage.tsx. A searchable, paginated list of the user's recipe
      library using useRecipes(). Includes a search text field (debounced, updates the
      query params), and a "New recipe" button that navigates to a create form or opens a
      dialog. Renders RecipeCard components in a grid. Shows an empty state when no recipes exist.
    status: pending
    dependencies:
      - recipe-card

  - id: recipe-detail-page
    content: >
      Create src/pages/RecipeDetailPage.tsx. Fetches a RecipeRead via useRecipe(id). Displays:
        - Title, servings, source_model badge
        - Ingredients list (formatted with formatQuantity based on user's unit preference)
        - Edit button (opens RecipeEditForm)
        - ChatInterface (see chat.plan.md)
        - NutritionPanel (see nutrition.plan.md)
    status: pending
    dependencies:
      - recipe-hooks

  - id: recipe-create-form
    content: >
      Create src/components/RecipeForm.tsx (shared between create and edit). React Hook Form +
      Zod schema covering title, servings, instructions, and a dynamic ingredients list
      (add/remove rows, each with name, quantity, unit, category). Quantities are entered in
      the user's preferred unit but submitted to the API in metric. Reuse for both
      POST /recipes (create) and PUT /recipes/:id (edit).
    status: pending
    dependencies:
      - recipe-detail-page

  - id: recipe-tests
    content: >
      Tests for:
        - RecipesPage: renders cards, search filters list, empty state
        - RecipeDetailPage: renders ingredients with unit formatting, shows AI badge
        - RecipeCard: delete confirmation, navigation on click
        - RecipeForm: add/remove ingredient rows, metric conversion on submit
        - useDeleteRecipe: invalidates lists() on success
      MSW handlers for GET /recipes, GET /recipes/:id, DELETE /recipes/:id.
    status: pending
    dependencies:
      - recipe-create-form
---

## Roadmap

| Status | Task |
|--------|------|
| ⏳ Pending | TypeScript types (RecipeRead, RecipeSummaryRead, RecipeCreate) |
| ⏳ Pending | Recipe API functions |
| ⏳ Pending | Query keys |
| ⏳ Pending | Custom hooks |
| ⏳ Pending | RecipeCard component |
| ⏳ Pending | RecipesPage (library with search) |
| ⏳ Pending | RecipeDetailPage (ingredients + chat + nutrition) |
| ⏳ Pending | RecipeForm (create + edit, dynamic ingredient rows) |
| ⏳ Pending | Tests |

---

## Implementation notes

### Unit display

All API values are in metric. Use a `formatQuantity(value, unit, unitSystem)` utility to
convert for display. Example: `500 g` → `1.1 lb` in imperial. Render as a plain string.
Do not store the converted value anywhere — derive on render.

### AI badge

When `source_model` is not null, show a small Chip or badge indicating the recipe was
AI-generated. This is informational only and does not affect behaviour.

### RecipeSummaryRead for list vs RecipeRead for detail

The list endpoint returns `RecipeSummaryRead` (no ingredients) for performance. The detail
endpoint returns `RecipeRead` with the full ingredients array. Query keys differ:
`recipeKeys.lists()` vs `recipeKeys.detail(id)`. Do not conflate them — a cache hit on the
list does not satisfy the detail query.

### Dynamic ingredient rows

The ingredient list in `RecipeForm` uses `useFieldArray` from React Hook Form. Each row
has name, quantity, unit, and category fields. Allow the user to add unlimited rows and
remove any row.

### Search debounce

In `RecipesPage`, debounce the search input by ~300ms before updating the query key to
avoid firing a new API request on every keystroke.

### Pending backend features

`GET /recipes` with search and pagination is pending in the backend (see backend recipe.plan.md).
Until it ships, either query without filters or implement a local client-side filter on the
full list. Document the approach in the component.
