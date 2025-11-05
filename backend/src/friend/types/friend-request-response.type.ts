import { ObjectId } from 'mongodb';
import { User } from '../../user/entities/user.entity';
import { FriendRequestStatus } from '../entities/friend-request.entity';

export interface IncomingFriendRequestResponse {
  _id: ObjectId;
  sender: Omit<Partial<User>, 'password'>;
  status: FriendRequestStatus;
  createdAt: Date;
}

export interface OutgoingFriendRequestResponse {
  _id: ObjectId;
  receiver: Omit<Partial<User>, 'password'>;
  status: FriendRequestStatus;
  createdAt: Date;
}
