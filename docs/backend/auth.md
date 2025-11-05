
# 🔐 Authentication Module

**Version:** 0.0.1  

---

## Overview

The Authentication Module provides a robust, JWT-based authentication system with support for access and refresh tokens, token versioning, and forced logout capabilities. Built on NestJS with Passport.js integration.

### Key Features

- ✅ **JWT-based Authentication** - Secure token-based auth with access & refresh tokens
- ✅ **Local Strategy** - Email/password authentication
- ✅ **Token Versioning** - Force logout from all devices
- ✅ **Password Security** - Bcrypt hashing with salt rounds
- ✅ **Public Routes** - Decorator-based route protection bypass
- ✅ **Global Guards** - Automatic JWT validation on all routes
- ✅ **Token Invalidation** - Granular control over session management

---

## Architecture

### Module Structure

```
src/auth/
├── auth.module.ts                  # Module definition
├── auth.controller.ts              # HTTP endpoints
├── auth.service.ts                 # Business logic
├── auth.decorator.ts               # @Public(), @Auth(), @CurrentUser() decorators
├── strategies/
│   ├── jwt.strategy.ts             # JWT access token validation
│   ├── jwt-refresh.strategy.ts    # JWT refresh token validation
│   └── local.strategy.ts           # Email/password strategy
├── guards/
│   ├── jwt-auth.guard.ts           # JWT access token guard
│   ├── jwt-refresh-auth.guard.ts  # JWT refresh token guard
│   ├── local-auth.guard.ts         # Local auth guard
│   └── ws-jwt.guard.ts             # WebSocket JWT guard
├── interfaces/
│   ├── authenticated-user.interface.ts
│   ├── jwt-payload.interface.ts
│   ├── jwt-request.interface.ts
│   └── request-with-user.interface.ts
└── schema/
    └── auth.schema.ts              # Zod validation schemas
```

### Dependencies

```typescript
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
```

---

## API Endpoints

### 1. User Registration


**POST** `/auth/signup`

Register a new user account.


**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:** `201 Created`

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "createdAt": "2024-11-06T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Rules:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | ✅ | Valid email format, unique |
| `password` | string | ✅ | Min 8 chars, max 128 chars |
| `name` | string | ✅ | Min 2 chars |
| `phone` | string | ❌ | Optional (not in signup schema) |

**Error Responses:**

- `400 Bad Request` - Validation failed
- `409 Conflict` - Email already exists

---

### 2. User Login


**POST** `/auth/signin`

Authenticate user and receive tokens.


**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "lastLogin": "2024-11-06T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid credentials
- `404 Not Found` - User not found

---

### 3. Refresh Access Token


**POST** `/auth/refresh`

Obtain a new access token using refresh token.


**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`

```json
{
  "message": "Access token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** Only returns new access token, not refresh token.

**Error Responses:**

- `401 Unauthorized` - Invalid or expired refresh token
- `403 Forbidden` - Token version mismatch (forced logout)

---

### 4. Sign Out


**POST** `/auth/signout`

Sign out from current device.


**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "message": "Signed out successfully. All tokens have been invalidated."
}
```

**Behavior:**
- Sets user as inactive
- Increments tokenVersion (invalidates ALL tokens)
- Forces logout from all devices
- Requires re-authentication

---

### 5. Invalidate All Tokens


**POST** `/auth/invalidate-tokens`

Force logout from all devices.


**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "message": "All tokens invalidated successfully"
}
```

**Behavior:**
- Increments user's `tokenVersion`
- Invalidates all existing tokens across all devices
- Requires re-authentication

---

## Token System

### Access Token

**Purpose:** Short-lived token for API authentication  
**Lifetime:** 15 minutes  
**Storage:** Client-side (memory/localStorage)

**Payload:**

```json
{
  "sub": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "type": "access",
  "tokenVersion": 1,
  "iat": 1699228800,
  "exp": 1699229700
}
```

