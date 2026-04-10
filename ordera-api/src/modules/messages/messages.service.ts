import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Thread } from './schemas/thread.schema';
import { Message } from './schemas/message.schema';
import { User } from '../users/user.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Thread.name) private threadModel: Model<Thread>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getThreads(userId: string, orgId: string, branchId: string) {
    return this.threadModel
      .find({
        organizationId: orgId,
        branchId,
        memberIds: userId,
      })
      .sort({ 'lastMessage.sentAt': -1 })
      .lean();
  }

  async getThreadById(threadId: string, userId: string) {
    const thread = await this.threadModel.findById(threadId).lean();
    if (!thread) throw new NotFoundException('Thread not found');
    if (!thread.memberIds.map(id => id.toString()).includes(userId)) {
      throw new ForbiddenException('You are not a member of this thread');
    }
    return thread;
  }

  async getMessageHistory(threadId: string, userId: string, page = 1, limit = 50) {
    await this.getThreadById(threadId, userId); // Validation

    return this.messageModel
      .find({ threadId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  }

  async createDirectThread(userId: string, recipientId: string, orgId: string, branchId: string) {
    // 1. Check if DM already exists
    const existing = await this.threadModel.findOne({
      organizationId: orgId,
      branchId,
      type: 'direct',
      memberIds: { $all: [userId, recipientId], $size: 2 },
    });

    if (existing) return existing;

    // 2. Create new DM thread
    const thread = new this.threadModel({
      organizationId: orgId,
      branchId,
      type: 'direct',
      memberIds: [userId, recipientId],
      unreadCounts: { [userId]: 0, [recipientId]: 0 },
    });

    return thread.save();
  }

  async sendMessage(threadId: string, senderId: string, content: string, attachmentUrl?: string) {
    const thread = await this.threadModel.findById(threadId);
    if (!thread) throw new NotFoundException('Thread not found');
    
    const sender = await this.userModel.findById(senderId);
    if (!sender) throw new NotFoundException('Sender not found');

    const message = new this.messageModel({
      organizationId: thread.organizationId,
      threadId,
      senderId,
      senderName: `${sender.firstName} ${sender.lastName}`,
      senderAvatar: sender.avatarUrl,
      content,
      attachmentUrl,
      readBy: [senderId],
    });

    const savedMessage = await message.save();

    // Update Thread
    thread.lastMessage = {
      content: content.substring(0, 80),
      senderName: sender.firstName,
      sentAt: new Date(),
    };

    // Increment unread for all others
    thread.memberIds.forEach((id) => {
      const idStr = id.toString();
      if (idStr !== senderId) {
        const current = thread.unreadCounts.get(idStr) || 0;
        thread.unreadCounts.set(idStr, current + 1);
      }
    });

    await thread.save();
    return savedMessage;
  }

  async markAsRead(threadId: string, userId: string) {
    const thread = await this.threadModel.findById(threadId);
    if (!thread) return;

    thread.unreadCounts.set(userId, 0);
    await thread.save();

    // Mark all messages in thread as read by this user
    await this.messageModel.updateMany(
      { threadId, readBy: { $ne: userId } },
      { $push: { readBy: userId } }
    );
  }
}
