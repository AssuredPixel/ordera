import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlatformSettings } from './platform-settings.schema';

@Injectable()
export class PlatformSettingsService implements OnModuleInit {
  constructor(
    @InjectModel(PlatformSettings.name) private settingsModel: Model<PlatformSettings>,
  ) {}

  async onModuleInit() {
    // Ensure at least one settings document exists
    const count = await this.settingsModel.countDocuments();
    if (count === 0) {
      await this.settingsModel.create({
        plans: [
          { 
            id: 'starter', name: 'Starter', price: 49000, branchLimit: 1, staffLimit: 5, 
            features: [{ name: 'Real-time tracking', included: true }, { name: 'Basic Support', included: true }] 
          },
          { 
            id: 'bread', name: 'Growth', price: 99000, branchLimit: 3, staffLimit: 15, isPopular: true,
            features: [{ name: 'Real-time tracking', included: true }, { name: 'Priority Support', included: true }] 
          },
          { 
            id: 'feast', name: 'Pro', price: 199000, branchLimit: 999, staffLimit: 9999,
            features: [{ name: 'Unlimited everything', included: true }] 
          }
        ],
        gateways: {
          paystack: { isEnabled: true },
          stripe: { isEnabled: false }
        }
      });
    }
  }

  async getSettings() {
    return this.settingsModel.findOne().exec();
  }

  async updateSettings(update: Partial<PlatformSettings>) {
    return this.settingsModel.findOneAndUpdate({}, update, { new: true, upsert: true });
  }

  async getPublicPlans() {
    const settings = await this.getSettings();
    return settings?.plans || [];
  }
  
  async getAnnouncement() {
    const settings = await this.getSettings();
    return settings?.announcement;
  }
}
