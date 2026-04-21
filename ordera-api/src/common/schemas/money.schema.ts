import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class MoneySchema {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;
}
