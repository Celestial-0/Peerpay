
# 🔌 Realtime Module (WebSocket)

**Version:** 0.0.1  

---

## Overview

The Realtime Module provides WebSocket-based real-time communication with JWT authentication, multi-device support, online status tracking, and event broadcasting.

### Key Features

- ✅ **JWT Authentication** - Secure WebSocket connections
- ✅ **Multi-Device Support** - Multiple connections per user
- ✅ **Online Status Tracking** - Real-time presence system
- ✅ **User Rooms** - Targeted message delivery
- ✅ **Event Broadcasting** - Friend, transaction, notification events
- ✅ **Connection Management** - Automatic cleanup and reconnection
- ✅ **Type-Safe Events** - Strongly typed event definitions

---

## Architecture

### Module Structure

```
src/realtime/
├── realtime.module.ts           # Module definition
├── realtime.gateway.ts          # WebSocket gateway
├── services/
│   ├── friend-events.service.ts
│   ├── transaction-events.service.ts
│   └── notification-events.service.ts
└── guards/
    └── ws-jwt.guard.ts          # WebSocket JWT guard
```

### WebSocket Gateway

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  },
  namespace: '/ws'
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private userSockets: Map<string, Set<string>> = new Map();
  
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = await this.jwtService.verify(token);
      
      client.data.userId = payload.sub;
      
      // Join user room
      client.join(`user:${payload.sub}`);
      
      // Track connection
      this.addUserSocket(payload.sub, client.id);
      
      // Notify friends
      this.notifyFriendsOnline(payload.sub);
      
      client.emit('connected', { userId: payload.sub });
    } catch (error) {
      client.disconnect();
    }
  }
  
  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    
    if (userId) {
      this.removeUserSocket(userId, client.id);
      
      // If no more connections, notify friends offline
      if (!this.isUserOnline(userId)) {
        this.notifyFriendsOffline(userId);
      }
    }
  }
}
```

---

## WebSocket Events

### Client → Server Events

#### 1. Get Online Friends

```typescript
socket.emit('friends.getOnline');

// Response
socket.on('friends.onlineList', (data) => {
  console.log(data.friends); // Array of online friend IDs
});
```

#### 2. Get Online Users Count

```typescript
socket.emit('users.getOnlineCount');

// Response
socket.on('users.onlineCount', (data) => {
  console.log(data.count); // Total online users
});
```

#### 3. Check Users Online

```typescript
socket.emit('users.checkOnline', {
  userIds: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013']
});

// Response
socket.on('users.onlineStatus', (data) => {
  console.log(data.statuses); // { userId: boolean }
});
```

#### 4. Ping

```typescript
socket.emit('ping');

