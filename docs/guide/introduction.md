# Introduction

## What is Peerpay Ledger?

Peerpay Ledger is a comprehensive peer-to-peer money lending and borrowing platform that empowers friends to lend and borrow money with confidence. It eliminates awkward conversations and forgotten debts through real-time tracking, smart settlements, and a two-phase approval system that ensures mutual agreement on every transaction.

## Vision

**Simplifying peer-to-peer financial relationships through transparent tracking and effortless settlements.**

The platform is designed to make lending and borrowing money between friends as simple and transparent as possible, while maintaining security and trust.

## Platform Components

Peerpay Ledger consists of three main components:

### 🔷 Mobile App (React Native + Expo)

A beautiful, intuitive mobile application for iOS and Android that allows users to:

- 💸 Track money lent to friends
- 💰 Monitor borrowed amounts
- 👥 Manage friend connections
- 🔔 Receive real-time notifications
- 📊 View balance summaries and transaction history
- 🔐 Secure authentication with biometric support

### 🔷 Web Dashboard (Next.js)

A powerful web interface for users to:

- 📈 View analytics and insights
- 👥 Manage friends and connections
- 🔍 Monitor transactions and activities
- 📊 Generate reports and exports
- ⚙️ Configure personal settings
- 💰 Track lending and borrowing

### 🔷 Backend API (NestJS)

A robust, scalable backend service that provides:

- 🔐 JWT-based authentication with token versioning
- 🌐 RESTful API endpoints (29+ endpoints)
- ⚡ Real-time WebSocket communication
- 💾 MongoDB database integration
- 🔒 Secure data handling and validation
- 📡 Push notification support

## Key Features

### Authentication & Security

- **JWT-based Authentication** - Secure token-based auth with access & refresh tokens
- **Token Versioning** - Force logout from all devices when needed
- **Password Security** - Bcrypt hashing with 10 salt rounds
- **Biometric Support** - Face ID and Touch ID on mobile devices

### Friend Management

- **Friend Requests** - Send, accept, reject, and cancel friend requests
- **Bidirectional Tracking** - Automatic two-way friend connections
- **Online Status** - Real-time friend online/offline tracking
- **Friend Search** - Find and connect with other users

### Transaction System

- **Two-Phase Transactions** - Create and accept/reject workflow
- **Transaction Types** - LENT and BORROWED tracking
- **Automatic Balances** - Real-time ledger balance calculations
- **Transaction History** - Complete history with filtering options
- **Atomic Operations** - Database transactions for data consistency

### Real-time Communication

- **WebSocket Support** - Instant updates via Socket.IO
- **Multi-device** - Connect from multiple devices simultaneously
- **Event System** - Friend, transaction, and notification events
- **JWT Authentication** - Secure WebSocket connections

### Notifications

- **Multiple Types** - Friend requests, transactions, reminders
- **Read/Unread Tracking** - Mark notifications as read
- **Real-time Delivery** - Instant notification via WebSocket
- **Push Notifications** - Mobile push notification support

## Use Cases

### Personal Finance Tracking

Keep track of money lent to and borrowed from friends without the awkwardness of asking for reminders.

### Group Expenses

Manage shared expenses among friends for trips, dinners, or shared living costs.

### Trust Building

Build trust in financial relationships through transparent tracking and mutual agreement on all transactions.

### Settlement Management

Easily settle debts with automatic balance calculations and settlement suggestions.

## Why Peerpay Ledger?

### 🎯 Transparency

Every transaction requires mutual agreement, ensuring both parties are always on the same page.

### 🔒 Security

Built with industry-standard security practices including JWT authentication, password hashing, and secure data storage.

### ⚡ Real-time

Instant notifications and updates keep everyone informed about their financial relationships.

### 📱 Cross-platform

Access your ledger from mobile devices (iOS/Android) or web dashboard.

### 🚀 Scalable

Built on modern, scalable technologies (NestJS, MongoDB, Socket.IO) that can grow with your needs.

### 🧪 Well-tested

Comprehensive test suite with unit and e2e tests ensuring reliability.

## What's Next?

Ready to get started? Check out the [Quick Start Guide](/guide/quick-start) to set up your development environment.

Want to dive deeper? Explore the [Backend API Documentation](/backend/overview) to understand the system architecture.
