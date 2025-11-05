import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './entities/transaction.entity';
import { User } from '../user/entities/user.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { ObjectId } from 'mongodb';
import { CreateTransactionDto } from './schemas/transaction.schema';
import { TransactionEventsService } from '../realtime/services/transaction-events.service';
import { Server } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from '../realtime/types/socket-events.types';

interface MockQueryRunner {
  connect: jest.Mock;
  startTransaction: jest.Mock;
  commitTransaction: jest.Mock;
  rollbackTransaction: jest.Mock;
  release: jest.Mock;
  manager: {
    save: jest.Mock;
    delete: jest.Mock;
  };
}

describe('TransactionService', () => {
  let service: TransactionService;
  let transactionRepository: jest.Mocked<Repository<Transaction>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let realtimeGateway: jest.Mocked<RealtimeGateway>;
  let queryRunner: MockQueryRunner;

  const mockSenderId = new ObjectId();
  const mockReceiverId = new ObjectId();
  const mockTransactionId = new ObjectId();

  const mockSender: Partial<User> = {
    _id: mockSenderId,
    email: 'sender@test.com',
    name: 'Sender User',
    totalLent: 0,
    totalBorrowed: 0,
    netBalance: 0,
    recalculateBalance: jest.fn(),
  };

  const mockReceiver: Partial<User> = {
    _id: mockReceiverId,
    email: 'receiver@test.com',
    name: 'Receiver User',
    totalLent: 0,
    totalBorrowed: 0,
    netBalance: 0,
    recalculateBalance: jest.fn(),
  };

  const mockTransaction: Partial<Transaction> = {
    _id: mockTransactionId,
    senderId: mockSenderId,
    receiverId: mockReceiverId,
    amount: 100,
    type: TransactionType.LENT,
    status: TransactionStatus.PENDING,
    remarks: 'Test transaction',
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Create mock query runner
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockTransactionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockDataSource: Partial<DataSource> = {
      createQueryRunner: jest.fn(
        (): QueryRunner => queryRunner as unknown as QueryRunner,
      ),
    };

    const mockTransactionEventsService = {
      emitTransactionCreated: jest.fn(),
      emitTransactionUpdated: jest.fn(),
      emitTransactionSettled: jest.fn(),
    };

    const mockRealtimeGateway: Partial<RealtimeGateway> = {
      getTransactionEvents: jest.fn(
        (): TransactionEventsService =>
          mockTransactionEventsService as unknown as TransactionEventsService,
      ),
      getServer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: RealtimeGateway,
          useValue: mockRealtimeGateway,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    transactionRepository = module.get(getRepositoryToken(Transaction));
    userRepository = module.get(getRepositoryToken(User));
    realtimeGateway = module.get(RealtimeGateway);

    // Suppress logger output in tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    const createDto: CreateTransactionDto = {
      receiverId: mockReceiverId.toString(),
      amount: 100,
      type: 'lent',
      remarks: 'Test transaction',
    };

    it('should create a transaction successfully', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockSender as User)
        .mockResolvedValueOnce(mockReceiver as User);

      transactionRepository.create.mockReturnValue(
        mockTransaction as Transaction,
      );
      queryRunner.manager.save.mockResolvedValue(mockTransaction);

      const result = await service.createTransaction(
        mockSenderId.toString(),
        createDto,
      );

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(transactionRepository.create).toHaveBeenCalled();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result._id).toBe(mockTransactionId.toString());
      expect(result.amount).toBe(100);
      expect(result.type).toBe(TransactionType.LENT);
    });

    it('should throw NotFoundException if sender not found', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.createTransaction(mockSenderId.toString(), createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if receiver not found', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockSender as User)
        .mockResolvedValueOnce(null);

      await expect(
        service.createTransaction(mockSenderId.toString(), createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if sender and receiver are the same', async () => {
      const sameUserDto: CreateTransactionDto = {
        ...createDto,
        receiverId: mockSenderId.toString(),
      };

      userRepository.findOne.mockResolvedValue(mockSender as User);

      await expect(
        service.createTransaction(mockSenderId.toString(), sameUserDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback transaction on error', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockSender as User)
        .mockResolvedValueOnce(mockReceiver as User);

      transactionRepository.create.mockReturnValue(
        mockTransaction as Transaction,
      );
      queryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createTransaction(mockSenderId.toString(), createDto),
      ).rejects.toThrow(BadRequestException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle WebSocket errors gracefully', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockSender as User)
        .mockResolvedValueOnce(mockReceiver as User);

      transactionRepository.create.mockReturnValue(
        mockTransaction as Transaction,
      );
      queryRunner.manager.save.mockResolvedValue(mockTransaction);

      const mockTransactionEvents = {
        emitTransactionCreated: jest.fn(() => {
          throw new Error('WebSocket error');
        }),
      };
      realtimeGateway.getTransactionEvents.mockReturnValue(
        mockTransactionEvents as unknown as TransactionEventsService,
      );

      const result = await service.createTransaction(
        mockSenderId.toString(),
        createDto,
      );

      expect(result).toBeDefined();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('getUserTransactions', () => {
    it('should return user transaction summary', async () => {
      const sentTransactions = [
        {
          ...mockTransaction,
          status: TransactionStatus.COMPLETED,
          type: TransactionType.LENT,
          amount: 100,
        },
        {
          ...mockTransaction,
          status: TransactionStatus.PENDING,
          type: TransactionType.LENT,
          amount: 50,
        },
      ];
      const receivedTransactions = [
        {
          ...mockTransaction,
          senderId: mockReceiverId,
          receiverId: mockSenderId,
          status: TransactionStatus.COMPLETED,
          type: TransactionType.BORROWED,
          amount: 75,
        },
      ];

      transactionRepository.find
        .mockResolvedValueOnce(sentTransactions as Transaction[])
        .mockResolvedValueOnce(receivedTransactions as Transaction[]);

      // Mock user lookups for populateUserDetails
      userRepository.findOne.mockImplementation(
        (options: { where: { _id: ObjectId } }) => {
          const id = options.where._id.toString();
          if (id === mockSenderId.toString()) {
            return Promise.resolve(mockSender as User);
          }
          if (id === mockReceiverId.toString()) {
            return Promise.resolve(mockReceiver as User);
          }
          return Promise.resolve(null);
        },
      );

      const result = await service.getUserTransactions(mockSenderId.toString());

      expect(result.totalSent).toBe(100);
      expect(result.totalReceived).toBe(75);
      expect(result.pendingCount).toBe(1);
      expect(result.completedCount).toBe(2);
      expect(result.transactions).toHaveLength(3);
      expect(result.transactions[0].senderName).toBeDefined();
      expect(result.transactions[0].receiverName).toBeDefined();
    });

    it('should return empty summary for user with no transactions', async () => {
      transactionRepository.find.mockResolvedValue([]);

      const result = await service.getUserTransactions(mockSenderId.toString());

      expect(result.totalSent).toBe(0);
      expect(result.totalReceived).toBe(0);
      expect(result.pendingCount).toBe(0);
      expect(result.completedCount).toBe(0);
      expect(result.transactions).toHaveLength(0);
    });

    it('should count failed transactions correctly', async () => {
      const sentTransactions = [
        {
          ...mockTransaction,
          status: TransactionStatus.FAILED,
          type: TransactionType.LENT,
          amount: 100,
        },
      ];
      const receivedTransactions = [
        {
          ...mockTransaction,
          senderId: mockReceiverId,
          receiverId: mockSenderId,
          status: TransactionStatus.FAILED,
          type: TransactionType.BORROWED,
          amount: 75,
        },
      ];

      transactionRepository.find
        .mockResolvedValueOnce(sentTransactions as Transaction[])
        .mockResolvedValueOnce(receivedTransactions as Transaction[]);

      userRepository.findOne.mockImplementation(
        (options: { where: { _id: ObjectId } }) => {
          const id = options.where._id.toString();
          if (id === mockSenderId.toString()) {
            return Promise.resolve(mockSender as User);
          }
          if (id === mockReceiverId.toString()) {
            return Promise.resolve(mockReceiver as User);
          }
          return Promise.resolve(null);
        },
      );

      const result = await service.getUserTransactions(mockSenderId.toString());

      expect(result.failedCount).toBe(2);
      expect(result.totalSent).toBe(0);
      expect(result.totalReceived).toBe(0);
    });

    it('should sort transactions by timestamp descending', async () => {
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-12-01');

      const sentTransactions = [
        {
          ...mockTransaction,
          timestamp: oldDate,
          type: TransactionType.LENT,
          _id: new ObjectId(),
        },
      ];
      const receivedTransactions = [
        {
          ...mockTransaction,
          senderId: mockReceiverId,
          receiverId: mockSenderId,
          timestamp: newDate,
          type: TransactionType.BORROWED,
          _id: new ObjectId(),
        },
      ];

      transactionRepository.find
        .mockResolvedValueOnce(sentTransactions as Transaction[])
        .mockResolvedValueOnce(receivedTransactions as Transaction[]);

      userRepository.findOne.mockImplementation(
        (options: { where: { _id: ObjectId } }) => {
          const id = options.where._id.toString();
          if (id === mockSenderId.toString()) {
            return Promise.resolve(mockSender as User);
          }
          if (id === mockReceiverId.toString()) {
            return Promise.resolve(mockReceiver as User);
          }
          return Promise.resolve(null);
        },
      );

      const result = await service.getUserTransactions(mockSenderId.toString());

      expect(result.transactions[0].timestamp).toEqual(newDate);
      expect(result.transactions[1].timestamp).toEqual(oldDate);
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction if user is sender', async () => {
      transactionRepository.findOne.mockResolvedValue(
        mockTransaction as Transaction,
      );

      const result = await service.getTransactionById(
        mockTransactionId.toString(),
        mockSenderId.toString(),
      );

      expect(result._id).toBe(mockTransactionId.toString());
      expect(result.type).toBe(TransactionType.LENT);
    });

    it('should return transaction if user is receiver', async () => {
      transactionRepository.findOne.mockResolvedValue(
        mockTransaction as Transaction,
      );

      const result = await service.getTransactionById(
        mockTransactionId.toString(),
        mockReceiverId.toString(),
      );

      expect(result._id).toBe(mockTransactionId.toString());
    });

    it('should throw NotFoundException if transaction not found', async () => {
      transactionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getTransactionById(
          mockTransactionId.toString(),
          mockSenderId.toString(),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not part of transaction', async () => {
      const otherUserId = new ObjectId();
      transactionRepository.findOne.mockResolvedValue(
        mockTransaction as Transaction,
      );

      await expect(
        service.getTransactionById(
          mockTransactionId.toString(),
          otherUserId.toString(),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status successfully', async () => {
      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      };

      transactionRepository.findOne.mockResolvedValue(
        mockTransaction as Transaction,
      );
      transactionRepository.save.mockResolvedValue(
        updatedTransaction as Transaction,
      );

      const result = await service.updateTransactionStatus(
        mockTransactionId.toString(),
        TransactionStatus.COMPLETED,
        mockSenderId.toString(),
      );

      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(transactionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if transaction not found', async () => {
      transactionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateTransactionStatus(
          mockTransactionId.toString(),
          TransactionStatus.COMPLETED,
          mockSenderId.toString(),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not authorized', async () => {
      const otherUserId = new ObjectId();
      transactionRepository.findOne.mockResolvedValue(
        mockTransaction as Transaction,
      );

      await expect(
        service.updateTransactionStatus(
          mockTransactionId.toString(),
          TransactionStatus.COMPLETED,
          otherUserId.toString(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should emit WebSocket events on status update', async () => {
      const mockTransactionEvents = {
        emitTransactionUpdated: jest.fn(),
        emitTransactionSettled: jest.fn(),
      };

      transactionRepository.findOne.mockResolvedValue(
        mockTransaction as Transaction,
      );
      transactionRepository.save.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      } as Transaction);
      realtimeGateway.getTransactionEvents.mockReturnValue(
        mockTransactionEvents as unknown as TransactionEventsService,
      );

      await service.updateTransactionStatus(
        mockTransactionId.toString(),
        TransactionStatus.COMPLETED,
        mockSenderId.toString(),
      );

      expect(mockTransactionEvents.emitTransactionUpdated).toHaveBeenCalled();
      expect(mockTransactionEvents.emitTransactionSettled).toHaveBeenCalled();
    });

    it('should not emit settled event for non-completed status', async () => {
      const mockTransactionEvents = {
        emitTransactionUpdated: jest.fn(),
        emitTransactionSettled: jest.fn(),
      };

      transactionRepository.findOne.mockResolvedValue(
        mockTransaction as Transaction,
      );
      transactionRepository.save.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.FAILED,
      } as Transaction);
      realtimeGateway.getTransactionEvents.mockReturnValue(
        mockTransactionEvents as unknown as TransactionEventsService,
      );

      await service.updateTransactionStatus(
        mockTransactionId.toString(),
        TransactionStatus.FAILED,
        mockSenderId.toString(),
      );

      expect(mockTransactionEvents.emitTransactionUpdated).toHaveBeenCalled();
      expect(
        mockTransactionEvents.emitTransactionSettled,
      ).not.toHaveBeenCalled();
    });

    it('should handle WebSocket errors gracefully on status update', async () => {
      const mockTransactionEvents = {
        emitTransactionUpdated: jest.fn(() => {
          throw new Error('WebSocket error');
        }),
        emitTransactionSettled: jest.fn(),
      };

      transactionRepository.findOne.mockResolvedValue(
        mockTransaction as Transaction,
      );
      transactionRepository.save.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      } as Transaction);
      realtimeGateway.getTransactionEvents.mockReturnValue(
        mockTransactionEvents as unknown as TransactionEventsService,
      );

      const result = await service.updateTransactionStatus(
        mockTransactionId.toString(),
        TransactionStatus.COMPLETED,
        mockSenderId.toString(),
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(TransactionStatus.COMPLETED);
    });
  });

  describe('getTransactionsBetweenUsers', () => {
    it('should return transactions between two users', async () => {
      const transactions = [
        mockTransaction,
        {
          ...mockTransaction,
          senderId: mockReceiverId,
          receiverId: mockSenderId,
          type: TransactionType.BORROWED,
        },
      ];

      transactionRepository.find.mockResolvedValue(
        transactions as Transaction[],
      );

      const result = await service.getTransactionsBetweenUsers(
        mockSenderId.toString(),
        mockReceiverId.toString(),
      );

      expect(result).toHaveLength(2);
      expect(result[0].type).toBeDefined();
      expect(transactionRepository.find).toHaveBeenCalled();
    });

    it('should return empty array if no transactions found', async () => {
      transactionRepository.find.mockResolvedValue([]);

      const result = await service.getTransactionsBetweenUsers(
        mockSenderId.toString(),
        mockReceiverId.toString(),
      );

      expect(result).toHaveLength(0);
    });

    it('should sort transactions by timestamp descending', async () => {
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-12-01');

      const transactions = [
        {
          ...mockTransaction,
          timestamp: oldDate,
          type: TransactionType.LENT,
          _id: new ObjectId(),
        },
        {
          ...mockTransaction,
          timestamp: newDate,
          type: TransactionType.LENT,
          _id: new ObjectId(),
        },
      ];

      transactionRepository.find.mockResolvedValue(
        transactions as Transaction[],
      );

      const result = await service.getTransactionsBetweenUsers(
        mockSenderId.toString(),
        mockReceiverId.toString(),
      );

      expect(result[0].timestamp).toEqual(newDate);
      expect(result[1].timestamp).toEqual(oldDate);
    });
  });

  describe('acceptTransaction', () => {
    it('should accept LENT transaction and update balances correctly', async () => {
      const lentTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PENDING,
        type: TransactionType.LENT,
      };

      transactionRepository.findOne.mockResolvedValue(
        lentTransaction as Transaction,
      );

      const sender = { ...mockSender, totalLent: 0, totalBorrowed: 0 };
      const receiver = { ...mockReceiver, totalLent: 0, totalBorrowed: 0 };

      userRepository.findOne
        .mockResolvedValueOnce(sender as User)
        .mockResolvedValueOnce(receiver as User);

      queryRunner.manager.save.mockResolvedValue({
        ...lentTransaction,
        status: TransactionStatus.ACCEPTED,
      });

      const mockTransactionEvents: Partial<TransactionEventsService> = {
        emitTransactionAccepted: jest.fn(),
      };
      realtimeGateway.getTransactionEvents.mockReturnValue(
        mockTransactionEvents as TransactionEventsService,
      );
      realtimeGateway.getServer.mockReturnValue(
        {} as Server<ClientToServerEvents, ServerToClientEvents>,
      );

      await service.acceptTransaction(
        mockTransactionId.toString(),
        mockReceiverId.toString(),
      );

      // Verify sender's totalLent increased
      expect(sender.totalLent).toBe(100);
      expect(sender.totalBorrowed).toBe(0);

      // Verify receiver's totalBorrowed increased
      expect(receiver.totalLent).toBe(0);
      expect(receiver.totalBorrowed).toBe(100);

      expect(sender.recalculateBalance).toHaveBeenCalled();
      expect(receiver.recalculateBalance).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalledWith(User, [
        sender,
        receiver,
      ]);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should accept BORROWED transaction and update balances correctly', async () => {
      const borrowedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PENDING,
        type: TransactionType.BORROWED,
      };

      transactionRepository.findOne.mockResolvedValue(
        borrowedTransaction as Transaction,
      );

      const sender = { ...mockSender, totalLent: 0, totalBorrowed: 0 };
      const receiver = { ...mockReceiver, totalLent: 0, totalBorrowed: 0 };

      userRepository.findOne
        .mockResolvedValueOnce(sender as User)
        .mockResolvedValueOnce(receiver as User);

      queryRunner.manager.save.mockResolvedValue({
        ...borrowedTransaction,
        status: TransactionStatus.ACCEPTED,
      });

      const mockTransactionEvents: Partial<TransactionEventsService> = {
        emitTransactionAccepted: jest.fn(),
      };
      realtimeGateway.getTransactionEvents.mockReturnValue(
        mockTransactionEvents as TransactionEventsService,
      );
      realtimeGateway.getServer.mockReturnValue(
        {} as Server<ClientToServerEvents, ServerToClientEvents>,
      );

      await service.acceptTransaction(
        mockTransactionId.toString(),
        mockReceiverId.toString(),
      );

      // Verify sender's totalBorrowed increased
      expect(sender.totalLent).toBe(0);
      expect(sender.totalBorrowed).toBe(100);

      // Verify receiver's totalLent increased
      expect(receiver.totalLent).toBe(100);
      expect(receiver.totalBorrowed).toBe(0);

      expect(sender.recalculateBalance).toHaveBeenCalled();
      expect(receiver.recalculateBalance).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if transaction not found', async () => {
      transactionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.acceptTransaction(
          mockTransactionId.toString(),
          mockReceiverId.toString(),
        ),
      ).rejects.toThrow(NotFoundException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user is not receiver', async () => {
      transactionRepository.findOne.mockResolvedValue(
        mockTransaction as Transaction,
      );

      await expect(
        service.acceptTransaction(
          mockTransactionId.toString(),
          mockSenderId.toString(),
        ),
      ).rejects.toThrow(BadRequestException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if transaction is not pending', async () => {
      const acceptedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.ACCEPTED,
      };

      transactionRepository.findOne.mockResolvedValue(
        acceptedTransaction as Transaction,
      );

      await expect(
        service.acceptTransaction(
          mockTransactionId.toString(),
          mockReceiverId.toString(),
        ),
      ).rejects.toThrow(BadRequestException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should handle WebSocket errors gracefully', async () => {
      const pendingTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PENDING,
      };
      transactionRepository.findOne.mockResolvedValue(
        pendingTransaction as Transaction,
      );
      userRepository.findOne
        .mockResolvedValueOnce(mockSender as User)
        .mockResolvedValueOnce(mockReceiver as User);

      queryRunner.manager.save.mockResolvedValue({
        ...pendingTransaction,
        status: TransactionStatus.ACCEPTED,
      });

      const mockTransactionEvents: Partial<TransactionEventsService> = {
        emitTransactionAccepted: jest.fn(() => {
          throw new Error('WebSocket error');
        }),
      };
      realtimeGateway.getTransactionEvents.mockReturnValue(
        mockTransactionEvents as TransactionEventsService,
      );
      realtimeGateway.getServer.mockReturnValue(
        {} as Server<ClientToServerEvents, ServerToClientEvents>,
      );

      // Should not throw despite WebSocket error
      await expect(
        service.acceptTransaction(
          mockTransactionId.toString(),
          mockReceiverId.toString(),
        ),
      ).resolves.toBeDefined();

      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('settleWithFriend', () => {
    it('should settle when user owes friend', async () => {
      const user = {
        ...mockSender,
        totalLent: 50,
        totalBorrowed: 150, // User owes 100
      };
      const friend = {
        ...mockReceiver,
        totalLent: 150,
        totalBorrowed: 50,
      };

      userRepository.findOne
        .mockResolvedValueOnce(user as User)
        .mockResolvedValueOnce(friend as User);

      transactionRepository.create.mockReturnValue({
        senderId: mockSenderId,
        receiverId: mockReceiverId,
        amount: 100,
        type: TransactionType.LENT,
        remarks: 'Settlement',
        status: TransactionStatus.COMPLETED,
      } as Transaction);

      queryRunner.manager.save.mockResolvedValue({
        _id: new ObjectId(),
        senderId: mockSenderId,
        receiverId: mockReceiverId,
        amount: 100,
        type: TransactionType.LENT,
        remarks: 'Settlement',
        status: TransactionStatus.COMPLETED,
      } as Transaction);

      const mockTransactionEvents: Partial<TransactionEventsService> = {
        emitTransactionSettled: jest.fn(),
      };
      realtimeGateway.getTransactionEvents.mockReturnValue(
        mockTransactionEvents as TransactionEventsService,
      );
      realtimeGateway.getServer.mockReturnValue(
        {} as Server<ClientToServerEvents, ServerToClientEvents>,
      );

      await service.settleWithFriend(
        mockSenderId.toString(),
        mockReceiverId.toString(),
        100,
      );

      // User pays back, so user.totalLent increases
      expect(user.totalLent).toBe(150);
      // Friend receives payment, so friend.totalBorrowed increases
      expect(friend.totalBorrowed).toBe(150);

      expect(user.recalculateBalance).toHaveBeenCalled();
      expect(friend.recalculateBalance).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should settle when friend owes user', async () => {
      const user = {
        ...mockSender,
        totalLent: 150,
        totalBorrowed: 50, // Friend owes user 100
      };
      const friend = {
        ...mockReceiver,
        totalLent: 50,
        totalBorrowed: 150,
      };

      userRepository.findOne
        .mockResolvedValueOnce(user as User)
        .mockResolvedValueOnce(friend as User);

      transactionRepository.create.mockReturnValue({
        senderId: mockSenderId,
        receiverId: mockReceiverId,
        amount: 100,
        type: TransactionType.BORROWED,
        remarks: 'Settlement',
        status: TransactionStatus.COMPLETED,
      } as Transaction);

      queryRunner.manager.save.mockResolvedValue({
        _id: new ObjectId(),
        senderId: mockSenderId,
        receiverId: mockReceiverId,
        amount: 100,
        type: TransactionType.BORROWED,
        remarks: 'Settlement',
        status: TransactionStatus.COMPLETED,
      } as Transaction);

      const mockTransactionEvents: Partial<TransactionEventsService> = {
        emitTransactionSettled: jest.fn(),
      };
      realtimeGateway.getTransactionEvents.mockReturnValue(
        mockTransactionEvents as TransactionEventsService,
      );
      realtimeGateway.getServer.mockReturnValue(
        {} as Server<ClientToServerEvents, ServerToClientEvents>,
      );

      await service.settleWithFriend(
        mockSenderId.toString(),
        mockReceiverId.toString(),
        100,
      );

      // Friend pays back, so user.totalBorrowed increases (to cancel lent)
      expect(user.totalBorrowed).toBe(150);
      // Friend pays, so friend.totalLent increases
      expect(friend.totalLent).toBe(150);

      expect(user.recalculateBalance).toHaveBeenCalled();
      expect(friend.recalculateBalance).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.settleWithFriend(
          mockSenderId.toString(),
          mockReceiverId.toString(),
          100,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if friend not found', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockSender as User)
        .mockResolvedValueOnce(null);

      await expect(
        service.settleWithFriend(
          mockSenderId.toString(),
          mockReceiverId.toString(),
          100,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should handle WebSocket errors gracefully', async () => {
      const user = {
        ...mockSender,
        totalLent: 50,
        totalBorrowed: 150,
      };
      const friend = {
        ...mockReceiver,
        totalLent: 150,
        totalBorrowed: 50,
      };

      userRepository.findOne
        .mockResolvedValueOnce(user as User)
        .mockResolvedValueOnce(friend as User);

      transactionRepository.create.mockReturnValue({
        senderId: mockSenderId,
        receiverId: mockReceiverId,
        amount: 100,
        type: TransactionType.LENT,
        remarks: 'Settlement',
        status: TransactionStatus.COMPLETED,
      } as Transaction);

      queryRunner.manager.save.mockResolvedValue({
        _id: new ObjectId(),
        senderId: mockSenderId,
        receiverId: mockReceiverId,
        amount: 100,
        type: TransactionType.LENT,
        remarks: 'Settlement',
        status: TransactionStatus.COMPLETED,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Transaction);

      const mockTransactionEvents: Partial<TransactionEventsService> = {
        emitTransactionSettled: jest.fn(() => {
          throw new Error('WebSocket error');
        }),
      };
      realtimeGateway.getTransactionEvents.mockReturnValue(
        mockTransactionEvents as TransactionEventsService,
      );
      realtimeGateway.getServer.mockReturnValue(
        {} as Server<ClientToServerEvents, ServerToClientEvents>,
      );

      // Should not throw despite WebSocket error
      await expect(
        service.settleWithFriend(
          mockSenderId.toString(),
          mockReceiverId.toString(),
          100,
        ),
      ).resolves.toBeDefined();

      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('deleteTransaction', () => {
    it('should delete pending transaction without rolling back balances', async () => {
      const pendingTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PENDING,
        type: TransactionType.LENT,
      };

      transactionRepository.findOne.mockResolvedValue(
        pendingTransaction as Transaction,
      );

      await service.deleteTransaction(
        mockTransactionId.toString(),
        mockSenderId.toString(),
      );

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      // Pending transactions don't update balances, so no save needed
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
      expect(queryRunner.manager.delete).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if transaction not found', async () => {
      transactionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteTransaction(
          mockTransactionId.toString(),
          mockSenderId.toString(),
        ),
      ).rejects.toThrow(NotFoundException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user is not sender', async () => {
      transactionRepository.findOne.mockResolvedValue(
        mockTransaction as Transaction,
      );

      await expect(
        service.deleteTransaction(
          mockTransactionId.toString(),
          mockReceiverId.toString(),
        ),
      ).rejects.toThrow(BadRequestException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if transaction is not pending', async () => {
      const completedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.LENT,
      };

      transactionRepository.findOne.mockResolvedValue(
        completedTransaction as Transaction,
      );

      await expect(
        service.deleteTransaction(
          mockTransactionId.toString(),
          mockSenderId.toString(),
        ),
      ).rejects.toThrow(BadRequestException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      transactionRepository.findOne.mockResolvedValue(
        mockTransaction as Transaction,
      );
      userRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(
        service.deleteTransaction(
          mockTransactionId.toString(),
          mockSenderId.toString(),
        ),
      ).rejects.toThrow();

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle case when users are not found during deletion', async () => {
      const pendingTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PENDING,
        type: TransactionType.LENT,
      };

      transactionRepository.findOne.mockResolvedValue(
        pendingTransaction as Transaction,
      );
      userRepository.findOne.mockResolvedValue(null);

      await service.deleteTransaction(
        mockTransactionId.toString(),
        mockSenderId.toString(),
      );

      expect(queryRunner.manager.delete).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('mapToResponse', () => {
    it('should correctly map transaction entity to response DTO', async () => {
      transactionRepository.findOne.mockResolvedValue(
        mockTransaction as Transaction,
      );

      const result = await service.getTransactionById(
        mockTransactionId.toString(),
        mockSenderId.toString(),
      );

      expect(result._id).toBe(mockTransactionId.toString());
      expect(result.senderId).toBe(mockSenderId.toString());
      expect(result.receiverId).toBe(mockReceiverId.toString());
      expect(result.amount).toBe(mockTransaction.amount);
      expect(result.type).toBe(mockTransaction.type);
      expect(result.status).toBe(mockTransaction.status);
      expect(result.remarks).toBe(mockTransaction.remarks);
      expect(result.timestamp).toBe(mockTransaction.timestamp);
      expect(result.createdAt).toBe(mockTransaction.createdAt);
      expect(result.updatedAt).toBe(mockTransaction.updatedAt);
    });
  });
});
