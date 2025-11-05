/**
 * User object attached to request after authentication
 * This is what the JWT and Local strategies return
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  tokenVersion: number;
}
