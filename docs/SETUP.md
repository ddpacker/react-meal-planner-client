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

Do not commit `.env.local`. The checked-in `.env` contains only the default `http://localhost:8000` value, which is safe — `VITE_*` variables are public build-time values. Never put API keys or secrets in `.env` files with a `VITE_` prefix.

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
