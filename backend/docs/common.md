<link rel="stylesheet" href="styles.css">

# 🛠️ Common Module & Utilities

**Version:** 0.0.1  
**Status:** <span class="badge badge-status">Production Ready</span>

---

## Overview

The Common Module is a minimal shared module providing MongoDB query type helpers for TypeORM. Most shared functionality (guards, decorators, constants) is located in their respective feature modules.

### Key Features

- ✅ **MongoDB Query Types** - Type-safe MongoDB query helpers
- ✅ **ObjectId Utilities** - Safe ObjectId validation and conversion
- ✅ **Query Builders** - `$or`, `$in`, and ObjectId query helpers

### Important Notes

> **⚠️ Location of Shared Code:**
> - **Authentication decorators** (`@Public()`, `@Auth()`, `@CurrentUser()`) → `src/auth/auth.decorator.ts`
> - **Guards** (JWT, Local, Refresh, WebSocket) → `src/auth/guards/`
> - **Constants** (JWT, DB) → `src/constants.ts` (root level)
> - **Query Types** → `src/common/types/mongo-query.types.ts`

---

## Module Structure

```
src/common/
├── common.module.ts              # Module definition (empty)
└── types/
    └── mongo-query.types.ts      # MongoDB query type helpers

src/
└── constants.ts                  # Global constants (JWT, DB)
```

---

## MongoDB Query Type Helpers

Located in `src/common/types/mongo-query.types.ts`

### MongoQuery<T>

Type helper for TypeORM MongoDB queries with MongoDB-specific operators:

```typescript
export type MongoQuery<T> = FindOptionsWhere<T> & {
  $or?: Array<Partial<T>>;
  $and?: Array<Partial<T>>;
  $not?: Partial<T>;
};
```

### createOrQuery<T>()

Safe MongoDB `$or` query builder:

```typescript
import { createOrQuery } from '../common/types/mongo-query.types';

// Usage
const query = createOrQuery<User>([
  { email: 'user@example.com' },
  { name: 'John Doe' }
]);

const users = await userRepository.find({ where: query });
```

**Implementation:**

```typescript
export function createOrQuery<T>(conditions: Partial<T>[]): MongoQuery<T> {
  return { $or: conditions } as MongoQuery<T>;
}
```

---

### createObjectIdQuery<T>()

Safe ObjectId query builder with validation. Throws `BadRequestException` if ID format is invalid:

```typescript
import { createObjectIdQuery } from '../common/types/mongo-query.types';

// Usage
const query = createObjectIdQuery<User>('_id', userId);
const user = await userRepository.findOne({ where: query });
```

**Implementation:**

```typescript
export function createObjectIdQuery<T>(
  field: keyof T,
  id: string | ObjectId,
): FindOptionsWhere<T> {
  if (typeof id === 'string') {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
    const objectId = new ObjectId(id);
    return { [field]: objectId } as FindOptionsWhere<T>;
  }
  return { [field]: id } as FindOptionsWhere<T>;
}
```

---

### createInQuery<T>()

Safe MongoDB `$in` query builder for multiple ObjectIds:

```typescript
import { createInQuery } from '../common/types/mongo-query.types';

// Usage
const query = createInQuery<User>('_id', [userId1, userId2, userId3]);
const users = await userRepository.find({ where: query });
```

**Implementation:**

```typescript
export function createInQuery<T>(
  field: keyof T,
  ids: (string | ObjectId)[],
): FindOptionsWhere<T> {
  const objectIds = ids.map((id) => {
    if (typeof id === 'string') {
      if (!isValidObjectId(id)) {
        throw new BadRequestException(`Invalid ID format: ${id}`);
      }
      return new ObjectId(id);
    }
    return id;
  });
  return { [field]: { $in: objectIds } } as FindOptionsWhere<T>;
}
```

---

## Global Constants

Located in `src/constants.ts` (root level, not in common module)

### Available Constants

```typescript
// Database
const DB_NAME = process.env.NODE_ENV === 'production' ? 'peerpay' : 'peerpay-dev';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'a8f5e2c9d3b7e1f4a6c8d2e9b4f7a3c5e8d1b6f9a2c7e4d8b3f6a9c2e5d7b4f1a8';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'c3e9f2a5d8b1e4c7f9a2d6b3e8c1f5a9d2b7e4c8f1a6d9b2e5c7f3a8d1b6e9c4f2';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const IS_PUBLIC_KEY = process.env.IS_PUBLIC_KEY || 'isPublic';

export {
  DB_NAME,
  IS_PUBLIC_KEY,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
};
```

**Usage:**

```typescript
import { JWT_SECRET, DB_NAME } from './constants';

// In auth module
JwtModule.register({
  secret: JWT_SECRET,
  signOptions: { expiresIn: JWT_EXPIRES_IN }
});

// In app module
TypeOrmModule.forRoot({
  type: 'mongodb',
  url: `${process.env.MONGODB_URI}/${DB_NAME}?retryWrites=true&w=majority`,
  // ...
});
```

---

## Related Documentation

- **[Auth Module](./auth.md)** - Guards, decorators, and authentication
- **[User Module](./user.md)** - User entity and services
- **[Friend Module](./friend.md)** - Friend relationships
- **[Transaction Module](./transaction.md)** - Transaction management
- **[Notification Module](./notification.md)** - Notifications
- **[Realtime Module](./realtime.md)** - WebSocket events

---

**Last Updated:** November 6, 2025  
**Maintained By:** Celestial
