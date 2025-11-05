/**
 * WebSocket Event Type Definitions
 * Centralized type definitions for all real-time events
 */

// ========== Friend Events ==========
export interface FriendOnlineEvent {
  userId: string;
  timestamp: Date;
}

export interface FriendOfflineEvent {
  userId: string;
  timestamp: Date;
}

export interface FriendRequestedEvent {
  senderId: string;
  requestId: string;
  timestamp: Date;
}

export interface FriendAcceptedEvent {
  friendId: string;
  timestamp: Date;
}

export interface FriendRejectedEvent {
  receiverId: string;
  timestamp: Date;
}

export interface FriendRemovedEvent {
  friendId: string;
  timestamp: Date;
}

export interface FriendRequestCancelledEvent {
  requestId: string;
  timestamp: Date;
}

export interface FriendsOnlineListResponse {
  onlineFriends?: string[];
  error?: string;
}

// ========== Transaction Events ==========
export interface TransactionCreatedEvent {
  transactionId: string;
  amount: number;
  type: 'lent' | 'borrowed';
  withUserId: string;
  timestamp: Date;
}

export interface TransactionUpdatedEvent {
  transactionId: string;
  timestamp: Date;
}

export interface TransactionSettledEvent {
  transactionId: string;
  timestamp: Date;
}

// ========== Notification Events ==========
export interface NotificationEvent {
  id: string;
  type: 'friend_request' | 'transaction' | 'reminder' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
}

// ========== General Events ==========
export interface OnlineStatusResponse {
  status?: Record<string, boolean>;
  error?: string;
}

export interface OnlineCountResponse {
  count?: number;
  error?: string;
}

// ========== Server to Client Events ==========
export interface ServerToClientEvents {
  // Friend events
  'friend.online': (data: FriendOnlineEvent) => void;
  'friend.offline': (data: FriendOfflineEvent) => void;
  'friend.requested': (data: FriendRequestedEvent) => void;
  'friend.accepted': (data: FriendAcceptedEvent) => void;
  'friend.rejected': (data: FriendRejectedEvent) => void;
  'friend.removed': (data: FriendRemovedEvent) => void;
  'friend.requestCancelled': (data: FriendRequestCancelledEvent) => void;
  'friends.onlineList': (data: FriendsOnlineListResponse) => void;

  // Transaction events
  'transaction.created': (data: TransactionCreatedEvent) => void;
  'transaction.updated': (data: TransactionUpdatedEvent) => void;
  'transaction.accepted': (data: TransactionUpdatedEvent) => void;
  'transaction.rejected': (data: TransactionUpdatedEvent) => void;
  'transaction.settled': (data: TransactionSettledEvent) => void;

  // Notification events
  notification: (data: NotificationEvent) => void;
  'notification.new': (data: any) => void;
  'notification.unreadCount': (data: { count: number }) => void;

  // General events
  'users.onlineStatus': (data: OnlineStatusResponse) => void;
  'users.onlineCount': (data: OnlineCountResponse) => void;
}

// ========== Client to Server Events ==========
export interface ClientToServerEvents {
  // Friend queries
  'friends.getOnline': () => void;

  // General queries
  'users.getOnlineCount': () => void;
  'users.checkOnline': (payload: { userIds: string[] }) => void;

  // Ping/Pong for connection health
  ping: () => void;
}

// ========== Socket Data ==========
export interface SocketData {
  userId: string;
  userEmail?: string;
}

// ========== JWT Payload ==========
export interface JwtPayload {
  sub: string;
  email: string;
  tokenVersion: number;
}
