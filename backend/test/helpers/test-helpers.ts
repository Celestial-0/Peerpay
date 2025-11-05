import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  AuthSignupResponse,
  AuthSigninResponse,
  UserResponse,
} from '../types/test-response.types';

/**
 * Test user credentials for consistent testing
 */
export const TEST_USERS = {
  user1: {
    email: 'testuser1@example.com',
    password: 'Test@1234',
    name: 'Test User One',
  },
  user2: {
    email: 'testuser2@example.com',
    password: 'Test@5678',
    name: 'Test User Two',
  },
  user3: {
    email: 'testuser3@example.com',
    password: 'Test@9012',
    name: 'Test User Three',
  },
};

export interface CreateUserAndLoginResult {
  userId: string;
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

/**
 * Helper to create a user and return auth tokens
 */
export async function createUserAndLogin(
  app: INestApplication<App>,
  userData: { email: string; password: string; name: string },
): Promise<CreateUserAndLoginResult> {
  // Signup
  const signupResponse = await request(app.getHttpServer())
    .post('/auth/signup')
    .send(userData)
    .expect(201);

  const signupBody = signupResponse.body as AuthSignupResponse;

  // Signin
  const signinResponse = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({
      email: userData.email,
      password: userData.password,
    })
    .expect(200);

  const signinBody = signinResponse.body as AuthSigninResponse;

  return {
    userId: signupBody.user._id,
    accessToken: signinBody.accessToken,
    refreshToken: signinBody.refreshToken,
    user: signupBody.user,
  };
}

/**
 * Helper to get auth headers
 */
export function getAuthHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

/**
 * Helper to clean up test data (if needed)
 */
export async function cleanupTestUser(
  app: INestApplication<App>,
  accessToken: string,
) {
  try {
    await request(app.getHttpServer())
      .delete('/user/profile')
      .set(getAuthHeaders(accessToken));
  } catch {
    // Ignore errors during cleanup
  }
}

/**
 * Wait helper for async operations
 */
export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
