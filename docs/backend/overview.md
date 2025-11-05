# Backend Overview

## Introduction

The Peerpay Ledger Backend is a robust, scalable peer-to-peer money lending and borrowing platform built with NestJS, MongoDB, and WebSocket technology. It provides a complete API for managing users, friendships, transactions, and real-time notifications.

## Vision

**Simplifying peer-to-peer financial relationships through transparent tracking and effortless settlements.**

Peerpay Ledger empowers friends to lend and borrow money with confidence, eliminating awkward conversations and forgotten debts through real-time tracking, smart settlements, and a two-phase approval system that ensures mutual agreement on every transaction.

## Key Features

### 🔐 Authentication & Security
- JWT-based authentication with access & refresh tokens
- Token versioning for forced logout from all devices
- Bcrypt password hashing (10 salt rounds)
- Global JWT guard on all routes
- Public route decorator for exceptions

### 👤 User Management
- Profile CRUD operations
- Ledger balance tracking (totalLent, totalBorrowed, netBalance)
- User search with online status
- Password security
- Account deletion

### 👥 Friend System
- Send/accept/reject friend requests
- Cancel pending requests
- Remove friends
- View friends list with online status
- Real-time friend events

### 💰 Transaction Management
- Two-phase transaction system (create → accept)
- LENT/BORROWED transaction types
- Atomic database operations
- Automatic balance synchronization
- Transaction history with filters
- Settlement system

### 🔔 Notifications
- Multiple notification types
- Real-time WebSocket delivery
- Read/unread status tracking
- Bulk operations
- Pagination support

### 🔌 Real-time Communication
- WebSocket-based communication via Socket.IO
- JWT-authenticated WebSocket connections
- Multi-device support
- Online/offline status tracking
- Friend, transaction, and notification events

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 11.x | Backend framework with TypeScript |
| **MongoDB** | 6.x | NoSQL database |
| **TypeORM** | 0.3.x | Object-relational mapping |
| **Socket.IO** | Latest | WebSocket communication |
| **Passport** | Latest | Authentication middleware |
| **JWT** | Latest | JSON Web Tokens |
| **Zod** | 4.x | Runtime type validation |
| **Bcrypt** | 6.x | Password hashing |

## Module Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      App Module                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │   Auth   │  │   User   │  │  Friend  │            │
│  │  Module  │  │  Module  │  │  Module  │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │              │                   │
│  ┌────▼─────────────▼──────────────▼─────┐            │
│  │         Common Module                  │            │
│  │  (Guards, Utils, Constants)            │            │
│  └────────────────────────────────────────┘            │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ Transaction  │  │ Notification │                   │
│  │   Module     │  │   Module     │                   │
│  └──────┬───────┘  └──────┬───────┘                   │
│         │                  │                           │
│         └──────────┬───────┘                           │
│                    │                                   │
│         ┌──────────▼───────────┐                       │
│         │   Realtime Module    │                       │
│         │   (WebSocket)        │                       │
│         └──────────────────────┘                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. [Authentication Module](/backend/auth)
JWT-based authentication with access and refresh tokens, token versioning, and forced logout capabilities.

**Endpoints:** 5
- Signup, signin, refresh, signout, invalidate

### 2. [User Module](/backend/user)
User profile management, ledger balance tracking, and user search functionality.

**Endpoints:** 5
- Profile, update, delete, search, ledger

### 3. [Friend Module](/backend/friend)
Complete friend request system with bidirectional friendship tracking and real-time notifications.

**Endpoints:** 7
- Send request, accept, reject, cancel, list friends, list requests, remove friend

### 4. [Transaction Module](/backend/transaction)
Peer-to-peer transaction management with atomic operations and automatic balance updates.

**Endpoints:** 6
- Create, list, get by ID, accept, reject, delete

### 5. [Notification Module](/backend/notification)
Comprehensive notification system with real-time delivery and read/unread tracking.

**Endpoints:** 6
- List, mark as read, mark all read, delete, get unread count

### 6. [Realtime Module](/backend/realtime)
WebSocket-based real-time communication with JWT authentication and multi-device support.

**Events:** 10+
- Friend events, transaction events, notification events

### 7. [Common Module](/backend/common)
Shared utilities, constants, type helpers, and global configurations.

## API Statistics

- **Total REST Endpoints:** 29+
- **WebSocket Events:** 10+
- **Database Collections:** 5
- **Test Coverage:** 85%+

## Database Schema

### Collections

#### users
Stores user profiles, authentication data, and ledger balances.

```typescript
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed),
  name: string,
  avatar?: string,
  phone?: string,
  friends: ObjectId[],
  pendingRequests: ObjectId[],
  totalLent: number,
  totalBorrowed: number,
  netBalance: number,
  tokenVersion: number,
  refreshTokenHash?: string,
  lastLogin?: Date,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### friend_requests
Tracks friend request status.

```typescript
{
  _id: ObjectId,
  from: ObjectId,
  to: ObjectId,
  status: 'pending' | 'accepted' | 'rejected',
  createdAt: Date,
  updatedAt: Date
}
```

#### friendships
Bidirectional friendship records.

```typescript
{
  _id: ObjectId,
  user: ObjectId,
  friend: ObjectId,
  createdAt: Date
}
```

#### transactions
Money lending/borrowing records.

```typescript
{
  _id: ObjectId,
  senderId: ObjectId,
  receiverId: ObjectId,
  amount: number,
  type: 'lent' | 'borrowed',
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'failed',
  remarks?: string,
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### notifications
User notifications.

```typescript
{
  _id: ObjectId,
  recipient: ObjectId,
  type: NotificationType,
  title: string,
  message: string,
  data?: any,
  isRead: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

### Authentication
- ✅ JWT access tokens (15 min expiry)
- ✅ JWT refresh tokens (7 day expiry)
- ✅ Token versioning for forced logout
- ✅ Bcrypt password hashing (10 salt rounds)

### Authorization
- ✅ Global JWT guard on all routes
- ✅ Public route decorator for exceptions
- ✅ User-specific data access control

### Data Protection
- ✅ Password excluded from all responses
- ✅ Input validation with Zod
- ✅ MongoDB injection prevention
- ✅ CORS configuration

## Performance Optimization

### Database Indexing
- Email index (unique)
- Friend request composite index
- Transaction sender/receiver indexes
- Notification recipient index

### Caching Strategy
- User data cached for 5 minutes
- Online status cached in memory
- Query result caching (recommended)

### Query Optimization
- Projection to limit returned fields
- Pagination for large datasets
- Lean queries for read-only operations

## Next Steps

- [Quick Start Guide](/backend/quick-start) - Set up your development environment
- [Environment Configuration](/backend/environment) - Configure environment variables
- [Authentication Module](/backend/auth) - Learn about authentication
- [API Reference](/backend/auth) - Explore all API endpoints

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Socket.IO Documentation](https://socket.io/docs)
- [TypeORM Documentation](https://typeorm.io)
- [GitHub Repository](https://github.com/Celestial-0/Peerpay)
