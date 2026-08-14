# Meal Planner Frontend — Quick Reference

## Project Overview

React + TypeScript SPA for the weekly meal planning assistant. Consumes the FastAPI meal
planner API at `VITE_API_BASE_URL`. Built with Vite, styled with Tailwind CSS v4 + MUI v9.
React Query v5 handles server state; React Router v7 handles navigation; React Hook Form +
Zod handles forms.

Deployed to Azure Static Web Apps behind Azure Front Door (same-origin as the FastAPI backend).
Auth transport differs by build environment — see [CONV-AUTH](docs/CONVENTIONS.md#conv-auth).

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

@docs/ARCHITECTURE.md
@docs/CONVENTIONS.md
@docs/SETUP.md

## Coding standards

@.cursor/rules/components.mdc
@.cursor/rules/security.mdc
@.cursor/rules/state.mdc
@.cursor/rules/styling.mdc
@.cursor/rules/testing.mdc

## Key source conventions

Cross-cutting decisions live in `docs/CONVENTIONS.md` with stable CONV-* IDs. Quick index:

- **[CONV-AUTH](docs/CONVENTIONS.md#conv-auth)** — Bearer token in dev, HttpOnly cookie in prod
- **[CONV-API-CLIENT](docs/CONVENTIONS.md#conv-api-client)** — one Axios instance; never import `axios` directly
- **[CONV-QUERY-KEYS](docs/CONVENTIONS.md#conv-query-keys)** — all keys in `queryKeys.ts`; never inline
- **[CONV-HOOKS](docs/CONVENTIONS.md#conv-hooks)** — `useQuery`/`useMutation` only in `src/hooks/`
- **[CONV-UNITS](docs/CONVENTIONS.md#conv-units)** — API always metric; display-only conversion
- **[CONV-TYPES](docs/CONVENTIONS.md#conv-types)** — `*Read/*Create/*Update`; Zod schema is source of truth
- **[CONV-STYLING](docs/CONVENTIONS.md#conv-styling)** — Tailwind for layout, MUI for interactive, `tokens.ts` for color
- **Tests** — `src/__tests__/`; use `renderWithProviders`; mock API with MSW
