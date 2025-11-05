<link rel="stylesheet" href="backend/docs/styles.css">

# 💰 Peerpay Ledger

<div align="center">

**Simplifying peer-to-peer financial relationships through transparent tracking and effortless settlements.**

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/Celestial-0/Peerpay)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-in%20development-yellow.svg)]()

</div>

---

## 🎯 Vision

Peerpay Ledger empowers friends to lend and borrow money with confidence, eliminating awkward conversations and forgotten debts through real-time tracking, smart settlements, and a two-phase approval system that ensures mutual agreement on every transaction.

---

## 📱 What is Peerpay Ledger?

Peerpay Ledger is a comprehensive financial tracking platform consisting of three main components:

### 🔷 Mobile App (React Native + Expo)
A beautiful, intuitive mobile application for iOS and Android that allows users to:
- 💸 Track money lent to friends
- 💰 Monitor borrowed amounts
- 👥 Manage friend connections
- 🔔 Receive real-time notifications
- 📊 View balance summaries and transaction history
- 🔐 Secure authentication with biometric support

### 🔷 Admin Dashboard (Next.js)
A powerful web dashboard for administrators and power users to:
- 📈 View analytics and insights
- 👤 Manage users and permissions
- 🔍 Monitor transactions and activities
- 📊 Generate reports and exports
- ⚙️ Configure system settings
- 🛡️ Handle disputes and support tickets

### 🔷 Backend API (NestJS)
A robust, scalable backend service that provides:
- 🔐 JWT-based authentication with token versioning
- 🌐 RESTful API endpoints
- ⚡ Real-time WebSocket communication
- 💾 MongoDB database integration
- 🔒 Secure data handling and validation
- 📡 Push notification support

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Peerpay Ledger                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │   Mobile App     │  │  Admin Dashboard │               │
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

---

## 🚀 Tech Stack

### Mobile App
| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo** | Development platform and tooling |
| **TypeScript** | Type-safe JavaScript |
| **React Navigation** | Navigation library |
| **Socket.IO Client** | Real-time communication |
| **AsyncStorage** | Local data persistence |
| **Expo Notifications** | Push notifications |

### Admin Dashboard
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with SSR |
| **TypeScript** | Type-safe JavaScript |
| **TailwindCSS** | Utility-first CSS framework |
| **shadcn/ui** | UI component library |
| **Recharts** | Data visualization |
| **React Query** | Server state management |
| **Socket.IO Client** | Real-time updates |

### Backend
| Technology | Purpose |
|------------|---------|
| **NestJS** | Backend framework with TypeScript |
| **MongoDB** | NoSQL database |
| **TypeORM** | Object-relational mapping |
| **JWT + Passport** | Authentication |
| **Socket.IO** | WebSocket communication |
| **Zod** | Runtime type validation |
| **Bcrypt** | Password hashing |

---

## 📂 Project Structure

```
peerpay-ledger/
├── backend/                    # NestJS Backend API
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── user/              # User management
│   │   ├── friend/            # Friend system
│   │   ├── transaction/       # Transaction handling
│   │   ├── notification/      # Notifications
│   │   ├── realtime/          # WebSocket gateway
│   │   └── common/            # Shared utilities
│   ├── docs/                  # API documentation
│   └── test/                  # Test files
│
├── frontend/
│   ├── mobile/                # React Native Expo App
│   │   ├── app/              # App screens (Expo Router)
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API services
│   │   ├── hooks/            # Custom hooks
│   │   ├── store/            # State management
│   │   └── utils/            # Utility functions
│   │
│   └── dashboard/            # Next.js Admin Dashboard
│       ├── app/              # App router pages
│       ├── components/       # UI components
│       ├── lib/              # Utilities and configs
│       ├── hooks/            # Custom hooks
│       └── public/           # Static assets
│
└── README.md                 # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **MongoDB** >= 6.x
- **npm** or **yarn**
- **Expo CLI** (for mobile development)
- **Git**

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Celestial-0/Peerpay.git
cd Peerpay
```

### 2️⃣ Backend Setup

```bash
# Navigate to backend
cd backend

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

**Backend will run on:** `http://localhost:3000`

### 3️⃣ Mobile App Setup

```bash
# Navigate to mobile app
cd frontend/mobile

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with backend URL

# Start Expo development server
npx expo start

# Scan QR code with Expo Go app (iOS/Android)
# Or press 'i' for iOS simulator, 'a' for Android emulator
```

### 4️⃣ Admin Dashboard Setup

