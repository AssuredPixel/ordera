import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Organization extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ required: true })
  contactEmail: string;

  @Prop({ required: true })
  address: string;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
