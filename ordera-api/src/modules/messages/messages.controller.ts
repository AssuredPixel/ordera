import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('threads')
  async getThreads(@GetUser('userId') userId: string) {
    return this.messagesService.findUserThreads(userId);
  }

  @Post('threads')
  async createDirectThread(
    @GetUser() user: any,
    @Body('recipientId') recipientId: string,
  ) {
    return this.messagesService.createDirectThread(
      user.userId,
      recipientId,
      user.organizationId,
      user.branchId,
    );
  }

  @Get('threads/:id/history')
  async getHistory(
    @Param('id') threadId: string,
    @GetUser('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Validate membership
    await this.messagesService.validateMember(threadId, userId);
    
    return this.messagesService.getThreadHistory(
      threadId,
      parseInt(page || '1'),
      parseInt(limit || '50'),
    );
  }
}
