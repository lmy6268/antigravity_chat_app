export const DASHBOARD_TABS = {
  ROOMS: 'rooms',
  FRIENDS: 'friends',
  SETTINGS: 'settings',
} as const;

export type DashboardTab = (typeof DASHBOARD_TABS)[keyof typeof DASHBOARD_TABS];
