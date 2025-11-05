# Changelog

All notable changes to Peerpay Ledger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Group expense splitting
- Recurring transaction reminders
- Transaction attachments (receipts, photos)
- Multi-currency support
- Advanced analytics and insights
- Export data to CSV/PDF

## [0.0.1] - 2025-11-06

### Added

#### Backend API
- **Authentication System**
  - JWT-based authentication with access & refresh tokens
  - Token versioning for forced logout from all devices
  - Bcrypt password hashing with 10 salt rounds
  - Signup, signin, refresh, signout, and token invalidation endpoints

- **User Management**
  - User profile CRUD operations
  - Ledger balance tracking (totalLent, totalBorrowed, netBalance)
  - User search functionality with online status
  - Account deletion with cascade cleanup

- **Friend System**
  - Send, accept, reject, and cancel friend requests
  - Bidirectional friendship tracking
  - Real-time friend online/offline status
  - Friend list and pending requests endpoints
  - Remove friend functionality

- **Transaction Management**
  - Two-phase transaction system (create → accept/reject)
  - LENT and BORROWED transaction types
  - Atomic database operations for data consistency
  - Automatic balance synchronization
  - Transaction history with filtering options
  - Settlement tracking

- **Notification System**
  - Multiple notification types (friend requests, transactions, reminders)
  - Real-time WebSocket delivery
  - Read/unread status tracking
  - Bulk operations (mark all as read)
  - Pagination support
  - Unread count endpoint

- **Real-time Communication**
  - WebSocket-based communication via Socket.IO
  - JWT-authenticated WebSocket connections
  - Multi-device support
  - Online/offline status tracking
  - Friend, transaction, and notification events

- **Testing**
  - Comprehensive unit tests for all modules
  - End-to-end tests for critical flows
  - Test coverage above 85%
  - Mock data helpers and test utilities

#### Documentation
- Complete API documentation for all modules
- Architecture overview and diagrams
- Quick start guide for developers
- Environment setup instructions
- Security best practices
- Performance optimization guide

### Security
- Global JWT guard on all routes
- Password excluded from all API responses
- Input validation with Zod schemas
- MongoDB injection prevention
- CORS configuration
- Secure password hashing

### Performance
- Database indexing for optimized queries
- Query result projection
- Pagination for large datasets
- Lean queries for read-only operations
- In-memory caching for online status

### Infrastructure
- MongoDB database integration
- TypeORM for object-relational mapping
- Environment-based configuration
- Modular NestJS architecture
- Docker support (planned)

## [0.0.0] - 2025-11-03

### Initial Setup
- Project initialization
- Repository structure
- Development environment setup
- Basic project documentation

---

## Release Notes

### Version 0.0.1 Highlights

This is the initial release of Peerpay Ledger, providing a complete backend API for peer-to-peer money lending and borrowing. The platform includes:

- **29+ REST API endpoints** across 6 modules
- **10+ WebSocket events** for real-time communication
- **5 database collections** with optimized schemas
- **85%+ test coverage** ensuring reliability
- **JWT authentication** with token versioning
- **Two-phase transaction system** for mutual agreement
- **Real-time notifications** via WebSocket

The backend is production-ready and provides a solid foundation for building mobile and web applications.

### Breaking Changes

None - this is the initial release.

### Migration Guide

Not applicable for initial release.

### Known Issues

- [ ] Mobile app and admin dashboard are in development
- [ ] Push notifications require additional setup
- [ ] Email notifications not yet implemented
- [ ] Rate limiting not configured

### Contributors

- **Yash Kumar Singh** - Initial development and architecture

---

## Future Roadmap

### Version 0.1.0 (Q2 2025)
- Mobile app (React Native + Expo) release
- Push notification integration
- Email notification system
- Rate limiting and API throttling

### Version 0.2.0 (Q3 2025)
- Admin dashboard (Next.js) release
- Advanced analytics and reporting
- Transaction attachments
- Multi-currency support

### Version 1.0.0 (Q4 2025)
- Group expense splitting
- Recurring transaction reminders
- Data export functionality
- Production deployment guides

---

For more information, visit the [GitHub Repository](https://github.com/Celestial-0/Peerpay).
