import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('threads')
  async getThreads(@GetUser() user: any) {
    return this.messagesService.getThreads(user.sub, user.organizationId, user.branchId);
  }

  @Get('threads/:id')
  async getThread(@Param('id') id: string, @GetUser() user: any) {
    return this.messagesService.getThreadById(id, user.sub);
  }

  @Get('threads/:id/history')
  async getHistory(
    @Param('id') id: string,
    @GetUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.getMessageHistory(id, user.sub, Number(page || 1), Number(limit || 50));
  }

  @Post('threads')
  async createDirectThread(@GetUser() user: any, @Body('recipientId') recipientId: string) {
    return this.messagesService.createDirectThread(
      user.sub,
      recipientId,
      user.organizationId,
      user.branchId,
    );
  }
}
