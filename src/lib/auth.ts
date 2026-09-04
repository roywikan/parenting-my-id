/**
 * Authentication and Session token helpers for client-side API calls
 */

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cms_token');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
