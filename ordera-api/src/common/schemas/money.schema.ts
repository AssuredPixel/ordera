import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class MoneyDocument {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;
}

export const MoneySchema = SchemaFactory.createForClass(MoneyDocument);
