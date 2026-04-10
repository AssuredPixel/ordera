import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Message extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
  organizationId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Thread', required: true, index: true })
  threadId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: string;

  @Prop({ required: true })
  senderName: string;

  @Prop()
  senderAvatar: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  attachmentUrl: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  readBy: string[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Compound index for sorted message retrieval within a thread
MessageSchema.index({ threadId: 1, createdAt: -1 });
