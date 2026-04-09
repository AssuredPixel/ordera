import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from '../organizations/schemas/organization.schema';
import { Branch, BranchSchema } from './schemas/branch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class BranchesModule {}
