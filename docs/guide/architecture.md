# Architecture

## System Overview

Peerpay Ledger follows a modern three-tier architecture with a clear separation of concerns between the presentation layer (mobile app and dashboard), business logic layer (backend API), and data layer (MongoDB).

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Peerpay Ledger                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │   Mobile App     │  │  Web Dashboard   │               │
│  │  (React Native)  │  │    (Next.js)     │               │
│  │     + Expo       │  │   + TypeScript   │               │
│  └────────┬─────────┘  └────────┬─────────┘               │
│           │                     │                          │
│           │    REST API + WS    │                          │
│           └──────────┬──────────┘                          │
│                      │                                     │
│           ┌──────────▼──────────┐                          │
│           │   Backend API       │                          │
│           │    (NestJS)         │                          │
│           │  + Socket.IO        │                          │
│           └──────────┬──────────┘                          │
│                      │                                     │
│           ┌──────────▼──────────┐                          │
│           │     MongoDB         │                          │
│           │   (Database)        │                          │
│           └─────────────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Backend Module Architecture

The backend is built using NestJS with a modular architecture. Each module is responsible for a specific domain of the application.

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

### 1. Authentication Module

**Responsibility:** User authentication and authorization

**Components:**
- JWT Strategy (access tokens)
- JWT Refresh Strategy (refresh tokens)
- Local Strategy (email/password)
- Auth Guards
- Token versioning system

**Key Features:**
- Access token (15 min expiry)
- Refresh token (7 day expiry)
- Token versioning for forced logout
- Password hashing with bcrypt

### 2. User Module

**Responsibility:** User profile and ledger management

**Components:**
- User Entity
- User Service
- User Controller
- Profile management
- Ledger balance tracking

**Key Features:**
- CRUD operations for user profiles
- Ledger balance calculations (totalLent, totalBorrowed, netBalance)
- User search functionality
- Friend list management

### 3. Friend Module

**Responsibility:** Friend relationships and requests

**Components:**
- FriendRequest Entity
- Friendship Entity
- Friend Service
- Friend Controller

**Key Features:**
- Send/accept/reject friend requests
- Bidirectional friendship tracking
- Request status management
- Real-time friend notifications

### 4. Transaction Module

**Responsibility:** Money lending/borrowing transactions

**Components:**
- Transaction Entity
- Transaction Service
- Transaction Controller
- Balance synchronization

**Key Features:**
- Two-phase transaction system (create → accept)
- LENT/BORROWED transaction types
- Atomic database operations
- Automatic balance updates
- Transaction history and filtering

### 5. Notification Module

**Responsibility:** User notifications

**Components:**
- Notification Entity
- Notification Service
- Notification Controller

**Key Features:**
- Multiple notification types
- Read/unread tracking
- Real-time delivery via WebSocket
- Bulk operations
- Pagination support

### 6. Realtime Module

**Responsibility:** WebSocket communication

**Components:**
- Realtime Gateway
- Socket.IO integration
- JWT authentication for WebSocket
- Event emitters

**Key Features:**
- Multi-device support
- Online/offline status tracking
- Real-time event broadcasting
- Connection management

### 7. Common Module

**Responsibility:** Shared utilities and configurations

**Components:**
- Global guards
- Decorators (@Public, @CurrentUser)
- Type helpers
- Constants
- Utility functions

## Data Flow

### Authentication Flow

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client │────>│   Auth   │────>│   User   │────>│ MongoDB  │
│         │     │Controller│     │ Service  │     │          │
└─────────┘     └──────────┘     └──────────┘     └──────────┘
     │               │                 │                 │
     │  1. Signup    │                 │                 │
     │──────────────>│  2. Create User │                 │
     │               │────────────────>│  3. Save User   │
     │               │                 │────────────────>│
     │               │                 │<────────────────│
     │               │<────────────────│  4. Return User │
     │  5. Tokens    │                 │                 │
     │<──────────────│                 │                 │
```

### Transaction Flow

```
┌─────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│  Client │────>│ Transaction  │────>│   User   │────>│ MongoDB  │
│         │     │  Controller  │     │ Service  │     │          │
└─────────┘     └──────────────┘     └──────────┘     └──────────┘
     │                 │                   │                 │
     │  1. Create Txn  │                   │                 │
     │────────────────>│  2. Start Txn     │                 │
     │                 │──────────────────>│                 │
     │                 │  3. Update Balances                 │
     │                 │──────────────────>│  4. Save        │
     │                 │                   │────────────────>│
     │                 │  5. Emit WS Event │                 │
     │                 │──────────────────>│                 │
     │  6. Response    │                   │                 │
     │<────────────────│                   │                 │
