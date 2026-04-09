import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Organization extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  ownerUserId: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  timezone: string; // IANA Timezone ID (e.g., 'Africa/Lagos')

  @Prop({ required: true })
  currency: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