```bash
# Navigate to dashboard
cd frontend/dashboard

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with backend URL

# Run development server
npm run dev
```

**Dashboard will run on:** `http://localhost:3001`

---

## 🔧 Environment Variables

### Backend (.env)

```bash
# Application
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017
DB_NAME=peerpay_ledger

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3001,exp://192.168.1.x:8081
```

### Mobile App (.env)

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_WS_URL=http://localhost:3000/ws

# App Configuration
EXPO_PUBLIC_APP_NAME=Peerpay Ledger
EXPO_PUBLIC_APP_VERSION=0.0.1
```

### Admin Dashboard (.env)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=http://localhost:3000/ws

# App Configuration
NEXT_PUBLIC_APP_NAME=Peerpay Admin
NEXT_PUBLIC_APP_VERSION=0.0.1
```

---

## 📱 Features

### Mobile App Features

#### 🔐 Authentication
- Email/password registration and login
- Biometric authentication (Face ID, Touch ID)
- Secure token management
- Auto-refresh tokens

#### 👥 Friend Management
- Send friend requests
- Accept/reject requests
- View friends list with online status
- Remove friends
- Search users

#### 💰 Transaction Management
- Create LENT/BORROWED transactions
- View transaction history
- Filter by type, status, date
- Transaction details view
- Balance summary dashboard

#### 🔔 Notifications
- Real-time push notifications
- In-app notification center
- Unread count badges
- Mark as read/unread
- Notification types:
  - Friend requests
  - Transaction updates
  - Payment reminders

#### 📊 Dashboard
- Net balance overview
- Total lent amount
- Total borrowed amount
- Recent transactions
- Friend activity feed

### Admin Dashboard Features

#### 📈 Analytics
- User growth metrics
- Transaction volume charts
- Revenue analytics
- Active users tracking
- System health monitoring

#### 👤 User Management
- View all users
- Search and filter users
- User details and activity
- Account status management
- Ban/unban users

#### 💳 Transaction Monitoring
- View all transactions
- Transaction analytics
- Dispute management
- Refund processing
- Export transaction data

#### ⚙️ System Configuration
- App settings management
- Feature flags
- Email templates
- Push notification settings
- API rate limiting

#### 🛡️ Security & Compliance
- Audit logs
- Security alerts
- Compliance reports
- Data export requests
- User data deletion

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Most endpoints require JWT authentication:
```
Authorization: Bearer <access_token>
```

### Main Endpoints

#### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/signout` - Logout user
- `POST /auth/invalidate` - Invalidate all tokens

#### User
- `GET /user/profile` - Get user profile
- `PATCH /user/profile` - Update profile
- `DELETE /user/account` - Delete account
- `GET /user/search` - Search users
- `GET /user/ledger` - Get ledger balance

#### Friend
- `POST /friend/request` - Send friend request
- `POST /friend/accept/:id` - Accept request
- `POST /friend/reject/:id` - Reject request
- `DELETE /friend/cancel/:id` - Cancel request
- `GET /friend/list` - Get friends list
- `GET /friend/requests` - Get pending requests
- `DELETE /friend/remove/:id` - Remove friend

#### Transaction
- `POST /transaction` - Create transaction
- `GET /transaction/list` - Get transactions
- `GET /transaction/:id` - Get transaction details
- `PATCH /transaction/:id` - Update transaction
- `DELETE /transaction/:id` - Delete transaction
- `GET /transaction/summary` - Get balance summary

#### Notification
- `GET /notification/list` - Get notifications
- `PATCH /notification/:id/read` - Mark as read
- `POST /notification/mark-all-read` - Mark all as read
- `DELETE /notification/:id` - Delete notification
- `GET /notification/unread-count` - Get unread count

### WebSocket Events

#### Connection
```typescript
const socket = io('http://localhost:3000/ws', {
  auth: { token: accessToken }
});
```

#### Events
- `friend.online` - Friend came online
- `friend.offline` - Friend went offline
- `friend.requested` - New friend request
- `friend.accepted` - Request accepted
- `transaction.created` - New transaction
- `transaction.updated` - Transaction updated
- `notification.new` - New notification

