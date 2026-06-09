/**
 * Auth transport strategy by build environment.
 *
 * - Development / test: Bearer token from login JSON, persisted in sessionStorage
 *   (supports cross-origin local dev against the API).
 * - Production: HttpOnly cookies only — the browser attaches them on same-origin
 *   requests; the client never reads or stores the token.
 */
export function usesCookieAuth(): boolean {
  return import.meta.env.PROD;
}

export function usesBearerTokenAuth(): boolean {
  return !usesCookieAuth();
}
