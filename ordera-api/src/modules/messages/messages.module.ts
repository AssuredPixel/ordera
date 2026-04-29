import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { PusherService } from './pusher.service';
import { Message, MessageSchema } from './schemas/message.schema';
import { Thread, ThreadSchema } from './schemas/thread.schema';
import { User, UserSchema } from '../users/user.schema';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Thread.name, schema: ThreadSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway, PusherService],
  exports: [MessagesService, PusherService],
})
export class MessagesModule {}
