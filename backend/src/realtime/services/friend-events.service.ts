import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  FriendOnlineEvent,
  FriendOfflineEvent,
  FriendRequestedEvent,
  FriendAcceptedEvent,
  FriendRejectedEvent,
  FriendRemovedEvent,
  FriendRequestCancelledEvent,
} from '../types/socket-events.types';

@Injectable()
export class FriendEventsService {
  private readonly USER_ROOM_PREFIX = 'user:';

  /**
   * Emit friend online event to all of a user's friends
   */
  emitFriendOnline(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    friendIds: string[],
    userId: string,
  ): void {
    const event: FriendOnlineEvent = {
      userId,
      timestamp: new Date(),
    };

    friendIds.forEach((friendId) => {
      server
        .to(`${this.USER_ROOM_PREFIX}${friendId}`)
        .emit('friend.online', event);
    });
  }

  /**
   * Emit friend offline event to all of a user's friends
   */
  emitFriendOffline(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    friendIds: string[],
    userId: string,
  ): void {
    const event: FriendOfflineEvent = {
      userId,
      timestamp: new Date(),
    };

    friendIds.forEach((friendId) => {
      server
        .to(`${this.USER_ROOM_PREFIX}${friendId}`)
        .emit('friend.offline', event);
    });
  }

  /**
   * Emit friend request sent event
   */
  emitFriendRequested(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    senderId: string,
    receiverId: string,
    requestId: string,
  ): void {
    const event: FriendRequestedEvent = {
      senderId,
      requestId,
      timestamp: new Date(),
    };

    server
      .to(`${this.USER_ROOM_PREFIX}${receiverId}`)
      .emit('friend.requested', event);
  }

  /**
   * Emit friend request accepted event to both users
   */
  emitFriendAccepted(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    userId1: string,
    userId2: string,
  ): void {
    const event1: FriendAcceptedEvent = {
      friendId: userId2,
      timestamp: new Date(),
    };

    const event2: FriendAcceptedEvent = {
      friendId: userId1,
      timestamp: new Date(),
    };

    server
      .to(`${this.USER_ROOM_PREFIX}${userId1}`)
      .emit('friend.accepted', event1);
    server
      .to(`${this.USER_ROOM_PREFIX}${userId2}`)
      .emit('friend.accepted', event2);
  }

  /**
   * Emit friend request rejected event
   */
  emitFriendRejected(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    senderId: string,
    receiverId: string,
  ): void {
    const event: FriendRejectedEvent = {
      receiverId,
      timestamp: new Date(),
    };

    server
      .to(`${this.USER_ROOM_PREFIX}${senderId}`)
      .emit('friend.rejected', event);
  }

  /**
   * Emit friendship removed event to both users
   */
  emitFriendRemoved(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    userId1: string,
    userId2: string,
  ): void {
    const event1: FriendRemovedEvent = {
      friendId: userId2,
      timestamp: new Date(),
    };

    const event2: FriendRemovedEvent = {
      friendId: userId1,
      timestamp: new Date(),
    };

    server
      .to(`${this.USER_ROOM_PREFIX}${userId1}`)
      .emit('friend.removed', event1);
    server
      .to(`${this.USER_ROOM_PREFIX}${userId2}`)
      .emit('friend.removed', event2);
  }

  /**
   * Emit friend request cancelled event (sender cancelled their request)
   */
  emitFriendRequestCancelled(
    server: Server<ClientToServerEvents, ServerToClientEvents>,
    receiverId: string,
    requestId: string,
  ): void {
    const event: FriendRequestCancelledEvent = {
      requestId,
      timestamp: new Date(),
    };

    server
      .to(`${this.USER_ROOM_PREFIX}${receiverId}`)
      .emit('friend.requestCancelled', event);
  }
}
