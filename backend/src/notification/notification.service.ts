import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Notification, NotificationType } from './entities/notification.entity';
import type {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryDto,
} from './schema/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * 📬 Create a new notification
   */
  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      userId: new ObjectId(createNotificationDto.userId),
    });
    return this.notificationRepository.save(notification);
  }

  /**
   * 📋 Get all notifications for a user with optional filters
   */
  async findAllForUser(
    userId: ObjectId,
    query?: NotificationQueryDto,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const whereClause: FindOptionsWhere<Notification> = {
      userId: userId as unknown as ObjectId,
    };

    if (query?.isRead !== undefined) {
      whereClause.isRead = query.isRead;
    }

    if (query?.type) {
      whereClause.type = query.type;
    }

    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where: whereClause,
        order: { createdAt: 'DESC' },
        skip: query?.offset || 0,
        take: query?.limit || 20,
      });

    return { notifications, total };
  }

  /**
   * 🔍 Find a single notification by ID
   */
  async findOne(id: string, userId: ObjectId): Promise<Notification> {
    const whereClause: FindOptionsWhere<Notification> = {
      _id: new ObjectId(id) as unknown as ObjectId,
      userId: userId as unknown as ObjectId,
    };

    const notification = await this.notificationRepository.findOne({
      where: whereClause,
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  /**
   * ✏️ Update a notification (e.g., mark as read)
   */
  async update(
    id: string,
    userId: ObjectId,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findOne(id, userId);

    Object.assign(notification, updateNotificationDto);

    return this.notificationRepository.save(notification);
  }

  /**
   * ✅ Mark a notification as read
   */
  async markAsRead(id: string, userId: ObjectId): Promise<Notification> {
    return this.update(id, userId, { isRead: true });
  }

  /**
   * ✅ Mark all notifications as read for a user
   */
  async markAllAsRead(userId: ObjectId): Promise<{ updated: number }> {
    const whereClause: FindOptionsWhere<Notification> = {
      userId: userId as unknown as ObjectId,
      isRead: false,
    };

    const result = await this.notificationRepository.update(whereClause, {
      isRead: true,
    });

    return { updated: result.affected || 0 };
  }

  /**
   * 🗑️ Delete a notification
   */
  async remove(id: string, userId: ObjectId): Promise<void> {
    const notification = await this.findOne(id, userId);
    await this.notificationRepository.remove(notification);
  }

  /**
   * 🗑️ Delete all notifications for a user
   */
  async removeAllForUser(userId: ObjectId): Promise<{ deleted: number }> {
    const whereClause: FindOptionsWhere<Notification> = {
      userId: userId as unknown as ObjectId,
    };
    const result = await this.notificationRepository.delete(whereClause);
    return { deleted: result.affected || 0 };
  }

  /**
   * 📊 Get unread count for a user
   */
  async getUnreadCount(userId: ObjectId): Promise<number> {
    const whereClause: FindOptionsWhere<Notification> = {
      userId: userId as unknown as ObjectId,
      isRead: false,
    };
    return this.notificationRepository.count({
      where: whereClause,
    });
  }

  /**
   * 🔔 Helper: Create a friend request notification
   */
  async createFriendRequestNotification(
    recipientId: ObjectId,
    senderName: string,
    senderId: ObjectId,
  ): Promise<Notification> {
    return this.create({
      userId: recipientId.toString(),
      title: 'New Friend Request',
      message: `${senderName} sent you a friend request`,
      type: NotificationType.FRIEND_REQUEST,
      actionUrl: '/friends/requests',
      metadata: { senderId: senderId.toString() },
    });
  }

  /**
   * 🔔 Helper: Create a friend accepted notification
   */
  async createFriendAcceptedNotification(
    recipientId: ObjectId,
    acceptorName: string,
  ): Promise<Notification> {
    return this.create({
      userId: recipientId.toString(),
      title: 'Friend Request Accepted',
      message: `${acceptorName} accepted your friend request`,
      type: NotificationType.FRIEND_ACCEPTED,
      actionUrl: '/friends',
      metadata: {},
    });
  }

  /**
   * 🔔 Helper: Create a transaction request notification
   */
  async createTransactionRequestNotification(
    recipientId: ObjectId,
    senderName: string,
    amount: number,
    transactionId: ObjectId,
  ): Promise<Notification> {
    return this.create({
      userId: recipientId.toString(),
      title: 'New Transaction Request',
      message: `${senderName} requested verification for ₹${amount}`,
      type: NotificationType.TRANSACTION_REQUEST,
      actionUrl: `/transactions/${transactionId.toString()}`,
      metadata: { transactionId: transactionId.toString(), amount },
    });
  }

  /**
   * 🔔 Helper: Create a transaction verified notification
   */
  async createTransactionVerifiedNotification(
    recipientId: ObjectId,
    verifierName: string,
    amount: number,
    transactionId: ObjectId,
  ): Promise<Notification> {
    return this.create({
      userId: recipientId.toString(),
      title: 'Transaction Verified',
      message: `${verifierName} verified your transaction of ₹${amount}`,
      type: NotificationType.TRANSACTION_VERIFIED,
      actionUrl: `/transactions/${transactionId.toString()}`,
      metadata: { transactionId: transactionId.toString(), amount },
    });
  }

  /**
   * 🔔 Helper: Create a payment reminder notification
   */
  async createPaymentReminderNotification(
    recipientId: ObjectId,
    creditorName: string,
    amount: number,
  ): Promise<Notification> {
    return this.create({
      userId: recipientId.toString(),
      title: 'Payment Reminder',
      message: `Reminder: You owe ${creditorName} ₹${amount}`,
      type: NotificationType.PAYMENT_REMINDER,
      actionUrl: '/transactions',
      metadata: { amount },
    });
  }
}
