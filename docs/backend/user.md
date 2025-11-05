
# 👤 User Module

**Version:** 0.0.1  

---

## Overview

The User Module manages user profiles, account settings, ledger balances, and user search functionality. It integrates with the Auth module for authentication and the Realtime module for online status tracking.

### Key Features

- ✅ **Profile Management** - Name, avatar, phone number updates
- ✅ **Ledger Tracking** - totalLent, totalBorrowed, netBalance
- ✅ **User Search** - Find users with online status filtering
- ✅ **Password Security** - Auto-hashing, excluded from responses
- ✅ **Friend Management** - Friends list and pending requests
- ✅ **Account Operations** - Update profile, delete account
- ✅ **Balance Recalculation** - Helper methods for ledger updates

---

## Architecture

### Module Structure

```
src/user/
├── user.module.ts           # Module definition
├── user.controller.ts       # HTTP endpoints
├── user.service.ts          # Business logic
├── entities/
│   └── user.entity.ts       # TypeORM entity
└── dto/
    ├── update-profile.dto.ts
    └── update-ledger.dto.ts
```

### Entity Schema

```typescript
@Entity('users')
export class User {
  // Identity
  @ObjectIdColumn()
  _id: ObjectId;
  
  @Column({ unique: true })
  email: string;
  
  @Column({ select: false })
  password: string;
  
  @Column()
  name: string;
  
  @Column({ nullable: true })
  avatar?: string;
  
  @Column({ nullable: true })
  phone?: string;
  
  // Friends
  @Column({ type: 'array', default: [] })
  friends: ObjectId[];
  
  @Column({ type: 'array', default: [] })
  pendingRequests: ObjectId[];
  
  // Ledger
  @Column({ type: 'decimal', default: 0 })
  totalLent: number;
  
  @Column({ type: 'decimal', default: 0 })
  totalBorrowed: number;
  
  @Column({ type: 'decimal', default: 0 })
  netBalance: number;
  
  // Security
  @Column({ default: 0 })
  tokenVersion: number;
  
  @Column({ nullable: true })
  refreshTokenHash?: string;
  
  // Activity
  @Column({ nullable: true })
  lastLogin?: Date;
  
  @Column({ default: true })
  isActive: boolean;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## API Endpoints

### 1. Get Current User Profile


**GET** `/user/profile`

Retrieve the authenticated user's profile.


**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatars/user.jpg",
  "phone": "+1234567890",
  "friends": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "pendingRequests": ["507f1f77bcf86cd799439014"],
  "totalLent": 1500.00,
  "totalBorrowed": 500.00,
  "netBalance": 1000.00,
  "lastLogin": "2024-11-06T00:00:00.000Z",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-11-06T00:00:00.000Z"
}
```

**Notes:**
- Password is automatically excluded from response
- `netBalance` = `totalLent` - `totalBorrowed`
- Positive balance means user is owed money
- Negative balance means user owes money

---

### 2. Update User Profile


**PATCH** `/user/profile`

Update user profile information.


**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "name": "John Smith",
  "avatar": "https://example.com/avatars/new-avatar.jpg",
  "phone": "+1987654321"
}
```

**Validation Rules:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | ❌ | Min 2 chars, max 100 chars |
| `avatar` | string | ❌ | Valid URL format |
| `phone` | string | ❌ | Valid phone format |

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Smith",
  "avatar": "https://example.com/avatars/new-avatar.jpg",
  "phone": "+1987654321",
  "updatedAt": "2024-11-06T00:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid or missing token

---

### 3. Delete User Account


**DELETE** `/user/profile`

Permanently delete user account and all associated data.


**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "message": "Account deleted successfully"
}
```

**Warning:**
> **⚠️ Destructive Operation**
> 
> This action is **irreversible** and will:
> - Delete user profile
> - Remove all friendships
> - Delete all transactions
> - Remove all notifications
> - Invalidate all tokens

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User not found

---

### 4. Search Users


**GET** `/user/search`

Search for users by name or email with optional online status filter.


**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | ✅ | Search term (name or email) |
| `onlineOnly` | boolean | ❌ | Filter to only online users |
| `limit` | number | ❌ | Max results (default: 20, max: 100) |
| `offset` | number | ❌ | Pagination offset (default: 0) |

