# Quick Start

Get Peerpay Ledger up and running in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.x ([Download](https://nodejs.org/))
- **MongoDB** >= 6.x ([Download](https://www.mongodb.com/try/download/community))
- **npm** or **yarn**
- **Git** ([Download](https://git-scm.com/))
- **Expo CLI** (for mobile development)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Celestial-0/Peerpay.git
cd Peerpay
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Application
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017
DB_NAME=peerpay_ledger

# JWT Secrets (use strong secrets in production)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3001,exp://192.168.1.x:8081
```

Start MongoDB:

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

Run the development server:

```bash
npm run start:dev
```

✅ Backend will be running at `http://localhost:3000`

### 3. Mobile App Setup

```bash
# Navigate to mobile app directory
cd ../frontend/mobile

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://192.168.1.x:3000/api
EXPO_PUBLIC_WS_URL=http://192.168.1.x:3000/ws

# App Configuration
EXPO_PUBLIC_APP_NAME=Peerpay Ledger
EXPO_PUBLIC_APP_VERSION=0.0.1
```

::: warning
Replace `192.168.1.x` with your actual local IP address. Don't use `localhost` as it won't work on physical devices.
:::

Start Expo development server:

```bash
npx expo start
```

Options:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your device

### 4. Web Dashboard Setup

```bash
# Navigate to dashboard directory
cd ../dashboard

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=http://localhost:3000/ws

# App Configuration
NEXT_PUBLIC_APP_NAME=Peerpay Admin
NEXT_PUBLIC_APP_VERSION=0.0.1
```

Run the development server:

```bash
npm run dev
```

✅ Dashboard will be running at `http://localhost:3001`

## Verify Installation

### Test Backend API

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-06T00:00:00.000Z"
}
```

### Test WebSocket Connection

Open browser console and run:

```javascript
const socket = io('http://localhost:3000/ws', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

## Next Steps

### For Developers

1. **Explore the API** - Check out the [Backend API Documentation](/backend/overview)
2. **Understand the Architecture** - Read about the [System Architecture](/guide/architecture)
3. **Run Tests** - Learn how to [run the test suite](/backend/testing)

### For Users

1. **Create an Account** - Register through the mobile app or dashboard
2. **Add Friends** - Send friend requests to connect with others
3. **Track Transactions** - Start recording money lent or borrowed

## Common Issues

### MongoDB Connection Error

**Problem:** Cannot connect to MongoDB

**Solution:**
```bash
# Check if MongoDB is running
mongosh

# If not running, start it
# Windows: mongod
# macOS/Linux: sudo systemctl start mongod
```

### Port Already in Use

**Problem:** Port 3000 is already in use

**Solution:**
```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000

# Kill the process or change PORT in .env
```

### Expo Cannot Connect

**Problem:** Mobile app cannot connect to backend

**Solution:**
- Ensure you're using your local IP address, not `localhost`
- Check that your device and computer are on the same network
- Verify backend is running and accessible
- Check firewall settings

### Module Not Found

**Problem:** Cannot find module errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

### Backend Development

```bash
cd backend

# Run in watch mode
npm run start:dev

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Build for production
npm run build
```

### Mobile App Development

```bash
cd frontend/mobile

# Start Expo
npx expo start

# Clear cache
npx expo start -c

# Run on specific platform
npx expo start --ios
npx expo start --android
```

### Dashboard Development

```bash
cd frontend/dashboard

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Getting Help

- 📖 [Full Documentation](/guide/introduction)
- 🐛 [Report Issues](https://github.com/Celestial-0/Peerpay/issues)
- 💬 [Discussions](https://github.com/Celestial-0/Peerpay/discussions)
- 📧 [Email Support](mailto:yashkumarsingh@ieee.com)
