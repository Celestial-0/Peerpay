# Technology Stack

## Overview

Peerpay Ledger is built with modern, production-ready technologies across three main components: Backend API, Mobile App, and Web Dashboard.

## Backend Stack

### Core Framework

#### NestJS 11.x
- **Why:** TypeScript-first framework with excellent architecture
- **Benefits:**
  - Modular design with dependency injection
  - Built-in support for guards, interceptors, and pipes
  - Excellent documentation and community
  - Easy testing with built-in test utilities
  - Production-ready out of the box

### Database

#### MongoDB 6.x
- **Why:** Flexible NoSQL database perfect for rapid development
- **Benefits:**
  - JSON-like documents (natural fit for JavaScript/TypeScript)
  - Flexible schema for easy iteration
  - Powerful aggregation pipeline
  - Horizontal scaling with sharding
  - Rich query language

#### TypeORM 0.3.x
- **Why:** Robust ORM with MongoDB support
- **Benefits:**
  - Type-safe database operations
  - Entity-based modeling
  - Migration support
  - Repository pattern
  - Query builder

### Authentication

#### Passport.js + JWT
- **Why:** Industry-standard authentication
- **Components:**
  - `@nestjs/passport` - NestJS integration
  - `@nestjs/jwt` - JWT token generation
  - `passport-jwt` - JWT strategy
  - `passport-local` - Email/password strategy
- **Benefits:**
  - Flexible strategy system
  - Well-tested and secure
  - Easy to extend

#### Bcrypt 6.x
- **Why:** Secure password hashing
- **Benefits:**
  - Adaptive hashing (configurable salt rounds)
  - Protection against rainbow table attacks
  - Industry standard

### Real-time Communication

#### Socket.IO
- **Why:** Reliable WebSocket library
- **Benefits:**
  - Automatic reconnection
  - Room-based broadcasting
  - Fallback to HTTP long-polling
  - Binary support
  - Cross-platform compatibility

### Validation

#### Zod 4.x
- **Why:** TypeScript-first schema validation
- **Benefits:**
  - Type inference
  - Runtime validation
  - Excellent error messages
  - Composable schemas
  - Zero dependencies

### Development Tools

- **TypeScript 5.x** - Type safety and better DX
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Supertest** - HTTP testing

## Mobile App Stack

### Core Framework

#### React Native
- **Why:** Cross-platform mobile development
- **Benefits:**
  - Single codebase for iOS and Android
  - Native performance
  - Large ecosystem
  - Hot reloading
  - Mature and battle-tested

#### Expo
- **Why:** Simplified React Native development
- **Benefits:**
  - Easy setup and configuration
  - Over-the-air updates
  - Built-in components (Camera, Location, etc.)
  - Simplified build process
  - Great developer experience

### State Management

#### React Context + Hooks
- **Why:** Built-in state management
- **Benefits:**
  - No additional dependencies
  - Simple and straightforward
  - Good for moderate complexity
  - Easy to understand

#### AsyncStorage
- **Why:** Local data persistence
- **Benefits:**
  - Simple key-value storage
  - Async API
  - Cross-platform
  - Good for tokens and user preferences

### Navigation

#### React Navigation
- **Why:** Standard navigation library for React Native
- **Benefits:**
  - Stack, tab, and drawer navigation
  - Deep linking support
  - Customizable
  - Great documentation

### Real-time

#### Socket.IO Client
- **Why:** WebSocket client for React Native
- **Benefits:**
  - Same API as web
  - Automatic reconnection
  - Event-based communication

### UI Components

#### React Native Paper / Native Base
- **Why:** Pre-built UI components
- **Benefits:**
  - Material Design / iOS design
  - Customizable themes
  - Accessibility support
  - Well-documented

## Web Dashboard Stack

### Core Framework

#### Next.js 16
- **Why:** React framework with SSR/SSG
- **Benefits:**
  - Server-side rendering
  - Static site generation
  - API routes
  - File-based routing
  - Image optimization
  - Excellent performance

### Styling