**Example Request:**

```
GET /user/search?query=john&onlineOnly=true&limit=10
```

**Response:** `200 OK`

```json
{
  "users": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatars/john.jpg",
      "isOnline": true,
      "isFriend": false
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "Johnny Smith",
      "email": "johnny@example.com",
      "avatar": "https://example.com/avatars/johnny.jpg",
      "isOnline": true,
      "isFriend": true
    }
  ],
  "total": 2,
  "limit": 10,
  "offset": 0
}
```

**Search Behavior:**
- Case-insensitive search
- Matches partial names and emails
- Excludes current user from results
- Integrates with Realtime module for online status
- Returns friendship status for each user

---

### 5. Update Ledger Balances


**PATCH** `/user/ledger`

Update user's ledger balances (internal use).


**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "totalLent": 2000.00,
  "totalBorrowed": 750.00
}
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "totalLent": 2000.00,
  "totalBorrowed": 750.00,
  "netBalance": 1250.00,
  "updatedAt": "2024-11-06T00:00:00.000Z"
}
```

**Notes:**
- `netBalance` is automatically calculated
- Typically called by Transaction module
- Validates balance consistency

---

## User Entity Details

### Identity Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | MongoDB unique identifier |
| `email` | string | Unique email address (login credential) |
| `password` | string | Bcrypt hashed password (excluded from responses) |
| `name` | string | User's display name |
| `avatar` | string | Profile picture URL (optional) |
| `phone` | string | Phone number (optional) |

### Friend Fields

| Field | Type | Description |
|-------|------|-------------|
| `friends` | ObjectId[] | Array of friend user IDs |
| `pendingRequests` | ObjectId[] | Incoming friend request IDs |

### Ledger Fields

| Field | Type | Description |
|-------|------|-------------|
| `totalLent` | decimal | Total amount user has lent |
| `totalBorrowed` | decimal | Total amount user has borrowed |
| `netBalance` | decimal | Net balance (lent - borrowed) |

### Security Fields

| Field | Type | Description |
|-------|------|-------------|
| `tokenVersion` | number | Token version for forced logout |
| `refreshTokenHash` | string | Hashed refresh token for validation |

### Activity Fields

| Field | Type | Description |
|-------|------|-------------|
| `lastLogin` | Date | Last successful login timestamp |
| `isActive` | boolean | Account active status |
| `createdAt` | Date | Account creation timestamp |
| `updatedAt` | Date | Last update timestamp |

---

## Business Logic

### Password Hashing

Passwords are automatically hashed before insertion:

```typescript
@BeforeInsert()
async hashPassword() {
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
}
```

### Balance Recalculation

Helper method to recalculate net balance:

```typescript
recalculateBalance(): void {
  this.netBalance = this.totalLent - this.totalBorrowed;
}
```

**Usage:**

```typescript
user.totalLent += 500;
user.recalculateBalance();
await userRepository.save(user);
```

### Password Exclusion

Password is excluded from all queries by default:

```typescript
@Column({ select: false })
password: string;

// To include password (e.g., for authentication)
const user = await userRepository.findOne({
  where: { email },
  select: ['_id', 'email', 'password', 'name', 'tokenVersion'],
});
```

---

## Integration with Other Modules

### Auth Module Integration

```typescript
// User creation during signup
async signup(signupDto: SignupDto) {
  const user = this.userRepository.create({
    email: signupDto.email,
    password: signupDto.password, // Auto-hashed by entity
    name: signupDto.name,
    phone: signupDto.phone,
  });
  
  await this.userRepository.save(user);
  
  // Generate tokens
  const tokens = await this.authService.generateTokens(user);
  
  return { user, ...tokens };
}

