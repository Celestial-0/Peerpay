import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ObjectId } from 'mongodb';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './entities/transaction.entity';
import { CreateTransactionDto } from './schemas/transaction.schema';
import {
  TransactionResponse,
  TransactionWithUser,
  UserTransactionSummary,
} from './types/transaction-response.type';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { User } from '../user/entities/user.entity';
import {
  createObjectIdQuery,
  createOrQuery,
} from '../common/types/mongo-query.types';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Create a new transaction with atomicity and rollback safety
   */
  async createTransaction(
    senderId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponse> {
    const { receiverId, amount, remarks, type } = createTransactionDto;

    this.logger.log(
      `Creating transaction: sender=${senderId}, receiver=${receiverId}, amount=${amount}, type=${type}`,
    );

    // Validate ObjectId format
    if (!ObjectId.isValid(senderId)) {
      throw new BadRequestException('Invalid sender ID format');
    }
    if (!ObjectId.isValid(receiverId)) {
      throw new BadRequestException('Invalid receiver ID format');
    }

    // Validate sender and receiver exist
    const [sender, receiver] = await Promise.all([
      this.userRepository.findOne({
        where: createObjectIdQuery<User>('_id', senderId),
      }),
      this.userRepository.findOne({
        where: createObjectIdQuery<User>('_id', receiverId),
      }),
    ]);

    if (!sender) {
      this.logger.error(`Sender not found: ${senderId}`);
      throw new NotFoundException('Sender not found');
    }

    if (!receiver) {
      this.logger.error(`Receiver not found: ${receiverId}`);
      throw new NotFoundException('Receiver not found');
    }

    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send transaction to yourself');
    }

    // Use transaction manager for atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create transaction
      const transaction = this.transactionRepository.create({
        senderId: new ObjectId(senderId),
        receiverId: new ObjectId(receiverId),
        amount,
        type: type === 'lent' ? TransactionType.LENT : TransactionType.BORROWED,
        remarks,
        status: TransactionStatus.PENDING,
      });

      const savedTransaction = await queryRunner.manager.save(
        Transaction,
        transaction,
      );

      // Don't update balances yet - wait for acceptance
      // Balances will be updated when transaction is accepted

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(
        `Transaction created: ${savedTransaction._id.toString()} from ${senderId} to ${receiverId}`,
      );

      // Emit WebSocket event for real-time updates (non-blocking)
      try {
        const transactionEvents = this.realtimeGateway.getTransactionEvents();
        const server = this.realtimeGateway.getServer();

        transactionEvents.emitTransactionCreated(
          server,
          savedTransaction._id.toString(),
          amount,
          'lent',
          senderId,
          receiverId,
        );
      } catch (wsError) {
        // Log WebSocket errors but don't fail the transaction
        this.logger.warn(
          `Failed to emit WebSocket event for transaction ${savedTransaction._id.toString()}: ${wsError instanceof Error ? wsError.message : 'Unknown error'}`,
        );
      }

      return this.mapToResponse(savedTransaction);
    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadRequestException('Failed to create transaction');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get all transactions for a specific user
   */
  async getUserTransactions(userId: string): Promise<UserTransactionSummary> {
    const userObjectId = new ObjectId(userId);

    // Fetch all transactions where user is sender or receiver
    const [sentTransactions, receivedTransactions] = await Promise.all([
      this.transactionRepository.find({
        where: createObjectIdQuery<Transaction>('senderId', userObjectId),
      }),
      this.transactionRepository.find({
        where: createObjectIdQuery<Transaction>('receiverId', userObjectId),
      }),
    ]);

    const allTransactions = [...sentTransactions, ...receivedTransactions];

    // Calculate summary statistics
    const totalSent = sentTransactions
      .filter((t) => t.status === TransactionStatus.COMPLETED)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalReceived = receivedTransactions
      .filter((t) => t.status === TransactionStatus.COMPLETED)
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingCount = allTransactions.filter(
      (t) => t.status === TransactionStatus.PENDING,
    ).length;

    const acceptedCount = allTransactions.filter(
      (t) => t.status === TransactionStatus.ACCEPTED,
    ).length;

    const completedCount = allTransactions.filter(
      (t) => t.status === TransactionStatus.COMPLETED,
    ).length;

    const failedCount = allTransactions.filter(
      (t) => t.status === TransactionStatus.FAILED,
    ).length;

    // Sort by timestamp descending
    allTransactions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    // Populate user details for all transactions
    const transactionsWithUsers =
      await this.populateUserDetails(allTransactions);

    // Adjust transaction type based on current user's perspective
    const transactionsWithPerspective = transactionsWithUsers.map((tx) => {
      const isSender = tx.senderId === userId;
      return {
        ...tx,
        type: isSender ? TransactionType.LENT : TransactionType.BORROWED,
      };
    });

    return {
      totalSent,
      totalReceived,
      pendingCount,
      acceptedCount,
      completedCount,
      failedCount,
      transactions: transactionsWithPerspective,
    };
  }

  /**
   * Get a single transaction by ID
   */
  async getTransactionById(
    transactionId: string,
    userId: string,
  ): Promise<TransactionResponse> {
    const transaction = await this.transactionRepository.findOne({
      where: createObjectIdQuery<Transaction>('_id', transactionId),
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify user is part of the transaction
    const userObjectId = new ObjectId(userId);
    if (
      transaction.senderId.toString() !== userObjectId.toString() &&
      transaction.receiverId.toString() !== userObjectId.toString()
    ) {
      throw new BadRequestException(
        'You are not authorized to view this transaction',
      );
    }

    return this.mapToResponse(transaction);
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    userId: string,
  ): Promise<TransactionResponse> {
    const transaction = await this.transactionRepository.findOne({
      where: createObjectIdQuery<Transaction>('_id', transactionId),
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify user is part of the transaction
    const userObjectId = new ObjectId(userId);
    if (
      transaction.senderId.toString() !== userObjectId.toString() &&
      transaction.receiverId.toString() !== userObjectId.toString()
    ) {
      throw new BadRequestException(
        'You are not authorized to update this transaction',
      );
    }

    // Update status
    transaction.status = status;
    const updatedTransaction =
      await this.transactionRepository.save(transaction);

    this.logger.log(
      `Transaction ${transactionId} status updated to ${status} by user ${userId}`,
    );

    // Emit WebSocket events (non-blocking)
    try {
      const transactionEvents = this.realtimeGateway.getTransactionEvents();
      const server = this.realtimeGateway.getServer();

      transactionEvents.emitTransactionUpdated(server, transactionId, [
        transaction.senderId.toString(),
        transaction.receiverId.toString(),
      ]);

      // If completed, emit settled event
      if (status === TransactionStatus.COMPLETED) {
        transactionEvents.emitTransactionSettled(server, transactionId, [
          transaction.senderId.toString(),
          transaction.receiverId.toString(),
        ]);
      }
    } catch (wsError) {
      // Log WebSocket errors but don't fail the status update
      this.logger.warn(
        `Failed to emit WebSocket event for transaction ${transactionId}: ${wsError instanceof Error ? wsError.message : 'Unknown error'}`,
      );
    }

    return this.mapToResponse(updatedTransaction);
  }

  /**
   * Get transactions between two users
   */
  async getTransactionsBetweenUsers(
    userId1: string,
    userId2: string,
  ): Promise<TransactionResponse[]> {
    const user1ObjectId = new ObjectId(userId1);
    const user2ObjectId = new ObjectId(userId2);

    const transactions = await this.transactionRepository.find({
      where: createOrQuery<Transaction>([
        {
          senderId: user1ObjectId,
          receiverId: user2ObjectId,
        },
        {
          senderId: user2ObjectId,
          receiverId: user1ObjectId,
        },
      ]),
    });

    // Sort by timestamp descending
    transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return transactions.map((t) => this.mapToResponse(t));
  }

  /**
   * Delete a transaction (only if pending)
   */
  async deleteTransaction(
    transactionId: string,
    userId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await this.transactionRepository.findOne({
        where: createObjectIdQuery<Transaction>('_id', transactionId),
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      // Verify user is the sender
      const userObjectId = new ObjectId(userId);
      if (transaction.senderId.toString() !== userObjectId.toString()) {
        throw new BadRequestException(
          'Only the sender can delete a transaction',
        );
      }

      // Only allow deletion of pending or rejected transactions
      if (
        transaction.status !== TransactionStatus.PENDING &&
        transaction.status !== TransactionStatus.REJECTED
      ) {
        throw new BadRequestException(
          'Only pending or rejected transactions can be deleted',
        );
      }

      // No need to rollback balances since they weren't updated for pending transactions

      // Delete the transaction
      await queryRunner.manager.delete(Transaction, transaction._id);

      await queryRunner.commitTransaction();

      this.logger.log(`Transaction ${transactionId} deleted by user ${userId}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to delete transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get pending transactions that need user's acceptance
   */
  async getPendingTransactions(
    userId: string,
  ): Promise<UserTransactionSummary> {
    const userObjectId = new ObjectId(userId);

    // Get transactions where user is receiver and status is pending
    const baseQuery = createObjectIdQuery<Transaction>(
      'receiverId',
      userObjectId,
    );
    const pendingTransactions = await this.transactionRepository.find({
      where: {
        ...baseQuery,
        status: TransactionStatus.PENDING,
      },
    });

    // Populate user details
    const transactionsWithUsers =
      await this.populateUserDetails(pendingTransactions);

    // Adjust transaction type based on receiver's perspective
    const transactionsWithPerspective = transactionsWithUsers.map((tx) => {
      // Since user is receiver, flip the type
      return {
        ...tx,
        type:
          tx.type === TransactionType.LENT
            ? TransactionType.BORROWED
            : TransactionType.LENT,
      };
    });

    return {
      totalSent: 0,
      totalReceived: 0,
      pendingCount: transactionsWithPerspective.length,
      acceptedCount: 0,
      completedCount: 0,
      failedCount: 0,
      transactions: transactionsWithPerspective,
    };
  }

  /**
   * Accept a transaction (receiver only)
   */
  async acceptTransaction(
    transactionId: string,
    userId: string,
  ): Promise<TransactionResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await this.transactionRepository.findOne({
        where: createObjectIdQuery<Transaction>('_id', transactionId),
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      // Verify user is the receiver
      const userObjectId = new ObjectId(userId);
      if (transaction.receiverId.toString() !== userObjectId.toString()) {
        throw new BadRequestException(
          'Only the receiver can accept this transaction',
        );
      }

      // Verify transaction is pending
      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('Transaction is not pending');
      }

      // Update transaction status
      transaction.status = TransactionStatus.ACCEPTED;
      const updatedTransaction = await queryRunner.manager.save(
        Transaction,
        transaction,
      );

      // Now update user balances
      const [sender, receiver] = await Promise.all([
        this.userRepository.findOne({
          where: createObjectIdQuery<User>('_id', transaction.senderId),
        }),
        this.userRepository.findOne({
          where: createObjectIdQuery<User>('_id', transaction.receiverId),
        }),
      ]);

      if (sender && receiver) {
        // Update balances based on transaction type
        if (transaction.type === TransactionType.LENT) {
          // Sender lent money to receiver
          sender.totalLent += transaction.amount;
          receiver.totalBorrowed += transaction.amount;
        } else {
          // Sender borrowed money from receiver
          sender.totalBorrowed += transaction.amount;
          receiver.totalLent += transaction.amount;
        }

        sender.recalculateBalance();
        receiver.recalculateBalance();

        await queryRunner.manager.save(User, [sender, receiver]);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Transaction ${transactionId} accepted by user ${userId}`,
      );

      // Emit WebSocket events
      try {
        const transactionEvents = this.realtimeGateway.getTransactionEvents();
        const server = this.realtimeGateway.getServer();

        transactionEvents.emitTransactionAccepted(
          server,
          transactionId,
          transaction.senderId.toString(),
          transaction.receiverId.toString(),
        );
      } catch (wsError) {
        this.logger.warn(
          `Failed to emit WebSocket event: ${wsError instanceof Error ? wsError.message : 'Unknown error'}`,
        );
      }

      return this.mapToResponse(updatedTransaction);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to accept transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reject a transaction (receiver only)
   */
  async rejectTransaction(
    transactionId: string,
    userId: string,
  ): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: createObjectIdQuery<Transaction>('_id', transactionId),
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify user is the receiver
    const userObjectId = new ObjectId(userId);
    if (transaction.receiverId.toString() !== userObjectId.toString()) {
      throw new BadRequestException(
        'Only the receiver can reject this transaction',
      );
    }

    // Verify transaction is pending
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not pending');
    }

    // Update status to rejected
    transaction.status = TransactionStatus.REJECTED;
    await this.transactionRepository.save(transaction);

    this.logger.log(`Transaction ${transactionId} rejected by user ${userId}`);

    // Emit WebSocket events
    try {
      const transactionEvents = this.realtimeGateway.getTransactionEvents();
      const server = this.realtimeGateway.getServer();

      transactionEvents.emitTransactionRejected(
        server,
        transactionId,
        transaction.senderId.toString(),
        transaction.receiverId.toString(),
      );
    } catch (wsError) {
      this.logger.warn(
        `Failed to emit WebSocket event: ${wsError instanceof Error ? wsError.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Settle all outstanding balance with a friend
   */
  async settleWithFriend(
    userId: string,
    friendId: string,
    amount: number,
  ): Promise<TransactionResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify both users exist
      const [user, friend] = await Promise.all([
        this.userRepository.findOne({
          where: createObjectIdQuery<User>('_id', userId),
        }),
        this.userRepository.findOne({
          where: createObjectIdQuery<User>('_id', friendId),
        }),
      ]);

      if (!user || !friend) {
        throw new NotFoundException('User not found');
      }

      // Calculate who owes whom
      const userNetBalance = user.totalLent - user.totalBorrowed;

      // Determine the settlement direction
      // If user's net balance is negative, user owes friend (user pays friend)
      // If user's net balance is positive, friend owes user (friend pays user)
      const userOwesFriend = userNetBalance < 0;

      // Create a settlement transaction (marked as completed)
      const settlementTransaction = this.transactionRepository.create({
        senderId: new ObjectId(userId),
        receiverId: new ObjectId(friendId),
        amount,
        type: userOwesFriend ? TransactionType.LENT : TransactionType.BORROWED,
        remarks: 'Settlement',
        status: TransactionStatus.COMPLETED,
      });

      const savedTransaction = await queryRunner.manager.save(
        Transaction,
        settlementTransaction,
      );

      // Update balances to reflect settlement
      if (userOwesFriend) {
        // User owes friend, so user is paying back (lending to cancel borrowed)
        user.totalLent += amount;
        friend.totalBorrowed += amount;
      } else {
        // Friend owes user, so friend is paying back (user borrowed to cancel lent)
        user.totalBorrowed += amount;
        friend.totalLent += amount;
      }

      user.recalculateBalance();
      friend.recalculateBalance();

      await queryRunner.manager.save(User, [user, friend]);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Settlement of ${amount} between ${userId} and ${friendId}`,
      );

      // Emit WebSocket events
      try {
        const transactionEvents = this.realtimeGateway.getTransactionEvents();
        const server = this.realtimeGateway.getServer();

        transactionEvents.emitTransactionSettled(
          server,
          savedTransaction._id.toString(),
          [userId, friendId],
        );
      } catch (wsError) {
        this.logger.warn(
          `Failed to emit WebSocket event: ${wsError instanceof Error ? wsError.message : 'Unknown error'}`,
        );
      }

      return this.mapToResponse(savedTransaction);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to settle: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Map Transaction entity to response DTO
   */
  private mapToResponse(transaction: Transaction): TransactionResponse {
    return {
      _id: transaction._id.toString(),
      senderId: transaction.senderId.toString(),
      receiverId: transaction.receiverId.toString(),
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      remarks: transaction.remarks,
      timestamp: transaction.timestamp,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  /**
   * Populate user details for transactions
   */
  private async populateUserDetails(
    transactions: Transaction[],
  ): Promise<TransactionWithUser[]> {
    if (transactions.length === 0) return [];

    // Get unique user IDs
    const userIds = new Set<string>();
    transactions.forEach((tx) => {
      userIds.add(tx.senderId.toString());
      userIds.add(tx.receiverId.toString());
    });

    // Fetch users individually (simpler approach that works with MongoDB)
    const userPromises = Array.from(userIds).map((userId) =>
      this.userRepository.findOne({
        where: createObjectIdQuery<User>('_id', userId),
      }),
    );
    const usersArray = await Promise.all(userPromises);

    // Create a map of userId -> user (filter out nulls)
    const validUsers = usersArray.filter((u): u is User => u !== null);
    const userMap = new Map(validUsers.map((u) => [u._id.toString(), u]));

    // Map transactions with user details
    return transactions.map((tx) => {
      const sender = userMap.get(tx.senderId.toString());
      const receiver = userMap.get(tx.receiverId.toString());

      return {
        ...this.mapToResponse(tx),
        senderName: sender?.name,
        senderEmail: sender?.email,
        receiverName: receiver?.name,
        receiverEmail: receiver?.email,
      };
    });
  }
}
