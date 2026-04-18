import { Controller, Get, Patch, Param, Query, UseGuards, Body } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN)
  async findAll(
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.organizationsService.findAllFiltered({ search, plan, status, page, limit });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findById(id);
  }

  @Patch(':id/suspend')
  @Roles(Role.SUPER_ADMIN)
  async suspend(@Param('id') id: string) {
    return this.organizationsService.suspend(id);
  }

  @Patch(':id/reactivate')
  @Roles(Role.SUPER_ADMIN)
  async reactivate(@Param('id') id: string) {
    return this.organizationsService.reactivate(id);
  }
}
