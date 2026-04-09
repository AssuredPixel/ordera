import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

@Schema({ _id: false })
class Money {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;
}

@Schema({ _id: false })
class UserShift {
  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date })
  endTime: Date;

  @Prop({ default: 0 })
  ordersServed: number;

  @Prop({ type: Money })
  revenue: Money;
}

@Schema({ _id: false })
class NotificationPrefs {
  @Prop({ default: true })
  newMessages: boolean;

  @Prop({ default: true })
  weeklyReport: boolean;

  @Prop({ default: true })
  paymentSuccess: boolean;

  @Prop({ default: true })
  billingAlert: boolean;

  @Prop({ default: true })
  newInventory: boolean;
}

@Schema({ _id: false })
class UserPreferences {
  @Prop({ default: 'en' })
  language: string;

  @Prop()
  region: string;

  @Prop({ default: 'light' })
  theme: string;
}

@Schema({ _id: false })
class ActiveSession {
  @Prop({ required: true })
  sessionId: string;

  @Prop()
  deviceName: string;

  @Prop()
  location: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  expiresAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: string;

  @Prop({ required: true })
  salesId: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: Object.values(Role) })
  role: Role;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  avatarUrl: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: UserShift, default: null })
  currentShift: UserShift | null;

  @Prop({ type: NotificationPrefs, default: () => ({}) })
  notificationPrefs: NotificationPrefs;

  @Prop({ type: UserPreferences, default: () => ({}) })
  preferences: UserPreferences;

  @Prop({ type: [ActiveSession], default: [] })
  activeSessions: ActiveSession[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound Indexes
UserSchema.index({ organizationId: 1, salesId: 1 }, { unique: true });
UserSchema.index({ organizationId: 1, branchId: 1, role: 1 });
