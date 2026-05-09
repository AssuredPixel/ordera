import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { IntelligenceService } from './intelligence.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntelligenceController {
  constructor(private readonly aiService: IntelligenceService) {}

  @Post('query')
  async query(@GetUser() user: any, @Body('query') question: string) {
    return this.aiService.query(user, question);
  }

  @Post('stream')
  async stream(@GetUser() user: any, @Body('query') question: string, @Res() res: Response) {
    const stream = await this.aiService.streamQuery(user, question);
    stream.pipe(res);
  }

  @Get('usage')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  async getUsage(@GetUser('branchId') branchId: string) {
    return this.aiService.getUsage(branchId);
  }
}
