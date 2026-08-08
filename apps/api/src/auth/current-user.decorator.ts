import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PublicUser } from './auth.types';

/** Injects the user resolved by JwtStrategy.validate() into a handler argument. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicUser =>
    ctx.switchToHttp().getRequest().user,
);
