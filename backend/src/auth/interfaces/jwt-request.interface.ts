import { Request } from 'express';
import { AuthenticatedUser } from './authenticated-user.interface';

/**
 * JWT payload structure (for token generation)
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Express Request with authenticated user
 * Uses AuthenticatedUser for consistency across the app
 */
export interface JwtRequest extends Request {
  user: AuthenticatedUser;
}
