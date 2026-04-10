import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class LastMessage {
  @Prop()
  content: string; // Truncated to 80 chars

  @Prop()
  senderName: string;

  @Prop({ default: Date.now })
  sentAt: Date;
}

@Schema({ timestamps: true })
export class Thread extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: string;

  @Prop({ required: true, enum: ['group', 'direct'] })
  type: 'group' | 'direct';

  @Prop()
  name: string; // null for direct messages

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  memberIds: string[];

  @Prop({ type: LastMessage, default: null })
  lastMessage: LastMessage;

  @Prop({ type: Map, of: Number, default: {} })
  unreadCounts: Map<string, number>;
}

export const ThreadSchema = SchemaFactory.createForClass(Thread);

// Compound index for organization and branch scoping
ThreadSchema.index({ organizationId: 1, branchId: 1 });
// Index for fuzzy member searches
ThreadSchema.index({ memberIds: 1 });
