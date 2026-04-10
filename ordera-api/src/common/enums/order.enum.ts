export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum OrderStatus {
  PENDING = 'pending',        // Created but not confirmed
  ACTIVE = 'active',          // Confirmed by kitchen
  SERVED = 'served',          // Delivered to table/customer
  BILLED = 'billed',          // Bill has been generated
  COMPLETED = 'completed',    // Bill paid, order closed
  CANCELLED = 'cancelled',    // Voided before completion
}
