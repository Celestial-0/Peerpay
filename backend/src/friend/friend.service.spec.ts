import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { FriendService } from './friend.service';
import {
  FriendRequest,
  FriendRequestStatus,
} from './entities/friend-request.entity';
import { Friendship } from './entities/friendship.entity';
import { User } from '../user/entities/user.entity';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transaction/entities/transaction.entity';
import {
  IncomingFriendRequestResponse,
  OutgoingFriendRequestResponse,
} from './types/friend-request-response.type';

describe('FriendService', () => {
  let service: FriendService;
  let friendRequestRepo: Repository<FriendRequest>;
  let friendshipRepo: Repository<Friendship>;
  let userRepo: Repository<User>;
  let transactionRepo: Repository<Transaction>;

  const mockUser1Id = new ObjectId('507f1f77bcf86cd799439011');
  const mockUser2Id = new ObjectId('507f1f77bcf86cd799439012');
  const mockFriendRequestId = new ObjectId('507f1f77bcf86cd799439013');
  const mockFriendshipId = new ObjectId('507f1f77bcf86cd799439014');

  const mockUser1: User = {
    _id: mockUser1Id,
    email: 'user1@example.com',
    password: 'hashedPassword1',
    name: 'User One',
    avatar: undefined,
    phone: undefined,
    friends: [],
    pendingRequests: [],
    totalLent: 0,
    totalBorrowed: 0,
    netBalance: 0,
    role: 'user',
    isActive: true,
    tokenVersion: 0,
    refreshTokenHash: undefined,
    lastLogin: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    setCreateTimestamp: function () {
      return;
    },
    updateTimestamp: function () {
      return;
    },
    comparePassword: async function () {
      return await Promise.resolve(true);
    },
    hashPassword: async function () {
      await Promise.resolve();
    },
    recalculateBalance: function () {
      return;
    },
  };

  const mockUser2: User = {
    _id: mockUser2Id,
    email: 'user2@example.com',
    password: 'hashedPassword2',
    name: 'User Two',
    avatar: undefined,
    phone: undefined,
    friends: [],
    pendingRequests: [],
    totalLent: 0,
    totalBorrowed: 0,
    netBalance: 0,
    role: 'user',
    isActive: true,
    tokenVersion: 0,
    refreshTokenHash: undefined,
    lastLogin: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    setCreateTimestamp: function () {
      return;
    },
    updateTimestamp: function () {
      return;
    },
    comparePassword: async function () {
      return Promise.resolve(true);
    },
    hashPassword: async function () {
      return Promise.resolve();
    },
    recalculateBalance: function () {
      return;
    },
  };

  const mockFriendRequest: FriendRequest = {
    _id: mockFriendRequestId,
    senderId: mockUser1Id,
    receiverId: mockUser2Id,
    status: FriendRequestStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    setCreateTimestamp: function () {
      return;
    },
    updateTimestamp: function () {
      return;
    },
  };

  const mockFriendship: Friendship = {
    _id: mockFriendshipId,
    userId1: mockUser1Id,
    userId2: mockUser2Id,
    createdAt: new Date(),
    updatedAt: new Date(),
    setCreateTimestamp: function () {
      return;
    },
    updateTimestamp: function () {
      return;
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendService,
        {
          provide: getRepositoryToken(FriendRequest),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Friendship),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FriendService>(FriendService);
    friendRequestRepo = module.get<Repository<FriendRequest>>(
      getRepositoryToken(FriendRequest),
    );
    friendshipRepo = module.get<Repository<Friendship>>(
      getRepositoryToken(Friendship),
    );
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    transactionRepo = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendFriendRequest', () => {
    const senderId = mockUser1Id.toString();
    const receiverId = mockUser2Id.toString();

    it('should successfully send a friend request', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser1);
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser2);
      jest.spyOn(friendshipRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(friendRequestRepo, 'create')
        .mockReturnValue(mockFriendRequest);
      jest
        .spyOn(friendRequestRepo, 'save')
        .mockResolvedValue(mockFriendRequest);

      const result = await service.sendFriendRequest(senderId, receiverId);

      expect(result).toEqual(mockFriendRequest);
      expect(friendRequestRepo.create).toHaveBeenCalled();
      const createSpy = jest.mocked(friendRequestRepo.create);
      const createCallArg = createSpy.mock.calls[0][0];
      expect(createCallArg.senderId).toBeInstanceOf(ObjectId);
      expect(createCallArg.receiverId).toBeInstanceOf(ObjectId);
      expect(createCallArg.status).toBe(FriendRequestStatus.PENDING);
      expect(friendRequestRepo.save).toHaveBeenCalledWith(mockFriendRequest);
    });

    it('should throw BadRequestException if sending request to self', async () => {
      await expect(
        service.sendFriendRequest(senderId, senderId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if sender does not exist', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.sendFriendRequest(senderId, receiverId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if receiver does not exist', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser1);
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.sendFriendRequest(senderId, receiverId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if already friends', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser1);
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser2);
      jest.spyOn(friendshipRepo, 'findOne').mockResolvedValue(mockFriendship);

      await expect(
        service.sendFriendRequest(senderId, receiverId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if request already exists', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser1);
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser2);
      jest.spyOn(friendshipRepo, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(friendRequestRepo, 'findOne')
        .mockResolvedValue(mockFriendRequest);

      await expect(
        service.sendFriendRequest(senderId, receiverId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptFriendRequest', () => {
    const requestId = mockFriendRequestId.toString();
    const userId = mockUser2Id.toString();

    it('should successfully accept a friend request', async () => {
      const request: FriendRequest = {
        ...mockFriendRequest,
        setCreateTimestamp: mockFriendRequest.setCreateTimestamp,
        updateTimestamp: mockFriendRequest.updateTimestamp,
      };
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(request);
      jest.spyOn(friendRequestRepo, 'save').mockResolvedValue(request);
      jest.spyOn(friendshipRepo, 'create').mockReturnValue(mockFriendship);
      jest.spyOn(friendshipRepo, 'save').mockResolvedValue(mockFriendship);

      const result = await service.acceptFriendRequest(requestId, userId);

      expect(result.status).toBe(FriendRequestStatus.ACCEPTED);
      const createSpy = jest.mocked(friendshipRepo.create);
      const createCall = createSpy.mock.calls[0][0];
      expect(createCall.userId1).toEqual(mockFriendRequest.senderId);
      expect(createCall.userId2).toEqual(mockFriendRequest.receiverId);
      expect(friendshipRepo.save).toHaveBeenCalledWith(mockFriendship);
    });

    it('should throw NotFoundException if request does not exist', async () => {
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.acceptFriendRequest(requestId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not the receiver', async () => {
      const request: FriendRequest = {
        ...mockFriendRequest,
        setCreateTimestamp: mockFriendRequest.setCreateTimestamp,
        updateTimestamp: mockFriendRequest.updateTimestamp,
      };
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(request);

      await expect(
        service.acceptFriendRequest(requestId, mockUser1Id.toString()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if request is not pending', async () => {
      const request: FriendRequest = {
        ...mockFriendRequest,
        status: FriendRequestStatus.ACCEPTED,
        setCreateTimestamp: mockFriendRequest.setCreateTimestamp,
        updateTimestamp: mockFriendRequest.updateTimestamp,
      };
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(request);

      await expect(
        service.acceptFriendRequest(requestId, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectFriendRequest', () => {
    const requestId = mockFriendRequestId.toString();
    const userId = mockUser2Id.toString();

    it('should successfully reject a friend request', async () => {
      const request: FriendRequest = {
        ...mockFriendRequest,
        setCreateTimestamp: mockFriendRequest.setCreateTimestamp,
        updateTimestamp: mockFriendRequest.updateTimestamp,
      };
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(request);
      jest.spyOn(friendRequestRepo, 'save').mockResolvedValue(request);

      const result = await service.rejectFriendRequest(requestId, userId);

      expect(result.status).toBe(FriendRequestStatus.REJECTED);
      const saveSpy = jest.mocked(friendRequestRepo.save);
      const saveCall = saveSpy.mock.calls[0][0];
      expect(saveCall.status).toBe(FriendRequestStatus.REJECTED);
    });

    it('should throw NotFoundException if request does not exist', async () => {
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.rejectFriendRequest(requestId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not the receiver', async () => {
      const request: FriendRequest = {
        ...mockFriendRequest,
        setCreateTimestamp: mockFriendRequest.setCreateTimestamp,
        updateTimestamp: mockFriendRequest.updateTimestamp,
      };
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(request);

      await expect(
        service.rejectFriendRequest(requestId, mockUser1Id.toString()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if request is not pending', async () => {
      const request: FriendRequest = {
        ...mockFriendRequest,
        status: FriendRequestStatus.REJECTED,
        setCreateTimestamp: mockFriendRequest.setCreateTimestamp,
        updateTimestamp: mockFriendRequest.updateTimestamp,
      };
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(request);

      await expect(
        service.rejectFriendRequest(requestId, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFriends', () => {
    const userId = mockUser1Id.toString();

    it('should return list of friends', async () => {
      jest.spyOn(friendshipRepo, 'find').mockResolvedValue([mockFriendship]);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser2);
      jest.spyOn(transactionRepo, 'find').mockResolvedValue([]);

      const result = await service.getFriends(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0].email).toBe(mockUser2.email);
    });

    it('should return empty array if no friends', async () => {
      jest.spyOn(friendshipRepo, 'find').mockResolvedValue([]);

      const result = await service.getFriends(userId);

      expect(result).toEqual([]);
    });

    it('should handle friendships where user is userId2', async () => {
      const reverseFriendship: Friendship = {
        ...mockFriendship,
        userId1: mockUser2Id,
        userId2: mockUser1Id,
        setCreateTimestamp: mockFriendship.setCreateTimestamp,
        updateTimestamp: mockFriendship.updateTimestamp,
      };
      jest.spyOn(friendshipRepo, 'find').mockResolvedValue([reverseFriendship]);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser2);
      jest.spyOn(transactionRepo, 'find').mockResolvedValue([]);

      const result = await service.getFriends(userId);

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe(mockUser2.email);
    });

    it('should filter out null users', async () => {
      jest.spyOn(friendshipRepo, 'find').mockResolvedValue([mockFriendship]);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(transactionRepo, 'find').mockResolvedValue([]);

      const result = await service.getFriends(userId);

      expect(result).toEqual([]);
    });

    it('should calculate per-friend balances correctly with LENT transactions', async () => {
      jest.spyOn(friendshipRepo, 'find').mockResolvedValue([mockFriendship]);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser2);

      // Mock transactions: user lent 100 to friend
      const mockTransactions: Partial<Transaction>[] = [
        {
          _id: new ObjectId(),
          senderId: mockUser1Id,
          receiverId: mockUser2Id,
          amount: 100,
          type: 'lent' as TransactionType,
          status: 'accepted' as TransactionStatus,
        },
      ];
      jest
        .spyOn(transactionRepo, 'find')
        .mockResolvedValue(mockTransactions as Transaction[]);

      const result = await service.getFriends(userId);

      expect(result).toHaveLength(1);
      expect(result[0].totalLent).toBe(100);
      expect(result[0].totalBorrowed).toBe(0);
    });

    it('should calculate per-friend balances correctly with BORROWED transactions', async () => {
      jest.spyOn(friendshipRepo, 'find').mockResolvedValue([mockFriendship]);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser2);

      // Mock transactions: user borrowed 50 from friend
      const mockTransactions: Partial<Transaction>[] = [
        {
          _id: new ObjectId(),
          senderId: mockUser1Id,
          receiverId: mockUser2Id,
          amount: 50,
          type: 'borrowed' as TransactionType,
          status: 'accepted' as TransactionStatus,
        },
      ];
      jest
        .spyOn(transactionRepo, 'find')
        .mockResolvedValue(mockTransactions as Transaction[]);

      const result = await service.getFriends(userId);

      expect(result).toHaveLength(1);
      expect(result[0].totalLent).toBe(0);
      expect(result[0].totalBorrowed).toBe(50);
    });

    it('should calculate balances when friend is sender', async () => {
      jest.spyOn(friendshipRepo, 'find').mockResolvedValue([mockFriendship]);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser2);

      // Mock transactions: friend lent 75 to user
      const mockTransactions: Partial<Transaction>[] = [
        {
          _id: new ObjectId(),
          senderId: mockUser2Id,
          receiverId: mockUser1Id,
          amount: 75,
          type: 'lent' as TransactionType,
          status: 'accepted' as TransactionStatus,
        },
      ];
      jest
        .spyOn(transactionRepo, 'find')
        .mockResolvedValue(mockTransactions as Transaction[]);

      const result = await service.getFriends(userId);

      expect(result).toHaveLength(1);
      // When friend lent to user, user borrowed from friend
      expect(result[0].totalLent).toBe(0);
      expect(result[0].totalBorrowed).toBe(75);
    });

    it('should calculate balances with multiple transactions', async () => {
      jest.spyOn(friendshipRepo, 'find').mockResolvedValue([mockFriendship]);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser2);

      // Mock multiple transactions
      const mockTransactions: Partial<Transaction>[] = [
        {
          _id: new ObjectId(),
          senderId: mockUser1Id,
          receiverId: mockUser2Id,
          amount: 100,
          type: 'lent' as TransactionType,
          status: 'accepted' as TransactionStatus,
        },
        {
          _id: new ObjectId(),
          senderId: mockUser1Id,
          receiverId: mockUser2Id,
          amount: 50,
          type: 'borrowed' as TransactionType,
          status: 'completed' as TransactionStatus,
        },
        {
          _id: new ObjectId(),
          senderId: mockUser2Id,
          receiverId: mockUser1Id,
          amount: 25,
          type: 'borrowed' as TransactionType,
          status: 'accepted' as TransactionStatus,
        },
      ];
      jest
        .spyOn(transactionRepo, 'find')
        .mockResolvedValue(mockTransactions as Transaction[]);

      const result = await service.getFriends(userId);

      expect(result).toHaveLength(1);
      // User lent 100, borrowed 50, and friend borrowed 25 (user lent 25)
      expect(result[0].totalLent).toBe(125); // 100 + 25
      expect(result[0].totalBorrowed).toBe(50);
    });
  });

  describe('getIncomingRequests', () => {
    const userId = mockUser2Id.toString();

    it('should return incoming friend requests with sender info', async () => {
      const mockIncomingResponse: IncomingFriendRequestResponse = {
        _id: mockFriendRequestId,
        sender: {
          _id: mockUser1Id,
          email: mockUser1.email,
          name: mockUser1.name,
        },
        status: FriendRequestStatus.PENDING,
        createdAt: mockFriendRequest.createdAt,
      };

      jest
        .spyOn(friendRequestRepo, 'find')
        .mockResolvedValue([mockFriendRequest]);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser1);

      const result = await service.getIncomingRequests(userId);

      expect(result).toHaveLength(1);
      expect(result[0].sender).toBeDefined();
      expect(result[0].sender).not.toHaveProperty('password');
      expect(result[0]._id).toEqual(mockIncomingResponse._id);
    });

    it('should return empty array if no incoming requests', async () => {
      jest.spyOn(friendRequestRepo, 'find').mockResolvedValue([]);

      const result = await service.getIncomingRequests(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getOutgoingRequests', () => {
    const userId = mockUser1Id.toString();

    it('should return outgoing friend requests with receiver info', async () => {
      const mockOutgoingResponse: OutgoingFriendRequestResponse = {
        _id: mockFriendRequestId,
        receiver: {
          _id: mockUser2Id,
          email: mockUser2.email,
          name: mockUser2.name,
        },
        status: FriendRequestStatus.PENDING,
        createdAt: mockFriendRequest.createdAt,
      };

      jest
        .spyOn(friendRequestRepo, 'find')
        .mockResolvedValue([mockFriendRequest]);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser2);

      const result = await service.getOutgoingRequests(userId);

      expect(result).toHaveLength(1);
      expect(result[0].receiver).toBeDefined();
      expect(result[0].receiver).not.toHaveProperty('password');
      expect(result[0]._id).toEqual(mockOutgoingResponse._id);
    });

    it('should return empty array if no outgoing requests', async () => {
      jest.spyOn(friendRequestRepo, 'find').mockResolvedValue([]);

      const result = await service.getOutgoingRequests(userId);

      expect(result).toEqual([]);
    });
  });

  describe('removeFriend', () => {
    const userId = mockUser1Id.toString();
    const friendId = mockUser2Id.toString();

    it('should successfully remove a friend', async () => {
      jest.spyOn(friendshipRepo, 'findOne').mockResolvedValue(mockFriendship);
      jest.spyOn(friendshipRepo, 'remove').mockResolvedValue(mockFriendship);

      await service.removeFriend(userId, friendId);

      const removeSpy = jest.mocked(friendshipRepo.remove);
      const removeCall = removeSpy.mock.calls[0][0];
      expect(removeCall._id).toEqual(mockFriendshipId);
    });

    it('should throw NotFoundException if friendship does not exist', async () => {
      jest.spyOn(friendshipRepo, 'findOne').mockResolvedValue(null);

      await expect(service.removeFriend(userId, friendId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancelFriendRequest', () => {
    const requestId = mockFriendRequestId.toString();
    const userId = mockUser1Id.toString();

    it('should successfully cancel a friend request', async () => {
      const request: FriendRequest = {
        ...mockFriendRequest,
        setCreateTimestamp: mockFriendRequest.setCreateTimestamp,
        updateTimestamp: mockFriendRequest.updateTimestamp,
      };
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(request);
      jest.spyOn(friendRequestRepo, 'remove').mockResolvedValue(request);

      const result = await service.cancelFriendRequest(requestId, userId);

      const removeSpy = jest.mocked(friendRequestRepo.remove);
      const removeCall = removeSpy.mock.calls[0][0];
      expect(removeCall._id).toEqual(mockFriendRequestId);
      expect(result).toEqual(request);
    });

    it('should throw NotFoundException if request does not exist', async () => {
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.cancelFriendRequest(requestId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not the sender', async () => {
      const request: FriendRequest = {
        ...mockFriendRequest,
        setCreateTimestamp: mockFriendRequest.setCreateTimestamp,
        updateTimestamp: mockFriendRequest.updateTimestamp,
      };
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(request);

      await expect(
        service.cancelFriendRequest(requestId, mockUser2Id.toString()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if request is not pending', async () => {
      const request: FriendRequest = {
        ...mockFriendRequest,
        status: FriendRequestStatus.ACCEPTED,
        setCreateTimestamp: mockFriendRequest.setCreateTimestamp,
        updateTimestamp: mockFriendRequest.updateTimestamp,
      };
      jest.spyOn(friendRequestRepo, 'findOne').mockResolvedValue(request);

      await expect(
        service.cancelFriendRequest(requestId, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('areFriends', () => {
    const userId1 = mockUser1Id.toString();
    const userId2 = mockUser2Id.toString();

    it('should return true if users are friends', async () => {
      jest.spyOn(friendshipRepo, 'findOne').mockResolvedValue(mockFriendship);

      const result = await service.areFriends(userId1, userId2);

      expect(result).toBe(true);
    });

    it('should return false if users are not friends', async () => {
      jest.spyOn(friendshipRepo, 'findOne').mockResolvedValue(null);

      const result = await service.areFriends(userId1, userId2);

      expect(result).toBe(false);
    });
  });
});
