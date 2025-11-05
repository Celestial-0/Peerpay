import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateTransactionDto,
  UpdateTransactionStatusDto,
} from './schemas/transaction.schema';
import type {
  TransactionResponse,
  UserTransactionSummary,
} from './types/transaction-response.type';
import type { JwtRequest } from '../auth/interfaces/jwt-request.interface';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { TransactionType } from './entities/transaction.entity';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway?: RealtimeGateway,
  ) {}

  /**
   * Create a new transaction
   * POST /transactions
   */
  @Post()
  async createTransaction(
    @Request() req: JwtRequest,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponse> {
    const senderId = req.user.userId;
    const transaction = await this.transactionService.createTransaction(
      senderId,
      createTransactionDto,
    );

    // Emit WebSocket event to both users
    if (this.realtimeGateway) {
      const server = this.realtimeGateway.getServer();

      // Notify sender (from their perspective)
      server.to(`user:${senderId}`).emit('transaction.created', {
        transactionId: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        withUserId: createTransactionDto.receiverId,
        timestamp: new Date(),
      });

      // Notify receiver (opposite perspective)
      const receiverType =
        transaction.type === TransactionType.LENT
          ? TransactionType.BORROWED
          : TransactionType.LENT;
      server
        .to(`user:${createTransactionDto.receiverId}`)
        .emit('transaction.created', {
          transactionId: transaction._id,
          amount: transaction.amount,
          type: receiverType,
          withUserId: senderId,
          timestamp: new Date(),
        });
    }

    return transaction;
  }

  /**
   * Get all transactions for the authenticated user
   * GET /transactions
   */
  @Get()
  async getUserTransactions(
    @Request() req: JwtRequest,
  ): Promise<UserTransactionSummary> {
    const userId = req.user.userId;
    return this.transactionService.getUserTransactions(userId);
  }

  /**
   * Get pending transactions that need acceptance
   * GET /transactions/pending
   */
  @Get('pending')
  async getPendingTransactions(
    @Request() req: JwtRequest,
  ): Promise<UserTransactionSummary> {
    const userId = req.user.userId;
    return this.transactionService.getPendingTransactions(userId);
  }

  /**
   * Get transactions between authenticated user and another user
   * GET /transactions/with/:userId
   * NOTE: This must come before GET /transactions/:id to avoid route conflicts
   */
  @Get('with/:userId')
  async getTransactionsBetweenUsers(
    @Request() req: JwtRequest,
    @Param('userId') otherUserId: string,
  ): Promise<TransactionResponse[]> {
    const userId = req.user.userId;
    return this.transactionService.getTransactionsBetweenUsers(
      userId,
      otherUserId,
    );
  }

  /**
   * Get a specific transaction by ID
   * GET /transactions/:id
   */
  @Get(':id')
  async getTransactionById(
    @Request() req: JwtRequest,
    @Param('id') transactionId: string,
  ): Promise<TransactionResponse> {
    const userId = req.user.userId;
    return this.transactionService.getTransactionById(transactionId, userId);
  }

  /**
   * Accept a transaction
   * PATCH /transactions/:id/accept
   */
  @Patch(':id/accept')
  async acceptTransaction(
    @Request() req: JwtRequest,
    @Param('id') transactionId: string,
  ): Promise<TransactionResponse> {
    const userId = req.user.userId;
    return this.transactionService.acceptTransaction(transactionId, userId);
  }

  /**
   * Reject a transaction
   * PATCH /transactions/:id/reject
   */
  @Patch(':id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectTransaction(
    @Request() req: JwtRequest,
    @Param('id') transactionId: string,
  ): Promise<void> {
    const userId = req.user.userId;
    return this.transactionService.rejectTransaction(transactionId, userId);
  }

  /**
   * Update transaction status
   * PATCH /transactions/:id/status
   */
  @Patch(':id/status')
  async updateTransactionStatus(
    @Request() req: JwtRequest,
    @Param('id') transactionId: string,
    @Body() updateStatusDto: UpdateTransactionStatusDto,
  ): Promise<TransactionResponse> {
    const userId = req.user.userId;
    const transaction = await this.transactionService.updateTransactionStatus(
      transactionId,
      updateStatusDto.status,
      userId,
    );

    // Emit WebSocket event
    if (this.realtimeGateway) {
      const server = this.realtimeGateway.getServer();
      const senderId = transaction.senderId.toString();
      const receiverId = transaction.receiverId.toString();

      // Notify both users
      server.to(`user:${senderId}`).emit('transaction.updated', {
        transactionId: transaction._id.toString(),
        timestamp: new Date(),
      });
      server.to(`user:${receiverId}`).emit('transaction.updated', {
        transactionId: transaction._id.toString(),
        timestamp: new Date(),
      });
    }

    return transaction;
  }

  /**
   * Settle balance with a friend
   * POST /transactions/settle/:friendId
   */
  @Post('settle/:friendId')
  async settleWithFriend(
    @Request() req: JwtRequest,
    @Param('friendId') friendId: string,
    @Body() body: { amount: number },
  ): Promise<TransactionResponse> {
    const userId = req.user.userId;
    return this.transactionService.settleWithFriend(
      userId,
      friendId,
      body.amount,
    );
  }

  /**
   * Delete a pending transaction
   * DELETE /transactions/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTransaction(
    @Request() req: JwtRequest,
    @Param('id') transactionId: string,
  ): Promise<void> {
    const userId = req.user.userId;
    return this.transactionService.deleteTransaction(transactionId, userId);
  }
}