```

### Real-time Notification Flow

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐
│ Client A│────>│ Backend  │────>│ Realtime │────>│Client B │
│         │     │ Service  │     │ Gateway  │     │         │
└─────────┘     └──────────┘     └──────────┘     └─────────┘
     │               │                 │                │
     │  1. Action    │                 │                │
     │──────────────>│  2. Process     │                │
     │               │────────────────>│  3. Emit Event │
     │               │                 │───────────────>│
     │               │                 │                │
```

## Database Schema

### Collections

1. **users** - User profiles and ledger balances
2. **friend_requests** - Friend request status tracking
3. **friendships** - Bidirectional friendship records
4. **transactions** - Money lending/borrowing records
5. **notifications** - User notifications

### Relationships

```
users (1) ──────< (N) friend_requests
users (1) ──────< (N) friendships
users (1) ──────< (N) transactions (as sender)
users (1) ──────< (N) transactions (as receiver)
users (1) ──────< (N) notifications
```

## Security Architecture

### Authentication Layers

1. **JWT Access Token** - Short-lived (15 min) for API requests
2. **JWT Refresh Token** - Long-lived (7 days) for token renewal
3. **Token Versioning** - Invalidate all tokens on demand
4. **Password Hashing** - Bcrypt with 10 salt rounds

### Authorization Layers

1. **Global JWT Guard** - Applied to all routes by default
2. **@Public Decorator** - Bypass authentication for specific routes
3. **User Context** - Access current user in request handlers
4. **WebSocket Auth** - JWT authentication for WebSocket connections

### Data Protection

1. **Password Exclusion** - Never return passwords in responses
2. **Input Validation** - Zod schemas for all inputs
3. **MongoDB Injection Prevention** - TypeORM query builders
4. **CORS Configuration** - Whitelist allowed origins

## Scalability Considerations

### Current Architecture

- **Vertical Scaling** - Increase server resources
- **Database Indexing** - Optimized queries
- **Connection Pooling** - Efficient database connections

### Future Enhancements

- **Horizontal Scaling** - Multiple backend instances
- **Redis Caching** - Cache frequently accessed data
- **Load Balancing** - Distribute traffic across instances
- **Message Queue** - Async processing with Bull/Redis
- **Microservices** - Split into domain-specific services

## Technology Choices

### Why NestJS?

- **TypeScript-first** - Type safety and better DX
- **Modular Architecture** - Clean separation of concerns
- **Dependency Injection** - Testable and maintainable code
- **Built-in Features** - Guards, interceptors, pipes
- **Great Documentation** - Easy to learn and use

### Why MongoDB?

- **Flexible Schema** - Easy to iterate during development
- **JSON-like Documents** - Natural fit for JavaScript/TypeScript
- **Scalability** - Horizontal scaling with sharding
- **Rich Query Language** - Powerful aggregation pipeline
- **TypeORM Support** - ORM integration

### Why Socket.IO?

- **Real-time Communication** - WebSocket with fallbacks
- **Room Support** - Easy event broadcasting
- **Reconnection** - Automatic reconnection handling
- **Binary Support** - Efficient data transfer
- **Cross-platform** - Works everywhere

## Development Workflow

### Local Development

```bash
# Start MongoDB
mongod

# Start backend in watch mode
npm run start:dev

# Run tests
npm run test

# Build for production
npm run build
```

### Testing Strategy

1. **Unit Tests** - Test individual components
2. **Integration Tests** - Test module interactions
3. **E2E Tests** - Test complete user flows
4. **Manual Testing** - Test UI and UX

## Deployment Architecture

### Production Setup

```
┌──────────────┐
│   Internet   │
└──────┬───────┘
       │
┌──────▼───────┐
│Load Balancer │
└──────┬───────┘
       │
   ┌───┴───┬───────┬───────┐
   │       │       │       │
┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐
│App 1│ │App 2│ │App 3│ │App N│
└──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘
   │       │       │       │
   └───┬───┴───┬───┴───┬───┘
       │       │       │
   ┌───▼───────▼───────▼───┐
   │   MongoDB Cluster     │
   └───────────────────────┘
```

## Next Steps

- [Tech Stack Details](/guide/tech-stack)
- [Backend API Documentation](/backend/overview)
- [Deployment Guide](/guide/deploy-backend)
