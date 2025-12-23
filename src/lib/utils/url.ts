/**
 * Utility for URL related operations
 */

/**
 * Returns the base URL of the application.
 *
 * Logic:
 * 1. Returns NEXT_PUBLIC_BASE_URL if defined (recommended for production).
 * 2. In development (on localhost), attempts to resolve the external host if it's being proxied.
 * 3. Fallbacks to window.location.origin in the browser.
 * 4. Fallbacks to a default localhost address if all else fails.
 */
export async function getBaseUrl(): Promise<string> {
  // 1. Manually configured base URL (Production)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  }

  // Fallback check for browser environment
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const isDev = process.env.NODE_ENV === 'development';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    // 2. Special handling for development on localhost to resolve external IP
    if (isDev && isLocalhost) {
      try {
        const res = await fetch('/api/dev/host');
        if (res.ok) {
          const data = await res.json();
          const host = data.host as string;
          if (host) {
            const url = new URL(origin);
            url.hostname = host;
            return url.origin.replace(/\/$/, '');
          }
        }
      } catch (e) {
        console.warn('Failed to resolve dev host, fallback to origin', e);
      }
    }

    // 3. Browser origin fallback
    return origin.replace(/\/$/, '');
  }

  // 4. Server-side default fallback
  return 'http://localhost:8080';
}

/**
 * Builds a full URL for a specific route.
 */
export async function buildFullUrl(path: string): Promise<string> {
  const baseUrl = await getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
