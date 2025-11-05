# Environment Setup

This guide covers setting up environment variables and configuration for the Peerpay Ledger Backend API.

## Environment Variables

The backend requires several environment variables to function correctly. These are configured in a `.env` file in the backend directory.

## Quick Setup

### 1. Copy Example File

```bash
cd backend
cp .env.example .env
```

### 2. Edit Configuration

Open `.env` and configure the variables according to your environment.

## Required Variables

### Database Configuration

#### MONGODB_URI

MongoDB connection string.

**Development:**
```bash
MONGODB_URI=mongodb://localhost:27017/peerpay
```

**Production (MongoDB Atlas):**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/peerpay?retryWrites=true&w=majority
```

**Format:**
- Local: `mongodb://[host]:[port]/[database]`
- Atlas: `mongodb+srv://[username]:[password]@[cluster]/[database]`

**Notes:**
- Replace `username`, `password`, `cluster`, and `database` with your values
- Ensure IP whitelist is configured in MongoDB Atlas
- Use strong passwords for production

### JWT Configuration

#### JWT_SECRET

Secret key for signing access tokens.

```bash
JWT_SECRET=your_very_secure_secret_key_minimum_32_characters_long
```

**Requirements:**
- Minimum 32 characters
- Use random, cryptographically secure string
- Never commit to version control
- Different for each environment

**Generate secure secret:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

#### JWT_REFRESH_SECRET

Secret key for signing refresh tokens.

```bash
JWT_REFRESH_SECRET=your_different_very_secure_refresh_secret_minimum_32_characters
```

**Requirements:**
- Minimum 32 characters
- Must be different from JWT_SECRET
- Use random, cryptographically secure string
- Never commit to version control

**Generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Application Configuration

#### NODE_ENV

Application environment mode.

```bash
NODE_ENV=development
```

**Values:**
- `development` - Development mode with debug logging
- `production` - Production mode with optimizations
- `test` - Testing mode

**Effects:**
- Logging level
- Error messages detail
- Performance optimizations
- Debug features

#### PORT

Port number for the API server.

```bash
PORT=3000
```

**Default:** 3000

**Notes:**
- Use different ports for multiple instances
- Ensure port is not already in use
- Production deployments may use 80 or 443

## Optional Variables

### CORS Configuration

#### CORS_ORIGIN

Allowed origins for CORS requests.

```bash
# Single origin
CORS_ORIGIN=http://localhost:3001

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:3001,https://dashboard.peerpay.com,https://peerpay.com
```

**Default:** `*` (all origins - not recommended for production)

**Production:**
```bash
CORS_ORIGIN=https://dashboard.peerpay.com,https://app.peerpay.com
```

### Logging Configuration

#### LOG_LEVEL

Logging verbosity level.

```bash
LOG_LEVEL=info
```

**Values:**
- `error` - Only errors
- `warn` - Warnings and errors
- `info` - Info, warnings, and errors (default)
- `debug` - All logs including debug
- `verbose` - Very detailed logs

**Recommendations:**
- Development: `debug` or `verbose`
- Production: `info` or `warn`

### Rate Limiting

#### RATE_LIMIT_TTL

Time-to-live for rate limit window (in seconds).

```bash
RATE_LIMIT_TTL=900
```

**Default:** 900 (15 minutes)

#### RATE_LIMIT_MAX

Maximum requests per TTL window.

```bash
RATE_LIMIT_MAX=100
```

**Default:** 100 requests per 15 minutes

### Token Expiration

#### JWT_ACCESS_EXPIRATION

Access token expiration time.

```bash
JWT_ACCESS_EXPIRATION=15m
```

**Default:** 15m (15 minutes)

**Format:**
- `s` - seconds
- `m` - minutes
- `h` - hours
- `d` - days

**Examples:**
- `30s` - 30 seconds
- `15m` - 15 minutes
- `1h` - 1 hour
- `7d` - 7 days

#### JWT_REFRESH_EXPIRATION

Refresh token expiration time.

```bash
JWT_REFRESH_EXPIRATION=7d
```

**Default:** 7d (7 days)

**Recommendations:**
- Access: 15m - 1h
- Refresh: 7d - 30d

## Complete .env Example

### Development

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/peerpay

# JWT Secrets
JWT_SECRET=dev_secret_key_minimum_32_characters_long_random_string
JWT_REFRESH_SECRET=dev_refresh_secret_minimum_32_characters_different

# Application
NODE_ENV=development
PORT=3000

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:19006

# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_TTL=900
RATE_LIMIT_MAX=100

# Token Expiration
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### Production

