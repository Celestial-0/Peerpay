import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

interface JwtError {
  name: string;
  message: string;
}

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Note: We don't check IS_PUBLIC_KEY here because refresh endpoint
    // needs @Public() to bypass the global JwtAuthGuard, but we still
    // want to validate the refresh token
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: Error | null,
    user: TUser | false,
    info: JwtError | undefined,
  ): TUser {
    // Provide better error messages
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Refresh token has expired. Please sign in again.',
        );
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active yet');
      }
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}