// Password validation during login
async validateUser(email: string, password: string) {
  const user = await this.userRepository.findOne({
    where: { email },
    select: ['_id', 'email', 'password', 'tokenVersion'],
  });
  
  if (!user) return null;
  
  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? user : null;
}
```

### Realtime Module Integration

```typescript
// Check online status during user search
async searchUsers(query: string, currentUserId: string, onlineOnly: boolean) {
  let users = await this.userRepository.find({
    where: {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
      _id: { $ne: new ObjectId(currentUserId) },
    },
  });
  
  if (onlineOnly) {
    const onlineUserIds = await this.realtimeService.getOnlineUsers();
    users = users.filter(user => 
      onlineUserIds.includes(user._id.toString())
    );
  }
  
  return users.map(user => ({
    ...user,
    isOnline: this.realtimeService.isUserOnline(user._id.toString()),
  }));
}
```

### Friend Module Integration

```typescript
// Add friend to user's friends list
async addFriend(userId: string, friendId: string) {
  const user = await this.userRepository.findOne({ 
    where: { _id: new ObjectId(userId) } 
  });
  
  if (!user.friends.includes(new ObjectId(friendId))) {
    user.friends.push(new ObjectId(friendId));
    await this.userRepository.save(user);
  }
}

// Remove friend from user's friends list
async removeFriend(userId: string, friendId: string) {
  const user = await this.userRepository.findOne({ 
    where: { _id: new ObjectId(userId) } 
  });
  
  user.friends = user.friends.filter(
    id => id.toString() !== friendId
  );
  
  await this.userRepository.save(user);
}
```

### Transaction Module Integration

```typescript
// Update ledger balances after transaction
async updateLedgerBalances(
  userId: string,
  type: 'LENT' | 'BORROWED',
  amount: number
) {
  const user = await this.userRepository.findOne({ 
    where: { _id: new ObjectId(userId) } 
  });
  
  if (type === 'LENT') {
    user.totalLent += amount;
  } else {
    user.totalBorrowed += amount;
  }
  
  user.recalculateBalance();
  await this.userRepository.save(user);
  
  return user;
}
```

---

## Data Validation

### Update Profile DTO

```typescript
import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .optional(),
  
  avatar: z.string()
    .url('Avatar must be a valid URL')
    .optional(),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
```

### Update Ledger DTO

```typescript
import { z } from 'zod';

export const UpdateLedgerSchema = z.object({
  totalLent: z.number()
    .min(0, 'Total lent cannot be negative')
    .optional(),
  
  totalBorrowed: z.number()
    .min(0, 'Total borrowed cannot be negative')
    .optional(),
});

export type UpdateLedgerDto = z.infer<typeof UpdateLedgerSchema>;
```

---

## Security Considerations

### Password Security

```typescript
// Never expose password in responses
@Exclude()
password: string;

// Use class-transformer to strip password
import { classToPlain } from 'class-transformer';

