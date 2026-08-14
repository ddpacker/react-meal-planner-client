# Conventions

Single source of truth for cross-cutting decisions. Each has a stable ID. Cursor rules and
prompts reference by ID (e.g. "per [CONV-AUTH](#conv-auth)") instead of restating. When you
change a decision, edit it here — that propagates everywhere. If a feature must deviate,
it should say so explicitly and explain why.

---

## CONV-AUTH

Auth transport differs by build environment.

**Dev** (`import.meta.env.PROD === false`): Bearer token. Returned from login/register as
`access_token` in the JSON response. Stored in-memory via `setAccessToken()`; persisted to
`sessionStorage` so page refreshes don't require re-login (`restoreAccessToken()` runs on
module load). Sent as `Authorization: Bearer <token>` via the Axios request interceptor.

**Prod**: HttpOnly cookie only. The browser attaches it automatically on same-origin
requests. The `access_token` JSON field from login/register is ignored.

`withCredentials: true` is set on the Axios instance for both environments.

**Why it matters:** Adding a second Axios instance, calling `fetch` directly, using
`localStorage`, or setting `Authorization` unconditionally all break this contract.

---

## CONV-API-CLIENT

`src/lib/api/client.ts` exports the one `apiClient`. All API calls must go through it.
Never import `axios` directly in any other file. Never call `fetch` for API requests.

**Why:** The 401 interceptor (silent refresh + queue + redirect) only fires on this instance.
Direct `fetch` or a second instance silently bypasses token refresh.

---

## CONV-QUERY-KEYS

All React Query keys are defined in `src/lib/queryKeys.ts`. Never inline `['recipes']` or
any other key array in a hook or component. Use the factory functions:
`recipeKeys.lists()`, `mealPlanKeys.detail(id)`, etc.

**Why:** Scattered keys make invalidation unreliable — a mutation might invalidate
`['recipes', 'list']` while the query uses `['recipes']` and the cache never clears.

---

## CONV-HOOKS

`useQuery` and `useMutation` are called only inside custom hooks in `src/hooks/`. Pages and
components call the hook; the hook calls the API function.

**Why:** Components stay testable without mocking React Query internals. Query key usage
stays traceable to one place per resource.

---

## CONV-UNITS

The API always returns and expects **metric** values. `UserPreferences.unit_system`
(`'metric'` | `'imperial'`) is a display hint only. Never submit imperial values to the API.
Use `formatQuantity(value, unit, unitSystem)` for display conversion. Forms that accept the
user's preferred unit must convert to metric before submission.

Null nutrition macro fields are displayed as `—`, never `0`.

---

## CONV-TYPES

Types in `src/types/` mirror backend Pydantic naming: `*Read` (response), `*Create` (POST
body), `*Update` (PATCH/PUT body). For forms, define the Zod schema first and infer the
TypeScript type via `z.infer<typeof schema>`. Never define a form type separately from its
schema — they drift.

---

## CONV-STYLING

- **Tailwind v4** for layout, spacing, typography, responsive breakpoints.
- **MUI v9** for interactive components (`Button`, `TextField`, `Dialog`, `Chip`, etc.).
- **`src/lib/theme/tokens.ts`** is the only source of truth for brand colours. No hex
  literals in pages or components. No generic Tailwind palette classes (`text-gray-600`,
  `bg-blue-500`) when a semantic token exists (`text-secondary`, `bg-background`).
- Standalone card pages (login, register, and similar flows) use `PageTemplate` from
  `src/components/layout/PageTemplate.tsx`.

---

## Related references

- Full component structure, routing, and data model: [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Changelog

One line per decision change: date, what changed, and why.

- **2026-08-13** — Extracted cross-cutting decisions into this file with stable `CONV-*` IDs.
  *Why:* cursor rules and ARCHITECTURE.md were restating the same decisions; one edit now
  propagates instead of N drifting copies.
