import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
class SocialLinks {
  @Prop() instagram?: string;
  @Prop() facebook?: string;
  @Prop() twitter?: string;
  @Prop() linkedin?: string;
  @Prop() whatsapp?: string;
}

@Schema({ timestamps: true })
export class Organization extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  subdomain: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerUserId: Types.ObjectId;

  @Prop({ required: true })
  country: string;

  @Prop({ default: 'Africa/Lagos' })
  timezone: string;

  @Prop({ default: 'NGN' })
  currency: string;

  @Prop()
  logoUrl: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Subscription' })
  subscriptionId: Types.ObjectId;

  @Prop()
  contactPhone: string;

  @Prop()
  address: string;

  @Prop({ default: '#7C3AED' }) // Default brand purple
  primaryColor: string;

  @Prop({ type: SocialLinks, default: () => ({}) })
  socialLinks: SocialLinks;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);



// Static method
export function generateOrganizationSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special characters
    .replace(/[\s_-]+/g, '-') // replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // remove leading/trailing hyphens
}
