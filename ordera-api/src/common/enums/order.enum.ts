export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum OrderStatus {
  PENDING = 'pending',        // Created but not confirmed
  CONFIRMED = 'confirmed',    // Accepted by kitchen/staff
  PREPARING = 'preparing',    // Kitchen is actively working
  READY = 'ready',            // Ready for pickup/serving
  SERVED = 'served',          // Delivered to table/customer
  COMPLETED = 'completed',    // Bill paid, order closed
  CANCELLED = 'cancelled',    // Voided before completion
}
