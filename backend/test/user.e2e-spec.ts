import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import {
  TEST_USERS,
  createUserAndLogin,
  getAuthHeaders,
} from './helpers/test-helpers';
import {
  UserProfileResponse,
  UserSearchResponse,
} from './types/test-response.types';

describe('UserController (e2e)', () => {
  let app: INestApplication<App>;
  let user1Token: string;
  let user1Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.useGlobalPipes(new ZodValidationPipe());
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector));

    await app.init();

    // Create two test users
    const user1 = await createUserAndLogin(app, TEST_USERS.user1);
    user1Token = user1.accessToken;
    user1Id = user1.userId;

    // Create user2 for search tests
    await createUserAndLogin(app, TEST_USERS.user2);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/user/profile (GET)', () => {
    it('should get current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/profile')
        .set(getAuthHeaders(user1Token))
        .expect(200);

      const body = response.body as UserProfileResponse;
      expect(body).toHaveProperty('_id');
      expect(body.email).toBe(TEST_USERS.user1.email);
      expect(body.name).toBe(TEST_USERS.user1.name);
      expect(body).not.toHaveProperty('password');
      expect(body).toHaveProperty('totalLent');
      expect(body).toHaveProperty('totalBorrowed');
      expect(body).toHaveProperty('netBalance');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/user/profile').expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/user/profile (PATCH)', () => {
    it('should update user profile name', async () => {
      const response = await request(app.getHttpServer())
        .patch('/user/profile')
        .set(getAuthHeaders(user1Token))
        .send({
          name: 'Updated Name',
        })
        .expect(200);

      const body = response.body as UserProfileResponse;
      expect(body.name).toBe('Updated Name');
    });

    it('should update user profile phone', async () => {
      const response = await request(app.getHttpServer())
        .patch('/user/profile')
        .set(getAuthHeaders(user1Token))
        .send({
          phone: '+1234567890',
        })
        .expect(200);

      const body = response.body as UserProfileResponse;
      expect(body.phone).toBe('+1234567890');
    });

    it('should fail with invalid phone format', async () => {
      await request(app.getHttpServer())
        .patch('/user/profile')
        .set(getAuthHeaders(user1Token))
        .send({
          phone: 'invalid-phone',
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .patch('/user/profile')
        .send({
          name: 'New Name',
        })
        .expect(401);
    });
  });

  describe('/user/search (GET)', () => {
    it('should search users by email', async () => {
      const response = await request(app.getHttpServer())
        .get(`/user/search?search=${TEST_USERS.user2.email}`)
        .set(getAuthHeaders(user1Token))
        .expect(200);

      const body = response.body as UserSearchResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      const foundUser = body.find(
        (u: UserSearchResponse) => u.email === TEST_USERS.user2.email,
      );
      expect(foundUser).toBeDefined();
    });

    it('should search users by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/search')
        .query({ search: 'Test User' })
        .set(getAuthHeaders(user1Token))
        .expect(200);

      const body = response.body as UserSearchResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/search?search=nonexistentuser12345')
        .set(getAuthHeaders(user1Token))
        .expect(200);

      const body = response.body as UserSearchResponse[];
      expect(Array.isArray(body)).toBe(true);
    });

    it('should not return current user in search results', async () => {
      const response = await request(app.getHttpServer())
        .get(`/user/search?search=${TEST_USERS.user1.email}`)
        .set(getAuthHeaders(user1Token))
        .expect(200);

      const body = response.body as UserSearchResponse[];
      const foundSelf = body.find((u: UserSearchResponse) => u._id === user1Id);
      expect(foundSelf).toBeUndefined();
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/user/search')
        .query({ search: 'test' })
        .expect(401);
    });
  });

  describe('/user/ledger (PATCH)', () => {
    it('should update balance correctly', async () => {
      const response = await request(app.getHttpServer())
        .patch('/user/ledger')
        .set(getAuthHeaders(user1Token))
        .send({
          totalLent: 100,
          totalBorrowed: 50,
        })
        .expect(200);

      const body = response.body as UserProfileResponse;
      expect(body.totalLent).toBe(100);
      expect(body.totalBorrowed).toBe(50);
      expect(body.netBalance).toBe(50);
    });

    it('should fail with negative values', async () => {
      await request(app.getHttpServer())
        .patch('/user/ledger')
        .set(getAuthHeaders(user1Token))
        .send({
          totalLent: -100,
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .patch('/user/ledger')
        .send({
          totalLent: 100,
        })
        .expect(401);
    });
  });

  describe('/user/profile (DELETE)', () => {
    let user3Token: string;

    beforeAll(async () => {
      // Create a user specifically for deletion test
      const user3 = await createUserAndLogin(app, TEST_USERS.user3);
      user3Token = user3.accessToken;
    });

    it('should delete user account', async () => {
      await request(app.getHttpServer())
        .delete('/user/profile')
        .set(getAuthHeaders(user3Token))
        .expect(204);
    });

    it('should fail to access deleted account', async () => {
      await request(app.getHttpServer())
        .get('/user/profile')
        .set(getAuthHeaders(user3Token))
        .expect(401);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).delete('/user/profile').expect(401);
    });
  });
});
