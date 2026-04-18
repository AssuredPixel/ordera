import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class PlanFeature {
  @Prop({ required: true })
  name: string;
  
  @Prop({ default: true })
  included: boolean;
}

@Schema({ _id: false })
class PlanDefinition {
  @Prop({ required: true })
  id: string; // starter, bread, feast
  
  @Prop({ required: true })
  name: string;
  
  @Prop({ required: true })
  price: number;
  
  @Prop({ required: true })
  branchLimit: number;
  
  @Prop({ required: true })
  staffLimit: number;
  
  @Prop({ type: [PlanFeature], default: [] })
  features: PlanFeature[];

  @Prop({ default: false })
  isPopular: boolean;
}

@Schema({ _id: false })
class GatewayConfig {
  @Prop()
  publicKey: string;
  
  @Prop()
  secretKey: string; // Should be encrypted at rest in a real prod env
  
  @Prop({ default: false })
  isEnabled: boolean;
}

@Schema({ _id: false })
class AnnouncementConfig {
  @Prop({ default: '' })
  text: string;
  
  @Prop({ default: false })
  isActive: boolean;
  
  @Prop({ default: Date.now })
  version: number; // Used for dismissal tracking
}

@Schema({ timestamps: true })
export class PlatformSettings extends Document {
  @Prop({ type: [PlanDefinition], default: [] })
  plans: PlanDefinition[];

  @Prop({ default: 0.002 })
  aiTokenPrice: number; // Cost in NGN per token (or 1000 tokens)

  @Prop({ type: Object, default: {} })
  gateways: {
    paystack: GatewayConfig;
    stripe: GatewayConfig;
  };

  @Prop({ type: Map, of: String, default: {} })
  emailTemplates: Map<string, string>; // name -> raw html

  @Prop({ type: AnnouncementConfig, default: () => ({}) })
  announcement: AnnouncementConfig;
}

export const PlatformSettingsSchema = SchemaFactory.createForClass(PlatformSettings);
