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
      const cookies = client.handshake.headers.cookie;
      let token: string | undefined;

      if (cookies) {
        const parsedCookies = cookies.split(';').reduce((acc, curr) => {
          const [key, value] = curr.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = parsedCookies['ordera_token'];
      }

      if (!token) {
        // Fallback for non-browser clients (if any)
        const authHeader = client.handshake.headers.authorization || client.handshake.auth.token;
        if (authHeader) {
          token = authHeader.split(' ')[1] || authHeader;
        }
      }

      if (!token) throw new WsException('Unauthorized');
      const payload = await this.jwtService.verifyAsync(token);
      
      // Attach user to client
      client.data.user = payload;
      
      return true;
    } catch (err) {
      throw new WsException('Unauthorized');
    }
  }
}
