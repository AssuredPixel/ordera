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
  PICKED_UP = 'PICKED_UP',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
  BILLED = 'BILLED',
}

export enum BillStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
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

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
}

export interface OrderItem {
  _id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  notes?: string;
  selectedAddons?: { name: string; price: Money }[];
}

export interface Order {
  _id: string;
  tableNumber?: string;
  waiterName: string;
  status: OrderStatus;
  orderType: OrderType;
  guestCount: number;
  customerName?: string;
  items: OrderItem[];
  subtotal: Money;
  tax: Money;
  total: Money;
  createdAt: string;
  sentToKitchenAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  servedAt?: string;
}

export enum StockStatus {
  AVAILABLE = 'available',
  LOW = 'low',
  FINISHED = 'finished',
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface MenuItem {
  _id: string;
  name: string;
  price: Money;
  stockStatus: StockStatus;
  categoryId: string;
  isActive: boolean;
}

export interface Bill {
  _id: string;
  orderId: string;
  tableNumber?: string;
  waiterName: string;
  items: OrderItem[];
  subtotal: Money;
  tax: Money;
  total: Money;
  status: BillStatus;
  payment?: {
    method: PaymentMethod;
    amountPaid: Money;
    change: Money;
    reference?: string;
    processedAt: string;
  };
  createdAt: string;
}
