import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './transaction.entity';
import { ObjectId } from 'mongodb';

describe('Transaction Entity', () => {
  let transaction: Transaction;

  beforeEach(() => {
    transaction = new Transaction();
    transaction._id = new ObjectId();
    transaction.senderId = new ObjectId();
    transaction.receiverId = new ObjectId();
    transaction.amount = 100;
    transaction.type = TransactionType.LENT;
    transaction.remarks = 'Test transaction';
  });

  describe('setCreateTimestamp', () => {
    it('should set timestamp, createdAt, and updatedAt on insert', () => {
      const beforeTime = new Date();
      transaction.setCreateTimestamp();
      const afterTime = new Date();

      expect(transaction.timestamp).toBeDefined();
      expect(transaction.createdAt).toBeDefined();
      expect(transaction.updatedAt).toBeDefined();

      expect(transaction.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(transaction.timestamp.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );

      expect(transaction.createdAt.getTime()).toBe(
        transaction.timestamp.getTime(),
      );
      expect(transaction.updatedAt.getTime()).toBe(
        transaction.timestamp.getTime(),
      );
    });

    it('should set default status to PENDING if undefined', () => {
      // Create a new transaction without status set
      const newTransaction = new Transaction();
      newTransaction._id = new ObjectId();
      newTransaction.senderId = new ObjectId();
      newTransaction.receiverId = new ObjectId();
      newTransaction.amount = 100;

      newTransaction.setCreateTimestamp();

      expect(newTransaction.status).toBe(TransactionStatus.PENDING);
    });

    it('should not override status if already set', () => {
      transaction.status = TransactionStatus.COMPLETED;
      transaction.setCreateTimestamp();

      expect(transaction.status).toBe(TransactionStatus.COMPLETED);
    });

    it('should set all three timestamps to the same value', () => {
      transaction.setCreateTimestamp();

      expect(transaction.timestamp.getTime()).toBe(
        transaction.createdAt.getTime(),
      );
      expect(transaction.createdAt.getTime()).toBe(
        transaction.updatedAt.getTime(),
      );
    });
  });

  describe('updateTimestamp', () => {
    it('should update only updatedAt on update', () => {
      // Set initial timestamps
      transaction.setCreateTimestamp();
      const originalTimestamp = transaction.timestamp;
      const originalCreatedAt = transaction.createdAt;

      // Wait a bit to ensure different timestamp
      const wait = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      return wait(10).then(() => {
        transaction.updateTimestamp();

        expect(transaction.timestamp).toBe(originalTimestamp);
        expect(transaction.createdAt).toBe(originalCreatedAt);
        expect(transaction.updatedAt.getTime()).toBeGreaterThan(
          originalCreatedAt.getTime(),
        );
      });
    });

    it('should set updatedAt to current time', () => {
      const beforeTime = new Date();
      transaction.updateTimestamp();
      const afterTime = new Date();

      expect(transaction.updatedAt).toBeDefined();
      expect(transaction.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(transaction.updatedAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
    });
  });

  describe('TransactionStatus enum', () => {
    it('should have PENDING status', () => {
      expect(TransactionStatus.PENDING).toBe('pending');
    });

    it('should have COMPLETED status', () => {
      expect(TransactionStatus.COMPLETED).toBe('completed');
    });

    it('should have FAILED status', () => {
      expect(TransactionStatus.FAILED).toBe('failed');
    });
  });

  describe('TransactionType enum', () => {
    it('should have LENT type', () => {
      expect(TransactionType.LENT).toBe('lent');
    });

    it('should have BORROWED type', () => {
      expect(TransactionType.BORROWED).toBe('borrowed');
    });
  });

  describe('Entity properties', () => {
    it('should allow setting all required properties', () => {
      const senderId = new ObjectId();
      const receiverId = new ObjectId();

      transaction.senderId = senderId;
      transaction.receiverId = receiverId;
      transaction.amount = 250.5;
      transaction.type = TransactionType.BORROWED;
      transaction.status = TransactionStatus.COMPLETED;
      transaction.remarks = 'Payment for services';

      expect(transaction.senderId).toBe(senderId);
      expect(transaction.receiverId).toBe(receiverId);
      expect(transaction.amount).toBe(250.5);
      expect(transaction.type).toBe(TransactionType.BORROWED);
      expect(transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(transaction.remarks).toBe('Payment for services');
    });

    it('should support LENT transaction type', () => {
      transaction.type = TransactionType.LENT;
      expect(transaction.type).toBe(TransactionType.LENT);
    });

    it('should support BORROWED transaction type', () => {
      transaction.type = TransactionType.BORROWED;
      expect(transaction.type).toBe(TransactionType.BORROWED);
    });

    it('should properly store ObjectId fields', () => {
      const id = new ObjectId();
      const senderId = new ObjectId();
      const receiverId = new ObjectId();

      transaction._id = id;
      transaction.senderId = senderId;
      transaction.receiverId = receiverId;

      expect(transaction._id).toBe(id);
      expect(transaction.senderId).toBe(senderId);
      expect(transaction.receiverId).toBe(receiverId);
      expect(transaction._id).toBeInstanceOf(ObjectId);
      expect(transaction.senderId).toBeInstanceOf(ObjectId);
      expect(transaction.receiverId).toBeInstanceOf(ObjectId);
    });

    it('should allow optional remarks to be undefined', () => {
      transaction.remarks = undefined;

      expect(transaction.remarks).toBeUndefined();
    });
  });
});
