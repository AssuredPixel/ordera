import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Thread } from './schemas/thread.schema';
import { Message } from './schemas/message.schema';
import { ThreadType } from '../../common/enums/thread-type.enum';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/user.schema';
import { PusherService } from './pusher.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Thread.name) private readonly threadModel: Model<Thread>,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly pusherService: PusherService,
  ) { }

  async validateMember(threadId: string, userId: string) {
    const thread = await this.threadModel.findById(threadId);
    if (!thread) throw new NotFoundException('Thread not found');

    if (!thread.memberIds.some(id => id.toString() === userId)) {
      throw new ForbiddenException('User is not a member of this thread');
    }

    return thread;
  }

  async createSystemThreads(branchId: string, organizationId: string) {
    // Find Branch Manager to seed the threads initially
    const branchManager = await this.userModel.findOne({
      branchId: new Types.ObjectId(branchId),
      role: Role.BRANCH_MANAGER,
      isActive: true,
    });

    const managerId = branchManager ? branchManager._id : null;
    const initialMembers = managerId ? [managerId] : [];

    const systemThreads = [
      {
        name: 'Front of House',
        type: ThreadType.GROUP,
        isSystemThread: true,
        memberIds: initialMembers,
      },
      {
        name: 'Kitchen',
        type: ThreadType.GROUP,
        isSystemThread: true,
        memberIds: initialMembers,
      },
      {
        name: 'Management',
        type: ThreadType.GROUP,
        isSystemThread: true,
        memberIds: initialMembers,
      },
    ];

    for (const threadData of systemThreads) {
      await this.threadModel.create({
        ...threadData,
        branchId: new Types.ObjectId(branchId),
        organizationId: new Types.ObjectId(organizationId),
      });
    }
  }

  async findUserThreads(userId: string, user?: any) {
    // If user info is provided, ensure they are in the correct system threads
    if (user && user.branchId) {
      await this.syncSystemThreads(user.userId, user.branchId, user.role);
    }

    return this.threadModel
      .find({ memberIds: new Types.ObjectId(userId) })
      .populate('memberIds', 'firstName lastName avatar role') 
      .sort({ 'lastMessage.sentAt': -1 })
      .exec();
  }

  private async syncSystemThreads(userId: string, branchId: string, role: string) {
    const systemThreads = await this.threadModel.find({
      branchId: new Types.ObjectId(branchId),
      isSystemThread: true,
    });

    for (const thread of systemThreads) {
      const isMember = thread.memberIds.some(id => id.toString() === userId);
      if (isMember) continue;

      // Logic for who joins which thread
      let shouldJoin = false;
      if (thread.name === 'Front of House') shouldJoin = true; // Everyone in FOH?
      if (thread.name === 'Kitchen' && (role === Role.WAITER || role === Role.KITCHEN_STAFF || role === Role.BRANCH_MANAGER)) shouldJoin = true;
      if (thread.name === 'Management' && (role === Role.BRANCH_MANAGER || role === Role.OWNER)) shouldJoin = true;

      if (shouldJoin) {
        await this.threadModel.updateOne(
          { _id: thread._id },
          { $addToSet: { memberIds: new Types.ObjectId(userId) } }
        );
      }
    }
  }

  async getThreadHistory(threadId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    return this.messageModel
      .find({ threadId: new Types.ObjectId(threadId) })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async createDirectThread(senderId: string, recipientId: string, orgId: string, branchId: string) {
    if (senderId === recipientId) {
      throw new ConflictException('Cannot create a direct thread with yourself');
    }

    // Check if DM already exists
    const existingThread = await this.threadModel.findOne({
      type: ThreadType.DIRECT,
      memberIds: { $all: [new Types.ObjectId(senderId), new Types.ObjectId(recipientId)], $size: 2 },
    });

    if (existingThread) {
      return existingThread;
    }

    return this.threadModel.create({
      organizationId: new Types.ObjectId(orgId),
      branchId: new Types.ObjectId(branchId),
      type: ThreadType.DIRECT,
      memberIds: [new Types.ObjectId(senderId), new Types.ObjectId(recipientId)],
      unreadCounts: new Map(),
    });
  }

  async markAsRead(threadId: string, userId: string) {
    const thread = await this.threadModel.findById(threadId);
    if (!thread) return;

    // Reset unread count for user
    if (thread.unreadCounts) {
      thread.unreadCounts.set(userId, 0);
      await this.threadModel.updateOne(
        { _id: thread._id },
        { $set: { [`unreadCounts.${userId}`]: 0 } }
      );
    }

    // Update readBy in messages
    await this.messageModel.updateMany(
      { threadId: new Types.ObjectId(threadId), readBy: { $ne: new Types.ObjectId(userId) } },
      { $push: { readBy: new Types.ObjectId(userId) } }
    );
  }

  async sendMessage(threadId: string, user: any, data: { content: string; attachmentUrl?: string }) {
    const thread = await this.validateMember(threadId, user.userId);

    // 1. Save Message
    let senderName = user.firstName;
    let senderRole = user.role;

    if (!senderName) {
      const dbUser = await this.userModel.findById(user.userId);
      senderName = dbUser?.firstName || 'Staff';
      senderRole = dbUser?.role || user.role;
    }

    const message = await this.messageModel.create({
      organizationId: new Types.ObjectId(user.organizationId),
      threadId: new Types.ObjectId(threadId),
      senderId: new Types.ObjectId(user.userId),
      senderName,
      senderRole,
      content: data.content,
      attachmentUrl: data.attachmentUrl,
      readBy: [new Types.ObjectId(user.userId)],
    });

    // 2. Update Thread LastMessage and Unread Counts
    const preview = data.content.substring(0, 80);
    const unreadUpdates: any = {};
    thread.memberIds.forEach(id => {
      const idStr = id.toString();
      if (idStr !== user.userId) {
        unreadUpdates[`unreadCounts.${idStr}`] = 1;
      }
    });

    await this.threadModel.updateOne(
      { _id: thread._id },
      {
        $set: {
          lastMessage: {
            content: preview,
            senderName,
            sentAt: new Date(),
          },
        },
        $inc: unreadUpdates,
      }
    );

    // 3. Trigger Real-time Event
    await this.pusherService.trigger(
      `thread-${threadId}`,
      'message:receive',
      { threadId, message }
    );

    return message;
  }
}
