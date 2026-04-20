import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription } from './subscription.schema';
import { Organization } from '../organizations/organization.schema';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';

@Injectable()
export class SubscriptionTaskService {
  private readonly logger = new Logger(SubscriptionTaskService.name);

  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    @InjectModel(Organization.name) private organizationModel: Model<Organization>,
  ) {}

  /**
   * Runs every hour to check for expired trials and subscriptions.
   * "Exact day and time" suspension.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleSubscriptionExpiration() {
    this.logger.log('Running subscription expiration check...');
    const now = new Date();

    // 1. Find all ACTIVE or TRIAL subscriptions that have expired
    const expiredSubscriptions = await this.subscriptionModel.find({
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.TRIALING] },
      $or: [
        { trialEnd: { $lt: now } },
        { currentPeriodEnd: { $lt: now } },
      ],
    });

    if (expiredSubscriptions.length > 0) {
        this.logger.log(`Found ${expiredSubscriptions.length} expired subscriptions. Suspending...`);
        
        for (const sub of expiredSubscriptions) {
            // Update subscription status
            sub.status = SubscriptionStatus.SUSPENDED;
            sub.notes = (sub.notes || '') + `\nAutomated suspension on ${now.toISOString()}`;
            await sub.save();

            // Deactivate organization
            await this.organizationModel.findByIdAndUpdate(sub.organizationId, {
                $set: { isActive: false }
            });

            this.logger.log(`Suspended organization: ${sub.organizationId}`);
        }
    }
  }

  /**
   * Runs once a day at midnight to send warnings for subscriptions ending in 7 days.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleSubscriptionWarnings() {
    this.logger.log('Running subscription warning check...');
    
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const nextDay = new Date(sevenDaysFromNow);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find subscriptions ending exactly 7 days from now
    const upcomingExpiring = await this.subscriptionModel.find({
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.TRIALING] },
      $or: [
        { trialEnd: { $gte: sevenDaysFromNow, $lt: nextDay } },
        { currentPeriodEnd: { $gte: sevenDaysFromNow, $lt: nextDay } },
      ],
    });

    if (upcomingExpiring.length > 0) {
        this.logger.log(`Found ${upcomingExpiring.length} organizations requiring a 7-day warning.`);
        for (const sub of upcomingExpiring) {
            // TODO: Trigger Email Service here
            // this.emailService.sendExpiryWarning(sub.organizationId);
            this.logger.log(`WARNING: Subscription for ${sub.organizationId} expires in 7 days.`);
        }
    }
  }
}
