import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // 1. Try Bearer token
          const authHeader = request.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
          }
          // 2. Try Cookie
          return request?.cookies?.['jwt'];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev_secret_key_change_me',
    });
  }

  async validate(payload: any) {
    if (!payload.sub || !payload.sessionId) {
      throw new UnauthorizedException('Invalid token payload');
    }
    // Passport attaches this to request.user
    return {
      sub: payload.sub,
      userId: payload.userId,
      sessionId: payload.sessionId,
      salesId: payload.salesId,
      name: payload.name,
      role: payload.role,
      organizationId: payload.organizationId,
      branchId: payload.branchId,
    };
  }
}
