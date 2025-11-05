import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import {
  TransactionStatus,
  TransactionType,
} from './entities/transaction.entity';
import {
  CreateTransactionDto,
  UpdateTransactionStatusDto,
} from './schemas/transaction.schema';
import { JwtRequest } from '../auth/interfaces/jwt-request.interface';
import {
  TransactionResponse,
  UserTransactionSummary,
  TransactionWithUser,
} from './types/transaction-response.type';
import { RealtimeGateway } from '../realtime/realtime.gateway';

describe('TransactionController', () => {
  let controller: TransactionController;
  let service: jest.Mocked<TransactionService>;

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockReceiverId = '507f1f77bcf86cd799439012';
  const mockTransactionId = '507f1f77bcf86cd799439013';

  const mockRequest: Partial<JwtRequest> = {
    user: {
      userId: mockUserId,
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      tokenVersion: 1,
    },
  };

  const mockTransactionResponse: TransactionResponse = {
    _id: mockTransactionId,
    senderId: mockUserId,
    receiverId: mockReceiverId,
    amount: 100,
    type: TransactionType.LENT,
    status: TransactionStatus.PENDING,
    remarks: 'Test transaction',
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransactionWithUser: TransactionWithUser = {
    ...mockTransactionResponse,
    senderName: 'Sender User',
    senderEmail: 'sender@test.com',
    receiverName: 'Receiver User',
    receiverEmail: 'receiver@test.com',
  };

  const mockUserTransactionSummary: UserTransactionSummary = {
    totalSent: 500,
    totalReceived: 300,
    pendingCount: 2,
    completedCount: 5,
    failedCount: 1,
    transactions: [mockTransactionWithUser],
  };

  beforeEach(async () => {
    const mockTransactionService = {
      createTransaction: jest.fn(),
      getUserTransactions: jest.fn(),
      getTransactionById: jest.fn(),
      updateTransactionStatus: jest.fn(),
      getTransactionsBetweenUsers: jest.fn(),
      deleteTransaction: jest.fn(),
    };

    const mockRealtimeGateway = {
      getServer: jest.fn().mockReturnValue({
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      }),
      getTransactionEvents: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
        {
          provide: RealtimeGateway,
          useValue: mockRealtimeGateway,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    service = module.get(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    const createDto: CreateTransactionDto = {
      receiverId: mockReceiverId,
      amount: 100,
      type: 'lent',
      remarks: 'Test transaction',
    };

    it('should create a transaction successfully', async () => {
      service.createTransaction.mockResolvedValue(mockTransactionResponse);

      const result = await controller.createTransaction(
        mockRequest as JwtRequest,
        createDto,
      );

      expect(service.createTransaction).toHaveBeenCalledWith(
        mockUserId,
        createDto,
      );
      expect(result).toEqual(mockTransactionResponse);
    });

    it('should extract sender ID from JWT token', async () => {
      service.createTransaction.mockResolvedValue(mockTransactionResponse);

      await controller.createTransaction(mockRequest as JwtRequest, createDto);

      expect(service.createTransaction).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Object),
      );
    });

    it('should pass through service errors', async () => {
      const error = new Error('Service error');
      service.createTransaction.mockRejectedValue(error);

      await expect(
        controller.createTransaction(mockRequest as JwtRequest, createDto),
      ).rejects.toThrow('Service error');
    });
  });

  describe('getUserTransactions', () => {
    it('should return user transaction summary', async () => {
      service.getUserTransactions.mockResolvedValue(mockUserTransactionSummary);

      const result = await controller.getUserTransactions(
        mockRequest as JwtRequest,
      );

      expect(service.getUserTransactions).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUserTransactionSummary);
    });

    it('should extract user ID from JWT token', async () => {
      service.getUserTransactions.mockResolvedValue(mockUserTransactionSummary);

      await controller.getUserTransactions(mockRequest as JwtRequest);

      expect(service.getUserTransactions).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('getTransactionsBetweenUsers', () => {
    it('should return transactions between users', async () => {
      const transactions = [mockTransactionResponse];
      service.getTransactionsBetweenUsers.mockResolvedValue(transactions);

      const result = await controller.getTransactionsBetweenUsers(
        mockRequest as JwtRequest,
        mockReceiverId,
      );

      expect(service.getTransactionsBetweenUsers).toHaveBeenCalledWith(
        mockUserId,
        mockReceiverId,
      );
      expect(result).toEqual(transactions);
    });

    it('should use authenticated user ID as first parameter', async () => {
      service.getTransactionsBetweenUsers.mockResolvedValue([]);

      await controller.getTransactionsBetweenUsers(
        mockRequest as JwtRequest,
        mockReceiverId,
      );

      expect(service.getTransactionsBetweenUsers).toHaveBeenCalledWith(
        mockUserId,
        mockReceiverId,
      );
    });
  });

  describe('getTransactionById', () => {
    it('should return a specific transaction', async () => {
      service.getTransactionById.mockResolvedValue(mockTransactionResponse);

      const result = await controller.getTransactionById(
        mockRequest as JwtRequest,
        mockTransactionId,
      );

      expect(service.getTransactionById).toHaveBeenCalledWith(
        mockTransactionId,
        mockUserId,
      );
      expect(result).toEqual(mockTransactionResponse);
    });

    it('should pass user ID for authorization check', async () => {
      service.getTransactionById.mockResolvedValue(mockTransactionResponse);

      await controller.getTransactionById(
        mockRequest as JwtRequest,
        mockTransactionId,
      );

      expect(service.getTransactionById).toHaveBeenCalledWith(
        mockTransactionId,
        mockUserId,
      );
    });
  });

  describe('updateTransactionStatus', () => {
    const updateDto: UpdateTransactionStatusDto = {
      status: TransactionStatus.COMPLETED,
    };

    it('should update transaction status successfully', async () => {
      const updatedTransaction = {
        ...mockTransactionResponse,
        status: TransactionStatus.COMPLETED,
      };
      service.updateTransactionStatus.mockResolvedValue(updatedTransaction);

      const result = await controller.updateTransactionStatus(
        mockRequest as JwtRequest,
        mockTransactionId,
        updateDto,
      );

      expect(service.updateTransactionStatus).toHaveBeenCalledWith(
        mockTransactionId,
        TransactionStatus.COMPLETED,
        mockUserId,
      );
      expect(result.status).toBe(TransactionStatus.COMPLETED);
    });

    it('should extract status from DTO', async () => {
      service.updateTransactionStatus.mockResolvedValue(
        mockTransactionResponse,
      );

      await controller.updateTransactionStatus(
        mockRequest as JwtRequest,
        mockTransactionId,
        updateDto,
      );

      expect(service.updateTransactionStatus).toHaveBeenCalledWith(
        mockTransactionId,
        TransactionStatus.COMPLETED,
        mockUserId,
      );
    });

    it('should handle different status values', async () => {
      const failedDto: UpdateTransactionStatusDto = {
        status: TransactionStatus.FAILED,
      };
      const failedTransaction: TransactionResponse = {
        ...mockTransactionResponse,
        status: TransactionStatus.FAILED,
      };
      service.updateTransactionStatus.mockResolvedValue(failedTransaction);

      const result = await controller.updateTransactionStatus(
        mockRequest as JwtRequest,
        mockTransactionId,
        failedDto,
      );

      expect(service.updateTransactionStatus).toHaveBeenCalledWith(
        mockTransactionId,
        TransactionStatus.FAILED,
        mockUserId,
      );
      expect(result.status).toBe(TransactionStatus.FAILED);
    });

    it('should include type field in response', async () => {
      const completedDto: UpdateTransactionStatusDto = {
        status: TransactionStatus.COMPLETED,
      };
      const completedTransaction: TransactionResponse = {
        ...mockTransactionResponse,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.LENT,
      };
      service.updateTransactionStatus.mockResolvedValue(completedTransaction);

      const result = await controller.updateTransactionStatus(
        mockRequest as JwtRequest,
        mockTransactionId,
        completedDto,
      );

      expect(result.type).toBe(TransactionType.LENT);
      expect(result.status).toBe(TransactionStatus.COMPLETED);
    });
  });

  describe('deleteTransaction', () => {
    it('should delete a transaction successfully', async () => {
      service.deleteTransaction.mockResolvedValue(undefined);

      const result = await controller.deleteTransaction(
        mockRequest as JwtRequest,
        mockTransactionId,
      );

      expect(service.deleteTransaction).toHaveBeenCalledWith(
        mockTransactionId,
        mockUserId,
      );
      expect(result).toBeUndefined();
    });

    it('should pass user ID for authorization check', async () => {
      service.deleteTransaction.mockResolvedValue(undefined);

      await controller.deleteTransaction(
        mockRequest as JwtRequest,
        mockTransactionId,
      );

      expect(service.deleteTransaction).toHaveBeenCalledWith(
        mockTransactionId,
        mockUserId,
      );
    });

    it('should pass through service errors', async () => {
      const error = new Error('Cannot delete completed transaction');
      service.deleteTransaction.mockRejectedValue(error);

      await expect(
        controller.deleteTransaction(
          mockRequest as JwtRequest,
          mockTransactionId,
        ),
      ).rejects.toThrow('Cannot delete completed transaction');
    });
  });
});