**📖 Full Documentation:** [View Complete Docs](https://celestial-0.github.io/Peerpay/)

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run unit tests
npm run test

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

### Mobile App Tests

```bash
cd frontend/mobile

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Dashboard Tests

```bash
cd frontend/dashboard

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

---

## 🚀 Deployment

### Backend Deployment

#### Using Docker

```bash
cd backend

# Build image
docker build -t peerpay-backend .

# Run container
docker run -p 3000:3000 --env-file .env peerpay-backend
```

#### Using PM2

```bash
cd backend

# Build
npm run build

# Start with PM2
pm2 start dist/main.js --name peerpay-backend
```

### Mobile App Deployment

#### iOS

```bash
cd frontend/mobile

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

#### Android

```bash
cd frontend/mobile

# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

### Dashboard Deployment

#### Vercel (Recommended)

```bash
cd frontend/dashboard

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Docker

```bash
cd frontend/dashboard

# Build image
docker build -t peerpay-dashboard .

# Run container
docker run -p 3001:3000 peerpay-dashboard
```

---

## 🔒 Security

### Authentication & Authorization
- ✅ JWT access tokens (15 min expiry)
- ✅ JWT refresh tokens (7 day expiry)
- ✅ Token versioning for forced logout
- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ Biometric authentication (mobile)

### Data Protection
- ✅ Password excluded from all responses
- ✅ Input validation with Zod
- ✅ MongoDB injection prevention
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ HTTPS in production

### Best Practices
- ✅ Environment variable secrets
- ✅ Secure token storage
- ✅ API request encryption
- ✅ Regular security audits
- ✅ Dependency vulnerability scanning

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** Cannot connect to backend from mobile app  
**Solution:** Ensure you're using the correct IP address (not localhost) in EXPO_PUBLIC_API_URL

**Issue:** WebSocket connection fails  
**Solution:** Check CORS configuration and ensure JWT token is valid

**Issue:** MongoDB connection error  
**Solution:** Verify MongoDB is running and MONGODB_URI is correct

**Issue:** Expo app crashes on startup  
**Solution:** Clear cache with `npx expo start -c`

**Issue:** Dashboard build fails  
**Solution:** Delete `.next` folder and `node_modules`, then reinstall

---

## 📈 Roadmap

### Phase 1 - MVP (Current)
- [x] Basic authentication
- [x] Friend system
- [x] Transaction tracking
- [x] Real-time notifications
- [ ] Mobile app UI polish
- [ ] Admin dashboard basics

### Phase 2 - Enhancement
- [ ] Payment gateway integration
- [ ] Transaction receipts
- [ ] Email notifications
- [ ] Push notifications
- [ ] Transaction categories
- [ ] Analytics dashboard

### Phase 3 - Advanced Features
- [ ] Multi-currency support
- [ ] Payment reminders automation
- [ ] Transaction disputes
- [ ] Two-factor authentication
- [ ] Biometric payments
- [ ] Voice commands

### Phase 4 - Scale
- [ ] Microservices architecture
- [ ] Redis caching
- [ ] CDN integration
- [ ] Load balancing
- [ ] Advanced analytics
- [ ] Machine learning insights

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow existing code conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Use TypeScript strict mode

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Development Team

**Maintained By:** Peerpay Development Team  
**Lead Developer:** [Yash Kumar Singh](https://github.com/Celestial-0)  
**Contact:** yashkumarsingh@ieee.com

---

## 📞 Support

### Getting Help

- **Documentation:** [Complete Documentation](https://celestial-0.github.io/Peerpay/)
- **Bug Reports:** [GitHub Issues](https://github.com/Celestial-0/Peerpay/issues)
- **Feature Requests:** [GitHub Discussions](https://github.com/Celestial-0/Peerpay/discussions)
- **Security Issues:** Email yashkumarsingh@ieee.com

---

## 🙏 Acknowledgments

- **NestJS** - Amazing backend framework
- **Expo** - Simplifying React Native development
- **Next.js** - Powerful React framework
- **MongoDB** - Flexible database solution
- **Socket.IO** - Real-time communication
- **shadcn/ui** - Beautiful UI components

---

<div align="center">

### 🎉 Thank you for using Peerpay Ledger!

**Built with ❤️ using React Native, Next.js, NestJS, and MongoDB**

[⭐ Star on GitHub](https://github.com/Celestial-0/Peerpay) | [📖 Documentation](https://celestial-0.github.io/Peerpay/) | [🐛 Report Bug](https://github.com/Celestial-0/Peerpay/issues) | [💡 Request Feature](https://github.com/Celestial-0/Peerpay/discussions)

---

**Version:** 0.0.1  
**Last Updated:** November 6, 2025

**Made with ❤️ by [Yash Kumar Singh](https://github.com/Celestial-0)**

</div>
