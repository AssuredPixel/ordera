import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { MoneySchema } from '../../../common/schemas/money.schema';
import { Money } from '../../../common/types/money.type';

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, required: true, ref: 'MenuItem' })
  menuItemId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: MoneySchema, required: true })
  unitPrice: Money;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({
    type: [{
      name: { type: String, required: true },
      price: { type: MoneySchema, required: true },
    }],
    default: [],
  })
  selectedAddons: { name: string; price: Money }[];

  @Prop({ type: MoneySchema, required: true })
  lineTotal: Money;

  @Prop()
  notes?: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
