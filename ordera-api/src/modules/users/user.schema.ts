import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

@Schema({ _id: false })
class Session {
  @Prop({ required: true }) sessionId: string;
  @Prop() deviceName: string;
  @Prop() deviceType: string;
  @Prop() location: string;
  @Prop() ipAddress: string;
  @Prop({ default: Date.now }) createdAt: Date;
  @Prop() expiresAt: Date;
  @Prop({ default: Date.now }) lastActiveAt: Date;
  @Prop({ default: true }) isActive: boolean;
}

@Schema({ _id: false })
class NotificationPrefs {
  @Prop({ default: true }) email: boolean;
  @Prop({ default: true }) push: boolean;
  @Prop({ default: true }) sms: boolean;
  @Prop({ default: true }) system: boolean;
}

@Schema({ _id: false })
class UserPreferences {
  @Prop({ default: 'en' }) language: string;
  @Prop({ default: 'light' }) theme: 'light' | 'dark';
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ type: Types.ObjectId, index: true }) // null for SUPER_ADMIN
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true }) // null for OWNER and SUPER_ADMIN
  branchId: Types.ObjectId;

  @Prop({ type: String, enum: Role, required: true })
  role: Role;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ select: false }) // select: false for security
  passwordHash: string;

  @Prop({ index: true, unique: true, sparse: true })
  googleId: string;

  @Prop()
  avatarUrl: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: [Session], default: [] })
  activeSessions: Session[];

  @Prop({ type: NotificationPrefs, default: () => ({}) })
  notificationPrefs: NotificationPrefs;

  @Prop({ type: UserPreferences, default: () => ({}) })
  preferences: UserPreferences;

  @Prop()
  lastLoginAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index(
  { organizationId: 1, email: 1 }, 
  { unique: true, sparse: true }
);

