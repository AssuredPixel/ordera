import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Money {
  @Prop({ required: true, type: Number })
  amount: number; // Always in subunits (kobo, cents) — NEVER store decimals

  @Prop({ required: true, type: String })
  currency: string; // ISO 4217: 'NGN', 'USD', etc.
}

export const MoneySchema = SchemaFactory.createForClass(Money);
