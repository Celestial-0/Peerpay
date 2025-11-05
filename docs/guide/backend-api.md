# Backend API

## Overview

The Peerpay Ledger Backend API is a robust, scalable RESTful API built with **NestJS**, **MongoDB**, and **WebSocket** technology. It provides comprehensive endpoints for authentication, user management, friend connections, transactions, and real-time notifications.

For detailed API documentation, see the [Backend Overview](/backend/overview).

## Quick Links

- [Backend Overview](/backend/overview) - Complete backend documentation
- [Authentication](/backend/auth) - Auth endpoints and JWT handling
- [User Management](/backend/user) - User profile and ledger APIs
- [Friend System](/backend/friend) - Friend request and management
- [Transactions](/backend/transaction) - Transaction creation and tracking
- [Notifications](/backend/notification) - Notification system
- [Real-time](/backend/realtime) - WebSocket events
- [Environment Setup](/backend/environment) - Configuration guide

## Key Features

### 🔐 Authentication
- JWT-based auth with access & refresh tokens
- Token versioning for forced logout
- Secure password hashing with bcrypt
- 5 authentication endpoints

### 👤 User Management
- Profile CRUD operations
- Ledger balance tracking
- User search functionality
- 5 user management endpoints

### 👥 Friend System
- Send, accept, reject friend requests
- Bidirectional friendship tracking
- Real-time friend status
- 7 friend management endpoints

### 💰 Transactions
- Two-phase transaction system
- LENT/BORROWED tracking
- Automatic balance updates
- 6 transaction endpoints

### 🔔 Notifications
- Multiple notification types
- Real-time WebSocket delivery
- Read/unread tracking
- 6 notification endpoints

### ⚡ Real-time
- WebSocket communication via Socket.IO
- JWT-authenticated connections
- Multi-device support
- 10+ real-time events

## API Statistics

- **Total REST Endpoints:** 29+
- **WebSocket Events:** 10+
- **Database Collections:** 5
- **Test Coverage:** 85%+

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 11.x | Backend framework |
| **MongoDB** | 6.x | NoSQL database |
| **TypeORM** | 0.3.x | ORM |
| **Socket.IO** | Latest | WebSocket |
| **JWT** | Latest | Authentication |
| **Zod** | 4.x | Validation |
| **Bcrypt** | 6.x | Password hashing |

## Getting Started

### Installation

```bash
cd backend
pnpm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your settings
```

### Run Development Server

```bash
pnpm run start:dev
```

### Run Tests

```bash
pnpm run test
pnpm run test:e2e
```

## API Endpoints Overview

### Authentication (5 endpoints)
```
POST   /auth/signup          - Create new account
POST   /auth/signin          - Login to account
POST   /auth/refresh         - Refresh access token
POST   /auth/signout         - Logout from current device
POST   /auth/invalidate      - Logout from all devices
```

### User (5 endpoints)
```
GET    /user/profile         - Get current user profile
PATCH  /user/profile         - Update user profile
DELETE /user/profile         - Delete user account
GET    /user/search          - Search for users
GET    /user/ledger          - Get ledger balance
```

### Friend (7 endpoints)
```
POST   /friend/request       - Send friend request
POST   /friend/accept/:id    - Accept friend request
POST   /friend/reject/:id    - Reject friend request
DELETE /friend/cancel/:id    - Cancel sent request
GET    /friend/list          - Get friends list
GET    /friend/requests      - Get pending requests
DELETE /friend/remove/:id    - Remove friend
```

### Transaction (6 endpoints)
```
POST   /transaction          - Create transaction
GET    /transaction          - List transactions
GET    /transaction/:id      - Get transaction details
POST   /transaction/accept/:id - Accept transaction
POST   /transaction/reject/:id - Reject transaction
DELETE /transaction/:id      - Delete transaction
```

### Notification (6 endpoints)
```
GET    /notification         - List notifications
PATCH  /notification/:id/read - Mark as read
PATCH  /notification/read-all - Mark all as read
DELETE /notification/:id     - Delete notification
GET    /notification/unread  - Get unread count
```

## WebSocket Events

### Client → Server
```
connect               - Connect to WebSocket
disconnect            - Disconnect from WebSocket
authenticate          - Authenticate connection
```

### Server → Client
```
friend:request        - New friend request
friend:accepted       - Friend request accepted
friend:online         - Friend came online
friend:offline        - Friend went offline
transaction:created   - New transaction
transaction:accepted  - Transaction accepted
transaction:rejected  - Transaction rejected
notification:new      - New notification
```

## Authentication Flow

```
1. Signup/Signin → Receive access + refresh tokens
2. Store tokens securely
3. Include access token in Authorization header
4. Refresh token when access token expires
5. Signout to invalidate tokens
```

## Security Features

- ✅ JWT access tokens (15 min expiry)
- ✅ JWT refresh tokens (7 day expiry)
- ✅ Token versioning
- ✅ Bcrypt password hashing
- ✅ Global JWT guard
- ✅ Input validation with Zod
- ✅ CORS configuration

## Database Schema

### Collections
- **users** - User profiles and auth data
- **friend_requests** - Friend request tracking
- **friendships** - Bidirectional friendships
- **transactions** - Money lending/borrowing
- **notifications** - User notifications

For detailed schemas, see [Backend Overview](/backend/overview).

## Error Handling

All API errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Rate Limiting

- **Default:** 100 requests per 15 minutes
- **Auth endpoints:** 10 requests per 15 minutes
- **WebSocket:** 1000 events per minute

## Next Steps

- [Environment Setup](/backend/environment) - Configure your environment
- [Authentication Module](/backend/auth) - Learn about auth
- [Quick Start](/backend/quick-start) - Get started quickly
- [Testing Guide](/backend/testing) - Write and run tests

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Socket.IO Documentation](https://socket.io/docs)
- [GitHub Repository](https://github.com/Celestial-0/Peerpay)

---

For detailed API documentation, visit the [Backend Overview](/backend/overview).
