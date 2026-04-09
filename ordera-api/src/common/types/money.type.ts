export interface Money {
  amount: number;   // in subunits (kobo for NGN, cents for USD)
  currency: string; // ISO 4217 e.g. 'NGN'
}
