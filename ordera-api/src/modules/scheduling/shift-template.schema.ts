import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ShiftTemplate extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Branch', index: true })
  branchId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true }) // HH:MM format
  startTime: string;

  @Prop({ required: true }) // HH:MM format
  endTime: string;

  @Prop({ default: false })
  crossesMidnight: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const ShiftTemplateSchema = SchemaFactory.createForClass(ShiftTemplate);

ShiftTemplateSchema.index({ branchId: 1, isActive: 1 });
