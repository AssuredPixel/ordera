import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Thread } from './schemas/thread.schema';
import { Message } from './schemas/message.schema';
import { ThreadType } from '../../common/enums/thread-type.enum';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/user.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Thread.name) private readonly threadModel: Model<Thread>,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) { }

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

  async findUserThreads(userId: string) {
    return this.threadModel
      .find({ memberIds: new Types.ObjectId(userId) })
      .sort({ 'lastMessage.sentAt': -1 })
      .exec();
  }

  async getThreadHistory(threadId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    return this.messageModel
      .find({ threadId: new Types.ObjectId(threadId) })
      .sort({ createdAt: -1 })
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
      await thread.save();
    }

    // Update readBy in messages (optional, for explicit "Read Receipt" UI)
    await this.messageModel.updateMany(
      { threadId: new Types.ObjectId(threadId), readBy: { $ne: new Types.ObjectId(userId) } },
      { $push: { readBy: new Types.ObjectId(userId) } }
    );
  }

  async validateMember(threadId: string, userId: string) {
    const thread = await this.threadModel.findById(threadId);
    if (!thread) throw new NotFoundException('Thread not found');

    if (!thread.memberIds.some(id => id.toString() === userId)) {
      throw new ForbiddenException('User is not a member of this thread');
    }

    return thread;
  }
}
