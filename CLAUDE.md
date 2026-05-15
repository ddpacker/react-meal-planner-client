# Meal Planner Frontend — Quick Reference

## Project Overview

React + TypeScript frontend for the weekly meal planning assistant. Consumes the FastAPI meal planner API. Built with Vite, styled with Tailwind CSS, and uses MUI components as a base. React Query handles server state; React Router handles navigation.

## Run commands
```bash
npm install
npm run dev
npm run build
npm run test
npm run lint
```

## Coding standards

@.cursor/rules/components.mdc
@.cursor/rules/security.mdc
@.cursor/rules/state.mdc
@.cursor/rules/styling.mdc
@.cursor/rules/testing.mdc

## Architecture
`docs/ARCHITECTURE.md` — component tree, routing structure, API integration layer

## Environment
```bash
VITE_API_BASE_URL=http://localhost:8000
```
