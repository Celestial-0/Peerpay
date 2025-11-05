import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { FriendService } from '../friend/friend.service';
import { FriendEventsService } from './services/friend-events.service';
import { TransactionEventsService } from './services/transaction-events.service';
import { NotificationEventsService } from './services/notification-events.service';
import { Server, Socket } from 'socket.io';
import { ObjectId } from 'mongodb';
import { User } from '../user/entities/user.entity';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from './types/socket-events.types';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let jwtService: JwtService;
  let friendService: FriendService;
  let friendEvents: FriendEventsService;
  let transactionEvents: TransactionEventsService;
  let notificationEvents: NotificationEventsService;

  const mockUserId1 = new ObjectId().toString();
  const mockUserId2 = new ObjectId().toString();
  const mockUserId3 = new ObjectId().toString();
  const mockSocketId1 = 'socket-1';
  const mockSocketId2 = 'socket-2';
  const mockToken = 'valid.jwt.token';

  const mockJwtPayload = {
    sub: mockUserId1,
    email: 'test@example.com',
    tokenVersion: 0,
  };

  const mockFriend: User = {
    _id: new ObjectId(mockUserId2),
    email: 'friend@example.com',
    password: 'hashedPassword',
    name: 'Friend User',
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

  type TypedSocket = Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >;

  const createMockSocket = (
    socketId: string,
    userId?: string,
    token?: string,
  ): Partial<TypedSocket> => ({
    id: socketId,
    handshake: {
      auth: token ? { token } : {},
      query: {},
      headers: {},
      time: new Date().toISOString(),
      address: '127.0.0.1',
      xdomain: false,
      secure: false,
      issued: Date.now(),
      url: '/',
    } as TypedSocket['handshake'],
    data: (userId
      ? { userId, userEmail: 'test@example.com' }
      : {}) as SocketData,
    disconnect: jest.fn(),
    join: jest.fn().mockResolvedValue(undefined),
    emit: jest.fn(),
  });

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as unknown as Server;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: FriendService,
          useValue: {
            getFriends: jest.fn(),
          },
        },
        {
          provide: FriendEventsService,
          useValue: {
            emitFriendOnline: jest.fn(),
            emitFriendOffline: jest.fn(),
          },
        },
        {
          provide: TransactionEventsService,
          useValue: {},
        },
        {
          provide: NotificationEventsService,
          useValue: {},
        },
      ],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
    jwtService = module.get<JwtService>(JwtService);
    friendService = module.get<FriendService>(FriendService);
    friendEvents = module.get<FriendEventsService>(FriendEventsService);
    transactionEvents = module.get<TransactionEventsService>(
      TransactionEventsService,
    );
    notificationEvents = module.get<NotificationEventsService>(
      NotificationEventsService,
    );

    // Set the server instance
    gateway.server = mockServer;

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should successfully connect a client with valid token', async () => {
      const mockSocket = createMockSocket(mockSocketId1, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest
        .spyOn(friendService, 'getFriends')
        .mockResolvedValue([mockFriend] as User[]);

      await gateway.handleConnection(mockSocket as TypedSocket);

      expect(jwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: expect.stringContaining('') as string,
      });
      expect(mockSocket.data).toEqual({
        userId: mockUserId1,
        userEmail: 'test@example.com',
      });
      expect(mockSocket.join).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockSocket.join).toHaveBeenCalledWith('users:online');
      expect(gateway.isUserOnline(mockUserId1)).toBe(true);
    });

    it('should disconnect client when no token is provided', async () => {
      const mockSocket = createMockSocket(mockSocketId1);

      await gateway.handleConnection(mockSocket as TypedSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'Connection rejected: No token provided',
      );
    });

    it('should disconnect client when token is invalid', async () => {
      const mockSocket = createMockSocket(
        mockSocketId1,
        undefined,
        'invalid.token',
      );
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(mockSocket as TypedSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'Connection rejected: Invalid token',
      );
    });

    it('should extract token from query parameter', async () => {
      const mockSocket: Partial<TypedSocket> = {
        id: mockSocketId1,
        handshake: {
          auth: {},
          query: { token: mockToken },
          headers: {},
          time: new Date().toISOString(),
          address: '127.0.0.1',
          xdomain: false,
          secure: false,
          issued: Date.now(),
          url: '/',
        } as TypedSocket['handshake'],
        data: {} as SocketData,
        disconnect: jest.fn(),
        join: jest.fn().mockResolvedValue(undefined),
        emit: jest.fn(),
      };
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest.spyOn(friendService, 'getFriends').mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as TypedSocket);

      expect(jwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: expect.stringContaining('') as string,
      });
    });

    it('should handle multiple devices for same user', async () => {
      const mockSocket1 = createMockSocket(mockSocketId1, undefined, mockToken);
      const mockSocket2 = createMockSocket(mockSocketId2, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest.spyOn(friendService, 'getFriends').mockResolvedValue([]);

      await gateway.handleConnection(mockSocket1 as TypedSocket);
      await gateway.handleConnection(mockSocket2 as TypedSocket);

      expect(gateway.isUserOnline(mockUserId1)).toBe(true);
    });

    it('should notify friends when user comes online', async () => {
      const mockSocket = createMockSocket(mockSocketId1, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest
        .spyOn(friendService, 'getFriends')
        .mockResolvedValue([mockFriend] as User[]);

      await gateway.handleConnection(mockSocket as TypedSocket);

      expect(friendEvents.emitFriendOnline).toHaveBeenCalledWith(
        mockServer,
        [mockUserId2],
        mockUserId1,
      );
    });

    it('should handle connection error gracefully', async () => {
      const mockSocket = createMockSocket(mockSocketId1, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('JWT verification failed');
      });

      await gateway.handleConnection(mockSocket as TypedSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should not notify friends on reconnection (already online)', async () => {
      const mockSocket1 = createMockSocket(mockSocketId1, undefined, mockToken);
      const mockSocket2 = createMockSocket(mockSocketId2, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest
        .spyOn(friendService, 'getFriends')
        .mockResolvedValue([mockFriend] as User[]);

      await gateway.handleConnection(mockSocket1 as TypedSocket);
      jest.clearAllMocks();

      await gateway.handleConnection(mockSocket2 as TypedSocket);

      expect(friendEvents.emitFriendOnline).not.toHaveBeenCalled();
    });

    it('should handle error when notifying friends of online status', async () => {
      const mockSocket = createMockSocket(mockSocketId1, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest
        .spyOn(friendService, 'getFriends')
        .mockRejectedValue(new Error('Database error'));

      await gateway.handleConnection(mockSocket as TypedSocket);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Error notifying friends of online status'),
      );
    });

    it('should handle non-Error exceptions when notifying friends', async () => {
      const mockSocket = createMockSocket(mockSocketId1, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest.spyOn(friendService, 'getFriends').mockRejectedValue('String error');

      await gateway.handleConnection(mockSocket as TypedSocket);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error notifying friends of online status: Unknown error',
      );
    });
  });

  describe('handleDisconnect', () => {
    beforeEach(async () => {
      const mockSocket = createMockSocket(mockSocketId1, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest.spyOn(friendService, 'getFriends').mockResolvedValue([]);
      await gateway.handleConnection(mockSocket as TypedSocket);
      jest.clearAllMocks();
    });

    it('should handle user going fully offline', async () => {
      const mockSocket = createMockSocket(mockSocketId1, mockUserId1);
      jest
        .spyOn(friendService, 'getFriends')
        .mockResolvedValue([mockFriend] as User[]);

      await gateway.handleDisconnect(mockSocket as TypedSocket);

      expect(gateway.isUserOnline(mockUserId1)).toBe(false);
      expect(friendEvents.emitFriendOffline).toHaveBeenCalledWith(
        mockServer,
        [mockUserId2],
        mockUserId1,
      );
    });

    it('should handle disconnect when userId is not set', async () => {
      const mockSocket = createMockSocket(mockSocketId1);

      await gateway.handleDisconnect(mockSocket as TypedSocket);

      expect(friendEvents.emitFriendOffline).not.toHaveBeenCalled();
    });

    it('should keep user online when other devices are connected', async () => {
      // Connect second device
      const mockSocket2 = createMockSocket(mockSocketId2, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest.spyOn(friendService, 'getFriends').mockResolvedValue([]);
      await gateway.handleConnection(mockSocket2 as TypedSocket);
      jest.clearAllMocks();

      // Disconnect first device
      const mockSocket1 = createMockSocket(mockSocketId1, mockUserId1);
      await gateway.handleDisconnect(mockSocket1 as TypedSocket);

      expect(gateway.isUserOnline(mockUserId1)).toBe(true);
      expect(friendEvents.emitFriendOffline).not.toHaveBeenCalled();
    });

    it('should handle disconnect error gracefully', async () => {
      const mockSocket = createMockSocket(mockSocketId1, mockUserId1);
      jest
        .spyOn(friendService, 'getFriends')
        .mockRejectedValue(new Error('Database error'));

      await gateway.handleDisconnect(mockSocket as TypedSocket);

      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions during disconnect', async () => {
      const mockSocket = createMockSocket(mockSocketId1, mockUserId1);
      jest.spyOn(friendService, 'getFriends').mockRejectedValue('String error');

      await gateway.handleDisconnect(mockSocket as TypedSocket);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error notifying friends of offline status: Unknown error',
      );
    });
  });

  describe('handleGetOnlineFriends', () => {
    beforeEach(async () => {
      const mockSocket = createMockSocket(mockSocketId1, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest.spyOn(friendService, 'getFriends').mockResolvedValue([]);
      await gateway.handleConnection(mockSocket as TypedSocket);
      jest.clearAllMocks();
    });

    it('should return list of online friends', async () => {
      const mockSocket = createMockSocket(mockSocketId1, mockUserId1);

      // Make friend online
      const friendSocket = createMockSocket(
        'friend-socket',
        undefined,
        'friend.token',
      );
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: mockUserId2,
        email: 'friend@example.com',
        tokenVersion: 0,
      });
      jest.spyOn(friendService, 'getFriends').mockResolvedValue([]);
      await gateway.handleConnection(friendSocket as TypedSocket);

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest
        .spyOn(friendService, 'getFriends')
        .mockResolvedValue([mockFriend] as User[]);

      await gateway.handleGetOnlineFriends(mockSocket as TypedSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('friends.onlineList', {
        onlineFriends: [mockUserId2],
      });
    });

    it('should return empty list when no friends are online', async () => {
      const mockSocket = createMockSocket(mockSocketId1, mockUserId1);
      jest
        .spyOn(friendService, 'getFriends')
        .mockResolvedValue([mockFriend] as User[]);

      await gateway.handleGetOnlineFriends(mockSocket as TypedSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('friends.onlineList', {
        onlineFriends: [],
      });
    });

    it('should return error when user is not authenticated', async () => {
      const mockSocket = createMockSocket(mockSocketId1);

      await gateway.handleGetOnlineFriends(mockSocket as TypedSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('friends.onlineList', {
        error: 'Unauthorized',
      });
    });

    it('should handle error when fetching friends fails', async () => {
      const mockSocket = createMockSocket(mockSocketId1, mockUserId1);
      jest
        .spyOn(friendService, 'getFriends')
        .mockRejectedValue(new Error('Database error'));

      await gateway.handleGetOnlineFriends(mockSocket as TypedSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('friends.onlineList', {
        error: 'Failed to fetch online friends',
      });
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('handleGetOnlineCount', () => {
    beforeEach(async () => {
      const mockSocket = createMockSocket(mockSocketId1, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest.spyOn(friendService, 'getFriends').mockResolvedValue([]);
      await gateway.handleConnection(mockSocket as TypedSocket);
      jest.clearAllMocks();
    });

    it('should return count of online users', () => {
      const mockSocket = createMockSocket(mockSocketId1, mockUserId1);

      gateway.handleGetOnlineCount(mockSocket as TypedSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('users.onlineCount', {
        count: 1,
      });
    });

    it('should return error when user is not authenticated', () => {
      const mockSocket = createMockSocket(mockSocketId1);

      gateway.handleGetOnlineCount(mockSocket as TypedSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('users.onlineCount', {
        error: 'Unauthorized',
      });
    });
  });

  describe('handleCheckUsersOnline', () => {
    beforeEach(async () => {
      const mockSocket = createMockSocket(mockSocketId1, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest.spyOn(friendService, 'getFriends').mockResolvedValue([]);
      await gateway.handleConnection(mockSocket as TypedSocket);
      jest.clearAllMocks();
    });

    it('should return online status for requested users', () => {
      const mockSocket = createMockSocket(mockSocketId1, mockUserId1);
      const payload = { userIds: [mockUserId1, mockUserId2, mockUserId3] };

      gateway.handleCheckUsersOnline(mockSocket as TypedSocket, payload);

      expect(mockSocket.emit).toHaveBeenCalledWith('users.onlineStatus', {
        status: {
          [mockUserId1]: true,
          [mockUserId2]: false,
          [mockUserId3]: false,
        },
      });
    });

    it('should return error when user is not authenticated', () => {
      const mockSocket = createMockSocket(mockSocketId1);
      const payload = { userIds: [mockUserId2] };

      gateway.handleCheckUsersOnline(mockSocket as TypedSocket, payload);

      expect(mockSocket.emit).toHaveBeenCalledWith('users.onlineStatus', {
        error: 'Unauthorized',
      });
    });

    it('should return error when payload is invalid', () => {
      const mockSocket = createMockSocket(mockSocketId1, mockUserId1);
      const payload = { userIds: 'invalid' as string & string[] };

      gateway.handleCheckUsersOnline(mockSocket as TypedSocket, payload);

      expect(mockSocket.emit).toHaveBeenCalledWith('users.onlineStatus', {
        error: 'Invalid payload',
      });
    });

    it('should return error when payload is missing', () => {
      const mockSocket = createMockSocket(mockSocketId1, mockUserId1);

      gateway.handleCheckUsersOnline(
        mockSocket as TypedSocket,
        undefined as undefined & { userIds: string[] },
      );

      expect(mockSocket.emit).toHaveBeenCalledWith('users.onlineStatus', {
        error: 'Invalid payload',
      });
    });
  });

  describe('handlePing', () => {
    it('should respond with online count', () => {
      const mockSocket = createMockSocket(mockSocketId1, mockUserId1);

      gateway.handlePing(mockSocket as TypedSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('users.onlineCount', {
        count: expect.any(Number) as number,
      });
    });
  });

  describe('Public Methods', () => {
    it('should return friend events service', () => {
      expect(gateway.getFriendEvents()).toBe(friendEvents);
    });

    it('should return transaction events service', () => {
      expect(gateway.getTransactionEvents()).toBe(transactionEvents);
    });

    it('should return notification events service', () => {
      expect(gateway.getNotificationEvents()).toBe(notificationEvents);
    });

    it('should return server instance', () => {
      expect(gateway.getServer()).toBe(mockServer);
    });

    it('should check if user is online', async () => {
      const mockSocket = createMockSocket(mockSocketId1, undefined, mockToken);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest.spyOn(friendService, 'getFriends').mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as TypedSocket);

      expect(gateway.isUserOnline(mockUserId1)).toBe(true);
      expect(gateway.isUserOnline(mockUserId2)).toBe(false);
    });

    it('should return all online user IDs', async () => {
      const mockSocket1 = createMockSocket(mockSocketId1, undefined, mockToken);
      const mockSocket2 = createMockSocket(mockSocketId2, undefined, 'token2');

      jest.spyOn(jwtService, 'verify').mockReturnValueOnce(mockJwtPayload);
      jest.spyOn(friendService, 'getFriends').mockResolvedValue([]);
      await gateway.handleConnection(mockSocket1 as TypedSocket);

      jest.spyOn(jwtService, 'verify').mockReturnValueOnce({
        sub: mockUserId2,
        email: 'user2@example.com',
        tokenVersion: 0,
      });
      await gateway.handleConnection(mockSocket2 as TypedSocket);

      const onlineUserIds = gateway.getOnlineUserIds();
      expect(onlineUserIds).toContain(mockUserId1);
      expect(onlineUserIds).toContain(mockUserId2);
      expect(onlineUserIds.length).toBe(2);
    });
  });
});
