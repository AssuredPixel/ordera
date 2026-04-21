import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('reconciliations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReconciliationController {
  constructor(private readonly reconService: ReconciliationService) {}

  @Get()
  @Roles(Role.BRANCH_MANAGER, Role.CASHIER, Role.OWNER)
  async getReconciliations(@GetUser('branchId') branchId: string) {
    return this.reconService.findAll(branchId);
  }

  @Post('open')
  @Roles(Role.BRANCH_MANAGER, Role.CASHIER)
  async open(@GetUser() user: any, @Body() data: any) {
    return this.reconService.openReconciliation(user, data);
  }

  @Patch(':id/enter-actuals')
  @Roles(Role.BRANCH_MANAGER, Role.CASHIER)
  async enterActuals(
    @Param('id') id: string,
    @GetUser('branchId') branchId: string,
    @Body() data: any,
  ) {
    return this.reconService.enterActuals(id, branchId, data);
  }

  @Patch(':id/verify-line')
  @Roles(Role.BRANCH_MANAGER, Role.CASHIER)
  async verifyLine(
    @Param('id') id: string,
    @GetUser('branchId') branchId: string,
    @Body() data: { waiterId: string; note?: string },
  ) {
    return this.reconService.verifyLine(id, branchId, data.waiterId, 'verified', data.note);
  }

  @Patch(':id/flag-line')
  @Roles(Role.BRANCH_MANAGER, Role.CASHIER)
  async flagLine(
    @Param('id') id: string,
    @GetUser('branchId') branchId: string,
    @Body() data: { waiterId: string; reason: string },
  ) {
    return this.reconService.verifyLine(id, branchId, data.waiterId, 'flagged', data.reason);
  }

  @Patch(':id/complete')
  @Roles(Role.BRANCH_MANAGER, Role.CASHIER)
  async complete(@Param('id') id: string, @GetUser('branchId') branchId: string) {
    return this.reconService.complete(id, branchId);
  }
}
