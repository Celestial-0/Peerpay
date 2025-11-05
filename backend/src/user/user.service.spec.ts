import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Mock bcrypt module
jest.mock('bcrypt');

type MockRepository = Partial<Record<keyof Repository<User>, jest.Mock>>;

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: MockRepository;

  const mockUser: Partial<User> = {
    _id: new ObjectId('507f1f77bcf86cd799439011'),
    email: 'test@example.com',
    password: '$2b$10$hashedPassword',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    phone: '+1234567890',
    friends: [],
    pendingRequests: [],
    totalLent: 0,
    totalBorrowed: 0,
    netBalance: 0,
    role: 'user',
    isActive: true,
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have userRepository injected', () => {
      expect(mockUserRepository).toBeDefined();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      mockUserRepository.findOne?.mockResolvedValue(mockUser as User);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne?.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });

    it('should handle email case insensitivity', async () => {
      mockUserRepository.findOne?.mockResolvedValue(mockUser as User);

      await service.findByEmail('TEST@EXAMPLE.COM');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'TEST@EXAMPLE.COM' },
      });
    });

    it('should handle database errors', async () => {
      mockUserRepository.findOne?.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.findByEmail('test@example.com')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('findById', () => {
    it('should find a user by ID', async () => {
      const userId = '507f1f77bcf86cd799439011';
      mockUserRepository.findOne?.mockResolvedValue(mockUser as User);

      const result = await service.findById(userId);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { _id: new ObjectId(userId) },
      });
    });

    it('should return null if user not found by ID', async () => {
      mockUserRepository.findOne?.mockResolvedValue(null);

      const result = await service.findById('507f1f77bcf86cd799439012');

      expect(result).toBeNull();
    });

    it('should handle invalid ObjectId format', async () => {
      const invalidId = 'invalid-id';

      await expect(service.findById(invalidId)).rejects.toThrow();
    });
  });

  describe('validateCredentials', () => {
    it('should validate correct credentials', async () => {
      mockUserRepository.findOne?.mockResolvedValue(mockUser);
      (
        bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>
      ).mockResolvedValue(true as never);

      const result = await service.validateCredentials(
        'test@example.com',
        'correctPassword',
      );

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result?.email).toBe('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctPassword',
        mockUser.password,
      );
    });

    it('should return null for incorrect password', async () => {
      mockUserRepository.findOne?.mockResolvedValue(mockUser);
      (
        bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>
      ).mockResolvedValue(false as never);

      const result = await service.validateCredentials(
        'test@example.com',
        'wrongPassword',
      );

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      mockUserRepository.findOne?.mockResolvedValue(null);

      const result = await service.validateCredentials(
        'nonexistent@example.com',
        'anyPassword',
      );

      expect(result).toBeNull();
    });

    it('should exclude password from returned user object', async () => {
      mockUserRepository.findOne?.mockResolvedValue(mockUser);
      (
        bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>
      ).mockResolvedValue(true as never);

      const result = await service.validateCredentials(
        'test@example.com',
        'correctPassword',
      );

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      mockUserRepository.findOne?.mockResolvedValue(null);
      mockUserRepository.create?.mockReturnValue(mockUser as User);
      mockUserRepository.save?.mockResolvedValue(mockUser as User);

      const result = await service.create(
        'new@example.com',
        'password123',
        'New User',
      );

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        tokenVersion: 0,
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserRepository.findOne?.mockResolvedValue(mockUser as User);

      await expect(
        service.create('test@example.com', 'password123', 'Test User'),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create('test@example.com', 'password123', 'Test User'),
      ).rejects.toThrow('User with this email already exists');

      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should initialize user with tokenVersion 0', async () => {
      mockUserRepository.findOne?.mockResolvedValue(null);
      mockUserRepository.create?.mockReturnValue(mockUser as User);
      mockUserRepository.save?.mockResolvedValue(mockUser as User);

      await service.create('new@example.com', 'password123', 'New User');

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tokenVersion: 0 }),
      );
    });

    it('should handle database errors during creation', async () => {
      mockUserRepository.findOne?.mockResolvedValue(null);
      mockUserRepository.create?.mockReturnValue(mockUser as User);
      mockUserRepository.save?.mockRejectedValue(
        new Error('Database write failed'),
      );

      await expect(
        service.create('new@example.com', 'password123', 'New User'),
      ).rejects.toThrow('Database write failed');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login and set user as active', async () => {
      const updatedUser = {
        ...mockUser,
        isActive: true,
        lastLogin: new Date(),
      };
      mockUserRepository.findOne!.mockResolvedValue(mockUser);
      mockUserRepository.save!.mockResolvedValue(updatedUser);

      const result = await service.updateLastLogin('507f1f77bcf86cd799439011');

      expect(result.isActive).toBe(true);
      expect(result.lastLogin).toBeDefined();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.updateLastLogin('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateLastLogin('507f1f77bcf86cd799439011'),
      ).rejects.toThrow('User not found');
    });
  });

  describe('setInactive', () => {
    it('should set user as inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserRepository.findOne!.mockResolvedValue(mockUser);
      mockUserRepository.save!.mockResolvedValue(inactiveUser);

      await service.setInactive('507f1f77bcf86cd799439011');

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should not throw error if user not found', async () => {
      mockUserRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.setInactive('507f1f77bcf86cd799439011'),
      ).resolves.not.toThrow();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('incrementTokenVersion', () => {
    it('should increment token version', async () => {
      const userWithIncrementedToken = { ...mockUser, tokenVersion: 1 };
      mockUserRepository.findOne!.mockResolvedValue(mockUser);
      mockUserRepository.save!.mockResolvedValue(userWithIncrementedToken);

      await service.incrementTokenVersion('507f1f77bcf86cd799439011');

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tokenVersion: 1 }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.incrementTokenVersion('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle multiple increments', async () => {
      const user1 = { ...mockUser, tokenVersion: 0 };
      const user2 = { ...mockUser, tokenVersion: 1 };
      const user3 = { ...mockUser, tokenVersion: 2 };

      mockUserRepository
        .findOne!.mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);
      mockUserRepository
        .save!.mockResolvedValueOnce(user2)
        .mockResolvedValueOnce(user3);

      await service.incrementTokenVersion('507f1f77bcf86cd799439011');
      await service.incrementTokenVersion('507f1f77bcf86cd799439011');

      expect(mockUserRepository.save).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ tokenVersion: 2 }),
      );
    });
  });

  describe('getUserWithoutPassword', () => {
    it('should return user without password field', async () => {
      mockUserRepository.findOne!.mockResolvedValue(mockUser);

      const result = await service.getUserWithoutPassword(
        '507f1f77bcf86cd799439011',
      );

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.getUserWithoutPassword('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user name', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      mockUserRepository.findOne!.mockResolvedValue(mockUser);
      mockUserRepository.save!.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('507f1f77bcf86cd799439011', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(result).not.toHaveProperty('password');
    });

    it('should update user avatar', async () => {
      const updatedUser = { ...mockUser, avatar: 'https://new-avatar.com' };
      mockUserRepository.findOne!.mockResolvedValue(mockUser);
      mockUserRepository.save!.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('507f1f77bcf86cd799439011', {
        avatar: 'https://new-avatar.com',
      });

      expect(result.avatar).toBe('https://new-avatar.com');
    });

    it('should update user phone', async () => {
      const updatedUser = { ...mockUser, phone: '+9876543210' };
      mockUserRepository.findOne!.mockResolvedValue(mockUser);
      mockUserRepository.save!.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('507f1f77bcf86cd799439011', {
        phone: '+9876543210',
      });

      expect(result.phone).toBe('+9876543210');
    });

    it('should update multiple fields at once', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'New Name',
        avatar: 'https://new-avatar.com',
        phone: '+9876543210',
      };
      mockUserRepository.findOne!.mockResolvedValue(mockUser);
      mockUserRepository.save!.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('507f1f77bcf86cd799439011', {
        name: 'New Name',
        avatar: 'https://new-avatar.com',
        phone: '+9876543210',
      });

      expect(result.name).toBe('New Name');
      expect(result.avatar).toBe('https://new-avatar.com');
      expect(result.phone).toBe('+9876543210');
    });

    it('should not update fields that are undefined', async () => {
      mockUserRepository.findOne!.mockResolvedValue(mockUser);
      mockUserRepository.save!.mockResolvedValue(mockUser);

      await service.updateProfile('507f1f77bcf86cd799439011', {});

      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.updateProfile('507f1f77bcf86cd799439011', {
          name: 'New Name',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLedgerBalances', () => {
    it('should update total lent', async () => {
      const updatedUser = {
        ...mockUser,
        totalLent: 1000,
        netBalance: 1000,
        recalculateBalance: jest.fn(),
      };
      mockUserRepository.findOne!.mockResolvedValue({
        ...mockUser,
        recalculateBalance: jest.fn(),
      });
      mockUserRepository.save!.mockResolvedValue(updatedUser);

      const result = await service.updateLedgerBalances(
        '507f1f77bcf86cd799439011',
        1000,
        undefined,
      );

      expect(result).not.toHaveProperty('password');
    });

    it('should update total borrowed', async () => {
      const updatedUser = {
        ...mockUser,
        totalBorrowed: 500,
        netBalance: -500,
        recalculateBalance: jest.fn(),
      };
      mockUserRepository.findOne!.mockResolvedValue({
        ...mockUser,
        recalculateBalance: jest.fn(),
      });
      mockUserRepository.save!.mockResolvedValue(updatedUser);

      const result = await service.updateLedgerBalances(
        '507f1f77bcf86cd799439011',
        undefined,
        500,
      );

      expect(result).not.toHaveProperty('password');
    });

    it('should update both balances', async () => {
      const userWithRecalculate = {
        ...mockUser,
        recalculateBalance: jest.fn(),
      };
      const updatedUser = {
        ...mockUser,
        totalLent: 1000,
        totalBorrowed: 500,
        netBalance: 500,
        recalculateBalance: jest.fn(),
      };
      mockUserRepository.findOne!.mockResolvedValue(userWithRecalculate);
      mockUserRepository.save!.mockResolvedValue(updatedUser);

      await service.updateLedgerBalances('507f1f77bcf86cd799439011', 1000, 500);

      expect(userWithRecalculate.recalculateBalance).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.updateLedgerBalances('507f1f77bcf86cd799439011', 1000, 500),
      ).rejects.toThrow(NotFoundException);
    });

    it('should call recalculateBalance method', async () => {
      const recalculateBalanceSpy = jest.fn();
      const userWithRecalculate = {
        ...mockUser,
        recalculateBalance: recalculateBalanceSpy,
      };
      mockUserRepository.findOne!.mockResolvedValue(userWithRecalculate);
      mockUserRepository.save!.mockResolvedValue(userWithRecalculate);

      await service.updateLedgerBalances('507f1f77bcf86cd799439011', 1000, 500);

      expect(recalculateBalanceSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchUsers', () => {
    const users = [
      {
        ...mockUser,
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        email: 'alice@example.com',
        name: 'Alice',
        phone: undefined,
      },
      {
        ...mockUser,
        _id: new ObjectId('507f1f77bcf86cd799439013'),
        email: 'bob@example.com',
        name: 'Bob',
        phone: undefined,
      },
      {
        ...mockUser,
        _id: new ObjectId('507f1f77bcf86cd799439012'),
        email: 'charlie@example.com',
        name: 'Charlie',
        phone: '+1111111111',
      },
    ];

    it('should search users by email', async () => {
      mockUserRepository.find!.mockResolvedValue(users);

      const result = await service.searchUsers(
        'alice',
        '507f1f77bcf86cd799439099',
      );

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('alice@example.com');
      expect(result[0]).not.toHaveProperty('password');
    });

    it('should search users by name', async () => {
      mockUserRepository.find!.mockResolvedValue(users);

      const result = await service.searchUsers(
        'bob',
        '507f1f77bcf86cd799439099',
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob');
    });

    it('should search users by phone', async () => {
      mockUserRepository.find!.mockResolvedValue(users);

      const result = await service.searchUsers(
        '+1111111111',
        '507f1f77bcf86cd799439011',
      );

      expect(result).toHaveLength(1);
      expect(result[0].phone).toBe('+1111111111');
    });

    it('should exclude current user from results', async () => {
      mockUserRepository.find!.mockResolvedValue(users);

      const result = await service.searchUsers(
        'example',
        '507f1f77bcf86cd799439011',
      );

      expect(
        result.every((u) => u._id!.toString() !== '507f1f77bcf86cd799439011'),
      ).toBe(true);
    });

    it('should be case insensitive', async () => {
      mockUserRepository.find!.mockResolvedValue(users);

      const result = await service.searchUsers(
        'ALICE',
        '507f1f77bcf86cd799439099',
      );

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('alice@example.com');
    });

    it('should return empty array if no matches', async () => {
      mockUserRepository.find!.mockResolvedValue(users);

      const result = await service.searchUsers(
        'nonexistent',
        '507f1f77bcf86cd799439011',
      );

      expect(result).toEqual([]);
    });

    it('should exclude password from all results', async () => {
      mockUserRepository.find!.mockResolvedValue(users);

      const result = await service.searchUsers(
        'example',
        '507f1f77bcf86cd799439011',
      );

      result.forEach((user) => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('searchOnlineUsers', () => {
    const users = [
      {
        ...mockUser,
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        email: 'online1@example.com',
        name: 'Online User 1',
        phone: '+1234567890',
      },
      {
        ...mockUser,
        _id: new ObjectId('507f1f77bcf86cd799439012'),
        email: 'online2@example.com',
        name: 'Online User 2',
        phone: undefined,
      },
      {
        ...mockUser,
        _id: new ObjectId('507f1f77bcf86cd799439013'),
        email: 'offline@example.com',
        name: 'Offline User',
        phone: undefined,
      },
    ];

    it('should filter only online users', async () => {
      mockUserRepository.find!.mockResolvedValue(users);
      const onlineUserIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      ];

      const result = await service.searchOnlineUsers(
        'online',
        '507f1f77bcf86cd799439010',
        onlineUserIds,
      );

      expect(result).toHaveLength(2);
      expect(
        result.every((u) => onlineUserIds.includes(u._id!.toString())),
      ).toBe(true);
    });

    it('should exclude current user even if online', async () => {
      mockUserRepository.find!.mockResolvedValue(users);
      const onlineUserIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      ];

      const result = await service.searchOnlineUsers(
        'online',
        '507f1f77bcf86cd799439011',
        onlineUserIds,
      );

      expect(
        result.every((u) => u._id!.toString() !== '507f1f77bcf86cd799439011'),
      ).toBe(true);
    });

    it('should apply search query to online users', async () => {
      mockUserRepository.find!.mockResolvedValue(users);
      const onlineUserIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      ];

      const result = await service.searchOnlineUsers(
        'online1',
        '507f1f77bcf86cd799439010',
        onlineUserIds,
      );

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('online1@example.com');
    });

    it('should exclude password from results', async () => {
      mockUserRepository.find!.mockResolvedValue(users);
      const onlineUserIds = ['507f1f77bcf86cd799439011'];

      const result = await service.searchOnlineUsers(
        'online',
        '507f1f77bcf86cd799439010',
        onlineUserIds,
      );

      result.forEach((user) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should search by phone number', async () => {
      mockUserRepository.find!.mockResolvedValue(users);
      const onlineUserIds = ['507f1f77bcf86cd799439011'];

      const result = await service.searchOnlineUsers(
        '1234',
        '507f1f77bcf86cd799439010',
        onlineUserIds,
      );

      expect(result).toHaveLength(1);
      expect(result[0].phone).toBe('+1234567890');
    });

    it('should handle users without phone numbers', async () => {
      mockUserRepository.find!.mockResolvedValue(users);
      const onlineUserIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      ];

      const result = await service.searchOnlineUsers(
        'online2',
        '507f1f77bcf86cd799439010',
        onlineUserIds,
      );

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('online2@example.com');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserRepository.findOne!.mockResolvedValue(mockUser);
      mockUserRepository.remove!.mockResolvedValue(mockUser);

      await service.deleteUser('507f1f77bcf86cd799439011');

      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.deleteUser('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.remove).not.toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      mockUserRepository.findOne!.mockResolvedValue(mockUser);
      mockUserRepository.remove!.mockRejectedValue(
        new Error('Database delete failed'),
      );

      await expect(
        service.deleteUser('507f1f77bcf86cd799439011'),
      ).rejects.toThrow('Database delete failed');
    });
  });
});
