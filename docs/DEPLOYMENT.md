# Deployment

## Overview

The React client deploys to Azure Static Web Apps (SWA). Azure Front Door sits in front of both the SWA and the FastAPI backend, routing both under the same origin — which is what makes `SameSite=Strict` cookies work for the JWT auth flow.

See [INFRASTRUCTURE.md](INFRASTRUCTURE.md) for Azure resource setup.

## Pre-deployment checklist

- All tests passing (`npm run test:run`)
- Production build succeeds locally (`npm run build`)
- `staticwebapp.config.json` is present at the repo root
- `VITE_API_BASE_URL` is configured in the SWA environment variables
- Backend is deployed and healthy

## Build

```bash
npm run build
```

Output goes to `dist/`. The SWA deployment workflow uploads this directory.

## SPA routing

Azure Static Web Apps requires a `staticwebapp.config.json` at the repo root to support client-side routing. Without it, hard-refreshing any route other than `/` returns a 404 from the SWA edge.

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/favicon.svg"]
  },
  "mimeTypes": {
    ".json": "text/json"
  }
}
```

## Deployment to Azure Static Web Apps

*In progress — see [INFRASTRUCTURE.md](INFRASTRUCTURE.md) for Azure resource setup and GitHub Actions workflow.*

The GitHub Actions workflow (`.github/workflows/deploy-client.yml`) will:
1. Run `npm ci`
2. Run `npm run test:run`
3. Run `npm run build` with `VITE_API_BASE_URL` injected as an env var
4. Deploy `dist/` via the `Azure/static-web-apps-deploy@v1` action

```yaml
# .github/workflows/deploy-client.yml (planned)
name: Deploy Client

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test:run
      - run: npm run build
        env:
          VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: upload
          app_location: dist
          skip_app_build: true
```

## Environment variables

Set in the SWA resource configuration (Azure Portal → Static Web App → Configuration) or in the GitHub Actions workflow:

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | The backend URL as seen by the browser, routed through Azure Front Door (e.g. `https://meal-planner.example.com`) |

No secrets belong in the frontend build. The JWT lives in an `HttpOnly` cookie. There are no API keys in the client.

## Rollback

Azure Static Web Apps keeps deployment history. Roll back via the Azure Portal → Static Web App → Deployment history, or:

```bash
az staticwebapp revision activate \
  --name swa-meal-planner-client-dev \
  --resource-group rg-fastapi-meal-planner-dev \
  --revision-name <revision>
```

## Monitoring

*To be documented after Application Insights is wired into the Azure Front Door / SWA environment.*
