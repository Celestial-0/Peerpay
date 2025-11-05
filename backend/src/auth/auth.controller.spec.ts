import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';
import { ObjectId } from 'mongodb';
import type { SignupDto } from './schema/auth.schema';
import type { RequestWithUser } from './interfaces/request-with-user.interface';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

describe('AuthController', () => {
  let controller: AuthController;

  const mockUser: User = {
    _id: new ObjectId('507f1f77bcf86cd799439011'),
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    name: 'Test User',
    role: 'user',
    isActive: true,
    tokenVersion: 0,
    friends: [],
    pendingRequests: [],
    totalLent: 0,
    totalBorrowed: 0,
    netBalance: 0,
    avatar: '',
    phone: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    setCreateTimestamp: jest.fn(),
    updateTimestamp: jest.fn(),
    comparePassword: jest.fn(),
    hashPassword: jest.fn(),
    recalculateBalance: jest.fn(),
  };

  const mockAuthenticatedUser: AuthenticatedUser = {
    userId: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    tokenVersion: 0,
  };

  const mockAuthService = {
    signup: jest.fn(),
    signin: jest.fn(),
    refreshAccessToken: jest.fn(),
    signout: jest.fn(),
    invalidateUserTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  const createMockRequest = (user: AuthenticatedUser): RequestWithUser => {
    return { user } as RequestWithUser;
  };

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user and return tokens', async () => {
      const signupDto: SignupDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const expectedResult = {
        message: 'User registered successfully',
        user: {
          _id: mockUser._id,
          email: signupDto.email,
          name: signupDto.name,
          role: 'user' as const,
          isActive: false,
          tokenVersion: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken: 'access.token',
        refreshToken: 'refresh.token',
      };

      mockAuthService.signup.mockResolvedValue(expectedResult);

      const result = await controller.signup(signupDto);

      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(expectedResult);
    });

    it('should pass the signup data to the auth service', async () => {
      const signupDto: SignupDto = {
        email: 'user@example.com',
        password: 'securePass123',
        name: 'John Doe',
      };

      mockAuthService.signup.mockResolvedValue({
        message: 'User registered successfully',
        user: mockUser,
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await controller.signup(signupDto);

      expect(mockAuthService.signup).toHaveBeenCalledTimes(1);
      expect(mockAuthService.signup).toHaveBeenCalledWith(signupDto);
    });
  });

  describe('signin', () => {
    it('should sign in a user and return tokens', async () => {
      const expectedResult = {
        message: 'Signed in successfully',
        user: {
          _id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name,
        },
        accessToken: 'access.token',
        refreshToken: 'refresh.token',
      };

      const mockRequest = createMockRequest(mockAuthenticatedUser);

      mockAuthService.signin.mockResolvedValue(expectedResult);

      const result = await controller.signin(mockRequest);

      expect(mockAuthService.signin).toHaveBeenCalledWith(
        mockAuthenticatedUser,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should use the user attached by LocalAuthGuard', async () => {
      const mockRequest = createMockRequest(mockAuthenticatedUser);

      mockAuthService.signin.mockResolvedValue({
        message: 'Signed in successfully',
        user: mockUser,
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await controller.signin(mockRequest);

      expect(mockAuthService.signin).toHaveBeenCalledWith(
        mockAuthenticatedUser,
      );
    });
  });

  describe('refresh', () => {
    it('should refresh access token', async () => {
      const expectedResult = {
        message: 'Access token refreshed successfully',
        accessToken: 'new.access.token',
      };

      const mockRequest = createMockRequest(mockAuthenticatedUser);

      mockAuthService.refreshAccessToken.mockResolvedValue(expectedResult);

      const result = await controller.refresh(mockRequest);

      expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith(
        mockAuthenticatedUser,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should use the user attached by JwtRefreshAuthGuard', async () => {
      const mockRequest = createMockRequest(mockAuthenticatedUser);

      mockAuthService.refreshAccessToken.mockResolvedValue({
        message: 'Access token refreshed successfully',
        accessToken: 'new.token',
      });

      await controller.refresh(mockRequest);

      expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith(
        mockAuthenticatedUser,
      );
    });
  });

  describe('signout', () => {
    it('should sign out a user and invalidate tokens', async () => {
      const userId = mockUser._id.toString();
      const expectedResult = {
        message: 'Signed out successfully. All tokens have been invalidated.',
      };

      mockAuthService.signout.mockResolvedValue(expectedResult);

      const result = await controller.signout(userId);

      expect(mockAuthService.signout).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });

    it('should call signout with the correct userId', async () => {
      const userId = '507f1f77bcf86cd799439011';

      mockAuthService.signout.mockResolvedValue({
        message: 'Signed out successfully. All tokens have been invalidated.',
      });

      await controller.signout(userId);

      expect(mockAuthService.signout).toHaveBeenCalledTimes(1);
      expect(mockAuthService.signout).toHaveBeenCalledWith(userId);
    });
  });

  describe('invalidateTokens', () => {
    it('should invalidate all user tokens', async () => {
      const userId = mockUser._id.toString();
      const expectedResult = {
        message: 'All tokens destroyed successfully. Please sign in again.',
      };

      mockAuthService.invalidateUserTokens.mockResolvedValue(undefined);

      const result = await controller.invalidateTokens(userId);

      expect(mockAuthService.invalidateUserTokens).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });

    it('should call invalidateUserTokens with the correct userId', async () => {
      const userId = '507f1f77bcf86cd799439011';

      mockAuthService.invalidateUserTokens.mockResolvedValue(undefined);

      await controller.invalidateTokens(userId);

      expect(mockAuthService.invalidateUserTokens).toHaveBeenCalledTimes(1);
      expect(mockAuthService.invalidateUserTokens).toHaveBeenCalledWith(userId);
    });
  });
});
