import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'ordering',
})
export class OrderingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const branchId = client.handshake.query.branchId as string;
    const userId = client.handshake.query.userId as string;
    const role = client.handshake.query.role as string;

    if (branchId) {
      if (role === 'KITCHEN_STAFF' || role === 'BRANCH_MANAGER') {
        client.join(`branch:${branchId}:kitchen`);
      }
      client.join(`branch:${branchId}`);
    }

    if (userId) {
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    // Rooms are automatically left on disconnect
  }

  emitToKitchen(branchId: string, event: string, data: any) {
    this.server.to(`branch:${branchId}:kitchen`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, data: any) {
    return { event: 'pong', data };
  }
}
