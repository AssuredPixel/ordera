import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { Invitation, InvitationSchema } from './invitation.schema';
import { PlatformModule } from '../platform/platform.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invitation.name, schema: InvitationSchema }]),
    PlatformModule
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService]
})
export class InvitationsModule {}
