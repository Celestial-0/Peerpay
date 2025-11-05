import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/**
 * 🔌 NotificationGateway - Real-time WebSocket notifications service
 *
 * Handles:
 * - Real-time notification push to connected clients via RealtimeGateway
 * - Unread count updates
 */
@Injectable()
export class NotificationGateway {
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * 📬 Send notification to a specific user
   */
  async sendNotificationToUser(
    userId: ObjectId,
    notification: Notification,
  ): Promise<void> {
    const server = this.realtimeGateway.getServer();
    const userRoom = `user:${userId.toString()}`;
    server.to(userRoom).emit('notification.new', notification);

    // Also update unread count
    const unreadCount = await this.notificationService.getUnreadCount(userId);
    server
      .to(userRoom)
      .emit('notification.unreadCount', { count: unreadCount });
  }

  /**
   * 📊 Send unread count update to a user
   */
  async sendUnreadCountUpdate(userId: ObjectId): Promise<void> {
    const unreadCount = await this.notificationService.getUnreadCount(userId);
    const userRoom = `user:${userId.toString()}`;
    this.realtimeGateway.emitToRoom(userRoom, 'notification.unreadCount', {
      count: unreadCount,
    });
  }

  /**
   * 🔍 Check if a user is currently connected
   */
  isUserConnected(userId: string): boolean {
    return this.realtimeGateway.isUserConnected(userId);
  }

  /**
   * 📊 Get number of connected sockets for a user
   */
  getUserConnectionCount(userId: string): number {
    return this.realtimeGateway.getUserConnectionCount(userId);
  }
}
