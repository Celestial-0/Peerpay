import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JWT_SECRET } from '../../constants';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

interface SocketAuth {
  token?: string;
  userId?: string;
  email?: string;
}

/**
 * 🔐 WebSocket JWT Guard
 * Validates JWT tokens for WebSocket connections
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const auth = client.handshake.auth as SocketAuth;
      const headers = client.handshake.headers as Record<
        string,
        string | string[] | undefined
      >;
      const authHeader = headers.authorization;

      const token =
        auth?.token ||
        (typeof authHeader === 'string' ? authHeader : undefined);

      if (!token) {
        throw new WsException('No token provided');
      }

      // Remove 'Bearer ' prefix if present
      const cleanToken =
        typeof token === 'string' ? token.replace('Bearer ', '') : token;

      // Verify token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        cleanToken,
        {
          secret: JWT_SECRET,
        },
      );

      // Attach user info to socket for later use
      const updatedAuth: SocketAuth = {
        ...auth,
        userId: payload.sub,
        email: payload.email,
      };

      client.handshake.auth = updatedAuth;

      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }
}
