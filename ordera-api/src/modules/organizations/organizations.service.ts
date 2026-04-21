import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization, generateOrganizationSlug } from './organization.schema';
import { Subscription } from '../platform/subscription.schema';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name) private orgModel: Model<Organization>,
    @InjectModel(Subscription.name) private subModel: Model<Subscription>,
  ) {}

  async create(data: Partial<Organization>): Promise<Organization> {
    const slug = data.slug || generateOrganizationSlug(data.name);
    const existing = await this.orgModel.findOne({ $or: [{ slug }, { subdomain: data.subdomain }] });
    if (existing) {
      throw new ConflictException('Organization slug or subdomain already exists');
    }
    return this.orgModel.create({ ...data, slug });
  }

  async findBySlug(slug: string): Promise<Organization> {
    const org = await this.orgModel.findOne({ slug });
    if (!org) throw new NotFoundException('Organization not found');
    return org.populate(['ownerUserId', 'subscriptionId']);
  }

  async findBySubdomain(subdomain: string): Promise<Organization> {
    const org = await this.orgModel.findOne({ subdomain });
    if (!org) throw new NotFoundException('Organization not found');
    return org.populate(['ownerUserId', 'subscriptionId']);
  }

  async findById(id: string): Promise<any> {
    const isObjectId = Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const org = await this.orgModel.findOne(query)
      .populate('subscriptionId')
      .populate('ownerUserId');
    
    if (!org) throw new NotFoundException('Organization not found');

    // Calculate MRR Contribution
    const planPrices: Record<string, number> = {
      'starter': 49000,
      'bread': 99000,
      'feast': 199000,
      'free': 0,
    };

    const sub: any = org.subscriptionId;
    const mrrContribution = (sub?.status === 'active' && sub?.plan) 
      ? (planPrices[sub.plan.toLowerCase()] || 0) 
      : 0;

    return {
      ...org.toObject(),
      mrrContribution,
    };
  }

  async findAllFiltered(query: { search?: string; plan?: string; status?: string; page: number; limit: number }) {
    const { search, plan, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'subscriptions',
          localField: 'subscriptionId',
          foreignField: '_id',
          as: 'subscriptionId'
        }
      },
      { $unwind: { path: '$subscriptionId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerUserId',
          foreignField: '_id',
          as: 'ownerUserId'
        }
      },
      { $unwind: { path: '$ownerUserId', preserveNullAndEmptyArrays: true } }
    ];

    // Filter by Search (Name)
    if (search) {
      pipeline.push({
        $match: { name: { $regex: search, $options: 'i' } }
      });
    }

    // Filter by Plan
    if (plan) {
      pipeline.push({
        $match: { 'subscriptionId.plan': plan.toLowerCase() }
      });
    }

    // Filter by Status
    if (status) {
      pipeline.push({
        $match: { 'subscriptionId.status': status.toLowerCase() }
      });
    }

    // Sort and Paginate
    const [results, total] = await Promise.all([
      this.orgModel.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) }
      ]),
      this.orgModel.aggregate([...pipeline, { $count: 'count' }])
    ]);

    return {
      data: results,
      total: total[0]?.count || 0,
      page: Number(page),
      limit: Number(limit)
    };
  }

  async suspend(id: string) {
    const org = await this.orgModel.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    await Promise.all([
      this.orgModel.findByIdAndUpdate(id, { isActive: false }),
      this.subModel.findByIdAndUpdate(org.subscriptionId, { status: SubscriptionStatus.SUSPENDED })
    ]);

    return { message: 'Organization suspended successfully' };
  }

  async reactivate(id: string) {
    const org = await this.orgModel.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    await Promise.all([
      this.orgModel.findByIdAndUpdate(id, { isActive: true }),
      this.subModel.findByIdAndUpdate(org.subscriptionId, { status: SubscriptionStatus.ACTIVE })
    ]);

    return { message: 'Organization reactivated successfully' };
  }

  async updateSubscription(orgId: string, subscriptionId: string) {
    return this.orgModel.findByIdAndUpdate(orgId, { subscriptionId: new Types.ObjectId(subscriptionId) });
  }

  async update(orgId: string, data: Partial<Organization>) {
    const org = await this.orgModel.findByIdAndUpdate(
      orgId,
      { $set: data },
      { new: true }
    );
    if (!org) throw new NotFoundException('Organization not found');
    return org.populate(['ownerUserId', 'subscriptionId']);
  }
}
