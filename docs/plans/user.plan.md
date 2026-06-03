---
name: user
overview: >
  User profile and preferences UI. Covers ProfilePage with email/password update forms,
  unit system preference toggle (metric/imperial), and account deletion with confirmation.
  The unit preference drives display throughout the app — it is fetched on login and cached
  in AuthContext or a dedicated query.
todos:
  - id: user-types
    content: >
      Create src/types/user.ts with types mirroring the backend schemas:
        UserRead (id, email, created_at)
        UserUpdate (email?, password? — password change also requires current_password)
        UserPreferencesRead (unit_system: 'metric' | 'imperial')
        UserPreferencesUpdate (unit_system: 'metric' | 'imperial')
        UnitSystem = 'metric' | 'imperial'
    status: pending

  - id: user-api
    content: >
      Create src/lib/api/user.ts with typed functions:
        fetchMe() -> UserRead
        updateMe(body: UserUpdate) -> UserRead
        deleteMe(password: string) -> void
        fetchPreferences() -> UserPreferencesRead
        updatePreferences(body: UserPreferencesUpdate) -> UserPreferencesRead
    status: pending
    dependencies:
      - user-types

  - id: user-query-keys
    content: >
      Add userKeys to src/lib/queryKeys.ts:
        me(), preferences()
      Note: /users/me is already queried in AuthContext. Reuse the same query key so the
      profile page reads from the cache rather than issuing a duplicate request.
    status: pending
    dependencies:
      - user-api

  - id: user-hooks
    content: >
      Create src/hooks/useUser.ts with:
        useMe() — useQuery on fetchMe(); reuses AuthContext cache entry
        usePreferences() — useQuery on fetchPreferences()
        useUpdateMe() — useMutation; onSuccess: invalidate me()
        useUpdatePreferences() — useMutation; onSuccess: invalidate preferences()
        useDeleteMe() — useMutation; onSuccess: logout() + navigate to /login
    status: pending
    dependencies:
      - user-query-keys

  - id: unit-system-context
    content: >
      Expose the unit_system preference app-wide so any component that renders quantities
      can access it without prop drilling. Options:
        a) Add unitSystem to AuthContext (simplest — fetch preferences alongside /users/me).
        b) Create a separate PreferencesContext.
      Recommendation: extend AuthContext with unitSystem: UnitSystem (default 'metric').
      The formatQuantity(value, unit, unitSystem) utility is then called with the context value.
    status: pending
    dependencies:
      - user-hooks

  - id: profile-page
    content: >
      Create src/pages/ProfilePage.tsx. Sections:
        1. Account info: display current email; "Change email" form (email field + current
           password). React Hook Form + Zod.
        2. Password: "Change password" form (current password, new password, confirm).
        3. Preferences: unit system toggle (MUI ToggleButtonGroup: Metric / Imperial).
           Calls useUpdatePreferences() on change; no save button needed (auto-save).
        4. Danger zone: "Delete account" button that opens a confirmation Dialog requiring
           the user to type their password before calling useDeleteMe().
    status: pending
    dependencies:
      - unit-system-context

  - id: user-tests
    content: >
      Tests for:
        - ProfilePage: renders email; change email form validation + submit; password change;
          unit preference toggle calls mutation; delete account requires password.
        - useUpdatePreferences: invalidates preferences() on success.
        - useDeleteMe: calls logout() and navigates to /login on success.
      MSW handlers for GET /users/me, PATCH /users/me, GET/PATCH /users/me/preferences,
      DELETE /users/me.
    status: pending
    dependencies:
      - profile-page
---

## Roadmap

| Status | Task |
|--------|------|
| ⏳ Pending | TypeScript types (UserRead, UserUpdate, UserPreferences) |
| ⏳ Pending | User API functions |
| ⏳ Pending | Query keys |
| ⏳ Pending | Custom hooks |
| ⏳ Pending | Unit system context (extend AuthContext or separate PreferencesContext) |
| ⏳ Pending | ProfilePage (email, password, unit preference, delete) |
| ⏳ Pending | Tests |

---

## Implementation notes

### Unit system global access

Every component that renders quantities (recipe ingredients, grocery items, nutrition macros)
needs the unit preference. Adding `unitSystem` to `AuthContext` is the simplest path — it
is fetched once on login alongside `/users/me` and never changes until the user updates it.
When `useUpdatePreferences` succeeds, invalidate the `me()` / `preferences()` query so
`AuthContext` picks up the new value.

### formatQuantity utility

```ts
// src/lib/formatQuantity.ts
export function formatQuantity(
  value: number,
  unit: string,
  unitSystem: UnitSystem,
): string {
  if (unitSystem === 'imperial') {
    // gram → oz/lb, ml → fl oz/cup, etc.
    return convertToImperial(value, unit);
  }
  return `${value} ${unit}`;
}
```

All conversions are display-only. Never submit imperial values to the API.

### Password change form

The backend requires `current_password` as part of the PATCH /users/me body when changing
the password. The Zod schema must include `current_password` as a required field alongside
`password` and `confirm_password`. `confirm_password` is client-only — do not send it to the API.

### Delete account

The delete confirmation Dialog must:
1. Explain that all data (meal plans, recipes, chat history) will be permanently deleted.
2. Require the user to enter their current password (not just type "DELETE").
3. Show a loading spinner while the mutation is in flight.
4. On success, call `logout()` to clear the auth state before navigating to `/login`.

### Pending backend features

`GET /users/me`, `PATCH /users/me`, `DELETE /users/me`, and preferences endpoints are all
pending backend implementation (see backend user.plan.md). Build the UI against MSW mocks;
wire to the real API once the backend ships.
