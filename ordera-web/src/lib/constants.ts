export const BRAND_COLORS = {
  primary: '#C97B2A',
  dark: '#1A1A2E',
} as const;

export const enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  WAITER = 'waiter',
  KITCHEN = "kitchen",
}
