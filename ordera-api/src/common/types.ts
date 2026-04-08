export const enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  WAITER = 'waiter',
  KITCHEN = "kitchen"
}

export interface Money {
  amount: number; // in subunits (kobo/cents)
  currency: string;
}

export const BRAND_COLORS = {
  amber: '#C97B2A',
  navy: '#1A1A2E',
} as const;