const sanitizedUser = classToPlain(user);
```

### Data Privacy

- Users can only view their own profile
- Search results exclude sensitive data
- Email visibility controlled by privacy settings

### Account Deletion

```typescript
async deleteAccount(userId: string) {
  // Start transaction
  const session = await this.connection.startSession();
  session.startTransaction();
  
  try {
    // Delete user
    await this.userRepository.delete({ _id: new ObjectId(userId) });
    
    // Delete related data
    await this.friendshipRepository.delete({
      $or: [
        { user: new ObjectId(userId) },
        { friend: new ObjectId(userId) },
      ],
    });
    
    await this.transactionRepository.delete({
      $or: [
        { from: new ObjectId(userId) },
        { to: new ObjectId(userId) },
      ],
    });
    
    await this.notificationRepository.delete({
      recipient: new ObjectId(userId),
    });
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## Performance Optimization

### Indexing Strategy

```typescript
@Entity('users')
@Index(['email'], { unique: true })
@Index(['name'])
@Index(['friends'])
export class User {
  // ...
}
```

**Recommended Indexes:**

| Field | Type | Reason |
|-------|------|--------|
| `email` | Unique | Fast login lookups |
| `name` | Regular | User search optimization |
| `friends` | Regular | Friend list queries |
| `createdAt` | Regular | Sorting by registration date |

### Query Optimization

```typescript
// Use projection to limit returned fields
async findUserBasicInfo(userId: string) {
  return this.userRepository.findOne({
    where: { _id: new ObjectId(userId) },
    select: ['_id', 'name', 'email', 'avatar'],
  });
}

// Use lean queries for read-only operations
async searchUsersLean(query: string) {
  return this.userRepository
    .createQueryBuilder('user')
    .select(['user._id', 'user.name', 'user.email', 'user.avatar'])
    .where('user.name LIKE :query OR user.email LIKE :query', { 
      query: `%${query}%` 
    })
    .limit(20)
    .getMany();
}
```

### Caching Strategy

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}
  
  async findById(userId: string): Promise<User> {
    const cacheKey = `user:${userId}`;
    
    // Check cache first
    let user = await this.cacheManager.get<User>(cacheKey);
    
    if (!user) {
      user = await this.userRepository.findOne({
        where: { _id: new ObjectId(userId) },
      });
      
      if (user) {
        // Cache for 5 minutes
        await this.cacheManager.set(cacheKey, user, 300);
      }
    }
    
    return user;
  }
  
  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { _id: new ObjectId(userId) },
    });
    
    Object.assign(user, updateDto);
    await this.userRepository.save(user);
    
    // Invalidate cache
    await this.cacheManager.del(`user:${userId}`);
    
    return user;
  }
}
```

---

## Testing

### Unit Tests

```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();
    
    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });
  
  it('should hash password before saving', async () => {
    const user = new User();
    user.password = 'plaintext';
    
    await user.hashPassword();
    
    expect(user.password).not.toBe('plaintext');
    expect(await bcrypt.compare('plaintext', user.password)).toBe(true);
  });
  
  it('should recalculate balance correctly', () => {
    const user = new User();
    user.totalLent = 1000;
    user.totalBorrowed = 300;
    
    user.recalculateBalance();
    
    expect(user.netBalance).toBe(700);
  });
  
  it('should exclude password from response', async () => {
    const user = await service.findById('507f1f77bcf86cd799439011');
    
    expect(user.password).toBeUndefined();
  });
});
```

### Integration Tests

```typescript
describe('User Endpoints (e2e)', () => {
  it('GET /user/profile - should return user profile', () => {
    return request(app.getHttpServer())
      .get('/user/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe('test@example.com');
        expect(res.body.password).toBeUndefined();
      });
  });
  
  it('PATCH /user/profile - should update profile', () => {
    return request(app.getHttpServer())
      .patch('/user/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Name' })
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toBe('Updated Name');
      });
  });
  
  it('GET /user/search - should find users', () => {
    return request(app.getHttpServer())
      .get('/user/search?query=john')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.users)).toBe(true);
      });
  });
});
```

---

## Error Handling

### Common Error Codes

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| `400` | `VALIDATION_ERROR` | Invalid input data | Check validation rules |
| `401` | `UNAUTHORIZED` | Missing/invalid token | Authenticate first |
| `404` | `USER_NOT_FOUND` | User doesn't exist | Verify user ID |
| `409` | `EMAIL_EXISTS` | Duplicate email | Use different email |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Name must be at least 2 characters"
    }
  ],
  "timestamp": "2024-11-06T00:00:00.000Z",
  "path": "/user/profile"
}
```

---

## Best Practices

### Profile Updates

```typescript
// ✅ Good: Partial updates
await userService.updateProfile(userId, { name: 'New Name' });

// ❌ Bad: Full object replacement
await userService.updateProfile(userId, {
  name: 'New Name',
  email: user.email,
  // ... all other fields
});
```

### Balance Management

```typescript
// ✅ Good: Use helper method
user.totalLent += amount;
user.recalculateBalance();
await userRepository.save(user);

// ❌ Bad: Manual calculation
user.totalLent += amount;
user.netBalance = user.totalLent - user.totalBorrowed;
await userRepository.save(user);
```

### Search Optimization

```typescript
// ✅ Good: Limit results and use indexes
const users = await userService.searchUsers(query, currentUserId, {
  limit: 20,
  onlineOnly: true,
});

// ❌ Bad: Fetch all users
const allUsers = await userRepository.find();
const filtered = allUsers.filter(u => u.name.includes(query));
```

---

## Related Modules

- [Auth Module](./auth.md) - Authentication and authorization
- [Friend Module](./friend.md) - Friend management
- [Transaction Module](./transaction.md) - Ledger balance updates
- [Realtime Module](./realtime.md) - Online status tracking

---

**Last Updated:** November 6, 2025  
**Maintained By:** Celestial
