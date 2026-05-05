import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@Controller('reconciliations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReconciliationController {
  constructor(private readonly reconService: ReconciliationService) {}

  @Post('open')
  @Roles(Role.CASHIER, Role.BRANCH_MANAGER, Role.OWNER)
  async open(
    @GetUser() user: JwtPayload,
    @Body('branchId') branchId: string,
  ) {
    // Security: Users can only open for their assigned branch unless they are OWNER
    if (user.role !== Role.OWNER && user.branchId !== branchId) {
      throw new UnauthorizedException('Access denied to this branch');
    }

    return this.reconService.openReconciliation(branchId, user.organizationId, user.userId);
  }

  @Get('branch/:branchId/active')
  @Roles(Role.CASHIER, Role.BRANCH_MANAGER, Role.OWNER)
  async getActive(
    @Param('branchId') branchId: string,
    @GetUser() user: JwtPayload,
  ) {
    if (user.role !== Role.OWNER && user.branchId !== branchId) {
      throw new UnauthorizedException('Access denied to this branch');
    }
    return this.reconService.getActiveReconciliation(branchId);
  }

  @Patch(':id/verify-line')
  @Roles(Role.CASHIER, Role.BRANCH_MANAGER, Role.OWNER)
  async verifyLine(
    @Param('id') id: string,
    @Body() body: { waiterId: string; actuals: { cash: number; card: number; transfer: number } },
  ) {
    return this.reconService.verifyLine(id, body.waiterId, body.actuals);
  }

  @Patch(':id/flag-line')
  @Roles(Role.CASHIER, Role.BRANCH_MANAGER, Role.OWNER)
  async flagLine(
    @Param('id') id: string,
    @Body() body: { waiterId: string; reason: string },
  ) {
    return this.reconService.flagLine(id, body.waiterId, body.reason);
  }

  @Patch(':id/complete')
  @Roles(Role.CASHIER, Role.BRANCH_MANAGER, Role.OWNER)
  async complete(
    @Param('id') id: string,
    @GetUser() user: JwtPayload,
  ) {
    return this.reconService.completeReconciliation(id, user.userId);
  }

  @Get('branch/:branchId/history')
  @Roles(Role.CASHIER, Role.BRANCH_MANAGER, Role.OWNER)
  async getHistory(
    @Param('branchId') branchId: string,
    @GetUser() user: JwtPayload,
  ) {
    if (user.role !== Role.OWNER && user.branchId !== branchId) {
      throw new UnauthorizedException('Access denied to this branch');
    }
    return this.reconService.getHistory(branchId);
  }
}
