export interface JwtPayload {
  sub: string; // user id
  email: string;
  type: 'access' | 'refresh';
  tokenVersion: number;
  iat?: number;
  exp?: number;
}
