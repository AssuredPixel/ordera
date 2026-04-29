import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { MessagesService } from './messages.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './schemas/message.schema';
import { Thread } from './schemas/thread.schema';
import { PusherService } from './pusher.service';

@WebSocketGateway({
  namespace: 'messages',
  cors: { origin: '*' },
})
@UseGuards(WsJwtGuard)
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly pusherService: PusherService,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(Thread.name) private readonly threadModel: Model<Thread>,
  ) {}

  async handleConnection(client: Socket) {
    // Rooms are auto-joined after a brief delay or on explicit join-thread event
    // The client should call join-thread for each thread they are active in
  }

  @SubscribeMessage('join-thread')
  async handleJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string },
  ) {
    const user = client.data.user;
    await this.messagesService.validateMember(data.threadId, user.userId);
    
    client.join(data.threadId);
    
    // Mark as read
    await this.messagesService.markAsRead(data.threadId, user.userId);
    
    return { status: 'success' };
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; content: string; attachmentUrl?: string },
  ) {
    const user = client.data.user;
    const thread = await this.messagesService.validateMember(data.threadId, user.userId);

    // 1. Save Message
    const message = await this.messageModel.create({
      organizationId: new Types.ObjectId(user.organizationId),
      threadId: new Types.ObjectId(data.threadId),
      senderId: new Types.ObjectId(user.userId),
      senderName: user.firstName,
      senderRole: user.role,
      content: data.content,
      attachmentUrl: data.attachmentUrl,
      readBy: [new Types.ObjectId(user.userId)],
    });

    // 2. Update Thread LastMessage and Unread Counts
    const preview = data.content.substring(0, 80);
    
    // Use $inc for atomic unread increments for everyone EXCEPT sender
    const unreadUpdates: any = {};
    thread.memberIds.forEach(id => {
      const idStr = id.toString();
      if (idStr !== user.userId) {
        unreadUpdates[`unreadCounts.${idStr}`] = 1;
      }
    });

    await this.threadModel.updateOne(
      { _id: thread._id },
      {
        $set: {
          lastMessage: {
            content: preview,
            senderName: user.firstName,
            sentAt: new Date(),
          },
        },
        $inc: unreadUpdates,
      }
    );

    // 3. Emit to Room (Socket.io fallback)
    this.server.to(data.threadId).emit('message:receive', {
      threadId: data.threadId,
      message,
    });

    // 4. Push to Pusher (Vercel/Production Real-time)
    this.pusherService.trigger(
      `thread-${data.threadId}`,
      'message:receive',
      { threadId: data.threadId, message }
    );

    return message;
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string },
  ) {
    const user = client.data.user;
    client.to(data.threadId).emit('typing:start', {
      threadId: data.threadId,
      userId: user.userId,
      userName: user.firstName,
    });

    this.pusherService.trigger(
      `thread-${data.threadId}`,
      'typing:start',
      { threadId: data.threadId, userId: user.userId, userName: user.firstName }
    );
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string },
  ) {
    const user = client.data.user;
    client.to(data.threadId).emit('typing:stop', {
      threadId: data.threadId,
      userId: user.userId,
    });

    this.pusherService.trigger(
      `thread-${data.threadId}`,
      'typing:stop',
      { threadId: data.threadId, userId: user.userId }
    );
  }
}
