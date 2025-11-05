<link rel="stylesheet" href="styles.css">

# 👥 Friend Module

**Version:** 0.0.1  
**Status:** <span class="badge badge-status">Production Ready</span>

---

## Overview

The Friend Module manages friend requests, friendships, and social connections between users. It provides a complete friend request system with real-time WebSocket notifications and bidirectional friendship tracking.

### Key Features

- ✅ **Friend Request System** - Send, accept, reject, cancel requests
- ✅ **Bidirectional Friendships** - Automatic two-way friend connections
- ✅ **Duplicate Prevention** - Validates existing requests and friendships
- ✅ **Status Tracking** - Pending, accepted, rejected states
- ✅ **Real-time Updates** - WebSocket integration for instant notifications
- ✅ **Request Management** - View incoming and outgoing requests
- ✅ **Friendship Operations** - Add, remove, list friends

---

## Architecture

### Module Structure

```
src/friend/
├── friend.module.ts              # Module definition
├── friend.controller.ts          # HTTP endpoints
├── friend.service.ts             # Business logic
├── entities/
│   ├── friend-request.entity.ts  # Friend request entity
│   └── friendship.entity.ts      # Friendship entity
└── dto/
    ├── send-request.dto.ts
    └── handle-request.dto.ts
```

### Entity Schemas

#### FriendRequest Entity

```typescript
@Entity('friend_requests')
export class FriendRequest {
  @ObjectIdColumn()
  _id: ObjectId;
  
  @Column()
  from: ObjectId;  // User who sent the request
  
  @Column()
  to: ObjectId;    // User who received the request
  
  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  })
  status: 'pending' | 'accepted' | 'rejected';
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### Friendship Entity

```typescript
@Entity('friendships')
export class Friendship {
  @ObjectIdColumn()
  _id: ObjectId;
  
  @Column()
  user: ObjectId;    // First user
  
  @Column()
  friend: ObjectId;  // Second user
  
  @CreateDateColumn()
  createdAt: Date;
}
```

---

## API Endpoints

### 1. Send Friend Request

<div class="endpoint-card">

**POST** `/friend/request`

Send a friend request to another user.

</div>

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "recipientId": "507f1f77bcf86cd799439012"
}
```

**Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439020",
  "from": "507f1f77bcf86cd799439011",
  "to": "507f1f77bcf86cd799439012",
  "status": "pending",
  "createdAt": "2024-11-06T00:00:00.000Z"
}
```

**Validation:**
- Cannot send request to yourself
- Cannot send duplicate requests
- Cannot send request to existing friends
- Recipient must exist

**WebSocket Event Emitted:**

```typescript
// To recipient
socket.to(recipientId).emit('friend.requested', {
  requestId: request._id,
  from: {
    id: currentUser._id,
    name: currentUser.name,
    avatar: currentUser.avatar
  },
  createdAt: request.createdAt
});
```

**Error Responses:**

- `400 Bad Request` - Invalid recipient or duplicate request
- `404 Not Found` - Recipient not found
- `409 Conflict` - Already friends

---

### 2. Handle Friend Request

<div class="endpoint-card">

**POST** `/friend/request/:id/handle`

Accept or reject a friend request.

</div>

**Headers:**

```
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Friend request ID |

**Request Body:**

```json
{
  "action": "accept"
}
```

**Actions:** `accept` | `reject`

**Response (Accept):** `200 OK`

```json
{
  "message": "Friend request accepted",
  "friendship": {
    "id": "507f1f77bcf86cd799439030",
    "user": "507f1f77bcf86cd799439011",
    "friend": "507f1f77bcf86cd799439012",
    "createdAt": "2024-11-06T00:00:00.000Z"
  }
}
```

**Response (Reject):** `200 OK`

```json
{
  "message": "Friend request rejected"
}
```

**Behavior (Accept):**
1. Updates request status to `accepted`
2. Creates bidirectional friendship records
3. Adds friend IDs to both users' `friends` arrays
4. Emits WebSocket event to requester

**Behavior (Reject):**
1. Updates request status to `rejected`
2. Emits WebSocket event to requester

**WebSocket Events Emitted:**

```typescript
// On accept
socket.to(requesterId).emit('friend.accepted', {
  friendId: currentUser._id,
  friend: {
    id: currentUser._id,
    name: currentUser.name,
    avatar: currentUser.avatar
  }
});

// On reject
socket.to(requesterId).emit('friend.rejected', {
  userId: currentUser._id
});
```

**Error Responses:**

- `400 Bad Request` - Invalid action
- `403 Forbidden` - Not the request recipient
- `404 Not Found` - Request not found

