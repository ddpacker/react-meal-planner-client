# Infrastructure Setup

## Azure Configuration

### Prerequisites

Azure CLI installed and logged in:

```bash
az login
```

The backend resource group `rg-fastapi-meal-planner-dev` already exists (see backend [INFRASTRUCTURE.md](../../fastapi-meal-planner-backend/docs/INFRASTRUCTURE.md)). All client-side resources are provisioned within the same group.

---

## Setup

1. **Create Azure Static Web App**

```bash
RG_NAME=rg-fastapi-meal-planner-dev
SWA_NAME=swa-meal-planner-client-dev

az staticwebapp create \
  --name $SWA_NAME \
  --resource-group $RG_NAME \
  --location eastus2 \
  --sku Free
```

Retrieve the deployment token for GitHub Actions:

```bash
az staticwebapp secrets list \
  --name $SWA_NAME \
  --resource-group $RG_NAME \
  --query "properties.apiKey" \
  --output tsv
```

Add the result as a GitHub Actions secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`.

---

2. **Set environment variable in SWA**

```bash
az staticwebapp appsettings set \
  --name $SWA_NAME \
  --resource-group $RG_NAME \
  --setting-names VITE_API_BASE_URL=https://meal-planner.example.com
```

`VITE_API_BASE_URL` is a build-time public variable — it is safe to set here and does not need to be in Key Vault.

---

3. **Add GitHub Secret**

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**

- Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`, Value: [paste from step 1]

---

4. **Validate deployment**

Push to `main` and confirm the `deploy-client.yml` workflow succeeds. The SWA URL is listed in the Azure Portal under Static Web Apps → Overview.

---

## Azure Front Door (same-origin routing)

Azure Front Door must route both the React client and the FastAPI backend under the same origin so that `SameSite=Strict` cookies work correctly. Without same-origin routing, the `HttpOnly` JWT cookie cannot be set or sent.

*Full Front Door setup is pending — to be documented once the backend Azure Container Apps deployment is complete (see backend infrastructure.plan.md).*

Planned origin groups:

| Path prefix | Backend |
|---|---|
| `/api/*` | Azure Container Apps (FastAPI) |
| `/*` | Azure Static Web Apps (React) |

---

## GitHub Actions Workflows

### Authentication

The SWA deployment workflow uses the SWA API token (a GitHub Actions secret). No OIDC is required for SWA deployments — the `Azure/static-web-apps-deploy@v1` action authenticates via the token.

### Available Workflows

*(None yet — to be created)*

### Planned Workflows

- **deploy-client** (`.github/workflows/deploy-client.yml`) — run tests, build, deploy to SWA on push to `main`

---

## Resource naming convention

| Resource | Name |
|---|---|
| Resource Group | `rg-fastapi-meal-planner-dev` |
| Static Web App | `swa-meal-planner-client-dev` |
| Front Door | `afd-meal-planner-dev` |
