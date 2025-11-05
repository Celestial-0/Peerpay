import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/auth.decorator';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryDto,
} from './schema/notification.schema';

/**
 * 📬 NotificationController
 *
 * REST endpoints for notification management
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * 📋 Get all notifications for the authenticated user
   * GET /notifications?isRead=false&type=friend_request&limit=20&skip=0
   */
  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationService.findAllForUser(new ObjectId(userId), query);
  }

  /**
   * 📊 Get unread notification count
   * GET /notifications/unread/count
   */
  @Get('unread/count')
  async getUnreadCount(@CurrentUser('userId') userId: string) {
    const count = await this.notificationService.getUnreadCount(
      new ObjectId(userId),
    );
    return { count };
  }

  /**
   * 🔍 Get a single notification by ID
   * GET /notifications/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.notificationService.findOne(id, new ObjectId(userId));
  }

  /**
   * 📬 Create a new notification (admin/system use)
   * POST /notifications
   */
  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    const notification = await this.notificationService.create(
      createNotificationDto,
    );

    // Send real-time notification via WebSocket
    await this.notificationGateway.sendNotificationToUser(
      new ObjectId(createNotificationDto.userId),
      notification,
    );

    return notification;
  }

  /**
   * ✏️ Update a notification
   * PATCH /notifications/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    const userObjectId = new ObjectId(userId);
    const notification = await this.notificationService.update(
      id,
      userObjectId,
      updateNotificationDto,
    );

    // Update unread count if isRead was changed
    if (updateNotificationDto.isRead !== undefined) {
      await this.notificationGateway.sendUnreadCountUpdate(userObjectId);
    }

    return notification;
  }

  /**
   * ✅ Mark a notification as read
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const userObjectId = new ObjectId(userId);
    const notification = await this.notificationService.markAsRead(
      id,
      userObjectId,
    );

    // Send updated unread count via WebSocket
    await this.notificationGateway.sendUnreadCountUpdate(userObjectId);

    return notification;
  }

  /**
   * ✅ Mark all notifications as read
   * PATCH /notifications/read-all
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser('userId') userId: string) {
    const userObjectId = new ObjectId(userId);
    const result = await this.notificationService.markAllAsRead(userObjectId);

    // Send updated unread count via WebSocket
    await this.notificationGateway.sendUnreadCountUpdate(userObjectId);

    return result;
  }

  /**
   * 🗑️ Delete a notification
   * DELETE /notifications/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    await this.notificationService.remove(id, new ObjectId(userId));
  }

  /**
   * 🗑️ Delete all notifications for the user
   * DELETE /notifications
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async removeAll(@CurrentUser('userId') userId: string) {
    return this.notificationService.removeAllForUser(new ObjectId(userId));
  }
}
