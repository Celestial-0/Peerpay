import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import {
  FriendRequest,
  FriendRequestStatus,
} from './entities/friend-request.entity';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { User } from '../user/entities/user.entity';

describe('FriendController', () => {
  let controller: FriendController;
  let friendService: FriendService;
  let realtimeGateway: RealtimeGateway;

  const mockAuthUser: AuthenticatedUser = {
    userId: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    tokenVersion: 0,
  };

  const mockFriendRequest: Partial<FriendRequest> = {
    _id: new ObjectId('507f1f77bcf86cd799439013'),
    senderId: new ObjectId('507f1f77bcf86cd799439011'),
    receiverId: new ObjectId('507f1f77bcf86cd799439012'),
    status: FriendRequestStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFriends: Partial<User>[] = [
    {
      _id: new ObjectId('507f1f77bcf86cd799439012'),
      email: 'friend@example.com',
      name: 'Friend User',
      role: 'user' as const,
      isActive: true,
    },
  ];

  const mockIncomingRequests = [
    {
      _id: new ObjectId('507f1f77bcf86cd799439013'),
      sender: {
        _id: new ObjectId('507f1f77bcf86cd799439012'),
        email: 'sender@example.com',
        name: 'Sender User',
      },
      createdAt: new Date(),
    },
  ];

  const mockServer = {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  };

  const mockFriendEvents = {
    emitFriendRequested: jest.fn(),
    emitFriendAccepted: jest.fn(),
    emitFriendRejected: jest.fn(),
    emitFriendRequestCancelled: jest.fn(),
    emitFriendRemoved: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendController],
      providers: [
        {
          provide: FriendService,
          useValue: {
            sendFriendRequest: jest.fn(),
            acceptFriendRequest: jest.fn(),
            rejectFriendRequest: jest.fn(),
            getFriends: jest.fn(),
            getIncomingRequests: jest.fn(),
            getOutgoingRequests: jest.fn(),
            cancelFriendRequest: jest.fn(),
            removeFriend: jest.fn(),
          },
        },
        {
          provide: RealtimeGateway,
          useValue: {
            getServer: jest.fn().mockReturnValue(mockServer),
            getFriendEvents: jest.fn().mockReturnValue(mockFriendEvents),
          },
        },
      ],
    }).compile();

    controller = module.get<FriendController>(FriendController);
    friendService = module.get<FriendService>(FriendService);
    realtimeGateway = module.get<RealtimeGateway>(RealtimeGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendFriendRequest', () => {
    const dto = { receiverId: '507f1f77bcf86cd799439012' };

    it('should send a friend request successfully', async () => {
      jest
        .spyOn(friendService, 'sendFriendRequest')
        .mockResolvedValue(mockFriendRequest as FriendRequest);

      const result = await controller.sendFriendRequest(mockAuthUser, dto);

      expect(result).toEqual(mockFriendRequest);
      expect(friendService.sendFriendRequest).toHaveBeenCalledWith(
        mockAuthUser.userId,
        dto.receiverId,
      );
      expect(mockFriendEvents.emitFriendRequested).toHaveBeenCalled();
    });

    it('should emit WebSocket event after sending request', async () => {
      jest
        .spyOn(friendService, 'sendFriendRequest')
        .mockResolvedValue(mockFriendRequest as FriendRequest);

      await controller.sendFriendRequest(mockAuthUser, dto);

      expect(realtimeGateway.getServer).toHaveBeenCalled();
      expect(realtimeGateway.getFriendEvents).toHaveBeenCalled();
      expect(mockFriendEvents.emitFriendRequested).toHaveBeenCalledWith(
        mockServer,
        mockAuthUser.userId,
        dto.receiverId,
        mockFriendRequest._id!.toString(),
      );
    });

    it('should handle errors from service', async () => {
      const error = new Error('Service error');
      jest.spyOn(friendService, 'sendFriendRequest').mockRejectedValue(error);

      await expect(
        controller.sendFriendRequest(mockAuthUser, dto),
      ).rejects.toThrow('Service error');
    });
  });

  describe('handleFriendRequest', () => {
    const requestId = '507f1f77bcf86cd799439013';

    it('should accept a friend request', async () => {
      const dto = { decision: 'accept' as const };
      jest
        .spyOn(friendService, 'acceptFriendRequest')
        .mockResolvedValue(mockFriendRequest as FriendRequest);

      const result = await controller.handleFriendRequest(
        mockAuthUser,
        requestId,
        dto,
      );

      expect(result).toEqual(mockFriendRequest);
      expect(friendService.acceptFriendRequest).toHaveBeenCalledWith(
        requestId,
        mockAuthUser.userId,
      );
      expect(mockFriendEvents.emitFriendAccepted).toHaveBeenCalled();
    });

    it('should reject a friend request', async () => {
      const dto = { decision: 'reject' as const };
      jest
        .spyOn(friendService, 'rejectFriendRequest')
        .mockResolvedValue(mockFriendRequest as FriendRequest);

      const result = await controller.handleFriendRequest(
        mockAuthUser,
        requestId,
        dto,
      );

      expect(result).toEqual(mockFriendRequest);
      expect(friendService.rejectFriendRequest).toHaveBeenCalledWith(
        requestId,
        mockAuthUser.userId,
      );
      expect(mockFriendEvents.emitFriendRejected).toHaveBeenCalled();
    });

    it('should emit WebSocket event when accepting', async () => {
      const dto = { decision: 'accept' as const };
      jest
        .spyOn(friendService, 'acceptFriendRequest')
        .mockResolvedValue(mockFriendRequest as FriendRequest);

      await controller.handleFriendRequest(mockAuthUser, requestId, dto);

      expect(mockFriendEvents.emitFriendAccepted).toHaveBeenCalledWith(
        mockServer,
        mockFriendRequest.senderId!.toString(),
        mockFriendRequest.receiverId!.toString(),
      );
    });

    it('should emit WebSocket event when rejecting', async () => {
      const dto = { decision: 'reject' as const };
      jest
        .spyOn(friendService, 'rejectFriendRequest')
        .mockResolvedValue(mockFriendRequest as FriendRequest);

      await controller.handleFriendRequest(mockAuthUser, requestId, dto);

      expect(mockFriendEvents.emitFriendRejected).toHaveBeenCalledWith(
        mockServer,
        mockFriendRequest.senderId!.toString(),
        mockFriendRequest.receiverId!.toString(),
      );
    });
  });

  describe('getFriends', () => {
    it('should return list of friends', async () => {
      jest.spyOn(friendService, 'getFriends').mockResolvedValue(mockFriends);

      const result = await controller.getFriends(mockAuthUser);

      expect(result).toEqual(mockFriends);
      expect(friendService.getFriends).toHaveBeenCalledWith(
        mockAuthUser.userId,
      );
    });
  });

  describe('getIncomingRequests', () => {
    it('should return incoming friend requests', async () => {
      jest
        .spyOn(friendService, 'getIncomingRequests')
        .mockResolvedValue(mockIncomingRequests);

      const result = await controller.getIncomingRequests(mockAuthUser);

      expect(result).toEqual(mockIncomingRequests);
      expect(friendService.getIncomingRequests).toHaveBeenCalledWith(
        mockAuthUser.userId,
      );
    });
  });

  describe('getOutgoingRequests', () => {
    it('should return outgoing friend requests', async () => {
      const mockOutgoingRequests = [
        {
          _id: new ObjectId('507f1f77bcf86cd799439013'),
          receiver: {
            _id: new ObjectId('507f1f77bcf86cd799439012'),
            email: 'receiver@example.com',
            name: 'Receiver User',
          },
          createdAt: new Date(),
        },
      ];
      jest
        .spyOn(friendService, 'getOutgoingRequests')
        .mockResolvedValue(mockOutgoingRequests);

      const result = await controller.getOutgoingRequests(mockAuthUser);

      expect(result).toEqual(mockOutgoingRequests);
      expect(friendService.getOutgoingRequests).toHaveBeenCalledWith(
        mockAuthUser.userId,
      );
    });
  });

  describe('cancelFriendRequest', () => {
    const requestId = '507f1f77bcf86cd799439013';

    it('should cancel a friend request', async () => {
      jest
        .spyOn(friendService, 'cancelFriendRequest')
        .mockResolvedValue(mockFriendRequest as FriendRequest);

      const result = await controller.cancelFriendRequest(
        mockAuthUser,
        requestId,
      );

      expect(result).toEqual({
        message: 'Friend request cancelled successfully',
      });
      expect(friendService.cancelFriendRequest).toHaveBeenCalledWith(
        requestId,
        mockAuthUser.userId,
      );
      expect(mockFriendEvents.emitFriendRequestCancelled).toHaveBeenCalled();
    });

    it('should emit WebSocket event after cancelling', async () => {
      jest
        .spyOn(friendService, 'cancelFriendRequest')
        .mockResolvedValue(mockFriendRequest as FriendRequest);

      await controller.cancelFriendRequest(mockAuthUser, requestId);

      expect(mockFriendEvents.emitFriendRequestCancelled).toHaveBeenCalledWith(
        mockServer,
        mockFriendRequest.receiverId!.toString(),
        requestId,
      );
    });
  });

  describe('removeFriend', () => {
    const friendId = '507f1f77bcf86cd799439012';

    it('should remove a friend', async () => {
      jest.spyOn(friendService, 'removeFriend').mockResolvedValue(undefined);

      const result = await controller.removeFriend(mockAuthUser, friendId);

      expect(result).toEqual({ message: 'Friend removed successfully' });
      expect(friendService.removeFriend).toHaveBeenCalledWith(
        mockAuthUser.userId,
        friendId,
      );
      expect(mockFriendEvents.emitFriendRemoved).toHaveBeenCalled();
    });

    it('should emit WebSocket event after removing friend', async () => {
      jest.spyOn(friendService, 'removeFriend').mockResolvedValue(undefined);

      await controller.removeFriend(mockAuthUser, friendId);

      expect(mockFriendEvents.emitFriendRemoved).toHaveBeenCalledWith(
        mockServer,
        mockAuthUser.userId,
        friendId,
      );
    });
  });
});
