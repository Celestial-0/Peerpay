---
layout: home

hero:
  name: Peerpay Ledger
  text: P2P Money Tracking Platform
  tagline: Simplifying peer-to-peer financial relationships through transparent tracking and effortless settlements
  image:
    light: https://v8sn4u5d65xaovfn.public.blob.vercel-storage.com/Peerpay%20logo%20light..svg
    dark: https://v8sn4u5d65xaovfn.public.blob.vercel-storage.com/Peerpay%20logo%20dark.svg
    alt: Peerpay Ledger
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/Celestial-0/Peerpay

features:
  - icon: 🔐
    title: Secure Authentication
    details: JWT-based authentication with access/refresh tokens, token versioning, and forced logout capabilities
  
  - icon: 👥
    title: Friend Management
    details: Complete friend request system with bidirectional tracking and real-time notifications
  
  - icon: 💰
    title: Transaction Tracking
    details: Two-phase transaction system with atomic operations and automatic balance synchronization
  
  - icon: 🔔
    title: Real-time Notifications
    details: WebSocket-based instant notifications with multi-device support and read/unread tracking
  
  - icon: 📊
    title: Ledger Balances
    details: Automatic calculation of totalLent, totalBorrowed, and netBalance for each user
  
  - icon: 🚀
    title: Production Ready
    details: Built with NestJS, MongoDB, and Socket.IO with comprehensive security best practices

---

## Quick Start

::: code-group

```bash [Backend]
# Clone repository
git clone https://github.com/Celestial-0/Peerpay.git
cd Peerpay/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run development server
npm run start:dev
```

```bash [Mobile App]
# Navigate to mobile app
cd frontend/mobile

# Install dependencies
npm install

# Start Expo
npx expo start
```

```bash [Dashboard]
# Navigate to dashboard
cd frontend/dashboard

# Install dependencies
npm install

# Run development server
npm run dev
```

:::

## Tech Stack

<div class="tech-stack">

### Backend
- **NestJS** - Backend framework with TypeScript
- **MongoDB** - NoSQL database
- **Socket.IO** - Real-time WebSocket communication
- **JWT + Passport** - Authentication
- **Zod** - Runtime validation

### Mobile App
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform
- **TypeScript** - Type-safe JavaScript

### Web Dashboard
- **Next.js 16** - React framework with SSR
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - UI component library

</div>

## Architecture

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

## Core Features

### 🔐 Authentication Module
JWT-based authentication with access and refresh tokens, token versioning, and forced logout capabilities.

[Learn more →](/backend/auth)

### 👤 User Module
User profile management, ledger balance tracking, and user search functionality.

[Learn more →](/backend/user)

### 👥 Friend Module
Complete friend request system with bidirectional friendship tracking and real-time notifications.

[Learn more →](/backend/friend)

### 💰 Transaction Module
Peer-to-peer transaction management with atomic operations and automatic balance updates.

[Learn more →](/backend/transaction)

### 🔔 Notification Module
Comprehensive notification system with real-time delivery and read/unread tracking.

[Learn more →](/backend/notification)

### 🔌 Realtime Module
WebSocket-based real-time communication with JWT authentication and multi-device support.

[Learn more →](/backend/realtime)

## What's Next?

- 📖 Read the [Introduction](/guide/introduction) to understand the platform
- 🚀 Follow the [Quick Start Guide](/guide/quick-start) to set up your development environment
- 🔧 Explore the [Backend API Documentation](/backend/overview)
- 💻 Check out the [GitHub Repository](https://github.com/Celestial-0/Peerpay)

<style>
.tech-stack {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.tech-stack h3 {
  color: var(--vp-c-brand);
  margin-bottom: 1rem;
}

.tech-stack ul {
  list-style: none;
  padding: 0;
}

.tech-stack li {
  padding: 0.5rem 0;
}
</style>
