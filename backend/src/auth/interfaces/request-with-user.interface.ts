import type { Request } from 'express';
import type { AuthenticatedUser } from './authenticated-user.interface';

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
