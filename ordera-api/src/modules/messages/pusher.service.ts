import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher = require('pusher');

@Injectable()
export class PusherService {
  private pusher: Pusher | null = null;
  private readonly logger = new Logger(PusherService.name);

  constructor(private readonly configService: ConfigService) {
    const appId = this.configService.get<string>('PUSHER_APP_ID');
    const key = this.configService.get<string>('PUSHER_KEY');
    const secret = this.configService.get<string>('PUSHER_SECRET');
    const cluster = this.configService.get<string>('PUSHER_CLUSTER');

    if (appId && key && secret && cluster) {
      this.pusher = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });
      this.logger.log('Pusher initialized successfully');
    } else {
      this.logger.warn('Pusher credentials missing. Real-time events will be disabled for Vercel/Production.');
    }
  }

  async trigger(channel: string, event: string, data: any) {
    if (!this.pusher) {
      this.logger.debug(`Pusher not initialized. Skipping trigger for ${channel}/${event}`);
      return;
    }

    try {
      await this.pusher.trigger(channel, event, data);
    } catch (error) {
      this.logger.error(`Failed to trigger pusher event: ${error.message}`);
    }
  }
}
