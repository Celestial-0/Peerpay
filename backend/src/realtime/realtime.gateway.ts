import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { FriendService } from '../friend/friend.service';
import { FriendEventsService } from './services/friend-events.service';
import { TransactionEventsService } from './services/transaction-events.service';
import { NotificationEventsService } from './services/notification-events.service';
import { JWT_SECRET } from '../constants';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
  JwtPayload,
} from './types/socket-events.types';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly logger = new Logger(RealtimeGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();
  private onlineUsers: Set<string> = new Set();

  // Room constants
  private readonly ONLINE_ROOM = 'users:online';
  private readonly USER_ROOM_PREFIX = 'user:';

  constructor(
    private readonly jwtService: JwtService,
    private readonly friendService: FriendService,
    private readonly friendEvents: FriendEventsService,
    private readonly transactionEvents: TransactionEventsService,
    private readonly notificationEvents: NotificationEventsService,
  ) {}

  /**
   * Handle new client connection
   */
  async handleConnection(
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      never,
      SocketData
    >,
  ): Promise<void> {
    try {
      // Extract and verify JWT token
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      const userId = payload.sub;

      // Store user socket mapping (multi-device support)
      this.addUserSocket(userId, client.id);
      client.data.userId = userId;
      client.data.userEmail = payload.email;

      // Join user rooms
      await client.join(`${this.USER_ROOM_PREFIX}${userId}`);
      await client.join(this.ONLINE_ROOM);

      // Handle online status and notifications
      await this.handleUserOnline(userId);

      this.logger.log(`User ${userId} connected (Socket: ${client.id})`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Connection error: ${errorMessage}`, errorStack);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnect(
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      never,
      SocketData
    >,
  ): Promise<void> {
    const userId = client.data.userId;

    if (!userId) return;

    try {
      const isFullyDisconnected = this.removeUserSocket(userId, client.id);

      if (isFullyDisconnected) {
        await this.handleUserOffline(userId);
        this.logger.log(
          `User ${userId} went offline (all devices disconnected)`,
        );
      } else {
        const remainingDevices = this.userSockets.get(userId)?.size || 0;
        this.logger.debug(
          `User ${userId} disconnected one device (${remainingDevices} remaining)`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Disconnect error for user ${userId}: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Get online friends list
   */
  @SubscribeMessage('friends.getOnline')
  async handleGetOnlineFriends(
    @ConnectedSocket()
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      never,
      SocketData
    >,
  ): Promise<void> {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('friends.onlineList', { error: 'Unauthorized' });
      return;
    }

    try {
      const friends = await this.friendService.getFriends(userId);
      const onlineFriends = friends
        .filter(
          (friend) => friend._id && this.isUserOnline(friend._id.toString()),
        )
        .map((friend) => friend._id!.toString());

      client.emit('friends.onlineList', { onlineFriends });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting online friends: ${errorMessage}`);
      client.emit('friends.onlineList', {
        error: 'Failed to fetch online friends',
      });
    }
  }

  /**
   * Get total online users count
   */
  @SubscribeMessage('users.getOnlineCount')
  handleGetOnlineCount(
    @ConnectedSocket()
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      never,
      SocketData
    >,
  ): void {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('users.onlineCount', { error: 'Unauthorized' });
      return;
    }

    client.emit('users.onlineCount', { count: this.onlineUsers.size });
  }

  /**
   * Check if specific users are online
   */
  @SubscribeMessage('users.checkOnline')
  handleCheckUsersOnline(
    @ConnectedSocket()
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      never,
      SocketData
    >,
    @MessageBody() payload: { userIds: string[] },
  ): void {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('users.onlineStatus', { error: 'Unauthorized' });
      return;
    }

    if (!payload?.userIds || !Array.isArray(payload.userIds)) {
      client.emit('users.onlineStatus', { error: 'Invalid payload' });
      return;
    }

    const onlineStatus = payload.userIds.reduce(
      (acc, id) => {
        acc[id] = this.isUserOnline(id);
        return acc;
      },
      {} as Record<string, boolean>,
    );

    client.emit('users.onlineStatus', { status: onlineStatus });
  }

  /**
   * Ping handler for connection health check
   */
  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket()
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      never,
      SocketData
    >,
  ): void {
    // Respond with pong event
    client.emit('users.onlineCount', { count: this.onlineUsers.size });
  }

  // ==================== Public Methods for Services ====================

  /**
   * Get friend events service for external use
   */
  getFriendEvents(): FriendEventsService {
    return this.friendEvents;
  }

  /**
   * Get transaction events service for external use
   */
  getTransactionEvents(): TransactionEventsService {
    return this.transactionEvents;
  }

  /**
   * Get notification events service for external use
   */
  getNotificationEvents(): NotificationEventsService {
    return this.notificationEvents;
  }

  /**
   * Get server instance for external use
   */
  getServer(): Server<ClientToServerEvents, ServerToClientEvents> {
    return this.server;
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * Get all online user IDs
   */
  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers);
  }

  /**
   * Check if a user is connected (has active sockets)
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get number of connected sockets for a user
   */
  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Emit event to a specific room
   */
  emitToRoom(room: string, event: string, data: any): void {
    this.server.to(room).emit(event as any, data);
  }

  // ==================== Private Helper Methods ====================

  /**
   * Extract token from client handshake
   */
  private extractToken(
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      never,
      SocketData
    >,
  ): string | undefined {
    const authToken = client.handshake.auth?.token as string | undefined;
    const queryToken = client.handshake.query?.token;

    return typeof authToken === 'string'
      ? authToken
      : typeof queryToken === 'string'
        ? queryToken
        : undefined;
  }

  /**
   * Verify JWT token
   */
  private verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: JWT_SECRET,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Token verification failed: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Add user socket to tracking
   */
  private addUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  /**
   * Remove user socket from tracking
   * @returns true if user is fully disconnected (no more sockets)
   */
  private removeUserSocket(userId: string, socketId: string): boolean {
    const userSocketSet = this.userSockets.get(userId);
    if (!userSocketSet) return true;

    userSocketSet.delete(socketId);

    if (userSocketSet.size === 0) {
      this.userSockets.delete(userId);
      this.onlineUsers.delete(userId);
      return true;
    }

    return false;
  }

  /**
   * Handle user coming online
   */
  private async handleUserOnline(userId: string): Promise<void> {
    const wasOffline = !this.onlineUsers.has(userId);
    this.onlineUsers.add(userId);

    // Only notify friends if transitioning from offline to online
    if (wasOffline) {
      try {
        const friends = await this.friendService.getFriends(userId);
        const friendIds = friends
          .filter((f) => f._id)
          .map((f) => f._id!.toString());

        this.friendEvents.emitFriendOnline(this.server, friendIds, userId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Error notifying friends of online status: ${errorMessage}`,
        );
      }
    }
  }

  /**
   * Handle user going offline
   */
  private async handleUserOffline(userId: string): Promise<void> {
    try {
      const friends = await this.friendService.getFriends(userId);
      const friendIds = friends
        .filter((f) => f._id)
        .map((f) => f._id!.toString());

      this.friendEvents.emitFriendOffline(this.server, friendIds, userId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error notifying friends of offline status: ${errorMessage}`,
      );
    }
  }
}
