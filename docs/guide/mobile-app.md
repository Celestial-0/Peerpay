# Mobile App

## Overview

The Peerpay Ledger Mobile App is a beautiful, intuitive mobile application built with **React Native** and **Expo** for both iOS and Android platforms. It provides users with a seamless experience for managing peer-to-peer money lending and borrowing.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo** | Development platform and tooling |
| **TypeScript** | Type-safe development |
| **React Navigation** | Navigation and routing |
| **Axios** | HTTP client for API calls |
| **Socket.IO Client** | Real-time WebSocket communication |
| **AsyncStorage** | Local data persistence |
| **Expo SecureStore** | Secure token storage |
| **React Native Reanimated** | Smooth animations |
| **Expo Notifications** | Push notifications |

## Key Features

### 🔐 Authentication & Security

#### Secure Login
- Email and password authentication
- JWT token management with automatic refresh
- Secure token storage using Expo SecureStore
- Biometric authentication (Face ID / Touch ID)
- Auto-login on app launch

#### Session Management
- Automatic token refresh before expiry
- Logout from all devices functionality
- Session timeout handling
- Secure credential storage

### 👤 User Profile

#### Profile Management
- View and edit profile information
- Update name, email, phone number
- Upload and change profile avatar
- View account statistics
- Delete account option

#### Ledger Overview
- **Total Lent** - Amount you've lent to friends
- **Total Borrowed** - Amount you've borrowed from friends
- **Net Balance** - Overall financial position
- Visual balance indicators
- Quick summary cards

### 👥 Friend Management

#### Friend Requests
- **Send Requests** - Find and add friends by email or username
- **Receive Requests** - Accept or reject incoming friend requests
- **Pending Requests** - View and manage outgoing requests
- **Cancel Requests** - Cancel sent friend requests
- Real-time request notifications

#### Friends List
- View all connected friends
- Online/offline status indicators
- Quick access to friend profiles
- Transaction history with each friend
- Remove friend option
- Search and filter friends

### 💰 Transaction Management

#### Create Transactions
- **Lent Money** - Record money you've lent to a friend
- **Borrowed Money** - Record money you've borrowed from a friend
- Enter amount with currency formatting
- Add optional remarks/notes
- Select friend from list
- Preview before submission

#### Transaction Workflow
1. **Create** - Initiate a transaction
2. **Pending** - Awaits friend's acceptance
3. **Accept/Reject** - Friend reviews and responds
4. **Completed** - Transaction finalized
5. **Balance Update** - Automatic ledger synchronization

#### Transaction History
- View all transactions (sent and received)
- Filter by type (lent/borrowed)
- Filter by status (pending/accepted/rejected)
- Filter by friend
- Sort by date or amount
- Detailed transaction view
- Transaction remarks and notes

#### Settlement Tracking
- View outstanding balances per friend
- Settlement suggestions
- Mark transactions as settled
- Settlement history

### 🔔 Notifications

#### Notification Types
- **Friend Requests** - New friend request received
- **Transaction Created** - Friend created a transaction
- **Transaction Accepted** - Your transaction was accepted
- **Transaction Rejected** - Your transaction was rejected
- **Reminders** - Payment reminders (upcoming feature)

#### Notification Features
- Real-time push notifications
- In-app notification center
- Unread count badge
- Mark as read/unread
- Delete notifications
- Notification history
- Deep linking to relevant screens

### ⚡ Real-time Features

#### Live Updates
- Friend online/offline status
- Instant transaction updates
- Real-time notification delivery
- Balance updates
- Multi-device synchronization

#### WebSocket Connection
- Automatic connection on login
- Reconnection on network recovery
- Connection status indicator
- Offline mode support
- Queue actions for when online

## User Interface

### Design Principles

#### Modern & Clean
- Material Design inspired
- Consistent color scheme
- Clear typography hierarchy
- Ample whitespace
- Intuitive iconography

#### User Experience
- Smooth animations and transitions
- Haptic feedback on interactions
- Loading states and skeletons
- Error handling with friendly messages
- Empty states with helpful guidance

### Screen Structure

#### Authentication Flow
```
Splash Screen
  ↓
Login / Signup
  ↓
Biometric Setup (optional)
  ↓
Main App
```

#### Main Navigation
```
Bottom Tab Navigator:
├── Home (Dashboard)
├── Friends
├── Transactions
├── Notifications
└── Profile
```

### Key Screens

#### 1. Dashboard (Home)
- Welcome message with user name
- Balance summary cards
  - Total Lent (green)
  - Total Borrowed (red)
  - Net Balance (blue/red)
- Recent transactions list
- Quick actions (Add Transaction, Add Friend)
- Friend activity feed

#### 2. Friends Screen
- Search bar for finding friends
- Tabs:
  - **All Friends** - List of connected friends
  - **Requests** - Pending friend requests (sent/received)
- Friend cards with:
  - Avatar and name
  - Online status
  - Balance with this friend
  - Quick action buttons

