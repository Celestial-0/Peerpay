import { Test, TestingModule } from '@nestjs/testing';
import { NotificationEventsService } from './notification-events.service';
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

describe('NotificationEventsService', () => {
  let service: NotificationEventsService;
  let mockServer: MockServer & { emit: MockEmit; to: MockTo };

  const mockUserId1 = 'user-id-1';
  const mockUserId2 = 'user-id-2';
  const mockUserId3 = 'user-id-3';

  beforeEach(async () => {
    mockServer = createMockServer();

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationEventsService],
    }).compile();

    service = module.get<NotificationEventsService>(NotificationEventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should send notification to single user', () => {
      const title = 'Test Title';
      const message = 'Test Message';
      const data = { key: 'value' };

      service.sendNotification(
        mockServer,
        mockUserId1,
        'system',
        title,
        message,
        data,
      );

      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        id: expect.stringContaining('notif_') as string,
        type: 'system',
        title,
        message,
        data,
        timestamp: expect.any(Date) as Date,
      });
    });

    it('should send notification to multiple users', () => {
      const userIds = [mockUserId1, mockUserId2, mockUserId3];
      const title = 'Broadcast Title';
      const message = 'Broadcast Message';

      service.sendNotification(mockServer, userIds, 'system', title, message);

      expect(mockServer.to).toHaveBeenCalledTimes(3);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId2}`);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId3}`);
      expect(mockServer.emit).toHaveBeenCalledTimes(3);
    });

    it('should send notification without data', () => {
      service.sendNotification(
        mockServer,
        mockUserId1,
        'reminder',
        'Title',
        'Message',
      );

      expect(mockServer.emit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({
          data: undefined,
        }),
      );
    });

    it('should generate unique notification IDs', () => {
      service.sendNotification(
        mockServer,
        mockUserId1,
        'system',
        'Title 1',
        'Message 1',
      );
      service.sendNotification(
        mockServer,
        mockUserId1,
        'system',
        'Title 2',
        'Message 2',
      );

      const emitMock = mockServer.emit as jest.MockedFunction<
        MockServer['emit']
      >;
      const emitCalls = emitMock.mock.calls;
      const id1 = (emitCalls[0]?.[1] as { id: string })?.id;
      const id2 = (emitCalls[1]?.[1] as { id: string })?.id;

      expect(id1).not.toEqual(id2);
      expect(id1).toMatch(/^notif_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^notif_\d+_[a-z0-9]+$/);
    });

    it('should handle all notification types', () => {
      const types: Array<
        'friend_request' | 'transaction' | 'reminder' | 'system'
      > = ['friend_request', 'transaction', 'reminder', 'system'];

      types.forEach((type) =>
        service.sendNotification(
          mockServer,
          mockUserId1,
          type,
          'Title',
          'Message',
        ),
      );

      expect(mockServer.emit).toHaveBeenCalledTimes(4);
      const emitMock = mockServer.emit as jest.MockedFunction<
        MockServer['emit']
      >;
      const emitCalls = emitMock.mock.calls;
      types.forEach((type, index) => {
        expect((emitCalls[index]?.[1] as { type: string })?.type).toBe(type);
      });
    });
  });

  describe('sendFriendRequestNotification', () => {
    it('should send friend request notification with correct format', () => {
      const senderName = 'John Doe';
      const requestId = 'request-123';

      service.sendFriendRequestNotification(
        mockServer,
        mockUserId1,
        senderName,
        requestId,
      );

      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        id: expect.stringContaining('notif_') as string,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${senderName} sent you a friend request`,
        data: { requestId },
        timestamp: expect.any(Date) as Date,
      });
    });

    it('should handle different sender names', () => {
      const senderNames = ['Alice', 'Bob Smith', "Charlie O'Brien"];

      senderNames.forEach((name) =>
        service.sendFriendRequestNotification(
          mockServer,
          mockUserId1,
          name,
          'request-id',
        ),
      );

      const emitMock = mockServer.emit as jest.MockedFunction<
        MockServer['emit']
      >;
      const emitCalls = emitMock.mock.calls;
      senderNames.forEach((name, index) => {
        expect((emitCalls[index]?.[1] as { message: string })?.message).toBe(
          `${name} sent you a friend request`,
        );
      });
    });
  });

  describe('sendTransactionNotification', () => {
    it('should send transaction notification with correct format', () => {
      const title = 'New Transaction';
      const message = 'You received $100';
      const transactionId = 'txn-123';

      service.sendTransactionNotification(
        mockServer,
        mockUserId1,
        title,
        message,
        transactionId,
      );

      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        id: expect.stringContaining('notif_') as string,
        type: 'transaction',
        title,
        message,
        data: { transactionId },
        timestamp: expect.any(Date) as Date,
      });
    });

    it('should handle various transaction messages', () => {
      const scenarios = [
        { title: 'Payment Received', message: 'You received $50' },
        { title: 'Payment Sent', message: 'You sent $100' },
        { title: 'Transaction Settled', message: 'Transaction completed' },
      ];

      scenarios.forEach((scenario) =>
        service.sendTransactionNotification(
          mockServer,
          mockUserId1,
          scenario.title,
          scenario.message,
          'txn-id',
        ),
      );

      expect(mockServer.emit).toHaveBeenCalledTimes(3);
    });
  });

  describe('sendReminderNotification', () => {
    it('should send reminder notification with correct format', () => {
      const message = 'Payment due tomorrow';
      const data = { dueDate: '2024-12-31', amount: 100 };

      service.sendReminderNotification(mockServer, mockUserId1, message, data);

      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        id: expect.stringContaining('notif_') as string,
        type: 'reminder',
        title: 'Reminder',
        message,
        data,
        timestamp: expect.any(Date) as Date,
      });
    });

    it('should send reminder without data', () => {
      const message = 'Simple reminder';

      service.sendReminderNotification(mockServer, mockUserId1, message);

      expect(mockServer.emit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({
          type: 'reminder',
          message,
          data: undefined,
        }),
      );
    });

    it('should handle complex reminder data', () => {
      const message = 'Complex reminder';
      const data = {
        type: 'payment',
        amount: 500,
        currency: 'USD',
        recipients: ['user1', 'user2'],
        metadata: { source: 'automated' },
      };

      service.sendReminderNotification(mockServer, mockUserId1, message, data);

      expect(mockServer.emit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({ data }),
      );
    });
  });

  describe('sendSystemNotification', () => {
    it('should send system notification to single user', () => {
      const title = 'System Update';
      const message = 'Maintenance scheduled';

      service.sendSystemNotification(mockServer, mockUserId1, title, message);

      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        id: expect.stringContaining('notif_') as string,
        type: 'system',
        title,
        message,
        data: undefined,
        timestamp: expect.any(Date) as Date,
      });
    });

    it('should send system notification to multiple users', () => {
      const userIds = [mockUserId1, mockUserId2, mockUserId3];
      const title = 'System Announcement';
      const message = 'New features available';

      service.sendSystemNotification(mockServer, userIds, title, message);

      expect(mockServer.to).toHaveBeenCalledTimes(3);
      expect(mockServer.emit).toHaveBeenCalledTimes(3);
      userIds.forEach((userId) => {
        expect(mockServer.to).toHaveBeenCalledWith(`user:${userId}`);
      });
    });

    it('should handle empty user array', () => {
      service.sendSystemNotification(mockServer, [], 'Title', 'Message');

      expect(mockServer.to).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('should handle various system messages', () => {
      const scenarios = [
        { title: 'Maintenance', message: 'Scheduled downtime at 2AM' },
        { title: 'Security Alert', message: 'Please update your password' },
        { title: 'New Feature', message: 'Check out our new dashboard' },
      ];

      scenarios.forEach((scenario) =>
        service.sendSystemNotification(
          mockServer,
          mockUserId1,
          scenario.title,
          scenario.message,
        ),
      );

      expect(mockServer.emit).toHaveBeenCalledTimes(3);
    });
  });
});