### Refresh Token

**Purpose:** Long-lived token for obtaining new access tokens  
**Lifetime:** 7 days  
**Storage:** Secure HTTP-only cookie (recommended)

**Payload:**

```json
{
  "sub": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "type": "refresh",
  "tokenVersion": 1,
  "iat": 1699228800,
  "exp": 1699833600
}
```

### Token Versioning

Token versioning prevents stale tokens from being used after forced logout:

```typescript
// User entity
@Column({ default: 0 })
tokenVersion: number;

// Validation in JWT strategy
if (payload.tokenVersion !== user.tokenVersion) {
  throw new UnauthorizedException('Token has been invalidated');
}
```

**Use Cases:**
- User changes password → increment version
- Security breach → invalidate all sessions
- Admin forces logout → increment version

---

## Security Features

### Password Hashing

```typescript
import * as bcrypt from 'bcrypt';

// Hash password on user creation
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Verify password on login
const isMatch = await bcrypt.compare(password, user.password);
```

### JWT Configuration

```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: '15m',        // Access token
    algorithm: 'HS256',
  },
});
```

**Environment Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for signing tokens | `your-super-secret-key-change-in-production` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `your-refresh-secret-key` |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |

---

## Guards & Decorators

### Global JWT Guard

Applied to all routes by default:

```typescript
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

### Authentication Decorators

#### @Public() Decorator

Bypass authentication for specific routes:

```typescript
import { Public } from './auth.decorator';

@Public()
@Post('signup')
async signup(@Body() signupDto: SignupDto) {
  return this.authService.signup(signupDto);
}
```

#### @Auth() Decorator

Shorthand for applying JWT authentication guard:

```typescript
import { Auth } from './auth.decorator';

@Auth()
@Get('profile')
async getProfile(@CurrentUser() user: AuthenticatedUser) {
  return this.userService.getProfile(user.userId);
}
```

#### @CurrentUser() Decorator

Extract authenticated user from request:

```typescript
import { CurrentUser } from './auth.decorator';

@Auth()
@Get('profile')
async getProfile(@CurrentUser() user: AuthenticatedUser) {
  // user contains { userId, email }
  return user;
}

// Extract specific field
@Auth()
@Get('profile')
async getProfile(@CurrentUser('userId') userId: string) {
  return userId;
}
```

**Implementation (auth.decorator.ts):**

```typescript
import { SetMetadata, UseGuards, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// @Public() - Skip authentication
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// @Auth() - Apply JWT guard
export const Auth = () => UseGuards(JwtAuthGuard);

// @CurrentUser() - Extract user from request
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

---

## Strategies

### Local Strategy

Validates email/password credentials:

```typescript
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
```

### JWT Strategy

Validates and extracts JWT payload:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findById(payload.sub);
    
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Invalid token');
    }
    
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
```

---

## Error Handling

### Common Error Codes

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| `400` | `BAD_REQUEST` | Invalid input data | Check validation rules |
| `401` | `UNAUTHORIZED` | Invalid credentials | Verify email/password |
| `401` | `TOKEN_EXPIRED` | Access token expired | Use refresh token |
| `403` | `TOKEN_INVALIDATED` | Token version mismatch | Re-authenticate |
| `404` | `USER_NOT_FOUND` | User doesn't exist | Check email |
| `409` | `EMAIL_EXISTS` | Duplicate email | Use different email |

### Error Response Format

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "timestamp": "2024-11-06T00:00:00.000Z",
  "path": "/auth/signin"
}
```

---

## Best Practices

### Client-Side Implementation

