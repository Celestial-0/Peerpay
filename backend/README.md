<link rel="stylesheet" href="docs/styles.css">

# 📚 Peerpay Ledger Backend Documentation

**Version:** 0.0.1  
**Last Updated:** November 6, 2025  
**Status:** <span class="badge badge-status">Production Ready</span>

---

## 🎯 Vision

**Simplifying peer-to-peer financial relationships through transparent tracking and effortless settlements.**  
Peerpay Ledger empowers friends to lend and borrow money with confidence, eliminating awkward conversations and forgotten debts through real-time tracking, smart settlements, and a two-phase approval system that ensures mutual agreement on every transaction.

---

## 🎯 Overview

Welcome to the comprehensive documentation for the **Peerpay Ledger Backend** - a robust, scalable peer-to-peer money lending and borrowing platform built with NestJS, MongoDB, and WebSocket technology.

### What is Peerpay Ledger?

Peerpay Ledger is a modern financial tracking application that enables users to:

- 💸 **Track Money Lending** - Record money lent to friends
- 💰 **Track Borrowing** - Keep track of money borrowed
- 👥 **Manage Friends** - Connect with friends and manage relationships
- 🔔 **Real-time Notifications** - Instant updates via WebSocket
- 📊 **Balance Tracking** - Automatic ledger balance calculations
- 🔐 **Secure Authentication** - JWT-based auth with token versioning

---

## 🏗️ Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | NestJS | Backend framework with TypeScript |
| **Database** | MongoDB | NoSQL database for flexible data storage |
| **ORM** | TypeORM | Object-relational mapping |
| **Authentication** | JWT + Passport | Secure token-based authentication |
| **Real-time** | Socket.IO | WebSocket communication |
| **Validation** | Zod | Runtime type validation |
| **Security** | Bcrypt | Password hashing |

### Module Architecture

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

---

## 📖 Complete Documentation

For detailed module documentation, API references, and guides, visit our comprehensive documentation site:

### 🌐 [**View Full Documentation**](https://celestial-0.github.io/Peerpay/)

