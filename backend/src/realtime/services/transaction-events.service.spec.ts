import { Test, TestingModule } from '@nestjs/testing';
import { TransactionEventsService } from './transaction-events.service';
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

describe('TransactionEventsService', () => {
  let service: TransactionEventsService;
  let mockServer: MockServer & { emit: MockEmit; to: MockTo };

  const mockUserId1 = 'user-id-1';
  const mockUserId2 = 'user-id-2';
  const mockUserId3 = 'user-id-3';
  const mockTransactionId = 'transaction-id-123';

  beforeEach(async () => {
    mockServer = createMockServer();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionEventsService],
    }).compile();

    service = module.get<TransactionEventsService>(TransactionEventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('emitTransactionCreated', () => {
    it('should emit transaction created event to both users with correct type', () => {
      const amount = 100;
      const type = 'lent';

      service.emitTransactionCreated(
        mockServer,
        mockTransactionId,
        amount,
        type,
        mockUserId1,
        mockUserId2,
      );

      expect(mockServer.to).toHaveBeenCalledTimes(2);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId2}`);
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
    });

    it('should emit lent type to user1 and borrowed type to user2', () => {
      const amount = 100;
      const type = 'lent';

      service.emitTransactionCreated(
        mockServer,
        mockTransactionId,
        amount,
        type,
        mockUserId1,
        mockUserId2,
      );

      const emitCalls = (mockServer.emit as jest.Mock).mock.calls;
      expect(emitCalls[0]).toEqual([
        'transaction.created',
        {
          transactionId: mockTransactionId,
          amount,
          type: 'lent',
          withUserId: mockUserId2,
          timestamp: expect.any(Date) as Date,
        },
      ]);
      expect(emitCalls[1]).toEqual([
        'transaction.created',
        {
          transactionId: mockTransactionId,
          amount,
          type: 'borrowed',
          withUserId: mockUserId1,
          timestamp: expect.any(Date) as Date,
        },
      ]);
    });

    it('should emit borrowed type to user1 and lent type to user2', () => {
      const amount = 200;
      const type = 'borrowed';

      service.emitTransactionCreated(
        mockServer,
        mockTransactionId,
        amount,
        type,
        mockUserId1,
        mockUserId2,
      );

      const emitCalls = (mockServer.emit as jest.Mock).mock.calls;
      expect(emitCalls[0]).toEqual([
        'transaction.created',
        {
          transactionId: mockTransactionId,
          amount,
          type: 'borrowed',
          withUserId: mockUserId2,
          timestamp: expect.any(Date) as Date,
        },
      ]);
      expect(emitCalls[1]).toEqual([
        'transaction.created',
        {
          transactionId: mockTransactionId,
          amount,
          type: 'lent',
          withUserId: mockUserId1,
          timestamp: expect.any(Date) as Date,
        },
      ]);
    });

    it('should handle zero amount', () => {
      service.emitTransactionCreated(
        mockServer,
        mockTransactionId,
        0,
        'lent',
        mockUserId1,
        mockUserId2,
      );

      expect(mockServer.emit).toHaveBeenCalledWith(
        'transaction.created',
        expect.objectContaining({ amount: 0 }),
      );
    });

    it('should handle large amounts', () => {
      const largeAmount = 999999.99;

      service.emitTransactionCreated(
        mockServer,
        mockTransactionId,
        largeAmount,
        'lent',
        mockUserId1,
        mockUserId2,
      );

      expect(mockServer.emit).toHaveBeenCalledWith(
        'transaction.created',
        expect.objectContaining({ amount: largeAmount }),
      );
    });
  });

  describe('emitTransactionUpdated', () => {
    it('should emit transaction updated event to all involved users', () => {
      const userIds = [mockUserId1, mockUserId2];

      service.emitTransactionUpdated(mockServer, mockTransactionId, userIds);

      expect(mockServer.to).toHaveBeenCalledTimes(2);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId2}`);
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
      expect(mockServer.emit).toHaveBeenCalledWith('transaction.updated', {
        transactionId: mockTransactionId,
        timestamp: expect.any(Date) as Date,
      });
    });

    it('should handle single user', () => {
      service.emitTransactionUpdated(mockServer, mockTransactionId, [
        mockUserId1,
      ]);

      expect(mockServer.to).toHaveBeenCalledTimes(1);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.emit).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple users', () => {
      const userIds = [mockUserId1, mockUserId2, mockUserId3];

      service.emitTransactionUpdated(mockServer, mockTransactionId, userIds);

      expect(mockServer.to).toHaveBeenCalledTimes(3);
      expect(mockServer.emit).toHaveBeenCalledTimes(3);
    });

    it('should handle empty user list', () => {
      service.emitTransactionUpdated(mockServer, mockTransactionId, []);

      expect(mockServer.to).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('emitTransactionSettled', () => {
    it('should emit transaction settled event to all involved users', () => {
      const userIds = [mockUserId1, mockUserId2];

      service.emitTransactionSettled(mockServer, mockTransactionId, userIds);

      expect(mockServer.to).toHaveBeenCalledTimes(2);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId1}`);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId2}`);
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
      expect(mockServer.emit).toHaveBeenCalledWith('transaction.settled', {
        transactionId: mockTransactionId,
        timestamp: expect.any(Date) as Date,
      });
    });

    it('should handle single user', () => {
      service.emitTransactionSettled(mockServer, mockTransactionId, [
        mockUserId1,
      ]);

      expect(mockServer.to).toHaveBeenCalledTimes(1);
      expect(mockServer.emit).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple users', () => {
      const userIds = [mockUserId1, mockUserId2, mockUserId3];

      service.emitTransactionSettled(mockServer, mockTransactionId, userIds);

      expect(mockServer.to).toHaveBeenCalledTimes(3);
      expect(mockServer.emit).toHaveBeenCalledTimes(3);
    });

    it('should handle empty user list', () => {
      service.emitTransactionSettled(mockServer, mockTransactionId, []);

      expect(mockServer.to).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });
});
