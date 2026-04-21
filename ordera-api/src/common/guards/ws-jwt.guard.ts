import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const authHeader = client.handshake.headers.authorization || client.handshake.auth.token;
      
      if (!authHeader) throw new WsException('Unauthorized');
      
      const token = authHeader.split(' ')[1] || authHeader;
      const payload = await this.jwtService.verifyAsync(token);
      
      // Attach user to client
      client.data.user = payload;
      
      return true;
    } catch (err) {
      throw new WsException('Unauthorized');
    }
  }
}
