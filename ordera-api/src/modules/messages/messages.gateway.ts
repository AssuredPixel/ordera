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
    return this.messagesService.sendMessage(data.threadId, user, data);
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
