import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { ObjectId } from 'mongodb';
import type { AuthenticatedUser } from './interfaces';

describe('AuthService', () => {
  let service: AuthService;

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
    createdAt: new Date(),
    updatedAt: new Date(),
    setCreateTimestamp: jest.fn(),
    updateTimestamp: jest.fn(),
    comparePassword: jest.fn(),
    recalculateBalance: jest.fn(),
    hashPassword: jest.fn(),
  };

  const mockUserService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    validateCredentials: jest.fn(),
    create: jest.fn(),
    updateLastLogin: jest.fn(),
    setInactive: jest.fn(),
    incrementTokenVersion: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const plainPassword = 'password123';
      const userWithoutPassword = {
        email: mockUser.email,
        name: mockUser.name,
      };
      mockUserService.validateCredentials.mockResolvedValue(
        userWithoutPassword,
      );

      const result = await service.validateUser(
        'test@example.com',
        plainPassword,
      );

      expect(mockUserService.validateCredentials).toHaveBeenCalledWith(
        'test@example.com',
        plainPassword,
      );
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null when user is not found', async () => {
      mockUserService.validateCredentials.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockUserService.validateCredentials.mockResolvedValue(null);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate an access token with correct payload', () => {
      const token = 'mock.access.token';
      mockJwtService.sign.mockReturnValue(token);

      const result = service.generateAccessToken(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser._id.toString(),
          email: mockUser.email,
          type: 'access',
          tokenVersion: mockUser.tokenVersion,
        },
        expect.objectContaining({
          expiresIn: expect.anything() as string,
        }),
      );
      expect(result).toBe(token);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with correct payload', () => {
      const token = 'mock.refresh.token';
      mockJwtService.sign.mockReturnValue(token);

      const result = service.generateRefreshToken(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser._id.toString(),
          email: mockUser.email,
          type: 'refresh',
          tokenVersion: mockUser.tokenVersion,
        },
        expect.objectContaining({
          secret: expect.anything() as string,
          expiresIn: expect.anything() as string,
        }),
      );
      expect(result).toBe(token);
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const accessToken = 'mock.access.token';
      const refreshToken = 'mock.refresh.token';
      mockJwtService.sign
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);

      const result = service.generateTokens(mockUser);

      expect(result).toEqual({
        accessToken,
        refreshToken,
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('signup', () => {
    const signupDto = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      phone: '+1234567890',
    };

    it('should create a new user and return tokens', async () => {
      const newUser = {
        ...mockUser,
        email: signupDto.email,
        name: signupDto.name,
      };

      mockUserService.create.mockResolvedValue(newUser);
      mockJwtService.sign
        .mockReturnValueOnce('access.token')
        .mockReturnValueOnce('refresh.token');

      const result = await service.signup(signupDto);

      expect(mockUserService.create).toHaveBeenCalledWith(
        signupDto.email,
        signupDto.password,
        signupDto.name,
        signupDto.phone,
      );
      expect(result).toEqual(
        expect.objectContaining({
          message: 'User registered successfully',
          accessToken: 'access.token',
          refreshToken: 'refresh.token',
        }),
      );
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw ConflictException if user already exists', async () => {
      const error = new Error('User with this email already exists');
      error.name = 'ConflictException';
      mockUserService.create.mockRejectedValue(error);

      await expect(service.signup(signupDto)).rejects.toThrow();
    });
  });

  describe('signin', () => {
    it('should update user activity and return tokens', async () => {
      const authenticatedUser = { email: mockUser.email, name: mockUser.name };
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.updateLastLogin.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce('access.token')
        .mockReturnValueOnce('refresh.token');

      const result = await service.signin(authenticatedUser);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(mockUserService.updateLastLogin).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          message: 'Signed in successfully',
          accessToken: 'access.token',
          refreshToken: 'refresh.token',
        }),
      );
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should set user as active and update lastLogin', async () => {
      const authenticatedUser = { email: mockUser.email, name: mockUser.name };
      const updatedUser = {
        ...mockUser,
        isActive: true,
        lastLogin: new Date(),
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.updateLastLogin.mockResolvedValue(updatedUser);
      mockJwtService.sign.mockReturnValue('token');

      await service.signin(authenticatedUser);

      expect(mockUserService.updateLastLogin).toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token for authenticated user', async () => {
      const authenticatedUser: AuthenticatedUser = {
        userId: mockUser._id.toString(),
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        tokenVersion: mockUser.tokenVersion,
      };
      const accessToken = 'new.access.token';
      mockUserService.findById.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await service.refreshAccessToken(authenticatedUser);

      expect(mockUserService.findById).toHaveBeenCalledWith(
        authenticatedUser.userId,
      );
      expect(result).toEqual({
        message: 'Access token refreshed successfully',
        accessToken,
      });
    });

    it('should fetch user if userId is provided', async () => {
      const authenticatedUser: AuthenticatedUser = {
        userId: mockUser._id.toString(),
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        tokenVersion: mockUser.tokenVersion,
      };
      mockUserService.findById.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new.access.token');

      const result = await service.refreshAccessToken(authenticatedUser);

      expect(mockUserService.findById).toHaveBeenCalledWith(
        authenticatedUser.userId,
      );
      expect(result.accessToken).toBe('new.access.token');
    });

    it('should throw error if user is not found with userId', async () => {
      const authenticatedUser: AuthenticatedUser = {
        userId: new ObjectId().toString(),
        email: 'test@example.com',
        name: 'Test',
        role: 'user',
        tokenVersion: 0,
      };
      mockUserService.findById.mockResolvedValue(null);

      await expect(
        service.refreshAccessToken(authenticatedUser),
      ).rejects.toThrow('User not found');
    });

    it('should throw error if user is not provided', async () => {
      const invalidUser = null as unknown as AuthenticatedUser;

      await expect(service.refreshAccessToken(invalidUser)).rejects.toThrow(
        'User information not found in token',
      );
    });
  });

  describe('signout', () => {
    it('should set user as inactive and invalidate tokens', async () => {
      const userId = mockUser._id.toString();
      mockUserService.setInactive.mockResolvedValue(undefined);
      mockUserService.incrementTokenVersion.mockResolvedValue(undefined);

      const result = await service.signout(userId);

      expect(mockUserService.setInactive).toHaveBeenCalledWith(userId);
      expect(mockUserService.incrementTokenVersion).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual({
        message: 'Signed out successfully. All tokens have been invalidated.',
      });
    });

    it('should handle non-existent user gracefully', async () => {
      mockUserService.setInactive.mockResolvedValue(undefined);
      mockUserService.incrementTokenVersion.mockResolvedValue(undefined);

      const result = await service.signout('507f1f77bcf86cd799439012');

      expect(result).toEqual({
        message: 'Signed out successfully. All tokens have been invalidated.',
      });
    });
  });

  describe('invalidateUserTokens', () => {
    it('should increment user tokenVersion', async () => {
      const userId = mockUser._id.toString();
      mockUserService.incrementTokenVersion.mockResolvedValue(undefined);

      await service.invalidateUserTokens(userId);

      expect(mockUserService.incrementTokenVersion).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should handle non-existent user gracefully', async () => {
      mockUserService.incrementTokenVersion.mockResolvedValue(undefined);

      await expect(
        service.invalidateUserTokens('507f1f77bcf86cd799439012'),
      ).resolves.not.toThrow();
    });
  });
});
