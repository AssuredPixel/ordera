import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Thread' })
  threadId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  senderName: string;

  @Prop()
  senderAvatar: string;

  @Prop({ type: String, enum: Role, required: true })
  senderRole: Role;

  @Prop({ required: true })
  content: string;

  @Prop()
  attachmentUrl: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  readBy: Types.ObjectId[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ threadId: 1, createdAt: -1 });
