import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { UnauthorizedException } from '@nestjs/common';

@WebSocketGateway({
  cors: true,
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) throw new UnauthorizedException();
      
      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      console.log(`User connected to messages: ${payload.name}`);
    } catch (e) {
      client.disconnect();
    }
  }

  @SubscribeMessage('join-thread')
  async handleJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string },
  ) {
    const userId = client.data.user.sub;
    
    // Validate membership
    await this.messagesService.getThreadById(data.threadId, userId);
    
    client.join(data.threadId);
    
    // Mark as read
    await this.messagesService.markAsRead(data.threadId, userId);
    
    return { status: 'ok', threadId: data.threadId };
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string; content: string; attachmentUrl?: string },
  ) {
    const userId = client.data.user.sub;
    
    const message = await this.messagesService.sendMessage(
      data.threadId,
      userId,
      data.content,
      data.attachmentUrl,
    );

    // Emit to room
    this.server.to(data.threadId).emit('message:receive', {
      message,
      threadId: data.threadId,
    });

    return { status: 'sent', messageId: message._id };
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string },
  ) {
    const user = client.data.user;
    client.to(data.threadId).emit('typing:start', {
      userId: user.sub,
      userName: user.name,
      threadId: data.threadId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string },
  ) {
    client.to(data.threadId).emit('typing:stop', {
      threadId: data.threadId,
      userId: client.data.user.sub,
    });
  }
}
