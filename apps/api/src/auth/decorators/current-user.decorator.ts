import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserSession {
  userId: string;
  walletAddress: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserSession => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
