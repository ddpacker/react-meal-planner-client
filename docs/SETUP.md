# Development Setup

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- The FastAPI backend running at `http://localhost:8000`

## Installation

1. **Install dependencies**

```bash
npm install
```

---

2. **Configure environment**

Create `.env.local` in the project root:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### Auth by environment

| Build | Auth mechanism |
|-------|----------------|
| `npm run dev` (development) | Bearer token from login/register JSON, stored in `sessionStorage`, sent as `Authorization: Bearer …` |
| `npm run build` (production) | HttpOnly cookies only — no token storage; browser sends cookies on same-origin requests |

In development, ensure your API allows `http://localhost:5173` with `Access-Control-Allow-Credentials: true`. In production, the SPA and API must share the same origin (Azure Front Door) so HttpOnly cookies work.

Do not commit `.env.local`. In production, `VITE_API_BASE_URL` must point at the public origin (routed through Azure Front Door). Never put API keys or secrets in `.env` files with a `VITE_` prefix.

---

3. **Run the development server**

```bash
npm run dev
```

The app is available at `http://localhost:5173`.

## All commands

```bash
npm run dev           # development server (http://localhost:5173)
npm run build         # production build → dist/
npm run preview       # preview production build locally
npm run lint          # ESLint
npm run test          # Vitest watch mode
npm run test:run      # Vitest single-pass (CI)
npm run test:coverage # Vitest with coverage report
```
