<link rel="stylesheet" href="styles.css">

# 🔔 Notification Module

**Version:** 0.0.1  
**Status:** <span class="badge badge-status">Production Ready</span>

---

## Overview

The Notification Module provides a comprehensive notification system with real-time delivery, read/unread tracking, filtering, and pagination support.

### Key Features

- ✅ **Real-time Delivery** - WebSocket push notifications
- ✅ **Read/Unread Tracking** - Mark notifications as read
- ✅ **Type-based Filtering** - Filter by notification type
- ✅ **Pagination Support** - Efficient data loading
- ✅ **Helper Methods** - Common notification scenarios
- ✅ **Bulk Operations** - Mark all as read, delete all

---

## Architecture

### Entity Schema

```typescript
@Entity('notifications')
export class Notification {
  @ObjectIdColumn()
  _id: ObjectId;
  
  @Column()
  recipient: ObjectId;
  
  @Column({
    type: 'enum',
    enum: [
      'FRIEND_REQUEST',
      'FRIEND_ACCEPTED',
      'TRANSACTION_REQUEST',
      'TRANSACTION_VERIFIED',
      'PAYMENT_REMINDER',
      'SYSTEM'
    ]
  })
  type: NotificationType;
  
  @Column()
  title: string;
  
  @Column()
  message: string;
  
  @Column({ type: 'json', nullable: true })
  data?: any;
  
  @Column({ default: false })
  isRead: boolean;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## API Endpoints

### 1. Get All Notifications

<div class="endpoint-card">

**GET** `/notifications`

Get all notifications with filters.

</div>

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by notification type |
| `isRead` | boolean | Filter by read status |
| `limit` | number | Max results (default: 20) |
| `offset` | number | Pagination offset |

**Response:** `200 OK`

```json
{
  "notifications": [
    {
      "id": "507f1f77bcf86cd799439050",
      "type": "FRIEND_REQUEST",
      "title": "New Friend Request",
      "message": "John Doe sent you a friend request",
      "data": {
        "requestId": "507f1f77bcf86cd799439020",
        "userId": "507f1f77bcf86cd799439012"
      },
      "isRead": false,
      "createdAt": "2024-11-06T00:00:00.000Z"
    }
  ],
  "total": 15,
  "unreadCount": 5,
  "limit": 20,
  "offset": 0
}
```

---

### 2. Get Unread Count

<div class="endpoint-card">

**GET** `/notifications/unread/count`

Get count of unread notifications.

</div>

**Response:** `200 OK`

```json
{
  "count": 5
}
```

---

### 3. Mark as Read

<div class="endpoint-card">

**PATCH** `/notifications/:id/read`

Mark a notification as read.

</div>

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439050",
  "isRead": true,
  "updatedAt": "2024-11-06T00:00:00.000Z"
}
```

---

### 4. Mark All as Read

<div class="endpoint-card">

**PATCH** `/notifications/read-all`

Mark all notifications as read.

</div>

**Response:** `200 OK`

```json
{
  "message": "All notifications marked as read",
  "count": 5
}
```

---

### 5. Delete Notification

<div class="endpoint-card">

**DELETE** `/notifications/:id`

Delete a specific notification.

</div>

**Response:** `200 OK`

```json
{
  "message": "Notification deleted successfully"
}
```

---

### 6. Delete All Notifications

<div class="endpoint-card">

**DELETE** `/notifications`

Delete all notifications for current user.

</div>

**Response:** `200 OK`

```json
{
  "message": "All notifications deleted",
  "count": 15
}
```

---

## Notification Types

### FRIEND_REQUEST

```json
{
  "type": "FRIEND_REQUEST",
  "title": "New Friend Request",
  "message": "John Doe sent you a friend request",
  "data": {
    "requestId": "507f1f77bcf86cd799439020",
    "userId": "507f1f77bcf86cd799439012",
    "userName": "John Doe",
    "userAvatar": "https://example.com/avatars/john.jpg"
  }
}
```

### FRIEND_ACCEPTED

```json
{
  "type": "FRIEND_ACCEPTED",
  "title": "Friend Request Accepted",
  "message": "Jane Doe accepted your friend request",
  "data": {
    "userId": "507f1f77bcf86cd799439013",
    "userName": "Jane Doe"
  }
}
```

### TRANSACTION_REQUEST

```json
{
  "type": "TRANSACTION_REQUEST",
  "title": "New Transaction",
  "message": "Bob Smith lent you $500",
  "data": {
    "transactionId": "507f1f77bcf86cd799439040",
    "userId": "507f1f77bcf86cd799439014",
    "amount": 500.00,
    "type": "BORROWED"
  }
}
```

### TRANSACTION_VERIFIED

```json
{
  "type": "TRANSACTION_VERIFIED",
  "title": "Transaction Verified",
  "message": "Your transaction of $500 has been verified",
  "data": {
    "transactionId": "507f1f77bcf86cd799439040",
    "amount": 500.00
  }
}
```

### PAYMENT_REMINDER

```json
{
  "type": "PAYMENT_REMINDER",
  "title": "Payment Reminder",
  "message": "You owe Alice Johnson $300",
  "data": {
    "userId": "507f1f77bcf86cd799439015",
    "amount": 300.00
  }
}
```