---

### 3. Cancel Friend Request

<div class="endpoint-card">

**DELETE** `/friend/request/:id`

Cancel a pending friend request you sent.

</div>

**Headers:**

```
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Friend request ID |

**Response:** `200 OK`

```json
{
  "message": "Friend request cancelled"
}
```

**Validation:**
- Must be the request sender
- Request must be pending

**WebSocket Event Emitted:**

```typescript
socket.to(recipientId).emit('friend.requestCancelled', {
  requestId: request._id,
  fromUserId: currentUser._id
});
```

**Error Responses:**

- `403 Forbidden` - Not the request sender
- `404 Not Found` - Request not found
- `400 Bad Request` - Request not pending

---

### 4. Get Friends List

<div class="endpoint-card">

**GET** `/friend/list`

Get all friends of the current user.

</div>

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `onlineOnly` | boolean | ❌ | Filter to only online friends |
| `limit` | number | ❌ | Max results (default: 50) |
| `offset` | number | ❌ | Pagination offset (default: 0) |

**Example Request:**

```
GET /friend/list?onlineOnly=true&limit=20
```

**Response:** `200 OK`

```json
{
  "friends": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatar": "https://example.com/avatars/jane.jpg",
      "isOnline": true,
      "friendsSince": "2024-01-15T00:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "Bob Smith",
      "email": "bob@example.com",
      "avatar": "https://example.com/avatars/bob.jpg",
      "isOnline": true,
      "friendsSince": "2024-02-20T00:00:00.000Z"
    }
  ],
  "total": 2,
  "limit": 20,
  "offset": 0
}
```

---

### 5. Get Incoming Friend Requests

<div class="endpoint-card">

**GET** `/friend/requests/incoming`

Get all pending friend requests received.

</div>

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "requests": [
    {
      "id": "507f1f77bcf86cd799439020",
      "from": {
        "id": "507f1f77bcf86cd799439014",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "avatar": "https://example.com/avatars/alice.jpg"
      },
      "status": "pending",
      "createdAt": "2024-11-05T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 6. Get Outgoing Friend Requests

<div class="endpoint-card">

**GET** `/friend/requests/outgoing`

Get all pending friend requests sent.

</div>

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "requests": [
    {
      "id": "507f1f77bcf86cd799439021",
      "to": {
        "id": "507f1f77bcf86cd799439015",
        "name": "Charlie Brown",
        "email": "charlie@example.com",
        "avatar": "https://example.com/avatars/charlie.jpg"
      },
      "status": "pending",
      "createdAt": "2024-11-04T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 7. Remove Friend

<div class="endpoint-card">

**DELETE** `/friend/:friendId`

Remove a friend (unfriend).

</div>

**Headers:**

```
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `friendId` | string | ID of friend to remove |

**Response:** `200 OK`

```json
{
  "message": "Friend removed successfully"
}
```

**Behavior:**
1. Deletes bidirectional friendship records
2. Removes friend IDs from both users' `friends` arrays
3. Emits WebSocket event to ex-friend

**WebSocket Event Emitted:**

```typescript
socket.to(friendId).emit('friend.removed', {
  userId: currentUser._id
});
```

**Error Responses:**

- `404 Not Found` - Friendship not found
- `400 Bad Request` - Not friends

---

## Business Logic

### Duplicate Request Prevention

```typescript
async sendFriendRequest(fromUserId: string, toUserId: string) {
  // Check if already friends
  const existingFriendship = await this.friendshipRepository.findOne({
    where: {
      $or: [
        { user: new ObjectId(fromUserId), friend: new ObjectId(toUserId) },
        { user: new ObjectId(toUserId), friend: new ObjectId(fromUserId) }
      ]
    }
  });
  
  if (existingFriendship) {
    throw new ConflictException('Already friends');
  }
  
  // Check for existing pending request
  const existingRequest = await this.friendRequestRepository.findOne({
    where: {
      from: new ObjectId(fromUserId),
      to: new ObjectId(toUserId),
      status: 'pending'
    }
  });
  
  if (existingRequest) {
    throw new ConflictException('Friend request already sent');
  }
  
  // Create new request
  const request = this.friendRequestRepository.create({
    from: new ObjectId(fromUserId),
    to: new ObjectId(toUserId),
    status: 'pending'
  });
  
  await this.friendRequestRepository.save(request);
  
  // Emit WebSocket event
  this.friendEventsService.emitFriendRequested(toUserId, request);
  
  return request;
}
```

### Bidirectional Friendship Creation

