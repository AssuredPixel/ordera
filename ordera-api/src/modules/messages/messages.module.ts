import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Thread, ThreadSchema } from './schemas/thread.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { MessagesController } from './messages.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Thread.name, schema: ThreadSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    UsersModule,
  ],
  providers: [MessagesService, MessagesGateway],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
