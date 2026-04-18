import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription } from './subscription.schema';
import { Organization } from '../organizations/organization.schema';

import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { PaymentGateway } from '../../common/enums/payment-gateway.enum';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    @InjectModel(Organization.name) private orgModel: Model<Organization>,
  ) { }
  
  async findAllFiltered(query: { search?: string; plan?: string; status?: string; gateway?: string; page: number; limit: number }) {
    const { search, plan, status, gateway, page, limit } = query;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'organizations',
          localField: 'organizationId',
          foreignField: '_id',
          as: 'organization'
        }
      },
      { $unwind: { path: '$organization', preserveNullAndEmptyArrays: true } }
    ];

    // Filter by Org Name (Search)
    if (search) {
      pipeline.push({
        $match: { 'organization.name': { $regex: search, $options: 'i' } }
      });
    }

    // Filter by Plan
    if (plan) {
      pipeline.push({
        $match: { plan: plan.toLowerCase() }
      });
    }

    // Filter by Status
    if (status) {
      pipeline.push({
        $match: { status: status.toLowerCase() }
      });
    }

    // Filter by Gateway
    if (gateway) {
      pipeline.push({
        $match: { gateway: gateway.toLowerCase() }
      });
    }

    // Sort and Paginate
    const [results, total] = await Promise.all([
      this.subscriptionModel.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) }
      ]),
      this.subscriptionModel.aggregate([...pipeline, { $count: 'count' }])
    ]);

    return {
      data: results,
      total: total[0]?.count || 0,
      page: Number(page),
      limit: Number(limit)
    };
  }


  async create(organizationId: string, plan: SubscriptionPlan, gateway: PaymentGateway): Promise<Subscription> {
    return this.subscriptionModel.create({
      organizationId: new Types.ObjectId(organizationId),
      plan,
      gateway,
      status: SubscriptionStatus.TRIAL,
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
    });
  }

  async findByOrganization(organizationId: string): Promise<Subscription> {
    const sub = await this.subscriptionModel.findOne({ organizationId: new Types.ObjectId(organizationId) });
    if (!sub) throw new NotFoundException('Subscription not found for this organization');
    return sub;
  }

  async activate(subscriptionId: string): Promise<Subscription> {
    const sub = await this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      {
        $set: { status: SubscriptionStatus.ACTIVE, paymentFailureCount: 0 }
      },
      { new: true },
    );
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async markPastDue(subscriptionId: string): Promise<Subscription> {
    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      {
        $set: { status: SubscriptionStatus.PAST_DUE, lastPaymentAttempt: new Date() },
        $inc: { paymentFailureCount: 1 }
      },
      { new: true },
    );
  }

  async expire(subscriptionId: string): Promise<Subscription> {
    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { $set: { status: SubscriptionStatus.CANCELED } },
      { new: true },
    );
  }

  async suspend(subscriptionId: string, note: string): Promise<Subscription> {
    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      {
        $set: { status: SubscriptionStatus.PAST_DUE, notes: note }
      },
      { new: true },
    );
  }

  async cancel(subscriptionId: string): Promise<Subscription> {
    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { $set: { cancelAtPeriodEnd: true } },
      { new: true },
    );
  }

  async upgrade(subscriptionId: string, newPlan: SubscriptionPlan): Promise<Subscription> {
    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { $set: { plan: newPlan } },
      { new: true },
    );
  }

  async forceUpdatePlan(subscriptionId: string, newPlan: SubscriptionPlan): Promise<Subscription> {
    const sub = await this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { 
        $set: { 
          plan: newPlan,
          status: SubscriptionStatus.ACTIVE,
          notes: `Plan forcefully updated by admin on ${new Date().toISOString()}`
        } 
      },
      { new: true },
    );
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async extend(subscriptionId: string, days: number, note?: string): Promise<Subscription> {
    const sub = await this.subscriptionModel.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');

    const currentEnd = sub.currentPeriodEnd || new Date();
    const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);

    return this.subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { 
        $set: { 
          currentPeriodEnd: newEnd,
          notes: note || `Extended by ${days} days on ${new Date().toISOString()}`
        } 
      },
      { new: true }
    );
  }

  async getStats() {
    const activeCount = await this.subscriptionModel.countDocuments({ status: SubscriptionStatus.ACTIVE });
    const pastDueCount = await this.subscriptionModel.countDocuments({ status: SubscriptionStatus.PAST_DUE });

    // MRR Calculation
    const activeSubscriptions = await this.subscriptionModel.find({ status: SubscriptionStatus.ACTIVE });
    const planPrices = {
      [SubscriptionPlan.STARTER]: 49000,
      [SubscriptionPlan.BREAD]: 99000,   // GROWTH
      [SubscriptionPlan.FEAST]: 199000, // PRO
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.CUSTOM]: 0,
    };

    const mrr = activeSubscriptions.reduce((acc, sub) => {
      const price = planPrices[sub.plan] || 0;
      return acc + price;
    }, 0);

    // New Orgs this month (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newOrgsCount = await this.orgModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    return {
      activeSubscriptions: activeCount,
      mrr: { amount: mrr, currency: 'NGN' },
      pastDueCount,
      newThisMonth: newOrgsCount,
      // Change badges (hardcoded/simulated for now as we don't store historical snapshots yet)
      trends: {
        active: +12,
        mrr: +8.5,
        pastDue: -2,
        newOrgs: +15
      }
    };
  }

  isAccessAllowed(subscription: Subscription): boolean {

    const allowed = [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.TRIAL,
      SubscriptionStatus.TRIALING,
      SubscriptionStatus.PAST_DUE,
    ];
    return allowed.includes(subscription.status);
  }

  getBranchLimit(plan: SubscriptionPlan): number {
    switch (plan) {
      case SubscriptionPlan.STARTER: return 1;
      case SubscriptionPlan.BREAD: return 3;   // BREAD = GROWTH
      case SubscriptionPlan.FEAST: return 999; // FEAST = PRO
      case SubscriptionPlan.FREE: return 1;
      default: return 1;
    }
  }

  getStaffLimit(plan: SubscriptionPlan): number {
    switch (plan) {
      case SubscriptionPlan.STARTER: return 5;
      case SubscriptionPlan.BREAD: return 15;   // BREAD = GROWTH
      case SubscriptionPlan.FEAST: return 9999; // FEAST = PRO
      case SubscriptionPlan.FREE: return 2;
      default: return 5;
    }
  }
}
