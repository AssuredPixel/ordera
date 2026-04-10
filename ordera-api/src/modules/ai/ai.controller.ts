import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('query')
  async askAI(@GetUser() user: any, @Body('query') query: string) {
    return this.aiService.ask(
      user.sub,
      user.organizationId,
      user.branchId,
      user.role,
      query,
    );
  }

  @Get('usage')
  @Roles(Role.OWNER, Role.MANAGER)
  async getUsage(@GetUser() user: any) {
    return this.aiService.getUsage(user.organizationId, user.branchId);
  }
}
