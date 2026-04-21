import { Controller, Get, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUnread(@GetUser('userId') userId: string) {
    return this.notificationsService.getUnreadNotifications(userId);
  }

  @Get('all')
  async getAll(
    @GetUser('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.notificationsService.getAllNotifications(userId, limit, skip);
  }

  @Get('count')
  async getCount(@GetUser('userId') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  async markAllRead(@GetUser('userId') userId: string) {
    await this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }
}