```typescript
// Store tokens securely
class AuthService {
  private accessToken: string | null = null;
  
  async login(email: string, password: string) {
    const response = await fetch('/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    // Store access token in memory
    this.accessToken = data.accessToken;
    
    // Store refresh token in HTTP-only cookie (server-side)
    // Or secure localStorage with encryption
    localStorage.setItem('refreshToken', data.refreshToken);
  }
  
  async refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    const data = await response.json();
    this.accessToken = data.accessToken;
  }
  
  async apiRequest(url: string, options: RequestInit = {}) {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.accessToken}`,
    };
    
    let response = await fetch(url, { ...options, headers });
    
    // Auto-refresh on 401
    if (response.status === 401) {
      await this.refreshAccessToken();
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      response = await fetch(url, { ...options, headers });
    }
    
    return response;
  }
}
```

### Security Recommendations

> **🔒 Production Checklist**
> 
> - [ ] Use strong JWT secrets (min 32 characters)
> - [ ] Enable HTTPS in production
> - [ ] Store refresh tokens in HTTP-only cookies
> - [ ] Implement rate limiting on auth endpoints
> - [ ] Add CSRF protection
> - [ ] Enable CORS with whitelist
> - [ ] Log authentication attempts
> - [ ] Implement account lockout after failed attempts
> - [ ] Use environment variables for secrets
> - [ ] Rotate JWT secrets periodically

---

## Testing

### Unit Tests

```typescript
describe('AuthService', () => {
  it('should hash password on signup', async () => {
    const password = 'Test123!';
    const user = await authService.signup({
      email: 'test@example.com',
      password,
      name: 'Test User',
    });
    
    expect(user.password).not.toBe(password);
    expect(await bcrypt.compare(password, user.password)).toBe(true);
  });
  
  it('should generate valid JWT tokens', async () => {
    const tokens = await authService.signin('test@example.com', 'Test123!');
    
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    
    const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
    expect(decoded.email).toBe('test@example.com');
  });
  
  it('should invalidate tokens on version increment', async () => {
    const user = await userService.findByEmail('test@example.com');
    const oldVersion = user.tokenVersion;
    
    await authService.invalidateAllTokens(user.id);
    
    const updatedUser = await userService.findById(user.id);
    expect(updatedUser.tokenVersion).toBe(oldVersion + 1);
  });
});
```

### Integration Tests

```typescript
describe('Auth Endpoints (e2e)', () => {
  it('POST /auth/signup - should create new user', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.user.email).toBe('newuser@example.com');
        expect(res.body.accessToken).toBeDefined();
      });
  });
  
  it('POST /auth/signin - should return tokens', () => {
    return request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
      });
  });
});
```

---

## Performance Considerations

### Token Size Optimization

- Keep JWT payload minimal
- Avoid storing large objects in tokens
- Use user ID references instead of full user objects

### Caching Strategy

```typescript
// Cache user data to reduce DB queries
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({...});
  }

  async validate(payload: any) {
    const cacheKey = `user:${payload.sub}`;
    let user = await this.cacheManager.get(cacheKey);
    
    if (!user) {
      user = await this.userService.findById(payload.sub);
      await this.cacheManager.set(cacheKey, user, 300); // 5 min cache
    }
    
    return user;
  }
}
```

---

## Migration Guide

### From Session-Based Auth

1. **Remove session middleware**
2. **Install JWT dependencies**
3. **Update login endpoint** to return tokens
4. **Replace session checks** with JWT validation
5. **Update client** to store and send tokens

### Breaking Changes

None - Initial implementation.

---

## Related Modules

- [User Module](./user.md) - User management and profiles
- [Notification Module](./notification.md) - Auth event notifications
- [Realtime Module](./realtime.md) - WebSocket authentication


---

## Support & Troubleshooting

### Common Issues

**Issue:** "Token has been invalidated"  
**Solution:** User's tokenVersion changed. Re-authenticate.

**Issue:** "JWT expired"  
**Solution:** Use refresh token to get new access token.

**Issue:** "Invalid signature"  
**Solution:** Verify JWT_SECRET matches between services.

---

**Last Updated:** November 6, 2025  
**Maintained By:** Celestial
