import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { SeedService } from './seed.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    OrganizationsModule,
    BranchesModule,
  ],
  providers: [SeedService],
  exports: [MongooseModule],
})
export class UsersModule {}