// Response
socket.on('pong', (data) => {
  console.log(data.timestamp);
});
```

---

### Server → Client Events

#### Friend Events

##### friend.online

```typescript
socket.on('friend.online', (data) => {
  console.log(`Friend ${data.friendId} is now online`);
  // Update UI to show friend online
});
```

**Payload:**

```json
{
  "friendId": "507f1f77bcf86cd799439012",
  "friend": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Jane Doe",
    "avatar": "https://example.com/avatars/jane.jpg"
  }
}
```

##### friend.offline

```typescript
socket.on('friend.offline', (data) => {
  console.log(`Friend ${data.friendId} went offline`);
  // Update UI to show friend offline
});
```

##### friend.requested

```typescript
socket.on('friend.requested', (data) => {
  console.log('New friend request from:', data.from);
  // Show notification
  // Update friend requests list
});
```

##### friend.accepted

```typescript
socket.on('friend.accepted', (data) => {
  console.log('Friend request accepted:', data.friendId);
  // Add to friends list
  // Show success notification
});
```

##### friend.rejected

```typescript
socket.on('friend.rejected', (data) => {
  console.log('Friend request rejected:', data.userId);
  // Remove from pending requests
});
```

##### friend.removed

```typescript
socket.on('friend.removed', (data) => {
  console.log('Removed as friend by:', data.userId);
  // Remove from friends list
  // Show notification
});
```

##### friend.requestCancelled

```typescript
socket.on('friend.requestCancelled', (data) => {
  console.log('Friend request cancelled:', data.requestId);
  // Remove from incoming requests
});
```

---

#### Transaction Events

##### transaction.created

```typescript
socket.on('transaction.created', (data) => {
  console.log('New transaction:', data);
  // Show notification
  // Update transaction list
  // Update balance
});
```

**Payload:**

```json
{
  "transactionId": "507f1f77bcf86cd799439040",
  "from": "507f1f77bcf86cd799439012",
  "amount": 500.00,
  "type": "LENT",
  "description": "Lunch money"
}
```

##### transaction.updated

```typescript
socket.on('transaction.updated', (data) => {
  console.log('Transaction updated:', data);
  // Update transaction status in UI
});
```

##### transaction.settled

```typescript
socket.on('transaction.settled', (data) => {
  console.log('Transaction settled:', data);
  // Update balance
  // Show notification
});
```

---

#### Notification Events

##### notification.new

```typescript
socket.on('notification.new', (notification) => {
  console.log('New notification:', notification);
  // Show toast/banner
  // Play sound
  // Update notification list
  // Increment badge count
});
```

**Payload:**

```json
{
  "id": "507f1f77bcf86cd799439050",
  "type": "FRIEND_REQUEST",
  "title": "New Friend Request",
  "message": "John Doe sent you a friend request",
  "data": {
    "requestId": "507f1f77bcf86cd799439020",
    "userId": "507f1f77bcf86cd799439012"
  },
  "createdAt": "2024-11-06T00:00:00.000Z"
}
```

##### notification.unreadCount

```typescript
socket.on('notification.unreadCount', (data) => {
  console.log('Unread count:', data.count);
  // Update badge count
});
```

---

## Client Implementation

### Connection Setup

```typescript
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  
  connect(accessToken: string) {
    this.socket = io('http://localhost:3000/ws', {
      auth: {
        token: accessToken
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.socket?.on('connected', (data) => {
      console.log('Connected to WebSocket:', data.userId);
    });
    
    this.socket?.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket?.connect();
      }
    });
    
    this.socket?.on('connect_error', (error) => {
      console.error('Connection error:', error);
      // Handle authentication error
      if (error.message === 'Authentication failed') {
        // Refresh token and reconnect
        this.refreshTokenAndReconnect();
      }
    });
    
    // Friend events
    this.socket?.on('friend.online', this.handleFriendOnline);
    this.socket?.on('friend.offline', this.handleFriendOffline);
    this.socket?.on('friend.requested', this.handleFriendRequested);
    this.socket?.on('friend.accepted', this.handleFriendAccepted);
    
    // Transaction events
    this.socket?.on('transaction.created', this.handleTransactionCreated);
    this.socket?.on('transaction.updated', this.handleTransactionUpdated);
    
    // Notification events
    this.socket?.on('notification.new', this.handleNewNotification);
    this.socket?.on('notification.unreadCount', this.handleUnreadCount);
  }
  
  // Event handlers
  private handleFriendOnline = (data: any) => {
    console.log('Friend online:', data.friendId);
    // Update UI
  };
  
  private handleNewNotification = (notification: any) => {
    // Show toast notification
    this.showToast(notification.title, notification.message);
    
    // Play sound
    this.playNotificationSound();
    
    // Update notification list
    this.updateNotificationList(notification);
  };
  
  // Emit events
  getOnlineFriends() {
    this.socket?.emit('friends.getOnline');
  }
  
  checkUsersOnline(userIds: string[]) {
    this.socket?.emit('users.checkOnline', { userIds });
  }
  
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const wsService = new WebSocketService();
```

### React Integration

```typescript
import { useEffect, useState } from 'react';
import { wsService } from './websocket.service';

function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineFriends, setOnlineFriends] = useState<string[]>([]);
  
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      wsService.connect(token);
    }
    
    // Listen for connection status
    wsService.socket?.on('connected', () => {
      setIsConnected(true);
    });
    
    wsService.socket?.on('disconnect', () => {
      setIsConnected(false);
    });
    
    // Listen for online friends
    wsService.socket?.on('friends.onlineList', (data) => {
      setOnlineFriends(data.friends);
    });
    
    // Cleanup
    return () => {
      wsService.disconnect();
    };
  }, []);
  
  return {
    isConnected,
    onlineFriends,
    getOnlineFriends: () => wsService.getOnlineFriends()
  };
}

export default useWebSocket;
```

---

## Online Status Tracking

### Server-Side Implementation

```typescript
@Injectable()
export class OnlineStatusService {
  private userSockets: Map<string, Set<string>> = new Map();
  
  addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }
  
  removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }
  
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && 
           this.userSockets.get(userId)!.size > 0;
  }
  
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
  
  getOnlineCount(): number {
    return this.userSockets.size;
  }
  
  getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }
}
```

### Notify Friends on Status Change

```typescript
async notifyFriendsOnline(userId: string) {
  const user = await this.userService.findById(userId);
  const friends = user.friends;
  
  for (const friendId of friends) {
    this.server.to(`user:${friendId.toString()}`).emit('friend.online', {
      friendId: userId,
      friend: {
        id: user._id,
        name: user.name,
        avatar: user.avatar
      }
    });
  }
}

