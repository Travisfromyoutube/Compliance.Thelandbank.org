/**
 * useApiClient — fetch wrapper that attaches Clerk session tokens.
 *
 * In prototype mode (no Clerk), behaves like regular fetch.
 * When Clerk is active, automatically adds Authorization: Bearer <token>.
 *
 * Usage:
 *   const api = useApiClient();
 *   const res = await api('/api/properties');
 *   const data = await res.json();
 */

import { useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * Prototype hook — returns plain fetch (no auth headers).
 * Used when Clerk is not configured.
 */
function useApiClientPrototype() {
  return useCallback((url, options = {}) => fetch(url, options), []);
}

/**
 * Clerk hook — injects Bearer token from useAuth().
 * Only called when ClerkProvider is active.
 */
function useApiClientClerk() {
  const { getToken } = useAuth();

  return useCallback(
    async (url, options = {}) => {
      const headers = { ...options.headers };

      try {
        const token = await getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {
        /* Token fetch failed — proceed without auth header */
      }

      return fetch(url, { ...options, headers });
    },
    [getToken],
  );
}

/**
 * Returns a fetch-like function that injects the Clerk Bearer token.
 * Falls back to plain fetch in prototype mode.
 *
 * React rules of hooks require unconditional hook calls, so we split
 * into two implementations selected at module load time via env var.
 * Tree-shaking removes the unused path in production builds.
 */
export const useApiClient = CLERK_KEY ? useApiClientClerk : useApiClientPrototype;
