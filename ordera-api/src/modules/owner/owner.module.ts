import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OwnerService } from './owner.service';
import { OwnerController } from './owner.controller';
import { Branch, BranchSchema } from '../branches/branch.schema';
import { User, UserSchema } from '../users/user.schema';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Branch.name, schema: BranchSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [OwnerController],
  providers: [OwnerService],
})
export class OwnerModule {}
