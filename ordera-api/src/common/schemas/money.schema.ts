import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class MoneyDocument {
  @Prop({ required: true })
  amount: number; // Stored as an integer (e.g. Kobo for NGN) to avoid floating point errors

  @Prop({ required: true })
  currency: string;
}

export const MoneySchema = SchemaFactory.createForClass(MoneyDocument);
