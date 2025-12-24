/**
 * Centralized route definitions for type-safe navigation
 * Provides a NavGraph-style declarative routing structure
 */

/**
 * Route builders with type safety
 * All routes return string literals (as const) for maximum type safety
 */
export const routes = {
  /**
   * Authentication routes
   */
  auth: {
    login: () => '/login' as const,
    register: () => '/register' as const,
  },

  /**
   * Dashboard (home) route
   */
  dashboard: () => '/' as const,

  /**
   * Chat routes
   */
  chat: {
    /**
     * Navigate to a specific chat room
     * @param roomId - The ID of the room to join
     */
    room: (roomId: string) => `/chat/${roomId}` as const,
  },
} as const;

/**
 * Route metadata for additional route information
 */
export const routeMetadata = {
  '/login': {
    title: 'Login',
    requiresAuth: false,
    redirectIfAuthenticated: '/',
  },
  '/register': {
    title: 'Register',
    requiresAuth: false,
    redirectIfAuthenticated: '/',
  },
  '/': {
    title: 'Dashboard',
    requiresAuth: true,
    redirectIfUnauthenticated: '/login',
  },
  '/chat/:roomId': {
    title: 'Chat Room',
    requiresAuth: true,
    redirectIfUnauthenticated: '/login',
  },
} as const;

/**
 * Type helper to extract all valid route paths
 */
type ExtractRoutes<T> = T extends (...args: unknown[]) => infer R
  ? R
  : T extends object
    ? { [K in keyof T]: ExtractRoutes<T[K]> }[keyof T]
    : never;

export type RoutePath = ExtractRoutes<typeof routes>;

/**
 * Type helper for route metadata keys
 */
export type RouteMetadataKey = keyof typeof routeMetadata;
