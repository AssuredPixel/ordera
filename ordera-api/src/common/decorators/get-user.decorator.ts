import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the user object from the request.
 * Should be used in conjunction with JwtAuthGuard.
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