#### TailwindCSS
- **Why:** Utility-first CSS framework
- **Benefits:**
  - Rapid development
  - Small bundle size
  - Customizable
  - Responsive design utilities
  - Dark mode support

#### shadcn/ui
- **Why:** Beautiful, accessible components
- **Benefits:**
  - Copy-paste components
  - Built on Radix UI
  - Fully customizable
  - TypeScript support
  - Accessible by default

### Data Fetching

#### React Query (TanStack Query)
- **Why:** Powerful data synchronization
- **Benefits:**
  - Automatic caching
  - Background refetching
  - Optimistic updates
  - Pagination support
  - DevTools

### Charts & Visualization

#### Recharts
- **Why:** Composable charting library
- **Benefits:**
  - Built with React components
  - Responsive
  - Customizable
  - Good documentation
  - SVG-based

### Forms

#### React Hook Form
- **Why:** Performant form library
- **Benefits:**
  - Minimal re-renders
  - Easy validation
  - TypeScript support
  - Small bundle size

## Development Tools

### Version Control
- **Git** - Source control
- **GitHub** - Repository hosting

### Package Management
- **npm** - Package manager
- **package-lock.json** - Dependency locking

### Code Quality
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

### Testing
- **Jest** - Unit testing
- **React Testing Library** - Component testing
- **Supertest** - API testing
- **Playwright** (planned) - E2E testing

### CI/CD
- **GitHub Actions** - Continuous integration
- **Docker** - Containerization
- **Vercel** (dashboard) - Deployment
- **EAS** (mobile) - Expo Application Services

## Infrastructure

### Database Hosting
- **MongoDB Atlas** - Cloud MongoDB hosting
- **Local MongoDB** - Development

### Backend Hosting
- **AWS EC2** / **DigitalOcean** - VPS hosting
- **Docker** - Containerization
- **PM2** - Process management

### Mobile Distribution
- **Apple App Store** - iOS distribution
- **Google Play Store** - Android distribution
- **EAS Build** - Build service

### Dashboard Hosting
- **Vercel** - Recommended for Next.js
- **Netlify** - Alternative option
- **AWS S3 + CloudFront** - Custom hosting

## Why These Choices?

### TypeScript Everywhere
- Type safety across the stack
- Better IDE support
- Fewer runtime errors
- Self-documenting code

### Modern React Ecosystem
- Component-based architecture
- Hooks for state management
- Large community and ecosystem
- Battle-tested in production

### MongoDB for Flexibility
- Rapid iteration during development
- Flexible schema
- Easy to scale
- Natural fit for JavaScript/TypeScript

### JWT for Authentication
- Stateless authentication
- Easy to scale horizontally
- Works across platforms
- Industry standard

### Socket.IO for Real-time
- Reliable WebSocket communication
- Automatic fallbacks
- Room-based broadcasting
- Cross-platform support

## Future Considerations

### Potential Additions
- **Redis** - Caching and session storage
- **Bull** - Job queue for async processing
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Stripe** - Payment processing
- **SendGrid** - Email service
- **Firebase** - Push notifications

### Scalability
- **Microservices** - Split into domain services
- **Message Queue** - Async processing
- **Load Balancer** - Distribute traffic
- **CDN** - Static asset delivery
- **Database Sharding** - Horizontal scaling

## Version Requirements

| Technology | Minimum Version | Recommended |
|------------|----------------|-------------|
| Node.js | 18.x | 20.x LTS |
| MongoDB | 6.x | 7.x |
| npm | 9.x | 10.x |
| TypeScript | 5.x | 5.7.x |
| React Native | 0.72+ | Latest |
| Next.js | 14.x | 14.x |

## Learning Resources

### Backend
- [NestJS Documentation](https://docs.nestjs.com)
- [MongoDB University](https://university.mongodb.com)
- [TypeORM Documentation](https://typeorm.io)

### Mobile
- [React Native Docs](https://reactnative.dev)
- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)

### Dashboard
- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## Next Steps

- [Architecture Overview](/guide/architecture)
- [Backend Quick Start](/backend/quick-start)
- [Mobile App Guide](/guide/mobile-app)
- [Web Dashboard Guide](/guide/web-dashboard)
