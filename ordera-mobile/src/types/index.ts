export enum Role {
  SUPER_ADMIN = 'super_admin',
  OWNER = 'owner',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  WAITER = 'waiter',
  KITCHEN = 'kitchen'
}

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  salesId: string;
  organizationId: string;
  branchId: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}
