import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ThreadType } from '../../../common/enums/thread-type.enum';

@Schema({ _id: false })
export class LastMessageInfo {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  senderName: string;

  @Prop({ required: true, default: Date.now })
  sentAt: Date;
}

@Schema({ timestamps: true })
export class Thread extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ type: String, enum: ThreadType, required: true })
  type: ThreadType;

  @Prop()
  name: string; // Used for GROUP types

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  memberIds: Types.ObjectId[];

  @Prop({ type: LastMessageInfo })
  lastMessage: LastMessageInfo;

  @Prop({ type: Map, of: Number, default: {} })
  unreadCounts: Map<string, number>;

  @Prop({ default: false })
  isSystemThread: boolean;
}

export const ThreadSchema = SchemaFactory.createForClass(Thread);

ThreadSchema.index({ organizationId: 1, branchId: 1, memberIds: 1 });
