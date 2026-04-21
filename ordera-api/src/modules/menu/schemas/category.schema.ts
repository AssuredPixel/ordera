import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop()
  imageUrl: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Compound Indexes
CategorySchema.index({ organizationId: 1, branchId: 1, isActive: 1 });
CategorySchema.index({ organizationId: 1, branchId: 1, displayOrder: 1 });