```typescript
async acceptFriendRequest(requestId: string, userId: string) {
  const request = await this.friendRequestRepository.findOne({
    where: { _id: new ObjectId(requestId) }
  });
  
  if (!request) {
    throw new NotFoundException('Friend request not found');
  }
  
  if (request.to.toString() !== userId) {
    throw new ForbiddenException('Not authorized');
  }
  
  // Start transaction
  const session = await this.connection.startSession();
  session.startTransaction();
  
  try {
    // Update request status
    request.status = 'accepted';
    await this.friendRequestRepository.save(request);
    
    // Create bidirectional friendships
    const friendship1 = this.friendshipRepository.create({
      user: request.from,
      friend: request.to
    });
    
    const friendship2 = this.friendshipRepository.create({
      user: request.to,
      friend: request.from
    });
    
    await this.friendshipRepository.save([friendship1, friendship2]);
    
    // Update users' friends arrays
    await this.userService.addFriend(
      request.from.toString(),
      request.to.toString()
    );
    
    await this.userService.addFriend(
      request.to.toString(),
      request.from.toString()
    );
    
    await session.commitTransaction();
    
    // Emit WebSocket event
    this.friendEventsService.emitFriendAccepted(
      request.from.toString(),
      userId
    );
    
    return friendship1;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### Friendship Removal

```typescript
async removeFriend(userId: string, friendId: string) {
  // Start transaction
  const session = await this.connection.startSession();
  session.startTransaction();
  
  try {
    // Delete bidirectional friendships
    await this.friendshipRepository.delete({
      $or: [
        { user: new ObjectId(userId), friend: new ObjectId(friendId) },
        { user: new ObjectId(friendId), friend: new ObjectId(userId) }
      ]
    });
    
    // Update users' friends arrays
    await this.userService.removeFriend(userId, friendId);
    await this.userService.removeFriend(friendId, userId);
    
    await session.commitTransaction();
    
    // Emit WebSocket event
    this.friendEventsService.emitFriendRemoved(friendId, userId);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## WebSocket Integration

### Friend Events Service

```typescript
@Injectable()
export class FriendEventsService {
  constructor(
    @InjectGateway() private readonly gateway: RealtimeGateway
  ) {}
  
  emitFriendRequested(recipientId: string, request: FriendRequest) {
    this.gateway.server
      .to(`user:${recipientId}`)
      .emit('friend.requested', {
        requestId: request._id,
        from: request.from,
        createdAt: request.createdAt
      });
  }
  
  emitFriendAccepted(requesterId: string, accepterId: string) {
    this.gateway.server
      .to(`user:${requesterId}`)
      .emit('friend.accepted', {
        friendId: accepterId
      });
  }
  
  emitFriendRejected(requesterId: string, rejecterId: string) {
    this.gateway.server
      .to(`user:${requesterId}`)
      .emit('friend.rejected', {
        userId: rejecterId
      });
  }
  
  emitRequestCancelled(recipientId: string, requestId: string) {
    this.gateway.server
      .to(`user:${recipientId}`)
      .emit('friend.requestCancelled', {
        requestId
      });
  }
  
  emitFriendRemoved(friendId: string, userId: string) {
    this.gateway.server
      .to(`user:${friendId}`)
      .emit('friend.removed', {
        userId
      });
  }
}
```

### Client-Side Event Handling

```typescript
// Listen for friend events
socket.on('friend.requested', (data) => {
  console.log('New friend request from:', data.from);
  // Update UI to show new request
  updateFriendRequests();
});

socket.on('friend.accepted', (data) => {
  console.log('Friend request accepted by:', data.friendId);
  // Add to friends list
  addToFriendsList(data.friendId);
});

socket.on('friend.rejected', (data) => {
  console.log('Friend request rejected by:', data.userId);
  // Remove from pending requests
  removeFromPendingRequests(data.userId);
});

socket.on('friend.removed', (data) => {
  console.log('Removed as friend by:', data.userId);
  // Remove from friends list
  removeFromFriendsList(data.userId);
});
```

---

## Data Validation

### Send Request DTO

```typescript
import { z } from 'zod';

export const SendRequestSchema = z.object({
  recipientId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
});

export type SendRequestDto = z.infer<typeof SendRequestSchema>;
```

### Handle Request DTO

```typescript
import { z } from 'zod';

export const HandleRequestSchema = z.object({
  action: z.enum(['accept', 'reject'])
});

export type HandleRequestDto = z.infer<typeof HandleRequestSchema>;
```

---

## Performance Optimization

### Indexing Strategy

```typescript
@Entity('friend_requests')
@Index(['from', 'to'], { unique: true })
@Index(['to', 'status'])
@Index(['from', 'status'])
export class FriendRequest {
  // ...
}

@Entity('friendships')
@Index(['user', 'friend'], { unique: true })
@Index(['user'])
@Index(['friend'])
export class Friendship {
  // ...
}
```

**Recommended Indexes:**

| Entity | Fields | Type | Reason |
|--------|--------|------|--------|
| FriendRequest | `[from, to]` | Unique | Prevent duplicates |
| FriendRequest | `[to, status]` | Regular | Incoming requests query |
| FriendRequest | `[from, status]` | Regular | Outgoing requests query |
| Friendship | `[user, friend]` | Unique | Prevent duplicates |
| Friendship | `[user]` | Regular | Friends list query |

### Query Optimization

```typescript
// Efficient friends list query
async getFriendsList(userId: string, onlineOnly: boolean) {
  const friendships = await this.friendshipRepository.find({
    where: { user: new ObjectId(userId) },
    select: ['friend', 'createdAt']
  });
  
  const friendIds = friendships.map(f => f.friend);
  
  let friends = await this.userRepository.find({
    where: { _id: { $in: friendIds } },
    select: ['_id', 'name', 'email', 'avatar']
  });
  
  if (onlineOnly) {
    const onlineIds = await this.realtimeService.getOnlineUsers();
    friends = friends.filter(f => onlineIds.includes(f._id.toString()));
  }
  
  return friends.map(friend => ({
    ...friend,
    friendsSince: friendships.find(
      f => f.friend.toString() === friend._id.toString()
    ).createdAt
  }));
}
```

---

## Testing

### Unit Tests

```typescript
describe('FriendService', () => {
  it('should prevent duplicate friend requests', async () => {
    await service.sendFriendRequest(user1Id, user2Id);
    
    await expect(
      service.sendFriendRequest(user1Id, user2Id)
    ).rejects.toThrow(ConflictException);
  });
  
  it('should create bidirectional friendships on accept', async () => {
    const request = await service.sendFriendRequest(user1Id, user2Id);
    await service.acceptFriendRequest(request._id.toString(), user2Id);
    
    const friendship1 = await friendshipRepository.findOne({
      where: { user: new ObjectId(user1Id), friend: new ObjectId(user2Id) }
    });
    
    const friendship2 = await friendshipRepository.findOne({
      where: { user: new ObjectId(user2Id), friend: new ObjectId(user1Id) }
    });
    
    expect(friendship1).toBeDefined();
    expect(friendship2).toBeDefined();
  });
  
  it('should remove bidirectional friendships', async () => {
    await service.removeFriend(user1Id, user2Id);
    
    const count = await friendshipRepository.count({
      where: {
        $or: [
          { user: new ObjectId(user1Id), friend: new ObjectId(user2Id) },
          { user: new ObjectId(user2Id), friend: new ObjectId(user1Id) }
        ]
      }
    });
    
    expect(count).toBe(0);
  });
});
```

---

## Error Handling

### Common Error Codes

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| `400` | `CANNOT_FRIEND_SELF` | Trying to friend yourself | Choose different user |
| `400` | `REQUEST_NOT_PENDING` | Request already handled | Check request status |
| `403` | `NOT_AUTHORIZED` | Not request recipient/sender | Verify permissions |
| `404` | `REQUEST_NOT_FOUND` | Invalid request ID | Check request exists |
| `409` | `ALREADY_FRIENDS` | Already friends with user | No action needed |
| `409` | `REQUEST_EXISTS` | Duplicate request | Wait for response |

---

## Best Practices

### Request Validation

```typescript
// ✅ Good: Comprehensive validation
async sendFriendRequest(fromId: string, toId: string) {
  if (fromId === toId) {
    throw new BadRequestException('Cannot friend yourself');
  }
  
  const recipient = await this.userService.findById(toId);
  if (!recipient) {
    throw new NotFoundException('User not found');
  }
  
  // Check existing friendship and requests
  // ...
}

// ❌ Bad: No validation
async sendFriendRequest(fromId: string, toId: string) {
  return this.friendRequestRepository.save({ from: fromId, to: toId });
}
```

### Transaction Usage

```typescript
// ✅ Good: Use transactions for multi-step operations
async acceptFriendRequest(requestId: string) {
  const session = await this.connection.startSession();
  session.startTransaction();
  try {
    // Multiple operations
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## Related Modules

- [User Module](./user.md) - User data and friends arrays
- [Notification Module](./notification.md) - Friend request notifications
- [Realtime Module](./realtime.md) - Real-time friend events

---

**Last Updated:** November 6, 2025  
**Maintained By:** Celestial
