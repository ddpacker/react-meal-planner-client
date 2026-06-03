---
name: infrastructure
overview: >
  Azure infrastructure and CI/CD for the React client. Target: Azure Static Web Apps (SWA)
  for hosting, Azure Front Door for same-origin routing (client + API under one domain),
  GitHub Actions for automated test/build/deploy on push to main.
todos:
  - id: swa-provision
    content: >
      Provision Azure Static Web App (swa-meal-planner-client-dev) in resource group
      rg-fastapi-meal-planner-dev. Retrieve the SWA deployment token and add it as a
      GitHub Actions secret (AZURE_STATIC_WEB_APPS_API_TOKEN). Set VITE_API_BASE_URL
      in the SWA application settings.
      See docs/INFRASTRUCTURE.md for full CLI commands.
    status: pending

  - id: staticwebapp-config
    content: >
      Create staticwebapp.config.json at the project root. Must include:
        navigationFallback (rewrite all paths to /index.html except /assets/* and /favicon.svg)
      Without this, hard-refreshing any client-side route (e.g. /recipes/42) returns 404
      from the SWA edge. Commit the file to the repo root.
    status: pending

  - id: gha-deploy-workflow
    content: >
      Create .github/workflows/deploy-client.yml. Triggers on push to main.
      Steps:
        1. actions/checkout@v4
        2. actions/setup-node@v4 (Node 20, npm cache)
        3. npm ci
        4. npm run test:run
        5. npm run build (VITE_API_BASE_URL injected from vars.VITE_API_BASE_URL)
        6. Azure/static-web-apps-deploy@v1 (upload dist/, skip build)
      Required GitHub secrets: AZURE_STATIC_WEB_APPS_API_TOKEN
      Required GitHub vars: VITE_API_BASE_URL
    status: pending
    dependencies:
      - swa-provision
      - staticwebapp-config

  - id: front-door-routing
    content: >
      Configure Azure Front Door to route:
        /api/* → Azure Container Apps (FastAPI backend)
        /*    → Azure Static Web Apps (React client)
      Both origins must share the same hostname so the SameSite=Strict cookie set by the
      backend is accepted by the browser on the client's origin. This is a shared resource
      with the backend infrastructure team.
      Blocked on: backend Container Apps deployment (see backend infrastructure.plan.md).
    status: pending
    dependencies:
      - swa-provision

  - id: pr-preview-environments
    content: >
      Azure Static Web Apps supports automatic preview environments for pull requests via
      the staging environments feature. Configure the deploy workflow to create a preview URL
      on PR open and delete it on PR close. Update the workflow's action parameter:
        action: upload   (push to main)
        action: close    (PR closed)
      Document the preview URL pattern in DEPLOYMENT.md.
    status: pending
    dependencies:
      - gha-deploy-workflow

  - id: monitoring
    content: >
      Configure Application Insights for the React client:
        - Add @microsoft/applicationinsights-web to dependencies.
        - Initialise with the connection string from the SWA environment variable
          VITE_APPINSIGHTS_CONNECTION_STRING.
        - Track page views and unhandled errors automatically.
        - Do not log user input, recipe content, or any PII.
      Blocked on: Application Insights workspace provisioned by backend team.
    status: pending
    dependencies:
      - swa-provision
---

## Roadmap

| Status | Task |
|--------|------|
| ⏳ Pending | Provision Azure Static Web App |
| ⏳ Pending | staticwebapp.config.json (SPA routing fallback) |
| ⏳ Pending | GitHub Actions deploy workflow |
| ⏳ Pending | Azure Front Door same-origin routing (blocked on backend ACA deployment) |
| ⏳ Pending | PR preview environments |
| ⏳ Pending | Application Insights |

---

## Implementation notes

### SWA tier

The Free tier is sufficient for development. Upgrade to Standard if custom domains,
authentication providers, or more than 100 GB/month bandwidth are needed.

### Environment variables in SWA

`VITE_*` variables are baked into the JavaScript bundle at build time — they are public.
Set them as GitHub Actions vars (not secrets) and inject them via the `npm run build` step.
Do not put `VITE_*` values in Key Vault — they are not sensitive.

### GitHub Actions vars vs secrets

| Item | Type | Reason |
|---|---|---|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Secret | Grants write access to the SWA |
| `VITE_API_BASE_URL` | Var | Public, safe to read in workflow logs |

### staticwebapp.config.json

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/favicon.svg", "/*.json"]
  },
  "mimeTypes": {
    ".json": "text/json"
  }
}
```

### Resource naming

| Resource | Name |
|---|---|
| Static Web App | `swa-meal-planner-client-dev` |
| Front Door | `afd-meal-planner-dev` |
| Resource Group | `rg-fastapi-meal-planner-dev` |
