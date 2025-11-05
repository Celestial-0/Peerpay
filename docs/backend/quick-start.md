# Backend Quick Start

Get the Peerpay Ledger backend up and running in minutes.

## Prerequisites

- **Node.js** >= 18.x
- **MongoDB** >= 6.x
- **npm** or **yarn**

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Celestial-0/Peerpay.git
cd Peerpay/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the backend directory:

```bash
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

# JWT Secrets (use strong secrets in production!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS (add your frontend URLs)
ALLOWED_ORIGINS=http://localhost:3001,exp://192.168.1.x:8081
```

::: warning Important
- Use strong, random secrets for JWT_SECRET and JWT_REFRESH_SECRET in production
- Minimum 32 characters recommended
- Never commit `.env` file to version control
:::

### 4. Start MongoDB

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6
```

Verify MongoDB is running:

```bash
mongosh
# Should connect successfully
```

### 5. Run the Development Server

```bash
npm run start:dev
```

You should see:

```
[Nest] 12345  - 11/06/2025, 12:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 11/06/2025, 12:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
...
[Nest] 12345  - 11/06/2025, 12:00:00 AM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 11/06/2025, 12:00:00 AM     LOG Application is running on: http://localhost:3000
```

✅ Backend is now running at `http://localhost:3000`

## Verify Installation

### Test Health Endpoint

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

### Test API Documentation

Open your browser and navigate to:
```
http://localhost:3000/api
```

You should see the Swagger API documentation.

## Create Your First User

### 1. Sign Up

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

Response:
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "name": "Test User",
    "createdAt": "2025-11-06T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Get User Profile

```bash
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Available Scripts

```bash
# Development
npm run start:dev          # Start in watch mode
npm run start:debug        # Start in debug mode

# Production
npm run build              # Build for production
npm run start:prod         # Start production server

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests

# Code Quality
npm run lint               # Lint code
npm run format             # Format code with Prettier
```

## Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication module
│   ├── user/              # User management
│   ├── friend/            # Friend system
│   ├── transaction/       # Transactions
│   ├── notification/      # Notifications
│   ├── realtime/          # WebSocket gateway
│   ├── common/            # Shared utilities
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry point
├── test/                  # E2E tests
├── .env.example           # Environment template
├── nest-cli.json          # NestJS CLI config
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

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
# Docker: docker start mongodb
```

### Port Already in Use

**Problem:** Port 3000 is already in use

**Solution:**
```bash
# Find and kill the process
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Or change the PORT in .env
PORT=3001
```

### Module Not Found

**Problem:** Cannot find module errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### JWT Secret Error

**Problem:** JWT secret is too short

**Solution:**
```bash
# Generate a strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<another-generated-secret>
```

## Development Workflow

### 1. Create a New Feature

```bash
# Create a new module
nest g module features/my-feature
nest g controller features/my-feature
nest g service features/my-feature
```

### 2. Write Tests

```bash
# Create test file
touch src/features/my-feature/my-feature.service.spec.ts

# Run tests
npm run test
```

### 3. Test Manually

Use tools like:
- **Postman** - API testing
- **Insomnia** - API testing
- **curl** - Command line testing
- **Swagger UI** - Built-in at `/api`

## Next Steps

- [Environment Configuration](/backend/environment) - Detailed environment setup
- [Authentication Module](/backend/auth) - Learn about authentication
- [User Module](/backend/user) - User management
- [API Reference](/backend/auth) - Complete API documentation

## Getting Help

- 📖 [Full Documentation](/backend/overview)
- 🐛 [Report Issues](https://github.com/Celestial-0/Peerpay/issues)
- 💬 [Discussions](https://github.com/Celestial-0/Peerpay/discussions)
- 📧 [Email Support](mailto:yashkumarsingh@ieee.com)
