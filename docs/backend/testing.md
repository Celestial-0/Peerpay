# Testing Guide

**Version:** 0.0.1

---

## Overview

The Peerpay Ledger backend includes comprehensive testing infrastructure using Jest and Supertest for unit, integration, and end-to-end testing.

## Test Structure

```
backend/test/
├── helpers/
│   ├── db.helper.ts          # Database test utilities
│   └── test.helper.ts        # General test helpers
├── types/
│   └── test.types.ts         # Test type definitions
├── ui/
│   └── test-ui.ts            # Test UI utilities
├── app.e2e-spec.ts           # App-level E2E tests
├── auth.e2e-spec.ts          # Auth E2E tests
├── friend.e2e-spec.ts        # Friend E2E tests
├── notification.e2e-spec.ts  # Notification E2E tests
├── transaction.e2e-spec.ts   # Transaction E2E tests
└── user.e2e-spec.ts          # User E2E tests
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:cov
```

### E2E Tests
```bash
npm run test:e2e
```

### Specific Test File
```bash
npm test -- auth.e2e-spec
```

## Test Configuration

Tests are configured in `backend/test/jest-e2e.json`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

## Writing Tests

### Basic Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Feature (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should do something', () => {
    return request(app.getHttpServer())
      .get('/endpoint')
      .expect(200);
  });
});
```

### Using Test Helpers

```typescript
import { createTestUser, cleanupTestData } from './helpers/test.helper';
import { connectTestDb, closeTestDb } from './helpers/db.helper';

describe('User Tests', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await cleanupTestData();
    await closeTestDb();
  });

  it('should create a user', async () => {
    const user = await createTestUser({
      name: 'Test User',
      email: 'test@example.com'
    });
    
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});
```

## Test Database

Tests use a separate test database to avoid affecting production data:

- **Development DB:** `peerpay-dev`
- **Test DB:** `peerpay-test`

The test database is automatically cleaned up between test runs.

## Best Practices

### 1. Isolation
- Each test should be independent
- Clean up test data after each test
- Don't rely on test execution order

### 2. Descriptive Names
```typescript
// Good
it('should return 401 when token is invalid', () => {});

// Bad
it('test auth', () => {});
```

### 3. Arrange-Act-Assert
```typescript
it('should create a transaction', async () => {
  // Arrange
  const user = await createTestUser();
  const transactionData = { amount: 100, type: 'lend' };

  // Act
  const transaction = await createTransaction(user.id, transactionData);

  // Assert
  expect(transaction.amount).toBe(100);
  expect(transaction.type).toBe('lend');
});
```

### 4. Mock External Services
```typescript
jest.mock('../src/notification/notification.service');

it('should send notification', async () => {
  const notificationService = jest.fn();
  // Test logic
});
```

## Common Test Scenarios

### Authentication Tests
```typescript
describe('POST /auth/login', () => {
  it('should login with valid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'password' })
      .expect(200)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
      });
  });

  it('should reject invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'wrong' })
      .expect(401);
  });
});
```

### Protected Route Tests
```typescript
describe('GET /user/profile', () => {
  let authToken: string;

  beforeAll(async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'password' });
    
    authToken = response.body.access_token;
  });

  it('should get profile with valid token', () => {
    return request(app.getHttpServer())
      .get('/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });

  it('should reject without token', () => {
    return request(app.getHttpServer())
      .get('/user/profile')
      .expect(401);
  });
});
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Before deployment

## Troubleshooting

### Tests Failing Locally

1. **Database Connection Issues**
   ```bash
   # Check MongoDB is running
   mongod --version
   
   # Restart MongoDB
   sudo systemctl restart mongod
   ```

2. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

3. **Stale Test Data**
   ```bash
   # Drop test database
   mongo peerpay-test --eval "db.dropDatabase()"
   ```

### Timeout Errors

Increase Jest timeout in test files:
```typescript
jest.setTimeout(30000); // 30 seconds
```

## Next Steps

- [Backend Overview](/backend/overview)
- [Environment Setup](/backend/environment)
- [Deployment Guide](/guide/deploy-backend)

---

**Last Updated:** November 6, 2025  
**Maintained By:** Celestial