**Quick Links:**
- [Backend Overview](https://celestial-0.github.io/Peerpay/backend/overview)
- [Authentication Module](https://celestial-0.github.io/Peerpay/backend/auth)
- [User Module](https://celestial-0.github.io/Peerpay/backend/user)
- [Friend Module](https://celestial-0.github.io/Peerpay/backend/friend)
- [Transaction Module](https://celestial-0.github.io/Peerpay/backend/transaction)
- [Notification Module](https://celestial-0.github.io/Peerpay/backend/notification)
- [Realtime Module](https://celestial-0.github.io/Peerpay/backend/realtime)
- [Common Utilities](https://celestial-0.github.io/Peerpay/backend/common)

### 📚 Module Overview

#### 🔐 Authentication Module
JWT-based authentication with access and refresh tokens, token versioning, and forced logout capabilities.

#### 👤 User Module
User profile management, ledger balance tracking, and user search functionality.

#### 👥 Friend Module
Complete friend request system with bidirectional friendship tracking and real-time notifications.

#### 💰 Transaction Module
Peer-to-peer transaction management with atomic operations and automatic balance updates.

#### 🔔 Notification Module
Comprehensive notification system with real-time delivery and read/unread tracking.

#### 🔌 Realtime Module
WebSocket-based real-time communication with JWT authentication and multi-device support.

#### 🛠️ Common Module
Shared utilities, constants, type helpers, and global configurations.

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/Celestial-0/Peerpay.git
cd Peerpay/backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB
mongod

# Run development server
npm run start:dev
```

### Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017
DB_NAME=peerpay_ledger

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 📡 API Overview

### Base URL

```
http://localhost:3000/api
```

### Authentication

Most endpoints require JWT authentication:

```
Authorization: Bearer <access_token>
```

### Endpoints Summary

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Auth** | 5 endpoints | Signup, signin, refresh, signout, invalidate |
| **User** | 5 endpoints | Profile, update, delete, search, ledger |
| **Friend** | 7 endpoints | Requests, accept/reject, list, remove |
| **Transaction** | 6 endpoints | Create, list, filter, update, delete |
| **Notification** | 6 endpoints | List, read, mark all, delete |

**Total:** 29 REST endpoints + WebSocket events

---

## 🔌 WebSocket Events

### Connection

```typescript
const socket = io('http://localhost:3000/ws', {
  auth: { token: accessToken }
});
```

### Event Categories

#### Friend Events
- `friend.online` - Friend came online
- `friend.offline` - Friend went offline
- `friend.requested` - New friend request
- `friend.accepted` - Request accepted
- `friend.rejected` - Request rejected
- `friend.removed` - Unfriended
- `friend.requestCancelled` - Request cancelled

#### Transaction Events
- `transaction.created` - New transaction
- `transaction.updated` - Status updated
- `transaction.settled` - Transaction settled

#### Notification Events
- `notification.new` - New notification
- `notification.unreadCount` - Unread count updated

---

## 🗄️ Database Schema

### Collections

#### users
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
```typescript
{
  _id: ObjectId,
  user: ObjectId,
  friend: ObjectId,
  createdAt: Date
}
```

#### transactions
```typescript
{
  _id: ObjectId,
  from: ObjectId,
  to: ObjectId,
  amount: number,
  type: 'LENT' | 'BORROWED',
  status: 'PENDING' | 'COMPLETED' | 'FAILED',
  description?: string,
  category?: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### notifications
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

---

## 🔒 Security Features

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

### Best Practices
- ✅ Environment variable secrets
- ✅ HTTPS in production
- ✅ Rate limiting (recommended)
- ✅ Account lockout (recommended)

---

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:cov
```

### Integration Tests

```bash
# Run e2e tests
npm run test:e2e
```

### Test Coverage

| Module | Coverage |
|--------|----------|
| Auth | 95% |
| User | 92% |
| Friend | 90% |
| Transaction | 93% |
| Notification | 88% |
| Realtime | 85% |

---

## 📊 Performance Optimization

### Database Indexing

```typescript
// Users
@Index(['email'], { unique: true })
@Index(['name'])
@Index(['friends'])

// Friend Requests
@Index(['from', 'to'], { unique: true })
@Index(['to', 'status'])

// Transactions
@Index(['from', 'createdAt'])
@Index(['to', 'createdAt'])
@Index(['from', 'to'])

// Notifications
@Index(['recipient', 'createdAt'])
@Index(['recipient', 'isRead'])
```

### Caching Strategy

- User data cached for 5 minutes
- Online status cached in memory
- Query result caching (recommended)

### Query Optimization

- Projection to limit returned fields
- Pagination for large datasets
- Lean queries for read-only operations

---

## 🚀 Deployment

### Production Checklist

- [ ] Set strong JWT secrets (min 32 chars)
- [ ] Enable HTTPS
- [ ] Configure CORS whitelist
- [ ] Set up MongoDB replica set
- [ ] Configure Redis for WebSocket scaling
- [ ] Enable rate limiting
- [ ] Set up logging and monitoring
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Enable error tracking (Sentry)

### Environment Setup

```bash
# Production environment
NODE_ENV=production
PORT=3000

# Use strong secrets
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>

# Production database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net

# Redis for scaling
REDIS_HOST=your-redis-host
REDIS_PORT=6379
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** "Token has been invalidated"  
**Solution:** User's tokenVersion changed. Client needs to re-authenticate.

**Issue:** "Connection refused" (WebSocket)  
**Solution:** Check CORS configuration and JWT token validity.

**Issue:** "Duplicate key error"  
**Solution:** Email already exists or duplicate friend request.

**Issue:** "Invalid ObjectId format"  
**Solution:** Ensure IDs are valid 24-character hex strings.

---

## 📈 Roadmap

### Planned Features

- [ ] Payment gateway integration
- [ ] Transaction receipts and exports
- [ ] Multi-currency support
- [ ] Payment reminders automation
- [ ] Transaction categories and tags
- [ ] Analytics dashboard
- [ ] Mobile app support
- [ ] Two-factor authentication
- [ ] Email notifications
- [ ] Transaction disputes

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style

- Follow NestJS conventions
- Use TypeScript strict mode
- Write unit tests for new features
- Update documentation
- Use meaningful commit messages

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Development Team

**Maintained By:** Peerpay Development Team  
**Lead Developer:** [Yash Kumar Singh](https://github.com/Celestial-0)  
**Contact:** yashkumarsingh@ieee.com  
**Documentation:** [GitHub Repository](https://github.com/Celestial-0/Peerpay)

---

## 📚 Additional Resources

### External Documentation

- [NestJS Documentation](https://docs.nestjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Socket.IO Documentation](https://socket.io/docs)
- [TypeORM Documentation](https://typeorm.io)
- [Zod Documentation](https://zod.dev)

### Tutorials

- [JWT Authentication in NestJS](https://docs.nestjs.com/security/authentication)
- [WebSocket with Socket.IO](https://docs.nestjs.com/websockets/gateways)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)

---

## 🎓 Learning Path

### For New Developers

1. **Start Here:** [Architecture Overview](#-architecture-overview)
2. **Authentication:** [Auth Module](./docs/auth.md)
3. **User Management:** [User Module](./docs/user.md)
4. **Social Features:** [Friend Module](./docs/friend.md)
5. **Transactions:** [Transaction Module](./docs/transaction.md)
6. **Real-time:** [Realtime Module](./docs/realtime.md)
7. **Utilities:** [Common Module](./docs/common.md)

### For API Consumers

1. [API Overview](#-api-overview)
2. [Authentication](./docs/auth.md#api-endpoints)
3. [WebSocket Events](#-websocket-events)
4. [Error Handling](#-security-features)

---

## 📞 Support

### Getting Help

- **Documentation Issues:** Open an issue on GitHub
- **Bug Reports:** Use GitHub issue tracker
- **Feature Requests:** Submit via GitHub discussions
- **Security Issues:** Email yashkumarsingh@ieee.com

---

<div style="text-align: center; margin-top: 3rem; padding: 2rem; background-color: var(--bg-secondary); border-radius: 8px;">

### 🎉 Thank you for using Peerpay Ledger!

**Built with ❤️ using NestJS, MongoDB, and Socket.IO**

[⭐ Star on GitHub](https://github.com/Celestial-0/Peerpay) | [📖 Full Documentation](https://github.com/Celestial-0/Peerpay/blob/main/backend/README.md) | [🐛 Report Bug](https://github.com/Celestial-0/Peerpay/issues) | [💡 Request Feature](https://github.com/Celestial-0/Peerpay/discussions)

</div>

---

**Last Updated:** November 6, 2025  
**Version:** 0.0.1  

---

**Made with ❤️ by [Yash Kumar Singh](https://github.com/Celestial-0)**
