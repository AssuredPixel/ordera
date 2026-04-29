import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Branch } from './branch.schema';
import { SubscriptionService } from '../platform/subscription.service';
import { UsersService } from '../users/users.service';
import { InvitationsService } from '../invitations/invitations.service';
import { OperatingMode } from '../../common/enums/operating-mode.enum';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class BranchesService {
  constructor(
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
    private subscriptionService: SubscriptionService,
    private usersService: UsersService,
    private invitationsService: InvitationsService,
    private messagesService: MessagesService,
  ) {}

  async create(organizationId: string, data: Partial<Branch>) {
    // Limits Enforcement
    const subscription = await this.subscriptionService.findByOrganization(organizationId);
    if (!this.subscriptionService.isAccessAllowed(subscription)) {
      throw new ForbiddenException('Organization subscription is not active');
    }

    const limit = this.subscriptionService.getBranchLimit(subscription.plan);
    const activeCount = await this.branchModel.countDocuments({ 
      organizationId: new Types.ObjectId(organizationId),
      isActive: true 
    });

    if (activeCount >= limit) {
      throw new ForbiddenException(`Branch limit of ${limit} reached for your current plan. Please upgrade to add more branches.`);
    }

    // Slug generation
    let slug = data.slug || data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const existingSlug = await this.branchModel.findOne({ organizationId: new Types.ObjectId(organizationId), slug });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const branch = new this.branchModel({
      ...data,
      slug,
      organizationId: new Types.ObjectId(organizationId),
    });
    const savedBranch = await branch.save();

    // Auto-create system threads
    await this.messagesService.createSystemThreads(savedBranch._id.toString(), organizationId);

    return savedBranch;
  }

  async getBranchStaff(branchId: string, organizationId: string) {
    // Verify branch belongs to organization
    await this.findOneByOrganization(branchId, organizationId);

    const [active, pending] = await Promise.all([
      this.usersService.findByBranch(branchId),
      this.invitationsService.findPendingByBranch(branchId),
    ]);

    return { active, pending };
  }

  async findAllByOrganization(organizationId: string) {
    return this.branchModel.find({ organizationId: new Types.ObjectId(organizationId) }).sort({ createdAt: -1 });
  }

  async findOneByOrganization(branchId: string, organizationId: string) {
    const branch = await this.branchModel.findOne({
      _id: new Types.ObjectId(branchId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async findOne(branchId: string) {
    const branch = await this.branchModel.findById(branchId);
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async update(branchId: string, organizationId: string, data: Partial<Branch>) {
    const branch = await this.branchModel.findOneAndUpdate(
      { _id: new Types.ObjectId(branchId), organizationId: new Types.ObjectId(organizationId) },
      { $set: data },
      { new: true }
    );
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async deactivate(branchId: string, organizationId: string) {
    return this.update(branchId, organizationId, { isActive: false });
  }

  async activate(branchId: string, organizationId: string) {
    // Before activating, we must check limits again since they might have reached limits with other active branches
    const subscription = await this.subscriptionService.findByOrganization(organizationId);
    const limit = this.subscriptionService.getBranchLimit(subscription.plan);
    const activeCount = await this.branchModel.countDocuments({ 
      organizationId: new Types.ObjectId(organizationId),
      isActive: true 
    });

    if (activeCount >= limit) {
      throw new ForbiddenException(`Cannot activate. Branch limit of ${limit} reached for your current plan.`);
    }

    return this.update(branchId, organizationId, { isActive: true });
  }
}
