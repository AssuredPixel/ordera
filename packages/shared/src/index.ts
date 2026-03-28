export const UserRole = {
  OWNER: 'owner',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  WAITER: 'waiter',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];


export const BRAND_COLORS = {
  brand: '#C97B2A',
  sidebar: '#1A1A2E',
  surface: '#F9FAFB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;
