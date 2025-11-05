/**
 * Type definitions for API responses in tests
 */

export interface UserResponse {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  totalLent?: number;
  totalBorrowed?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSignupResponse {
  user: UserResponse;
}

export interface AuthSigninResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface AuthRefreshResponse {
  accessToken: string;
}

export interface MessageResponse {
  message: string;
}

export interface FriendRequestResponse {
  _id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface IncomingFriendRequestResponse {
  _id: string;
  sender: UserResponse;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface OutgoingFriendRequestResponse {
  _id: string;
  receiver: UserResponse;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface FriendResponse {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
}

export interface TransactionResponse {
  _id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  type: 'lent' | 'borrowed';
  remarks?: string;
  status: 'pending' | 'accepted' | 'settled' | 'completed' | 'failed';
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  _id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UserProfileResponse extends UserResponse {
  totalLent: number;
  totalBorrowed: number;
  netBalance: number;
}

export interface UserSearchResponse {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
}

export interface TransactionListResponse {
  transactions: TransactionResponse[];
}
