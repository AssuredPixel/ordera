import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';
import { InvitationStatus } from '../../common/enums/invitation-status.enum';

@Schema({ timestamps: true })
export class Invitation extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  invitedByUserId: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ type: String, enum: Role, required: true })
  role: Role;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ type: String, enum: InvitationStatus, default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @Prop({ default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) }) // default 48h
  expiresAt: Date;

  @Prop()
  acceptedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  acceptedByUserId: Types.ObjectId;

  @Prop()
  emailSentAt: Date;

  @Prop({ default: 0 })
  resentCount: number;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);

InvitationSchema.index({ email: 1, branchId: 1, status: 1 });