```bash
# Database
MONGODB_URI=mongodb+srv://peerpay:SECURE_PASSWORD@cluster.mongodb.net/peerpay?retryWrites=true&w=majority

# JWT Secrets (use strong random strings)
JWT_SECRET=prod_a8f3d9e2b1c4f7a6e9d2c5b8a1f4e7d0c3b6a9f2e5d8c1b4a7f0e3d6c9b2a5f8
JWT_REFRESH_SECRET=prod_b9g4e0f3c2d5g8b7f0e3d6c9b2a5f8e1d4g7c0f3b6a9e2d5g8c1b4f7a0e3d6

# Application
NODE_ENV=production
PORT=3000

# CORS
CORS_ORIGIN=https://dashboard.peerpay.com,https://app.peerpay.com

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_TTL=900
RATE_LIMIT_MAX=100

# Token Expiration
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

## Environment-Specific Files

### Multiple Environments

Create separate env files:

```bash
.env.development
.env.staging
.env.production
.env.test
```

### Load Specific Environment

```bash
# Development
cp .env.development .env

# Production
cp .env.production .env
```

## Security Best Practices

### 1. Never Commit Secrets

Add to `.gitignore`:

```gitignore
# Environment files
.env
.env.local
.env.development
.env.production
.env.staging
.env.test
```

### 2. Use Strong Secrets

```bash
# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Rotate Secrets Regularly

- Change JWT secrets periodically
- Update database passwords
- Rotate API keys

### 4. Use Secret Management

**Production options:**
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager
- Railway/Render/Vercel environment variables

### 5. Limit Access

- Restrict who can view secrets
- Use role-based access control
- Audit secret access

## Validation

The application validates environment variables on startup.

### Required Variables Check

```typescript
// Automatically checked on startup
- MONGODB_URI
- JWT_SECRET
- JWT_REFRESH_SECRET
```

### Validation Errors

If required variables are missing:

```
Error: Missing required environment variables:
- JWT_SECRET
- MONGODB_URI
```

**Solution:** Add missing variables to `.env`

## Database Connection

### Local MongoDB

1. **Install MongoDB:**
   ```bash
   # macOS
   brew install mongodb-community
   
   # Ubuntu
   sudo apt install mongodb
   
   # Windows
   # Download from mongodb.com
   ```

2. **Start MongoDB:**
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Ubuntu
   sudo systemctl start mongodb
   
   # Windows
   # Start MongoDB service
   ```

3. **Configure:**
   ```bash
   MONGODB_URI=mongodb://localhost:27017/peerpay
   ```

### MongoDB Atlas (Cloud)

1. **Create Account:**
   - Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free

2. **Create Cluster:**
   - Choose free tier (M0)
   - Select region
   - Create cluster

3. **Configure Access:**
   - Database Access → Add user
   - Network Access → Add IP (0.0.0.0/0 for development)

4. **Get Connection String:**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string

5. **Configure:**
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/peerpay?retryWrites=true&w=majority
   ```

## Testing Configuration

### Test Environment

Create `.env.test`:

```bash
# Use separate test database
MONGODB_URI=mongodb://localhost:27017/peerpay_test

# Use test secrets
JWT_SECRET=test_secret_minimum_32_characters_long
JWT_REFRESH_SECRET=test_refresh_secret_minimum_32_characters

# Test mode
NODE_ENV=test
PORT=3001

# Disable rate limiting for tests
RATE_LIMIT_TTL=0
RATE_LIMIT_MAX=0
```

### Run Tests

```bash
# Tests automatically use .env.test
npm run test
npm run test:e2e
```

## Troubleshooting

### Connection Refused

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solutions:**
- Ensure MongoDB is running
- Check MONGODB_URI is correct
- Verify port is correct (default: 27017)
- Check firewall settings

### Authentication Failed

**Error:** `MongooseServerSelectionError: Authentication failed`

**Solutions:**
- Verify username and password
- Check user has correct permissions
- Ensure database name is correct

### Invalid JWT Secret

**Error:** `JWT_SECRET must be at least 32 characters`

**Solutions:**
- Generate new secret with minimum 32 characters
- Use crypto.randomBytes for secure generation

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ | - | MongoDB connection string |
| `JWT_SECRET` | ✅ | - | Access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | - | Refresh token secret (min 32 chars) |
| `NODE_ENV` | ❌ | `development` | Environment mode |
| `PORT` | ❌ | `3000` | Server port |
| `CORS_ORIGIN` | ❌ | `*` | Allowed CORS origins |
| `LOG_LEVEL` | ❌ | `info` | Logging verbosity |
| `RATE_LIMIT_TTL` | ❌ | `900` | Rate limit window (seconds) |
| `RATE_LIMIT_MAX` | ❌ | `100` | Max requests per window |
| `JWT_ACCESS_EXPIRATION` | ❌ | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRATION` | ❌ | `7d` | Refresh token expiry |

## Next Steps

- [Quick Start](/backend/quick-start) - Start development
- [Authentication](/backend/auth) - Learn about auth
- [Testing](/backend/testing) - Run tests
- [Deployment](/guide/deploy-backend) - Deploy to production

## Resources

- [MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

---

For more backend documentation, see [Backend Overview](/backend/overview).
