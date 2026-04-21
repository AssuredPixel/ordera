import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StockStatus } from '../../../common/enums/stock-status.enum';
import { Role } from '../../../common/enums/role.enum';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class StockHistory extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MenuItem', required: true, index: true })
  menuItemId: Types.ObjectId;

  @Prop({ required: true })
  menuItemName: string;

  @Prop({ type: String, enum: StockStatus, required: true })
  previousStatus: StockStatus;

  @Prop({ type: String, enum: StockStatus, required: true })
  newStatus: StockStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  changedByUserId: Types.ObjectId;

  @Prop({ required: true })
  changedByName: string;

  @Prop({ type: String, enum: Role, required: true })
  changedByRole: Role;

  @Prop()
  note: string;

  @Prop({ type: Types.ObjectId })
  shiftId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  businessDayId: Types.ObjectId;
}

export const StockHistorySchema = SchemaFactory.createForClass(StockHistory);

// Compound Indexes
StockHistorySchema.index({ menuItemId: 1, createdAt: -1 });
StockHistorySchema.index({ branchId: 1, createdAt: -1 });
StockHistorySchema.index({ organizationId: 1, branchId: 1 });