#### 3. Transactions Screen
- Filter and sort options
- Transaction list with cards showing:
  - Friend avatar and name
  - Amount (color-coded)
  - Type (lent/borrowed)
  - Status badge
  - Date and time
  - Remarks preview
- Floating action button to create transaction

#### 4. Notifications Screen
- Unread count in header
- Mark all as read button
- Notification cards with:
  - Icon based on type
  - Title and message
  - Timestamp
  - Read/unread indicator
  - Swipe to delete
- Empty state when no notifications

#### 5. Profile Screen
- Profile header with avatar
- User information
- Ledger statistics
- Settings options:
  - Edit Profile
  - Change Password
  - Notification Settings
  - Biometric Settings
  - About
  - Logout
  - Delete Account

## Features in Detail

### Biometric Authentication

Enable Face ID or Touch ID for quick and secure access:

```typescript
// Biometric authentication flow
1. Check device capability
2. Request user permission
3. Store preference securely
4. Authenticate on app launch
5. Fallback to password if failed
```

**Benefits:**
- Faster login experience
- Enhanced security
- No need to remember password
- Works offline

### Offline Support

The app works seamlessly even without internet:

**Offline Capabilities:**
- View cached data (friends, transactions, profile)
- Queue actions (create transaction, send friend request)
- Sync when connection restored
- Offline indicator in UI

**Sync Strategy:**
```typescript
1. Detect network status
2. Queue offline actions
3. On reconnection:
   - Sync queued actions
   - Fetch latest data
   - Update local cache
   - Notify user of sync status
```

### Push Notifications

Stay updated with real-time push notifications:

**Setup:**
1. Request notification permissions
2. Register device for push notifications
3. Store push token on backend
4. Receive notifications via Expo Notifications

**Notification Actions:**
- Tap to open relevant screen
- Quick actions (Accept/Reject)
- Notification grouping
- Custom sounds and vibrations

## Development

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Physical device for testing (recommended)

### Setup

```bash
# Navigate to mobile app directory
cd mobile

# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android
```

### Project Structure

```
mobile/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API and WebSocket services
│   ├── store/           # State management (Redux/Context)
│   ├── utils/           # Utility functions
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript types
│   ├── constants/       # App constants
│   └── assets/          # Images, fonts, etc.
├── App.tsx              # Root component
├── app.json            # Expo configuration
└── package.json        # Dependencies
```

### Environment Configuration

Create `.env` file:

```bash
API_BASE_URL=http://localhost:3000
WS_URL=ws://localhost:3000
EXPO_PUBLIC_API_KEY=your_api_key
```

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
# Using Detox
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Login/Signup flow
- [ ] Biometric authentication
- [ ] Create and accept transaction
- [ ] Send and accept friend request
- [ ] Real-time notifications
- [ ] Offline mode
- [ ] Push notifications
- [ ] Profile updates
- [ ] Logout and session management

## Build & Deployment

### Development Build

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### Production Build

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### Submit to App Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## Performance Optimization

### Best Practices

- **Lazy Loading** - Load screens on demand
- **Image Optimization** - Use optimized images and caching
- **List Virtualization** - Use FlatList for long lists
- **Memoization** - Use React.memo and useMemo
- **Code Splitting** - Split bundles for faster load
- **Network Optimization** - Cache API responses

### Monitoring

- **Expo Analytics** - Track app usage
- **Sentry** - Error tracking and monitoring
- **Performance Metrics** - Monitor app performance

## Accessibility

- **Screen Reader Support** - VoiceOver and TalkBack
- **High Contrast Mode** - Support for accessibility settings
- **Font Scaling** - Respect system font size
- **Touch Targets** - Minimum 44x44pt touch areas
- **Color Contrast** - WCAG AA compliance

## Security

- **Secure Storage** - Use Expo SecureStore for tokens
- **SSL Pinning** - Prevent man-in-the-middle attacks
- **Input Validation** - Validate all user inputs
- **Biometric Auth** - Optional biometric authentication
- **Session Management** - Automatic token refresh and logout

## Troubleshooting

### Common Issues

**App won't start:**
```bash
# Clear cache
npx expo start -c
```

**Build fails:**
```bash
# Clear node modules
rm -rf node_modules
npm install
```

**Push notifications not working:**
- Check notification permissions
- Verify push token registration
- Test on physical device

## Future Features

- [ ] Group expense splitting
- [ ] Transaction attachments (receipts)
- [ ] Recurring reminders
- [ ] Multi-currency support
- [ ] Dark mode
- [ ] Widgets
- [ ] Apple Watch / Wear OS support
- [ ] Siri / Google Assistant shortcuts

## Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

## Support

For issues or questions:
- Open an issue on [GitHub](https://github.com/Celestial-0/Peerpay/issues)
- Check the [FAQ](/guide/faq)
- Contact support

---

Ready to start development? Check out the [Quick Start Guide](/guide/quick-start) or explore the [Backend API](/guide/backend-api).
