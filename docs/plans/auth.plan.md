---
name: auth
overview: >
  Auth flow for the React client. Email/password login and register pages, Google OIDC
  redirect handling, AuthContext with token-refresh interceptor, RequireAuth route guard,
  and logout. The JWT lives in an HttpOnly cookie — the frontend never reads the token value.
todos:
  - id: axios-client
    content: >
      Create src/lib/api/client.ts with a single Axios instance (baseURL from
      import.meta.env.VITE_API_BASE_URL). Add a response interceptor that handles 401s:
      serialise concurrent 401 failures (queue them), call POST /auth/refresh once, then
      replay queued requests. If the refresh call itself fails (refresh token expired or
      revoked), flush the queue with errors and redirect to /login. Do not set
      withCredentials — requests are same-origin.
    status: completed

  - id: auth-api
    content: >
      Create src/lib/api/auth.ts with typed functions:
        login(email, password) -> void (sets cookie via backend)
        register(email, password) -> void
        logout() -> void
        refreshToken() -> void (used internally by interceptor)
        getMe() -> UserRead
      All use the shared Axios instance from client.ts.
    status: completed
    dependencies:
      - axios-client

  - id: auth-context
    content: >
      Create src/context/AuthContext.tsx. Expose isAuthenticated (bool), isLoading (bool),
      user (UserRead | null), login(), and logout(). Drive isAuthenticated and user from a
      useQuery on GET /users/me — success means authenticated, 401 means not authenticated.
      isLoading is true while the /users/me query is in flight. On logout, call
      POST /auth/logout, clear the query cache, and navigate to /login.
    status: completed
    dependencies:
      - auth-api

  - id: require-auth
    content: >
      Create src/components/RequireAuth.tsx. While isLoading is true, render a full-page
      CircularProgress (not null, not a redirect). Once resolved, redirect to /login if not
      authenticated; otherwise render the child outlet. This prevents redirect flicker on hard
      refresh for authenticated users.
    status: completed
    dependencies:
      - auth-context

  - id: router
    content: >
      Create src/router.tsx using createBrowserRouter. Wrap authenticated routes in
      <RequireAuth>. Public routes: /login, /register, /auth/google/callback.
      Authenticated routes: /, /meal-plans/:id, /recipes, /recipes/:id,
      /grocery/:listId, /profile. Wire into src/main.tsx via RouterProvider.
    status: completed
    dependencies:
      - require-auth

  - id: login-page
    content: >
      Create src/pages/LoginPage.tsx. Email + password form using React Hook Form + Zod.
      On success, navigate to /. Show inline error for invalid credentials (401 response).
      Include a "Sign in with Google" button that navigates to GET /auth/google (the backend
      redirect endpoint). Link to /register.
    status: pending
    dependencies:
      - auth-context

  - id: register-page
    content: >
      Create src/pages/RegisterPage.tsx. Email + password + confirm-password form using
      React Hook Form + Zod. On success, auto-login and navigate to /. Show inline error
      for duplicate email (409 response). Link to /login.
    status: pending
    dependencies:
      - auth-context

  - id: google-callback-page
    content: >
      Create src/pages/GoogleCallbackPage.tsx. The backend handles the OAuth code exchange
      and sets the JWT cookie before redirecting to this page. On mount, call GET /users/me
      to confirm the session is live, then navigate to /. Show an error state if /users/me
      fails (the Google flow failed server-side).
    status: pending
    dependencies:
      - auth-context

  - id: auth-tests
    content: >
      Tests for auth flow:
      - LoginPage: submit valid credentials → navigate to /; wrong password → show error.
      - RegisterPage: submit valid data → navigate to /; duplicate email → show error.
      - RequireAuth: renders spinner while isLoading; redirects to /login when not authenticated;
        renders children when authenticated.
      - Axios interceptor: single refresh fires on concurrent 401s; redirect on refresh failure.
      Use renderWithProviders with authState overrides; MSW handlers for /auth/login, /auth/register,
      /auth/refresh, /users/me.
    status: pending
    dependencies:
      - login-page
      - register-page
      - google-callback-page
---

## Roadmap

| Status | Task |
|--------|------|
| ✅ Done | Axios client + 401 refresh interceptor |
| ✅ Done | Auth API functions (login, register, logout, getMe) |
| ✅ Done | AuthContext + useAuth hook |
| ✅ Done | RequireAuth route guard |
| ✅ Done | Router (public + authenticated routes) |
| ⏳ Pending | LoginPage (email/password + Google button) |
| ⏳ Pending | RegisterPage |
| ⏳ Pending | GoogleCallbackPage (OIDC return handler) |
| ⏳ Pending | Auth tests |

---

## Implementation notes

### Cookie flow

The backend sets an `HttpOnly; Secure; SameSite=Strict` cookie on login. The frontend never
reads the token — it cannot. The Axios client does not need `withCredentials` because the
SPA and API share the same origin via Azure Front Door.

### Token refresh serialisation

Multiple queries may fail simultaneously with 401 when the access token expires (e.g., a page
that fires three queries on mount). The interceptor must ensure only one `POST /auth/refresh`
is sent. Use a module-level `isRefreshing` flag and a `pendingQueue` to hold the failed requests;
replay them after the refresh resolves.

```ts
let isRefreshing = false;
let pendingQueue: Array<(token: void) => void> = [];

// inside response interceptor on 401:
if (!isRefreshing) {
  isRefreshing = true;
  refreshToken()
    .then(() => { pendingQueue.forEach(cb => cb()); pendingQueue = []; })
    .catch(() => { /* redirect to /login */ })
    .finally(() => { isRefreshing = false; });
}
return new Promise(resolve => pendingQueue.push(() => resolve(apiClient(originalRequest))));
```

### Google OIDC

The frontend initiates Google login by navigating to `GET /auth/google` (the backend redirect).
The backend handles the OAuth exchange and redirects back to `/auth/google/callback` with the
JWT cookie already set. The callback page only needs to verify the session and navigate to `/`.

### AuthContext isLoading guard

`<RequireAuth>` must render a spinner (not redirect) while `isLoading` is true. If it
redirects immediately before the `/users/me` query resolves, authenticated users get sent to
`/login` on every hard refresh.
