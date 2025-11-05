import {
  createTransactionSchema,
  updateTransactionStatusSchema,
  transactionQuerySchema,
  CreateTransactionDto,
  UpdateTransactionStatusDto,
  TransactionQueryDto,
} from './transaction.schema';
import { TransactionStatus } from '../entities/transaction.entity';

describe('Transaction Schemas', () => {
  describe('createTransactionSchema', () => {
    it('should validate a valid transaction creation', () => {
      const validData = {
        receiverId: '507f1f77bcf86cd799439011',
        amount: 100,
        type: 'lent' as const,
        remarks: 'Test transaction',
      };

      const result = createTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate transaction without remarks', () => {
      const validData = {
        receiverId: '507f1f77bcf86cd799439011',
        amount: 100,
        type: 'lent' as const,
      };

      const result = createTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty receiverId', () => {
      const invalidData = {
        receiverId: '',
        amount: 100,
        type: 'lent' as const,
      };

      const result = createTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing receiverId', () => {
      const invalidData = {
        amount: 100,
        type: 'lent' as const,
      };

      const result = createTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject zero amount', () => {
      const invalidData = {
        receiverId: '507f1f77bcf86cd799439011',
        amount: 0,
        type: 'lent' as const,
      };

      const result = createTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const invalidData = {
        receiverId: '507f1f77bcf86cd799439011',
        amount: -50,
        type: 'lent' as const,
      };

      const result = createTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject remarks exceeding 500 characters', () => {
      const invalidData = {
        receiverId: '507f1f77bcf86cd799439011',
        amount: 100,
        type: 'lent' as const,
        remarks: 'a'.repeat(501),
      };

      const result = createTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept remarks with exactly 500 characters', () => {
      const validData = {
        receiverId: '507f1f77bcf86cd799439011',
        amount: 100,
        type: 'lent' as const,
        remarks: 'a'.repeat(500),
      };

      const result = createTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept positive decimal amounts', () => {
      const validData = {
        receiverId: '507f1f77bcf86cd799439011',
        amount: 99.99,
        type: 'borrowed' as const,
      };

      const result = createTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate lent transaction type', () => {
      const validData = {
        receiverId: '507f1f77bcf86cd799439011',
        amount: 100,
        type: 'lent' as const,
      };

      const result = createTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('lent');
      }
    });

    it('should validate borrowed transaction type', () => {
      const validData = {
        receiverId: '507f1f77bcf86cd799439011',
        amount: 100,
        type: 'borrowed' as const,
      };

      const result = createTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('borrowed');
      }
    });

    it('should reject invalid transaction type', () => {
      const invalidData = {
        receiverId: '507f1f77bcf86cd799439011',
        amount: 100,
        type: 'invalid',
      };

      const result = createTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing transaction type', () => {
      const invalidData = {
        receiverId: '507f1f77bcf86cd799439011',
        amount: 100,
      };

      const result = createTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateTransactionStatusSchema', () => {
    it('should validate PENDING status', () => {
      const validData = {
        status: TransactionStatus.PENDING,
      };

      const result = updateTransactionStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(TransactionStatus.PENDING);
      }
    });

    it('should validate COMPLETED status', () => {
      const validData = {
        status: TransactionStatus.COMPLETED,
      };

      const result = updateTransactionStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(TransactionStatus.COMPLETED);
      }
    });

    it('should validate FAILED status', () => {
      const validData = {
        status: TransactionStatus.FAILED,
      };

      const result = updateTransactionStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(TransactionStatus.FAILED);
      }
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid_status',
      };

      const result = updateTransactionStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing status', () => {
      const invalidData = {};

      const result = updateTransactionStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('transactionQuerySchema', () => {
    it('should validate query with all parameters', () => {
      const validData = {
        status: TransactionStatus.COMPLETED,
        limit: 25,
        offset: 10,
      };

      const result = transactionQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should apply default limit of 50', () => {
      const validData = {};

      const result = transactionQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should apply default offset of 0', () => {
      const validData = {};

      const result = transactionQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0);
      }
    });

    it('should reject limit exceeding 100', () => {
      const invalidData = {
        limit: 101,
      };

      const result = transactionQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      const invalidData = {
        limit: -1,
      };

      const result = transactionQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject zero limit', () => {
      const invalidData = {
        limit: 0,
      };

      const result = transactionQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const invalidData = {
        offset: -1,
      };

      const result = transactionQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept limit of 100', () => {
      const validData = {
        limit: 100,
      };

      const result = transactionQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept offset of 0', () => {
      const validData = {
        offset: 0,
      };

      const result = transactionQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with only status parameter', () => {
      const validData = {
        status: TransactionStatus.PENDING,
      };

      const result = transactionQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(TransactionStatus.PENDING);
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });
  });

  describe('DTO Classes', () => {
    it('should create CreateTransactionDto instance', () => {
      const dto = new CreateTransactionDto();
      expect(dto).toBeInstanceOf(CreateTransactionDto);
    });

    it('should create UpdateTransactionStatusDto instance', () => {
      const dto = new UpdateTransactionStatusDto();
      expect(dto).toBeInstanceOf(UpdateTransactionStatusDto);
    });

    it('should create TransactionQueryDto instance', () => {
      const dto = new TransactionQueryDto();
      expect(dto).toBeInstanceOf(TransactionQueryDto);
    });
  });
});