### SYSTEM

```json
{
  "type": "SYSTEM",
  "title": "System Update",
  "message": "New features available!",
  "data": {
    "version": "1.2.0",
    "features": ["Dark mode", "Export data"]
  }
}
```

---

## Helper Methods

### Create Friend Request Notification

```typescript
async createFriendRequestNotification(
  recipientId: string,
  senderId: string,
  senderName: string
) {
  const notification = this.notificationRepository.create({
    recipient: new ObjectId(recipientId),
    type: 'FRIEND_REQUEST',
    title: 'New Friend Request',
    message: `${senderName} sent you a friend request`,
    data: {
      userId: senderId,
      userName: senderName
    }
  });
  
  await this.notificationRepository.save(notification);
  
  // Push via WebSocket
  this.notificationEventsService.pushNotification(
    recipientId,
    notification
  );
  
  return notification;
}
```

### Create Transaction Notification

```typescript
async createTransactionNotification(
  recipientId: string,
  transaction: Transaction,
  senderName: string
) {
  const typeText = transaction.type === 'LENT' ? 'lent you' : 'borrowed from you';
  
  const notification = this.notificationRepository.create({
    recipient: new ObjectId(recipientId),
    type: 'TRANSACTION_REQUEST',
    title: 'New Transaction',
    message: `${senderName} ${typeText} $${transaction.amount}`,
    data: {
      transactionId: transaction._id,
      userId: transaction.from,
      amount: transaction.amount,
      type: transaction.type
    }
  });
  
  await this.notificationRepository.save(notification);
  this.notificationEventsService.pushNotification(recipientId, notification);
  
  return notification;
}
```

---

## WebSocket Integration

### Notification Events Service

```typescript
@Injectable()
export class NotificationEventsService {
  constructor(
    @InjectGateway() private readonly gateway: RealtimeGateway
  ) {}
  
  pushNotification(userId: string, notification: Notification) {
    this.gateway.server
      .to(`user:${userId}`)
      .emit('notification.new', {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt
      });
  }
  
  updateUnreadCount(userId: string, count: number) {
    this.gateway.server
      .to(`user:${userId}`)
      .emit('notification.unreadCount', { count });
  }
}
```

### Client-Side Handling

```typescript
socket.on('notification.new', (notification) => {
  // Show toast/banner
  showNotification(notification);
  
  // Update notification list
  addToNotificationList(notification);
  
  // Play sound
  playNotificationSound();
});

socket.on('notification.unreadCount', ({ count }) => {
  updateBadgeCount(count);
});
```

---

## Data Validation

```typescript
import { z } from 'zod';

export const CreateNotificationSchema = z.object({
  recipient: z.string()
    .regex(/^[0-9a-fA-F]{24}$/),
  
  type: z.enum([
    'FRIEND_REQUEST',
    'FRIEND_ACCEPTED',
    'TRANSACTION_REQUEST',
    'TRANSACTION_VERIFIED',
    'PAYMENT_REMINDER',
    'SYSTEM'
  ]),
  
  title: z.string()
    .min(1)
    .max(100),
  
  message: z.string()
    .min(1)
    .max(500),
  
  data: z.any().optional()
});
```

---

## Performance Optimization

### Indexing

```typescript
@Entity('notifications')
@Index(['recipient', 'createdAt'])
@Index(['recipient', 'isRead'])
@Index(['recipient', 'type'])
export class Notification {
  // ...
}
```

### Pagination

```typescript
async getNotifications(
  userId: string,
  filters: NotificationFilters,
  limit: number = 20,
  offset: number = 0
) {
  const query: any = { recipient: new ObjectId(userId) };
  
  if (filters.type) query.type = filters.type;
  if (filters.isRead !== undefined) query.isRead = filters.isRead;
  
  const [notifications, total] = await this.notificationRepository.findAndCount({
    where: query,
    order: { createdAt: 'DESC' },
    take: limit,
    skip: offset
  });
  
  const unreadCount = await this.notificationRepository.count({
    where: { recipient: new ObjectId(userId), isRead: false }
  });
  
  return { notifications, total, unreadCount };
}
```

---

## Best Practices

### Notification Cleanup

```typescript
// Delete old read notifications (run as cron job)
async cleanupOldNotifications() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await this.notificationRepository.delete({
    isRead: true,
    createdAt: { $lt: thirtyDaysAgo }
  });
}
```

### Batch Operations

```typescript
// ✅ Good: Bulk update
async markAllAsRead(userId: string) {
  const result = await this.notificationRepository.update(
    { recipient: new ObjectId(userId), isRead: false },
    { isRead: true }
  );
  
  this.notificationEventsService.updateUnreadCount(userId, 0);
  
  return result.affected;
}
```

---

## Related Modules

- [Auth Module](./auth.md) - User authentication
- [Friend Module](./friend.md) - Friend request notifications
- [Transaction Module](./transaction.md) - Transaction notifications
- [Realtime Module](./realtime.md) - WebSocket delivery

---

**Last Updated:** November 6, 2025  
**Maintained By:** Celestial
