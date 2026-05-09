import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { ResourceOwnerGuard } from '../../common/guards/resource-owner.guard';
import { ShiftTemplatesService, ShiftsService, BusinessDaysService } from './scheduling.service';
import { ShiftTemplate } from './shift-template.schema';
import { BusinessDay } from './business-day.schema';

// ─────────────────────────── SHIFT TEMPLATES ───────────────────────────────────
@Controller('branches/:branchId/shift-templates')
@UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnerGuard)
@Roles(Role.OWNER, Role.BRANCH_MANAGER)
export class ShiftTemplatesController {
  constructor(private readonly templatesService: ShiftTemplatesService) {}

  @Get()
  findAll(@Param('branchId') branchId: string) {
    return this.templatesService.findAll(branchId);
  }

  @Post()
  create(
    @Param('branchId') branchId: string,
    @Body() body: Partial<ShiftTemplate>,
    @GetUser() user: JwtPayload,
  ) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    return this.templatesService.create(branchId, user.organizationId as string, body);
  }
}

@Controller('shift-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftTemplatesMutationController {
  constructor(private readonly templatesService: ShiftTemplatesService) {}

  @Patch(':id')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  update(@Param('id') id: string, @GetUser() user: JwtPayload, @Body() body: Partial<ShiftTemplate>) {
    return this.templatesService.update(id, user, body);
  }

  @Delete(':id')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  remove(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.templatesService.softDelete(id, user);
  }
}

// ─────────────────────────────── SHIFTS ────────────────────────────────────────
@Controller('branches/:branchId/shifts')
@UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnerGuard)
@Roles(Role.OWNER, Role.BRANCH_MANAGER)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  findByDate(@Param('branchId') branchId: string, @Query('date') date: string) {
    const queryDate = date || new Date().toISOString().split('T')[0];
    return this.shiftsService.findByDate(branchId, queryDate);
  }

  @Post('generate')
  generate(
    @Param('branchId') branchId: string,
    @Body('date') date: string,
    @GetUser() user: JwtPayload,
  ) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    return this.shiftsService.generateFromTemplates(branchId, user.organizationId as string, date);
  }
}

@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftsMutationController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Patch(':id/open')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  open(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.shiftsService.open(id, user);
  }

  @Patch(':id/close')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  close(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.shiftsService.close(id, user);
  }
}

// ─────────────────────────── BUSINESS DAYS ─────────────────────────────────────
@Controller('branches/:branchId/business-days')
@UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnerGuard)
@Roles(Role.OWNER, Role.BRANCH_MANAGER)
export class BusinessDaysController {
  constructor(private readonly businessDaysService: BusinessDaysService) {}

  @Get()
  findByDate(@Param('branchId') branchId: string, @Query('date') date: string) {
    const queryDate = date || new Date().toISOString().split('T')[0];
    return this.businessDaysService.findByDate(branchId, queryDate);
  }

  @Post('open')
  open(
    @Param('branchId') branchId: string,
    @Body() body: Partial<BusinessDay>,
    @GetUser() user: JwtPayload,
  ) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    return this.businessDaysService.open(branchId, user.organizationId as string, user.userId, body);
  }
}

@Controller('business-days')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessDaysMutationController {
  constructor(private readonly businessDaysService: BusinessDaysService) {}

  @Patch(':id/close')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  close(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.businessDaysService.close(id, user);
  }
}
