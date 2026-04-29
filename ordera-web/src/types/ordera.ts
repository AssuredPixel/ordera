export enum Role {
  OWNER = 'OWNER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  SUPERVISOR = 'SUPERVISOR',
  CASHIER = 'CASHIER',
  WAITER = 'WAITER',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  SENT_TO_KITCHEN = 'SENT_TO_KITCHEN',
  IN_PREPARATION = 'IN_PREPARATION',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  SERVED = 'SERVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export interface Money {
  amount: number; // in cents
  currency: string;
}

export interface BranchStats {
  kpis: {
    revenue: number;
    ordersToday: number;
    staffOnShift: number;
    openOrders: number;
  };
  businessDay: {
    _id?: string;
    status: string;
    branchName?: string;
    operatingMode?: string;
    actualOpen?: string;
  };
  stockAlerts: StockAlert[];
  performance: StaffPerformance[];
  recentBills: BillSummary[];
}

export interface StockAlert {
  _id: string;
  name: string;
  stockStatus: string;
  categoryId: {
    _id: string;
    name: string;
  };
}

export interface StaffPerformance {
  _id: string;
  waiterName: string;
  ordersCount: number;
  revenue: number;
}

export interface BillSummary {
  _id: string;
  tableNumber: string;
  total: Money;
  payment?: {
    method: string;
  };
  createdAt: string;
}

export interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface Invitation {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}
