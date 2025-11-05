import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  NotificationEvent,
} from '../types/socket-events.types';

@Injectable()
export class NotificationEventsService {
  private readonly USER_ROOM_PREFIX = 'user:';

  /**
   * Send notification to specific user(s)
   */
  sendNotification(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    userIds: string | string[],
    type: NotificationEvent['type'],
    title: string,
    message: string,
    data?: Record<string, any>,
  ): void {
    const event: NotificationEvent = {
      id: this.generateNotificationId(),
      type,
      title,
      message,
      data,
      timestamp: new Date(),
    };

    const recipients = Array.isArray(userIds) ? userIds : [userIds];

    recipients.forEach((userId) => {
      server
        .to(`${this.USER_ROOM_PREFIX}${userId}`)
        .emit('notification', event);
    });
  }

  /**
   * Send friend request notification
   */
  sendFriendRequestNotification(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    receiverId: string,
    senderName: string,
    requestId: string,
  ): void {
    this.sendNotification(
      server,
      receiverId,
      'friend_request',
      'New Friend Request',
      `${senderName} sent you a friend request`,
      { requestId },
    );
  }

  /**
   * Send transaction notification
   */
  sendTransactionNotification(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    userId: string,
    title: string,
    message: string,
    transactionId: string,
  ): void {
    this.sendNotification(server, userId, 'transaction', title, message, {
      transactionId,
    });
  }

  /**
   * Send reminder notification
   */
  sendReminderNotification(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    userId: string,
    message: string,
    data?: Record<string, any>,
  ): void {
    this.sendNotification(
      server,
      userId,
      'reminder',
      'Reminder',
      message,
      data,
    );
  }

  /**
   * Send system notification
   */
  sendSystemNotification(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    userIds: string | string[],
    title: string,
    message: string,
  ): void {
    this.sendNotification(server, userIds, 'system', title, message);
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
