import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { NotificationType } from '../entities/notification.entity';

/**
 * Schema for creating a new notification
 */
export const createNotificationSchema = z.object({
  userId: z
    .string()
    .min(1, 'User ID is required')
    .regex(/^[a-f\d]{24}$/i, 'Invalid user ID format'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message cannot exceed 1000 characters')
    .trim(),
  type: z.enum(NotificationType),
  actionUrl: z
    .string()
    .url('Action URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for updating a notification
 */
export const updateNotificationSchema = z.object({
  isRead: z
    .boolean({
      message: 'isRead must be a boolean',
    })
    .optional(),
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters')
    .trim()
    .optional(),
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message cannot exceed 1000 characters')
    .trim()
    .optional(),
  actionUrl: z
    .url('Action URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for marking notification as read
 */
export const markAsReadSchema = z.object({
  isRead: z.boolean({
    message: 'isRead must be a boolean',
  }),
});

/**
 * Schema for notification query parameters
 */
export const notificationQuerySchema = z.object({
  isRead: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  type: z.enum(NotificationType).optional(),
  limit: z
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20),
  offset: z
    .number()
    .int('Offset must be an integer')
    .nonnegative('Offset cannot be negative')
    .optional()
    .default(0),
  sortBy: z
    .enum(['createdAt', 'type', 'isRead'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Schema for notification ID parameter validation
 */
export const notificationIdParamSchema = z.object({
  id: z
    .string()
    .min(1, 'Notification ID is required')
    .regex(/^[a-f\d]{24}$/i, 'Invalid notification ID format'),
});

/**
 * Schema for bulk notification operations
 */
export const bulkNotificationIdsSchema = z.object({
  notificationIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid notification ID format'))
    .min(1, 'At least one notification ID is required')
    .max(100, 'Cannot process more than 100 notifications at once'),
});

/**
 * Schema for marking all notifications as read
 */
export const markAllAsReadSchema = z.object({
  userId: z
    .string()
    .min(1, 'User ID is required')
    .regex(/^[a-f\d]{24}$/i, 'Invalid user ID format'),
});

/**
 * Schema for notification type filter
 */
export const notificationTypeFilterSchema = z.object({
  type: z.nativeEnum(NotificationType),
});

/**
 * Schema for deleting old notifications
 */
export const deleteOldNotificationsSchema = z.object({
  olderThanDays: z
    .number()
    .int('Days must be an integer')
    .positive('Days must be positive')
    .min(1, 'Must be at least 1 day')
    .max(365, 'Cannot exceed 365 days'),
  userId: z
    .string()
    .min(1, 'User ID is required')
    .regex(/^[a-f\d]{24}$/i, 'Invalid user ID format')
    .optional(),
});

/**
 * DTO Classes for NestJS validation
 */
export class CreateNotificationDto extends createZodDto(
  createNotificationSchema,
) {}

export class UpdateNotificationDto extends createZodDto(
  updateNotificationSchema,
) {}

export class MarkAsReadDto extends createZodDto(markAsReadSchema) {}

export class NotificationQueryDto extends createZodDto(
  notificationQuerySchema,
) {}

export class NotificationIdParamDto extends createZodDto(
  notificationIdParamSchema,
) {}

export class BulkNotificationIdsDto extends createZodDto(
  bulkNotificationIdsSchema,
) {}

export class MarkAllAsReadDto extends createZodDto(markAllAsReadSchema) {}

export class NotificationTypeFilterDto extends createZodDto(
  notificationTypeFilterSchema,
) {}

export class DeleteOldNotificationsDto extends createZodDto(
  deleteOldNotificationsSchema,
) {}
