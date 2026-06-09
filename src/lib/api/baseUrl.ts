const DEFAULT_API_BASE_URL = 'http://localhost:8000';

/**
 * Resolve the API base URL for the current environment.
 *
 * Development uses Bearer tokens against a cross-origin API URL (typically
 * `http://localhost:8000`). Production expects same-origin routing (e.g. Azure
 * Front Door) with HttpOnly cookies.
 */
export function resolveApiBaseURL(): string {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}
