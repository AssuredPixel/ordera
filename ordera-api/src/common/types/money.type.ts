export interface Money {
  /**
   * ALWAYS in subunits (kobo for NGN, cents for USD)
   */
  amount: number;

  /**
   * ISO 4217 code e.g. 'NGN'
   */
  currency: string;
}
