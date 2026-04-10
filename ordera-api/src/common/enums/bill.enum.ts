export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',  // Bank transfer (common in Nigeria)
  SPLIT = 'split',        // Indicates bill was split among multiple payments
}

export enum BillStatus {
  ACTIVE = 'active',        // Bill generated, awaiting payment
  PARTIALLY_PAID = 'partially_paid', // Split scenario — some portions paid
  PAID = 'paid',            // Fully settled
  VOIDED = 'voided',        // Cancelled after creation
  SPLIT = 'split',          // Parent bill that has been split into child bills
}
