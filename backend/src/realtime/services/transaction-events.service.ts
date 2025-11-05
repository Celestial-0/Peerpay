import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  TransactionCreatedEvent,
  TransactionUpdatedEvent,
  TransactionSettledEvent,
} from '../types/socket-events.types';

@Injectable()
export class TransactionEventsService {
  private readonly USER_ROOM_PREFIX = 'user:';

  /**
   * Emit transaction created event to both parties
   */
  emitTransactionCreated(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    transactionId: string,
    amount: number,
    type: 'lent' | 'borrowed',
    userId1: string,
    userId2: string,
  ): void {
    const event: TransactionCreatedEvent = {
      transactionId,
      amount,
      type,
      withUserId: userId2,
      timestamp: new Date(),
    };

    // Notify both users
    server
      .to(`${this.USER_ROOM_PREFIX}${userId1}`)
      .emit('transaction.created', event);
    server
      .to(`${this.USER_ROOM_PREFIX}${userId2}`)
      .emit('transaction.created', {
        ...event,
        type: type === 'lent' ? 'borrowed' : 'lent',
        withUserId: userId1,
      });
  }

  /**
   * Emit transaction updated event
   */
  emitTransactionUpdated(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    transactionId: string,
    userIds: string[],
  ): void {
    const event: TransactionUpdatedEvent = {
      transactionId,
      timestamp: new Date(),
    };

    userIds.forEach((userId) => {
      server
        .to(`${this.USER_ROOM_PREFIX}${userId}`)
        .emit('transaction.updated', event);
    });
  }

  /**
   * Emit transaction accepted event
   */
  emitTransactionAccepted(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    transactionId: string,
    senderId: string,
    receiverId: string,
  ): void {
    const event: TransactionUpdatedEvent = {
      transactionId,
      timestamp: new Date(),
    };

    // Notify both users
    server
      .to(`${this.USER_ROOM_PREFIX}${senderId}`)
      .emit('transaction.accepted', event);
    server
      .to(`${this.USER_ROOM_PREFIX}${receiverId}`)
      .emit('transaction.accepted', event);
  }

  /**
   * Emit transaction rejected event
   */
  emitTransactionRejected(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    transactionId: string,
    senderId: string,
    receiverId: string,
  ): void {
    const event: TransactionUpdatedEvent = {
      transactionId,
      timestamp: new Date(),
    };

    // Notify both users
    server
      .to(`${this.USER_ROOM_PREFIX}${senderId}`)
      .emit('transaction.rejected', event);
    server
      .to(`${this.USER_ROOM_PREFIX}${receiverId}`)
      .emit('transaction.rejected', event);
  }

  /**
   * Emit transaction settled event
   */
  emitTransactionSettled(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    transactionId: string,
    userIds: string[],
  ): void {
    const event: TransactionSettledEvent = {
      transactionId,
      timestamp: new Date(),
    };

    userIds.forEach((userId) => {
      server
        .to(`${this.USER_ROOM_PREFIX}${userId}`)
        .emit('transaction.settled', event);
    });
  }
}
