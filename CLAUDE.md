# Meal Planner Frontend — Quick Reference

## Project Overview

React + TypeScript SPA for the weekly meal planning assistant. Consumes the FastAPI meal
planner API at `VITE_API_BASE_URL`. Built with Vite, styled with Tailwind CSS v4 + MUI v9.
React Query v5 handles server state; React Router v7 handles navigation; React Hook Form +
Zod handles forms.

Deployed to Azure Static Web Apps behind Azure Front Door (same-origin as the FastAPI backend),
which is what makes `SameSite=Strict` JWT cookies work without `withCredentials`.

## Run commands

```bash
npm install
npm run dev         # dev server at http://localhost:5173
npm run build       # production build → dist/
npm run test        # Vitest watch mode
npm run test:run    # Vitest single-pass (CI)
npm run lint        # ESLint
```

## Environment

```bash
# .env.local (do not commit)
VITE_API_BASE_URL=http://localhost:8000
```

## Documentation

- `docs/ARCHITECTURE.md` — component tree, routing, API integration layer, state management
- `docs/SETUP.md` — full development setup including Vitest wiring
- `docs/DEPLOYMENT.md` — Azure Static Web Apps deployment
- `docs/INFRASTRUCTURE.md` — Azure resource provisioning
- `docs/plans/` — feature implementation plans (auth, meal, recipe, chat, grocery, nutrition, user, infrastructure)

## Coding standards

@.cursor/rules/components.mdc
@.cursor/rules/security.mdc
@.cursor/rules/state.mdc
@.cursor/rules/styling.mdc
@.cursor/rules/testing.mdc

## Key source conventions

- **One Axios instance** — `src/lib/api/client.ts`. Never import Axios elsewhere.
- **Query keys** — all in `src/lib/queryKeys.ts`. Never inline string arrays.
- **Hooks** — all `useQuery` / `useMutation` calls live in `src/hooks/`. Never in components.
- **Types** — `src/types/` mirrors backend Pydantic schemas (`*Read`, `*Create`, `*Update`).
- **Auth** — JWT is `HttpOnly` cookie; frontend never reads the token value.
- **Units** — API always returns metric. Unit preference is display-only; never submit imperial values.
- **Tests** — co-locate under `src/__tests__/`; use `renderWithProviders`; mock API with MSW.