async notifyFriendsOffline(userId: string) {
  const user = await this.userService.findById(userId);
  const friends = user.friends;
  
  for (const friendId of friends) {
    this.server.to(`user:${friendId.toString()}`).emit('friend.offline', {
      friendId: userId
    });
  }
}
```

---

## Security

### JWT Authentication

```typescript
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth.token;
    
    if (!token) {
      throw new WsException('Authentication token missing');
    }
    
    try {
      const payload = await this.jwtService.verify(token);
      client.data.userId = payload.sub;
      return true;
    } catch (error) {
      throw new WsException('Invalid authentication token');
    }
  }
}
```

### Rate Limiting

```typescript
@Injectable()
export class WsRateLimitGuard implements CanActivate {
  private requests: Map<string, number[]> = new Map();
  private readonly limit = 100; // requests
  private readonly window = 60000; // 1 minute
  
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const userId = client.data.userId;
    
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove old requests outside window
    const recentRequests = userRequests.filter(
      time => now - time < this.window
    );
    
    if (recentRequests.length >= this.limit) {
      throw new WsException('Rate limit exceeded');
    }
    
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    
    return true;
  }
}
```

---

## Performance Optimization

### Connection Pooling

```typescript
// Use Redis adapter for horizontal scaling
import { RedisIoAdapter } from './redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  
  app.useWebSocketAdapter(redisIoAdapter);
  
  await app.listen(3000);
}
```

### Event Batching

```typescript
// Batch notifications to reduce events
class NotificationBatcher {
  private queue: Map<string, Notification[]> = new Map();
  private timer: NodeJS.Timeout | null = null;
  
  add(userId: string, notification: Notification) {
    if (!this.queue.has(userId)) {
      this.queue.set(userId, []);
    }
    this.queue.get(userId)!.push(notification);
    
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 1000);
    }
  }
  
  private flush() {
    for (const [userId, notifications] of this.queue) {
      this.gateway.server
        .to(`user:${userId}`)
        .emit('notifications.batch', { notifications });
    }
    
    this.queue.clear();
    this.timer = null;
  }
}
```

---

## Error Handling

### Connection Errors

```typescript
socket.on('connect_error', (error) => {
  if (error.message === 'Authentication failed') {
    // Refresh token
    refreshAccessToken().then(newToken => {
      socket.auth.token = newToken;
      socket.connect();
    });
  } else {
    console.error('Connection error:', error);
  }
});
```

### Event Errors

```typescript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Show user-friendly message
  showErrorToast('Connection issue. Retrying...');
});
```

---

## Testing

### WebSocket Testing

```typescript
describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let socket: Socket;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RealtimeGateway, JwtService, UserService]
    }).compile();
    
    gateway = module.get<RealtimeGateway>(RealtimeGateway);
    
    // Create test socket
    socket = io('http://localhost:3000/ws', {
      auth: { token: testToken }
    });
  });
  
  it('should authenticate and connect', (done) => {
    socket.on('connected', (data) => {
      expect(data.userId).toBeDefined();
      done();
    });
  });
  
  it('should emit friend online event', (done) => {
    socket.on('friend.online', (data) => {
      expect(data.friendId).toBe(friendId);
      done();
    });
    
    // Trigger friend connection
    friendSocket.connect();
  });
});
```

---

## Best Practices

### Reconnection Strategy

```typescript
// ✅ Good: Exponential backoff
const socket = io(url, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});
```

### Event Naming

```typescript
// ✅ Good: Namespaced events
socket.on('friend.online', handler);
socket.on('transaction.created', handler);

// ❌ Bad: Generic events
socket.on('online', handler);
socket.on('created', handler);
```

### Memory Management

```typescript
// ✅ Good: Clean up listeners
useEffect(() => {
  socket.on('friend.online', handleFriendOnline);
  
  return () => {
    socket.off('friend.online', handleFriendOnline);
  };
}, []);
```

---

## Related Modules

- [Auth Module](./auth.md) - JWT authentication
- [Friend Module](./friend.md) - Friend events
- [Transaction Module](./transaction.md) - Transaction events
- [Notification Module](./notification.md) - Notification delivery

---

**Last Updated:** November 6, 2025  
**Maintained By:** Celestial
