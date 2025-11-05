import { Test, TestingModule } from '@nestjs/testing';
import { FriendEventsService } from './friend-events.service';
import { Server } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from '../types/socket-events.types';

type MockServer = Server<ClientToServerEvents, ServerToClientEvents>;
type MockEmit = jest.MockedFunction<MockServer['emit']>;
type MockTo = jest.MockedFunction<MockServer['to']>;

function createMockServer(): MockServer & { emit: MockEmit; to: MockTo } {
  const mockTo = jest.fn().mockReturnThis() as MockTo;
  const mockEmit = jest.fn() as MockEmit;
  const mock = {
    to: mockTo,
    emit: mockEmit,
  } as MockServer & { emit: MockEmit; to: MockTo };
  return mock;
}

describe('FriendEventsService', () => {
  let service: FriendEventsService;
  let mockServer: MockServer & { emit: MockEmit; to: MockTo };

  const mockUserId1 = 'user-id-1';
  const mockUserId2 = 'user-id-2';
  const mockUserId3 = 'user-id-3';
  const mockRequestId = 'request-id-123';

  beforeEach(async () => {
    mockServer = createMockServer();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FriendEventsService],
    }).compile();

    service = module.get<FriendEventsService>(FriendEventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('emitFriendOnline', () => {
    it('should emit friend online event to all friends', () => {
      const friendIds = [mockUserId2, mockUserId3];

      service.emitFriendOnline(mockServer, friendIds, mockUserId1);

      expect(mockServer.to).toHaveBeenCalledTimes(2);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId2}`);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId3}`);
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
      expect(mockServer.emit).toHaveBeenCalledWith('friend.online', {
        userId: mockUserId1,
        timestamp: expect.any(Date) as Date,
      });
    });

    it('should handle empty friend list', () => {
      service.emitFriendOnline(mockServer, [], mockUserId1);

      expect(mockServer.to).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('should emit to single friend', () => {
      service.emitFriendOnline(mockServer, [mockUserId2], mockUserId1);

      expect(mockServer.to).toHaveBeenCalledTimes(1);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId2}`);
      expect(mockServer.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('emitFriendOffline', () => {
    it('should emit friend offline event to all friends', () => {
      const friendIds = [mockUserId2, mockUserId3];

      service.emitFriendOffline(mockServer, friendIds, mockUserId1);

      expect(mockServer.to).toHaveBeenCalledTimes(2);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId2}`);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId3}`);
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
      expect(mockServer.emit).toHaveBeenCalledWith('friend.offline', {
        userId: mockUserId1,
        timestamp: expect.any(Date) as Date,
      });
    });

    it('should handle empty friend list', () => {
      service.emitFriendOffline(mockServer, [], mockUserId1);

      expect(mockServer.to).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('emitFriendRequested', () => {
    it('should emit friend request event to receiver', () => {
      service.emitFriendRequested(
        mockServer,
        mockUserId1,
        mockUserId2,
        mockRequestId,
      );

      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId2}`);
      expect(mockServer.emit).toHaveBeenCalledWith('friend.requested', {
        senderId: mockUserId1,
        requestId: mockRequestId,
        timestamp: expect.any(Date) as Date,
      });
    });

    it('should only emit to receiver, not sender', () => {
      service.emitFriendRequested(
        mockServer,
        mockUserId1,
        mockUserId2,
        mockRequestId,
      );

      expect(mockServer.to).toHaveBeenCalledTimes(1);
      expect(mockServer.to).not.toHaveBeenCalledWith(`user:${mockUserId1}`);
    });
  });

  describe('emitFriendAccepted', () => {
    it('should emit friend accepted event to both users', () => {
      service.emitFriendAccepted(mockServer, mockUserId1, mockUserId2);

      expect(mockServer.to).toHaveBeenCalledTimes(2);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId2}`);
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
    });

    it('should emit correct friend IDs to each user', () => {
      service.emitFriendAccepted(mockServer, mockUserId1, mockUserId2);

      const emitCalls = (mockServer.emit as jest.Mock).mock.calls;
      expect(emitCalls[0]).toEqual([
        'friend.accepted',
        {
          friendId: mockUserId2,
          timestamp: expect.any(Date) as Date,
        },
      ]);
      expect(emitCalls[1]).toEqual([
        'friend.accepted',
        {
          friendId: mockUserId1,
          timestamp: expect.any(Date) as Date,
        },
      ]);
    });
  });

  describe('emitFriendRejected', () => {
    it('should emit friend rejected event to sender only', () => {
      service.emitFriendRejected(mockServer, mockUserId1, mockUserId2);

      expect(mockServer.to).toHaveBeenCalledTimes(1);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.emit).toHaveBeenCalledWith('friend.rejected', {
        receiverId: mockUserId2,
        timestamp: expect.any(Date) as Date,
      });
    });

    it('should not emit to receiver', () => {
      service.emitFriendRejected(mockServer, mockUserId1, mockUserId2);

      expect(mockServer.to).not.toHaveBeenCalledWith(`user:${mockUserId2}`);
    });
  });

  describe('emitFriendRemoved', () => {
    it('should emit friend removed event to both users', () => {
      service.emitFriendRemoved(mockServer, mockUserId1, mockUserId2);

      expect(mockServer.to).toHaveBeenCalledTimes(2);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId2}`);
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
    });

    it('should emit correct friend IDs to each user', () => {
      service.emitFriendRemoved(mockServer, mockUserId1, mockUserId2);

      const emitCalls = (mockServer.emit as jest.Mock).mock.calls;
      expect(emitCalls[0]).toEqual([
        'friend.removed',
        {
          friendId: mockUserId2,
          timestamp: expect.any(Date) as Date,
        },
      ]);
      expect(emitCalls[1]).toEqual([
        'friend.removed',
        {
          friendId: mockUserId1,
          timestamp: expect.any(Date) as Date,
        },
      ]);
    });
  });

  describe('emitFriendRequestCancelled', () => {
    it('should emit friend request cancelled event to receiver', () => {
      service.emitFriendRequestCancelled(
        mockServer,
        mockUserId2,
        mockRequestId,
      );

      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId2}`);
      expect(mockServer.emit).toHaveBeenCalledWith('friend.requestCancelled', {
        requestId: mockRequestId,
        timestamp: expect.any(Date) as Date,
      });
    });

    it('should only emit once to receiver', () => {
      service.emitFriendRequestCancelled(
        mockServer,
        mockUserId2,
        mockRequestId,
      );

      expect(mockServer.to).toHaveBeenCalledTimes(1);
      expect(mockServer.emit).toHaveBeenCalledTimes(1);
    });
  });
});
