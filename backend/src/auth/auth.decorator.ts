import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../constants';
import type { RequestWithUser } from './interfaces/request-with-user.interface';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

/**
 * Combined authentication decorator that applies JWT guard.
 * This is a convenience decorator that can be extended with roles/permissions.
 *
 * @example
 * ```typescript
 * @Auth()
 * @Get('profile')
 * getProfile() { ... }
 * ```
 */
export const Auth = () => {
  return applyDecorators(UseGuards(JwtAuthGuard));
};

/**
 * Marks a route as public (bypasses JWT authentication).
 * When applied to a route, the global JwtAuthGuard will be skipped.
 *
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * login() { ... }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Parameter decorator to extract the current authenticated user from the request.
 *
 * @param data - Optional property key to extract a specific field from the user object
 * @returns The full user object or a specific property if data is provided
 *
 * @example
 * ```typescript
 * // Get the entire user object
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) { ... }
 *
 * // Get a specific property
 * @Get('my-id')
 * getUserId(@CurrentUser('userId') userId: string) { ... }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext,
  ): AuthenticatedUser | AuthenticatedUser[keyof AuthenticatedUser] => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user: AuthenticatedUser = request.user;

    return data ? user[data] : user;
  },
);
