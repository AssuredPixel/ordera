import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branchId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true })
  slug: string;

  @Prop()
  imageUrl: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Compound Indexes for multi-tenant isolation and performance
CategorySchema.index({ organizationId: 1, branchId: 1 });
CategorySchema.index({ organizationId: 1, branchId: 1, isActive: 1 });

// Unique slug per branch to prevent duplicate menu sections
CategorySchema.index({ organizationId: 1, branchId: 1, slug: 1 }, { unique: true });
