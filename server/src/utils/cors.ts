/**
 * Parse client origins from string into normalized string array
 */
export function parseAllowedOrigins(originsStr?: string): string[] {
  if (!originsStr) return ['http://localhost:5173'];
  return originsStr
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}
