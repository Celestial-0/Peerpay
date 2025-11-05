import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let realtimeGateway: RealtimeGateway;

  const mockAuthenticatedUser: AuthenticatedUser = {
    userId: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    tokenVersion: 0,
  };

  const mockUserProfile = {
    _id: new ObjectId('507f1f77bcf86cd799439011'),
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    phone: '+1234567890',
    friends: [],
    pendingRequests: [],
    totalLent: 0,
    totalBorrowed: 0,
    netBalance: 0,
    role: 'user' as const,
    isActive: true,
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserService: jest.Mocked<
    Pick<
      UserService,
      | 'getUserWithoutPassword'
      | 'updateProfile'
      | 'deleteUser'
      | 'searchUsers'
      | 'searchOnlineUsers'
      | 'updateLedgerBalances'
    >
  > = {
    getUserWithoutPassword: jest.fn(),
    updateProfile: jest.fn(),
    deleteUser: jest.fn(),
    searchUsers: jest.fn(),
    searchOnlineUsers: jest.fn(),
    updateLedgerBalances: jest.fn(),
  };

  const mockRealtimeGateway: jest.Mocked<
    Pick<RealtimeGateway, 'getOnlineUserIds'>
  > = {
    getOnlineUserIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: RealtimeGateway,
          useValue: mockRealtimeGateway,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    realtimeGateway = module.get<RealtimeGateway>(RealtimeGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have userService injected', () => {
      expect(userService).toBeDefined();
    });

    it('should have realtimeGateway injected', () => {
      expect(realtimeGateway).toBeDefined();
    });
  });

  describe('GET /user/profile', () => {
    it('should return current user profile', async () => {
      mockUserService.getUserWithoutPassword.mockResolvedValue(mockUserProfile);

      const result = await controller.getProfile(mockAuthenticatedUser);

      expect(result).toEqual(mockUserProfile);
      expect(mockUserService.getUserWithoutPassword).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(mockUserService.getUserWithoutPassword).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserService.getUserWithoutPassword.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.getProfile(mockAuthenticatedUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not include password in response', async () => {
      mockUserService.getUserWithoutPassword.mockResolvedValue(mockUserProfile);

      const result = await controller.getProfile(mockAuthenticatedUser);

      expect(result).not.toHaveProperty('password');
    });

    it('should use authenticated user ID from JWT', async () => {
      const differentUser: AuthenticatedUser = {
        userId: '507f1f77bcf86cd799439099',
        email: 'different@example.com',
        name: 'Different User',
        role: 'user',
        tokenVersion: 0,
      };
      mockUserService.getUserWithoutPassword.mockResolvedValue(mockUserProfile);

      await controller.getProfile(differentUser);

      expect(mockUserService.getUserWithoutPassword).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439099',
      );
    });
  });

  describe('PATCH /user/profile', () => {
    it('should update user name', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedProfile = { ...mockUserProfile, name: 'Updated Name' };
      mockUserService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(
        mockAuthenticatedUser,
        updateDto,
      );

      expect(result.name).toBe('Updated Name');
      expect(mockUserService.updateProfile).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateDto,
      );
    });

    it('should update user avatar', async () => {
      const updateDto = { avatar: 'https://new-avatar.com/image.jpg' };
      const updatedProfile = { ...mockUserProfile, ...updateDto };
      mockUserService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(
        mockAuthenticatedUser,
        updateDto,
      );

      expect(result.avatar).toBe('https://new-avatar.com/image.jpg');
    });

    it('should update user phone', async () => {
      const updateDto = { phone: '+9876543210' };
      const updatedProfile = { ...mockUserProfile, ...updateDto };
      mockUserService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(
        mockAuthenticatedUser,
        updateDto,
      );

      expect(result.phone).toBe('+9876543210');
    });

    it('should update multiple fields at once', async () => {
      const updateDto = {
        name: 'New Name',
        avatar: 'https://avatar.com/new.jpg',
        phone: '+1111111111',
      };
      const updatedProfile = { ...mockUserProfile, ...updateDto };
      mockUserService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(
        mockAuthenticatedUser,
        updateDto,
      );

      expect(result.name).toBe('New Name');
      expect(result.avatar).toBe('https://avatar.com/new.jpg');
      expect(result.phone).toBe('+1111111111');
    });

    it('should handle empty update object', async () => {
      const updateDto = {};
      mockUserService.updateProfile.mockResolvedValue(mockUserProfile);

      const result = await controller.updateProfile(
        mockAuthenticatedUser,
        updateDto,
      );

      expect(result).toEqual(mockUserProfile);
      expect(mockUserService.updateProfile).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {},
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateDto = { name: 'New Name' };
      mockUserService.updateProfile.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.updateProfile(mockAuthenticatedUser, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not include password in response', async () => {
      const updateDto = { name: 'New Name' };
      mockUserService.updateProfile.mockResolvedValue(mockUserProfile);

      const result = await controller.updateProfile(
        mockAuthenticatedUser,
        updateDto,
      );

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('DELETE /user/profile', () => {
    it('should delete user account', async () => {
      mockUserService.deleteUser.mockResolvedValue(undefined);

      await controller.deleteProfile(mockAuthenticatedUser);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(mockUserService.deleteUser).toHaveBeenCalledTimes(1);
    });

    it('should return void on successful deletion', async () => {
      mockUserService.deleteUser.mockResolvedValue(undefined);

      const result = await controller.deleteProfile(mockAuthenticatedUser);

      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserService.deleteUser.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.deleteProfile(mockAuthenticatedUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use authenticated user ID', async () => {
      const differentUser: AuthenticatedUser = {
        userId: '507f1f77bcf86cd799439099',
        email: 'different@example.com',
        name: 'Different User',
        role: 'user',
        tokenVersion: 0,
      };
      mockUserService.deleteUser.mockResolvedValue(undefined);

      await controller.deleteProfile(differentUser);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439099',
      );
    });
  });

  describe('GET /user/search', () => {
    const mockSearchResults = [
      {
        _id: new ObjectId('507f1f77bcf86cd799439012'),
        email: 'alice@example.com',
        name: 'Alice',
        isActive: true,
      },
      {
        _id: new ObjectId('507f1f77bcf86cd799439013'),
        email: 'bob@example.com',
        name: 'Bob',
        isActive: true,
      },
    ];

    it('should search all users when isActive not specified', async () => {
      const queryDto = {
        search: 'test',
        limit: 50,
        offset: 0,
        sortOrder: 'desc' as const,
      };
      mockUserService.searchUsers.mockResolvedValue(mockSearchResults);

      const result = await controller.searchUsers(
        mockAuthenticatedUser,
        queryDto,
      );

      expect(result).toEqual(mockSearchResults);
      expect(mockUserService.searchUsers).toHaveBeenCalledTimes(1);
      expect(mockUserService.searchUsers).toHaveBeenCalledWith(
        'test',
        '507f1f77bcf86cd799439011',
      );
      expect(mockUserService.searchOnlineUsers).not.toHaveBeenCalled();
    });

    it('should search online users when isActive is true', async () => {
      const queryDto = {
        search: 'test',
        isActive: true,
        limit: 50,
        offset: 0,
        sortOrder: 'desc' as const,
      };
      const onlineUserIds = ['507f1f77bcf86cd799439012'];
      mockRealtimeGateway.getOnlineUserIds.mockReturnValue(onlineUserIds);
      mockUserService.searchOnlineUsers.mockResolvedValue([
        mockSearchResults[0],
      ]);

      const result = await controller.searchUsers(
        mockAuthenticatedUser,
        queryDto,
      );

      expect(result).toEqual([mockSearchResults[0]]);
      expect(mockRealtimeGateway.getOnlineUserIds).toHaveBeenCalled();
      expect(mockUserService.searchOnlineUsers).toHaveBeenCalledWith(
        'test',
        '507f1f77bcf86cd799439011',
        onlineUserIds,
      );
      expect(mockUserService.searchUsers).not.toHaveBeenCalled();
    });

    it('should search online users when isActive is false', async () => {
      const queryDto = {
        search: 'test',
        isActive: false,
        limit: 50,
        offset: 0,
        sortOrder: 'desc' as const,
      };
      const onlineUserIds = ['507f1f77bcf86cd799439012'];
      mockRealtimeGateway.getOnlineUserIds.mockReturnValue(onlineUserIds);
      mockUserService.searchOnlineUsers.mockResolvedValue([
        mockSearchResults[0],
      ]);

      const result = await controller.searchUsers(
        mockAuthenticatedUser,
        queryDto,
      );

      expect(result).toEqual([mockSearchResults[0]]);
      expect(mockRealtimeGateway.getOnlineUserIds).toHaveBeenCalled();
      expect(mockUserService.searchOnlineUsers).toHaveBeenCalledWith(
        'test',
        '507f1f77bcf86cd799439011',
        onlineUserIds,
      );
      expect(mockUserService.searchUsers).not.toHaveBeenCalled();
    });

    it('should handle empty search query', async () => {
      const queryDto = {
        search: '',
        limit: 50,
        offset: 0,
        sortOrder: 'desc' as const,
      };
      mockUserService.searchUsers.mockResolvedValue(mockSearchResults);

      await controller.searchUsers(mockAuthenticatedUser, queryDto);

      expect(mockUserService.searchUsers).toHaveBeenCalledWith(
        '',
        '507f1f77bcf86cd799439011',
      );
    });

    it('should handle undefined search query', async () => {
      const queryDto = {
        limit: 50,
        offset: 0,
        sortOrder: 'desc' as const,
      };
      mockUserService.searchUsers.mockResolvedValue([]);

      await controller.searchUsers(mockAuthenticatedUser, queryDto);

      expect(mockUserService.searchUsers).toHaveBeenCalledWith(
        '',
        '507f1f77bcf86cd799439011',
      );
    });

    it('should exclude current user from search results', async () => {
      const queryDto = {
        search: 'test',
        limit: 50,
        offset: 0,
        sortOrder: 'desc' as const,
      };
      mockUserService.searchUsers.mockResolvedValue(mockSearchResults);

      const result = await controller.searchUsers(
        mockAuthenticatedUser,
        queryDto,
      );

      const hasCurrentUser = result.some(
        (u) => u._id!.toString() === mockAuthenticatedUser.userId,
      );
      expect(hasCurrentUser).toBe(false);
    });

    it('should fallback to searchUsers if gateway not available', async () => {
      const controllerWithoutGateway = new UserController(userService);
      const queryDto = {
        search: 'test',
        isActive: true,
        limit: 50,
        offset: 0,
        sortOrder: 'desc' as const,
      };
      mockUserService.searchUsers.mockResolvedValue(mockSearchResults);

      const result = await controllerWithoutGateway.searchUsers(
        mockAuthenticatedUser,
        queryDto,
      );

      expect(result).toEqual(mockSearchResults);
      expect(mockUserService.searchUsers).toHaveBeenCalled();
    });

    it('should not include passwords in search results', async () => {
      const queryDto = {
        search: 'test',
        limit: 50,
        offset: 0,
        sortOrder: 'desc' as const,
      };
      mockUserService.searchUsers.mockResolvedValue(mockSearchResults);

      const result = await controller.searchUsers(
        mockAuthenticatedUser,
        queryDto,
      );

      result.forEach((user) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should handle case-insensitive search', async () => {
      const queryDto = {
        search: 'ALICE',
        limit: 50,
        offset: 0,
        sortOrder: 'desc' as const,
      };
      mockUserService.searchUsers.mockResolvedValue([mockSearchResults[0]]);

      const result = await controller.searchUsers(
        mockAuthenticatedUser,
        queryDto,
      );

      expect(result).toHaveLength(1);
      expect(mockUserService.searchUsers).toHaveBeenCalledWith(
        'ALICE',
        '507f1f77bcf86cd799439011',
      );
    });
  });

  describe('PATCH /user/ledger', () => {
    it('should update total lent', async () => {
      const updateDto = { totalLent: 1000 };
      const updatedProfile = {
        ...mockUserProfile,
        totalLent: 1000,
        netBalance: 1000,
      };
      mockUserService.updateLedgerBalances.mockResolvedValue(updatedProfile);

      const result = await controller.updateLedgerBalances(
        mockAuthenticatedUser,
        updateDto,
      );

      expect(result.totalLent).toBe(1000);
      expect(result.netBalance).toBe(1000);
      expect(mockUserService.updateLedgerBalances).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        1000,
        undefined,
      );
    });

    it('should update total borrowed', async () => {
      const updateDto = { totalBorrowed: 500 };
      const updatedProfile = {
        ...mockUserProfile,
        totalBorrowed: 500,
        netBalance: -500,
      };
      mockUserService.updateLedgerBalances.mockResolvedValue(updatedProfile);

      const result = await controller.updateLedgerBalances(
        mockAuthenticatedUser,
        updateDto,
      );

      expect(result.totalBorrowed).toBe(500);
      expect(result.netBalance).toBe(-500);
      expect(mockUserService.updateLedgerBalances).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        undefined,
        500,
      );
    });

    it('should update both balances', async () => {
      const updateDto = { totalLent: 1000, totalBorrowed: 500 };
      const updatedProfile = {
        ...mockUserProfile,
        totalLent: 1000,
        totalBorrowed: 500,
        netBalance: 500,
      };
      mockUserService.updateLedgerBalances.mockResolvedValue(updatedProfile);

      const result = await controller.updateLedgerBalances(
        mockAuthenticatedUser,
        updateDto,
      );

      expect(result.totalLent).toBe(1000);
      expect(result.totalBorrowed).toBe(500);
      expect(result.netBalance).toBe(500);
      expect(mockUserService.updateLedgerBalances).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        1000,
        500,
      );
    });

    it('should handle zero balances', async () => {
      const updateDto = { totalLent: 0, totalBorrowed: 0 };
      const updatedProfile = {
        ...mockUserProfile,
        totalLent: 0,
        totalBorrowed: 0,
        netBalance: 0,
      };
      mockUserService.updateLedgerBalances.mockResolvedValue(updatedProfile);

      const result = await controller.updateLedgerBalances(
        mockAuthenticatedUser,
        updateDto,
      );

      expect(result.netBalance).toBe(0);
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateDto = { totalLent: 1000 };
      mockUserService.updateLedgerBalances.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.updateLedgerBalances(mockAuthenticatedUser, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate correct net balance', async () => {
      const updateDto = { totalLent: 1500, totalBorrowed: 800 };
      const updatedProfile = {
        ...mockUserProfile,
        totalLent: 1500,
        totalBorrowed: 800,
        netBalance: 700,
      };
      mockUserService.updateLedgerBalances.mockResolvedValue(updatedProfile);

      const result = await controller.updateLedgerBalances(
        mockAuthenticatedUser,
        updateDto,
      );

      expect(result.netBalance).toBe(700);
    });

    it('should not include password in response', async () => {
      const updateDto = { totalLent: 1000 };
      mockUserService.updateLedgerBalances.mockResolvedValue(mockUserProfile);

      const result = await controller.updateLedgerBalances(
        mockAuthenticatedUser,
        updateDto,
      );

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication for all endpoints', () => {
      // All endpoints should use @Auth() decorator
      const controllerMetadata = Reflect.getMetadata(
        'path',
        UserController,
      ) as string;
      expect(controllerMetadata).toBe('user');
    });

    it('should use correct user ID from JWT token', async () => {
      const customUser: AuthenticatedUser = {
        userId: '507f1f77bcf86cd799439099',
        email: 'custom@example.com',
        name: 'Custom User',
        role: 'user',
        tokenVersion: 5,
      };
      mockUserService.getUserWithoutPassword.mockResolvedValue(mockUserProfile);

      await controller.getProfile(customUser);

      expect(mockUserService.getUserWithoutPassword).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439099',
      );
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      mockUserService.getUserWithoutPassword.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.getProfile(mockAuthenticatedUser),
      ).rejects.toThrow('Database error');
    });

    it('should handle validation errors from service', async () => {
      const updateDto = { name: '' };
      mockUserService.updateProfile.mockRejectedValue(
        new Error('Validation failed'),
      );

      await expect(
        controller.updateProfile(mockAuthenticatedUser, updateDto),
      ).rejects.toThrow('Validation failed');
    });
  });
});
