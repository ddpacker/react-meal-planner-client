# Meal Planner Frontend

This is a React + TypeScript SPA for the weekly meal planning assistant. It consumes the FastAPI meal planner API to manage meal plans, trigger AI recipe generation, refine recipes via chat, generate grocery lists, and view per-recipe nutrition data.

## Features

- **User auth** with JWT (email + password; optional Google OIDC).
- **Weekly meal plans** with AI-generated recipes.
- **Per-meal chat sessions** to iteratively refine recipes.
- **Grocery list generation** from all ingredients in a week.
- **Basic nutrition estimates** per recipe.

## Tech Stack

- React, TypeScript, Vite
- Tailwind CSS v4, MUI v9
- React Query v5, React Router v7, React Hook Form + Zod
- Azure: Static Web Apps, Front Door
- CI/CD: GitHub Actions

## Documentation

- [Architecture](docs/ARCHITECTURE.md) – Component tree, routing, API integration layer, state management
- [Setup Guide](docs/SETUP.md) – Development environment and all run commands
- [Deployment](docs/DEPLOYMENT.md) – Azure Static Web Apps deployment
- [Infrastructure](docs/INFRASTRUCTURE.md) – Azure resource provisioning

## Quick start

1. Clone repo
2. `npm install`
3. Configure environment (see [SETUP.md](docs/SETUP.md)):
   ```bash
   # .env.local
   VITE_API_BASE_URL=http://localhost:8000
   ```
4. Start the FastAPI backend at `http://localhost:8000`
5. `npm run dev`
6. Open http://localhost:5173

See [SETUP.md](docs/SETUP.md) for full details.

## Run commands

```bash
npm run dev           # dev server at http://localhost:5173
npm run build         # production build → dist/
npm run preview       # preview production build locally
npm run lint          # ESLint
npm run test          # Vitest watch mode
npm run test:run      # Vitest single-pass (CI)
npm run test:coverage # Vitest with coverage report
```

## Project layout

- `src/components/` – Shared, reusable UI components (PascalCase, named exports).
- `src/pages/` – Route-level components (one per route).
- `src/hooks/` – Custom hooks; all `useQuery` / `useMutation` calls live here.
- `src/context/` – React context providers (auth state, login/logout).
- `src/lib/api/` – Single Axios instance and resource-grouped API functions.
- `src/lib/queryKeys.ts` – All React Query key factories.
- `src/types/` – TypeScript types mirroring backend Pydantic schemas (`*Read`, `*Create`, `*Update`).
- `src/router.tsx` – React Router route definitions.
- `src/main.tsx` – App entrypoint; `QueryClientProvider`, `RouterProvider`.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed design and data flow.

## Infrastructure

### Cloud Hosting

- **Provider:** Azure
- **Hosting:** Azure Static Web Apps — global edge delivery for the React SPA.
- **Routing:** Azure Front Door — routes both the SPA and FastAPI backend under the same origin, enabling `SameSite=Strict` JWT cookies without `withCredentials`.
- **Security:** JWT stored in `HttpOnly` cookie; frontend never reads the token value. No API keys or secrets in the client build.

### DevOps and Tooling

- **CI/CD:** GitHub Actions — runs tests, builds, and deploys to Azure Static Web Apps on push to `main`.
- **SPA Routing:** `staticwebapp.config.json` at the repo root rewrites all unmatched routes to `index.html` so client-side routing works on hard refresh.

See [INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) for Azure resource setup and workflow details.

## Git Workflow

- Commit names: `type: summary of change`
- Branch names: `type/short-description`
- PRs squashed to: `type: short description`