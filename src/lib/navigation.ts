'use client';

import { useRouter as useNextRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { routes, routeMetadata, type RouteMetadataKey } from './routes';

/**
 * Type-safe wrapper around Next.js useRouter
 * Provides the same API but encourages use of centralized routes
 */
export function useTypedRouter() {
  const router = useNextRouter();
  const pathname = usePathname();

  return {
    ...router,
    pathname,
    /**
     * Navigate to a route using the centralized route definitions
     * @example
     * const router = useTypedRouter();
     * router.push(routes.chat.room('123'));
     */
    push: router.push,
    replace: router.replace,
    back: router.back,
    forward: router.forward,
    refresh: router.refresh,
  };
}

/**
 * Check if user is authenticated (simple localStorage check)
 * In production, this should use a more robust auth system
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const user = localStorage.getItem('chat_user');
  return !!user;
}

/**
 * Get current route metadata
 */
export function getCurrentRouteMetadata(pathname: string) {
  // Try exact match first
  if (pathname in routeMetadata) {
    return routeMetadata[pathname as RouteMetadataKey];
  }

  // Try pattern matching for dynamic routes
  if (pathname.startsWith('/chat/')) {
    return routeMetadata['/chat/:roomId'];
  }

  return null;
}

/**
 * Route guard hook for authentication
 * Redirects to login if not authenticated and route requires auth
 * Redirects to dashboard if authenticated and route is guest-only
 *
 * @example
 * // In a page component
 * useRouteGuard();
 */
export function useRouteGuard() {
  const router = useNextRouter();
  const pathname = usePathname();

  useEffect(() => {
    const metadata = getCurrentRouteMetadata(pathname);
    if (!metadata) return;

    const authenticated = isAuthenticated();

    // Redirect if auth required but not authenticated
    if (metadata.requiresAuth && !authenticated) {
      router.push(metadata.redirectIfUnauthenticated || routes.auth.login());
    }

    // Redirect if guest-only but authenticated
    if (
      !metadata.requiresAuth &&
      metadata.redirectIfAuthenticated &&
      authenticated
    ) {
      router.push(metadata.redirectIfAuthenticated);
    }
  }, [pathname, router]);
}

/**
 * Match a pathname against a route pattern
 * @param pathname - Current pathname
 * @param pattern - Route pattern with :param syntax
 */
export function matchRoute(pathname: string, pattern: string): boolean {
  const patternRegex = new RegExp(
    '^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$',
  );
  return patternRegex.test(pathname);
}

/**
 * Extract parameters from a pathname using a route pattern
 * @param pathname - Current pathname
 * @param pattern - Route pattern with :param syntax
 * @returns Object with parameter key-value pairs
 *
 * @example
 * extractParams('/chat/room123', '/chat/:roomId')
 */
export function extractParams(
  pathname: string,
  pattern: string,
): Record<string, string> {
  const patternParts = pattern.split('/');
  const pathnameParts = pathname.split('/');
  const params: Record<string, string> = {};

  patternParts.forEach((part, index) => {
    if (part.startsWith(':')) {
      const paramName = part.slice(1);
      params[paramName] = pathnameParts[index];
    }
  });

  return params;
}
