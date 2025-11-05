import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { createUserAndLogin, getAuthHeaders } from './helpers/test-helpers';
import {
  FriendRequestResponse,
  IncomingFriendRequestResponse,
  OutgoingFriendRequestResponse,
  FriendResponse,
} from './types/test-response.types';

describe('FriendController (e2e)', () => {
  let app: INestApplication<App>;
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let user3Token: string;
  let user3Id: string;
  let friendRequestId: string;

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

    // Create three test users for friend operations
    const user1 = await createUserAndLogin(app, {
      email: 'friend1@example.com',
      password: 'Test@1234',
      name: 'Friend User One',
    });
    user1Token = user1.accessToken;
    user1Id = user1.userId;

    const user2 = await createUserAndLogin(app, {
      email: 'friend2@example.com',
      password: 'Test@5678',
      name: 'Friend User Two',
    });
    user2Token = user2.accessToken;
    user2Id = user2.userId;

    const user3 = await createUserAndLogin(app, {
      email: 'friend3@example.com',
      password: 'Test@9012',
      name: 'Friend User Three',
    });
    user3Token = user3.accessToken;
    user3Id = user3.userId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/friend/request (POST)', () => {
    it('should send a friend request', async () => {
      const response = await request(app.getHttpServer())
        .post('/friend/request')
        .set(getAuthHeaders(user1Token))
        .send({
          receiverId: user2Id,
        })
        .expect(201);

      const body = response.body as FriendRequestResponse;
      expect(body).toHaveProperty('_id');
      expect(body.senderId).toBeDefined();
      expect(body.receiverId).toBeDefined();
      expect(body.status).toBe('pending');

      // Store request ID for later tests
      friendRequestId = body._id;
    });

    it('should fail to send duplicate friend request', async () => {
      await request(app.getHttpServer())
        .post('/friend/request')
        .set(getAuthHeaders(user1Token))
        .send({
          receiverId: user2Id,
        })
        .expect(409); // Conflict status for duplicate
    });

    it('should fail to send friend request to self', async () => {
      await request(app.getHttpServer())
        .post('/friend/request')
        .set(getAuthHeaders(user1Token))
        .send({
          receiverId: user1Id,
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/friend/request')
        .send({
          receiverId: user2Id,
        })
        .expect(401);
    });

    it('should fail with invalid receiver ID', async () => {
      await request(app.getHttpServer())
        .post('/friend/request')
        .set(getAuthHeaders(user1Token))
        .send({
          receiverId: '507f1f77bcf86cd799439011', // Valid ObjectId format but non-existent
        })
        .expect(404); // Not found for non-existent user
    });
  });

  describe('/friend/requests/incoming (GET)', () => {
    it('should get incoming friend requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/friend/requests/incoming')
        .set(getAuthHeaders(user2Token))
        .expect(200);

      const body = response.body as IncomingFriendRequestResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].status).toBe('pending');
    });

    it('should return empty array when no incoming requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/friend/requests/incoming')
        .set(getAuthHeaders(user3Token))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/friend/requests/incoming')
        .expect(401);
    });
  });

  describe('/friend/requests/outgoing (GET)', () => {
    it('should get outgoing friend requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/friend/requests/outgoing')
        .set(getAuthHeaders(user1Token))
        .expect(200);

      const body = response.body as OutgoingFriendRequestResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].status).toBe('pending');
    });

    it('should return empty array when no outgoing requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/friend/requests/outgoing')
        .set(getAuthHeaders(user3Token))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/friend/requests/outgoing')
        .expect(401);
    });
  });

  describe('/friend/request/:requestId/handle (POST)', () => {
    it('should accept a friend request', async () => {
      const response = await request(app.getHttpServer())
        .post(`/friend/request/${friendRequestId}/handle`)
        .set(getAuthHeaders(user2Token))
        .send({
          decision: 'accept',
        })
        .expect(201);

      const body = response.body as FriendRequestResponse;
      expect(body.status).toBe('accepted');
    });

    it('should have both users as friends after acceptance', async () => {
      const user1Friends = await request(app.getHttpServer())
        .get('/friend/list')
        .set(getAuthHeaders(user1Token))
        .expect(200);

      const user2Friends = await request(app.getHttpServer())
        .get('/friend/list')
        .set(getAuthHeaders(user2Token))
        .expect(200);

      const user1Body = user1Friends.body as FriendResponse[];
      const user2Body = user2Friends.body as FriendResponse[];
      expect(user1Body.length).toBeGreaterThan(0);
      expect(user2Body.length).toBeGreaterThan(0);
    });

    it('should send another request for rejection test', async () => {
      const response = await request(app.getHttpServer())
        .post('/friend/request')
        .set(getAuthHeaders(user1Token))
        .send({
          receiverId: user3Id,
        })
        .expect(201);

      const body = response.body as FriendRequestResponse;
      friendRequestId = body._id;
    });

    it('should reject a friend request', async () => {
      const response = await request(app.getHttpServer())
        .post(`/friend/request/${friendRequestId}/handle`)
        .set(getAuthHeaders(user3Token))
        .send({
          decision: 'reject',
        })
        .expect(201);

      const body = response.body as FriendRequestResponse;
      expect(body.status).toBe('rejected');
    });

    it('should fail to handle non-existent request', async () => {
      await request(app.getHttpServer())
        .post('/friend/request/507f1f77bcf86cd799439011/handle')
        .set(getAuthHeaders(user2Token))
        .send({
          decision: 'accept',
        })
        .expect(404);
    });

    it('should fail with invalid decision', async () => {
      await request(app.getHttpServer())
        .post(`/friend/request/${friendRequestId}/handle`)
        .set(getAuthHeaders(user2Token))
        .send({
          decision: 'invalid',
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/friend/request/${friendRequestId}/handle`)
        .send({
          decision: 'accept',
        })
        .expect(401);
    });
  });

  describe('/friend/list (GET)', () => {
    it('should get list of friends', async () => {
      const response = await request(app.getHttpServer())
        .get('/friend/list')
        .set(getAuthHeaders(user1Token))
        .expect(200);

      const body = response.body as FriendResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/friend/list').expect(401);
    });
  });

  describe('/friend/request/:requestId (DELETE)', () => {
    let cancelRequestId: string;

    beforeAll(async () => {
      // Create a new request to cancel
      const response = await request(app.getHttpServer())
        .post('/friend/request')
        .set(getAuthHeaders(user2Token))
        .send({
          receiverId: user3Id,
        })
        .expect(201);

      const body = response.body as FriendRequestResponse;
      cancelRequestId = body._id;
    });

    it('should cancel a friend request', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/friend/request/${cancelRequestId}`)
        .set(getAuthHeaders(user2Token))
        .expect(200);

      const body = response.body as { message: string };
      expect(body).toHaveProperty('message');
      expect(body.message).toContain('cancelled');
    });

    it('should fail to cancel non-existent request', async () => {
      await request(app.getHttpServer())
        .delete('/friend/request/507f1f77bcf86cd799439011')
        .set(getAuthHeaders(user2Token))
        .expect(404);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/friend/request/${cancelRequestId}`)
        .expect(401);
    });
  });

  describe('/friend/:friendId (DELETE)', () => {
    it('should remove a friend', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/friend/${user2Id}`)
        .set(getAuthHeaders(user1Token))
        .expect(200);

      const body = response.body as { message: string };
      expect(body).toHaveProperty('message');
      expect(body.message).toContain('removed');
    });

    it('should verify friend was removed', async () => {
      const response = await request(app.getHttpServer())
        .get('/friend/list')
        .set(getAuthHeaders(user1Token))
        .expect(200);

      const body = response.body as FriendResponse[];
      const hasFriend = body.some(
        (friend: FriendResponse) => friend._id === user2Id,
      );
      expect(hasFriend).toBe(false);
    });

    it('should fail to remove non-existent friend', async () => {
      await request(app.getHttpServer())
        .delete('/friend/507f1f77bcf86cd799439011')
        .set(getAuthHeaders(user1Token))
        .expect(404);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/friend/${user2Id}`)
        .expect(401);
    });
  });
});
