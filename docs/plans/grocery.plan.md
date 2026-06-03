---
name: grocery
overview: >
  Grocery list UI. Users generate a grocery list from a meal plan, view items grouped by
  category, check off items as they shop, adjust quantities, manually add or remove items,
  and export the list. GroceryListPage lives at /grocery/:listId.
todos:
  - id: grocery-types
    content: >
      Create src/types/grocery.ts with types mirroring the backend schemas:
        GroceryItemRead (id, name, total_quantity, unit, category, checked)
        GroceryItemUpdate (checked?, total_quantity?, unit?)
        GroceryItemCreate (name, quantity, unit, category)
        GroceryListRead (id, meal_plan_week_id, title, notes, items: GroceryItemRead[])
    status: pending

  - id: grocery-api
    content: >
      Create src/lib/api/grocery.ts with typed functions:
        generateGroceryList(planId) -> GroceryListRead
        fetchGroceryList(listId) -> GroceryListRead
        updateGroceryItem(itemId, body: GroceryItemUpdate) -> GroceryItemRead
        addGroceryItem(listId, body: GroceryItemCreate) -> GroceryItemRead
        removeGroceryItem(itemId) -> void
        exportGroceryList(listId) -> string  (plain text blob)
    status: pending
    dependencies:
      - grocery-types

  - id: grocery-query-keys
    content: >
      Add groceryKeys to src/lib/queryKeys.ts:
        all, list(listId)
    status: pending
    dependencies:
      - grocery-api

  - id: grocery-hooks
    content: >
      Create src/hooks/useGrocery.ts with:
        useGroceryList(listId) — useQuery on fetchGroceryList
        useGenerateGroceryList() — useMutation; onSuccess: invalidate list(listId) +
          navigate to /grocery/:listId
        useUpdateGroceryItem() — useMutation; onSuccess: invalidate list(listId)
        useAddGroceryItem() — useMutation; onSuccess: invalidate list(listId)
        useRemoveGroceryItem() — useMutation; onSuccess: invalidate list(listId)
    status: pending
    dependencies:
      - grocery-query-keys

  - id: grocery-list-page
    content: >
      Create src/pages/GroceryListPage.tsx. Fetches GroceryListRead via useGroceryList(listId).
      Groups items by category (sorted alphabetically within each group). Renders a
      GroceryCategoryGroup component per category. Includes:
        - "Regenerate" button (re-calls POST /grocery/meal-plans/:id/grocery-list, which
          atomically replaces the existing list — requires knowing the planId, so pass it via
          state or read from the list's meal_plan_week_id).
        - "Export" button that triggers a download of the plain-text list.
        - "Add item" inline form.
      Show a progress indicator (checked / total items) at the top.
    status: pending
    dependencies:
      - grocery-hooks

  - id: grocery-category-group
    content: >
      Create src/components/GroceryCategoryGroup.tsx. Renders a collapsible section for one
      category (e.g., "Produce", "Dairy"). Each item is a GroceryItem component showing the
      name, quantity + unit (formatted via formatQuantity with user's unit preference),
      a checkbox to toggle checked, and a delete button.
    status: pending
    dependencies:
      - grocery-list-page

  - id: grocery-item
    content: >
      Create src/components/GroceryItem.tsx. Renders a single GroceryItemRead:
        - MUI Checkbox — calls useUpdateGroceryItem with { checked: !item.checked } on change.
          Apply a strikethrough style when checked.
        - Name and formatted quantity/unit label.
        - Delete icon button — calls useRemoveGroceryItem with confirmation.
      Optimistic update: toggle the checked state locally before the mutation resolves.
    status: pending
    dependencies:
      - grocery-category-group

  - id: grocery-add-item-form
    content: >
      Create src/components/AddGroceryItemForm.tsx. An inline form (not a Dialog) at the bottom
      of GroceryListPage. Fields: name (text), quantity (number), unit (text), category (select
      with canonical options: produce, dairy, meat, pantry, frozen, other). Uses React Hook Form
      + Zod. On submit, calls useAddGroceryItem(); clears the form on success.
    status: pending
    dependencies:
      - grocery-hooks

  - id: grocery-tests
    content: >
      Tests for:
        - GroceryListPage: renders categories, shows progress indicator, calls regenerate.
        - GroceryItem: checkbox toggles checked state; delete removes item from list.
        - AddGroceryItemForm: validation errors, submit calls mutation.
        - useUpdateGroceryItem: invalidates list on success.
      MSW handlers for GET /grocery/grocery-lists/:id, PATCH /grocery/grocery-items/:id,
      POST /grocery/grocery-lists/:id/items, DELETE /grocery/grocery-items/:id.
    status: pending
    dependencies:
      - grocery-item
      - grocery-add-item-form
---

## Roadmap

| Status | Task |
|--------|------|
| ⏳ Pending | TypeScript types (GroceryList, GroceryItem) |
| ⏳ Pending | Grocery API functions |
| ⏳ Pending | Query keys |
| ⏳ Pending | Custom hooks |
| ⏳ Pending | GroceryListPage (categories + progress + export) |
| ⏳ Pending | GroceryCategoryGroup (collapsible section) |
| ⏳ Pending | GroceryItem (checkbox, quantity, delete) |
| ⏳ Pending | AddGroceryItemForm (inline add) |
| ⏳ Pending | Tests |

---

## Implementation notes

### Category grouping

The backend sets item categories from AI output. Normalise on display: capitalise the first
letter, map known synonyms to canonical names (e.g., "Meats" → "Meat"). Sort groups
alphabetically; sort items within each group by checked status (unchecked first).

### Optimistic checkbox updates

Use React Query's `onMutate` + `onError` + `onSettled` pattern for the checked toggle to
avoid the checkbox snapping back before the mutation resolves:

```ts
onMutate: async ({ itemId, checked }) => {
  await queryClient.cancelQueries({ queryKey: groceryKeys.list(listId) });
  const previous = queryClient.getQueryData(groceryKeys.list(listId));
  queryClient.setQueryData(groceryKeys.list(listId), (old) =>
    old ? { ...old, items: old.items.map(i => i.id === itemId ? { ...i, checked } : i) } : old
  );
  return { previous };
},
onError: (_, __, context) => {
  queryClient.setQueryData(groceryKeys.list(listId), context?.previous);
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: groceryKeys.list(listId) });
},
```

### Export

Call `fetchGroceryList(listId)` (cached) or `exportGroceryList(listId)` to get plain text,
then trigger a browser download:

```ts
const blob = new Blob([text], { type: 'text/plain' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = 'grocery-list.txt'; a.click();
URL.revokeObjectURL(url);
```

### Pending backend features

Manual add/remove items and the export endpoint are pending in the backend (see backend
grocery.plan.md). Disable the "Add item" form and "Export" button until the backend ships them.
