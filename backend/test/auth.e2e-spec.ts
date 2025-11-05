import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { TEST_USERS } from './helpers/test-helpers';
import {
  AuthSignupResponse,
  AuthSigninResponse,
  AuthRefreshResponse,
} from './types/test-response.types';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let refreshToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/signup (POST)', () => {
    it('should successfully create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(TEST_USERS.user1)
        .expect(201);

      const body = response.body as AuthSignupResponse;
      expect(body).toHaveProperty('user');
      expect(body.user).toHaveProperty('_id');
      expect(body.user.email).toBe(TEST_USERS.user1.email);
      expect(body.user.name).toBe(TEST_USERS.user1.name);
      expect(body.user).not.toHaveProperty('password');
    });

    it('should fail with duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(TEST_USERS.user1)
        .expect(409);
    });

    it('should fail with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'Test@1234',
          name: 'Test User',
        })
        .expect(400);
    });

    it('should fail with short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'short',
          name: 'Test User',
        })
        .expect(400);
    });

    it('should fail with missing name', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'Test@1234',
        })
        .expect(400);
    });
  });

  describe('/auth/signin (POST)', () => {
    it('should successfully sign in with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: TEST_USERS.user1.email,
          password: TEST_USERS.user1.password,
        })
        .expect(200);

      const body = response.body as AuthSigninResponse;
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe(TEST_USERS.user1.email);

      // Store tokens for later tests
      accessToken = body.accessToken;
      refreshToken = body.refreshToken;
    });

    it('should fail with incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: TEST_USERS.user1.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should fail with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@1234',
        })
        .expect(401);
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({});

      // Should return 400 or 401 depending on validation
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should successfully refresh access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      const body = response.body as AuthRefreshResponse;
      expect(body).toHaveProperty('accessToken');
      expect(body.accessToken).toBeDefined();
      // Token might be the same if generated quickly, just verify it exists
      expect(typeof body.accessToken).toBe('string');

      // Update access token
      accessToken = body.accessToken;
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should fail without refresh token', async () => {
      await request(app.getHttpServer()).post('/auth/refresh').expect(401);
    });
  });

  describe('/auth/signout (POST)', () => {
    it('should successfully sign out', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as { message: string };
      expect(body).toHaveProperty('message');
    });

    it('should fail without access token', async () => {
      await request(app.getHttpServer()).post('/auth/signout').expect(401);
    });

    it('should fail with invalid access token', async () => {
      await request(app.getHttpServer())
        .post('/auth/signout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/invalidate-tokens (POST)', () => {
    let newAccessToken: string;

    beforeAll(async () => {
      // Sign in again to get fresh tokens
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: TEST_USERS.user1.email,
          password: TEST_USERS.user1.password,
        })
        .expect(200);

      const body = response.body as AuthSigninResponse;
      newAccessToken = body.accessToken;
    });

    it('should successfully invalidate all tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/invalidate-tokens')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      const body = response.body as { message: string };
      expect(body).toHaveProperty('message');
      expect(body.message).toContain('tokens destroyed');
    });

    it('should fail to use old token after invalidation', async () => {
      await request(app.getHttpServer())
        .post('/auth/signout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(401);
    });

    it('should fail without access token', async () => {
      await request(app.getHttpServer())
        .post('/auth/invalidate-tokens')
        .expect(401);
    });
  });
});
