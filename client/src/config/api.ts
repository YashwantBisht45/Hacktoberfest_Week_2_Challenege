/**
 * ScopeGuard AI - Client API Endpoint Configuration
 *
 * In production (e.g. Render Static Site), set VITE_API_BASE_URL to the deployed backend URL
 * (e.g. https://scopeguard-api.onrender.com).
 * In development, VITE_API_BASE_URL is typically unset, so requests use relative paths (/api/...)
 * which are proxied by Vite to http://localhost:5000.
 */

export function resolveApiBaseUrl(envValue?: string): string {
  if (!envValue) return '';
  return envValue.trim().replace(/\/+$/, '');
}

export const API_BASE_URL: string = resolveApiBaseUrl(
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_API_BASE_URL as string | undefined)
    : undefined
);

export function getApiEndpoint(endpoint: string, baseUrl: string = API_BASE_URL): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return baseUrl ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint;
}
