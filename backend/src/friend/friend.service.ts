import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import {
  FriendRequest,
  FriendRequestStatus,
} from './entities/friend-request.entity';
import { Friendship } from './entities/friendship.entity';
import { User } from '../user/entities/user.entity';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transaction/entities/transaction.entity';
import { MongoQuery, createOrQuery } from '../common/types/mongo-query.types';
import {
  IncomingFriendRequestResponse,
  OutgoingFriendRequestResponse,
} from './types/friend-request-response.type';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Send a friend request
   */
  async sendFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<FriendRequest> {
    // Validate sender and receiver are different
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if both users exist
    const sender = await this.userRepository.findOne({
      where: { _id: new ObjectId(senderId) } as MongoQuery<User>,
    });
    const receiver = await this.userRepository.findOne({
      where: { _id: new ObjectId(receiverId) } as MongoQuery<User>,
    });

    if (!sender || !receiver) {
      throw new NotFoundException('User not found');
    }

    // Check if already friends
    const existingFriendship = await this.friendshipRepository.findOne({
      where: {
        $or: [
          {
            userId1: new ObjectId(senderId),
            userId2: new ObjectId(receiverId),
          },
          {
            userId1: new ObjectId(receiverId),
            userId2: new ObjectId(senderId),
          },
        ],
      } as MongoQuery<Friendship>,
    });

    if (existingFriendship) {
      throw new ConflictException('Already friends with this user');
    }

    // Check if request already exists
    const existingRequest = await this.friendRequestRepository.findOne({
      where: {
        $or: [
          {
            senderId: new ObjectId(senderId),
            receiverId: new ObjectId(receiverId),
            status: FriendRequestStatus.PENDING,
          },
          {
            senderId: new ObjectId(receiverId),
            receiverId: new ObjectId(senderId),
            status: FriendRequestStatus.PENDING,
          },
        ],
      } as MongoQuery<FriendRequest>,
    });

    if (existingRequest) {
      throw new ConflictException('Friend request already exists');
    }

    // Create new friend request
    const friendRequest = this.friendRequestRepository.create({
      senderId: new ObjectId(senderId),
      receiverId: new ObjectId(receiverId),
      status: FriendRequestStatus.PENDING,
    });

    const savedRequest = await this.friendRequestRepository.save(friendRequest);

    // WebSocket events are now handled by RealtimeGateway
    // Will be triggered via FriendController -> RealtimeGateway

    return savedRequest;
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(
    requestId: string,
    userId: string,
  ): Promise<FriendRequest> {
    const request = await this.friendRequestRepository.findOne({
      where: { _id: new ObjectId(requestId) } as MongoQuery<FriendRequest>,
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Validate that the user is the receiver
    if (request.receiverId.toString() !== userId) {
      throw new BadRequestException('You can only accept requests sent to you');
    }

    // Validate request is still pending
    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Friend request is not pending');
    }

    // Update request status
    request.status = FriendRequestStatus.ACCEPTED;
    await this.friendRequestRepository.save(request);

    // Create friendship
    const friendship = this.friendshipRepository.create({
      userId1: request.senderId,
      userId2: request.receiverId,
    });
    await this.friendshipRepository.save(friendship);

    // WebSocket events are now handled by RealtimeGateway
    // Will be triggered via FriendController -> RealtimeGateway

    return request;
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(
    requestId: string,
    userId: string,
  ): Promise<FriendRequest> {
    const request = await this.friendRequestRepository.findOne({
      where: { _id: new ObjectId(requestId) } as MongoQuery<FriendRequest>,
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Validate that the user is the receiver
    if (request.receiverId.toString() !== userId) {
      throw new BadRequestException('You can only reject requests sent to you');
    }

    // Validate request is still pending
    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Friend request is not pending');
    }

    // Update request status
    request.status = FriendRequestStatus.REJECTED;
    const rejectedRequest = await this.friendRequestRepository.save(request);

    // WebSocket events are now handled by RealtimeGateway
    // Will be triggered via FriendController -> RealtimeGateway

    return rejectedRequest;
  }

  /**
   * Get all friends for a user with per-friend balance information
   */
  async getFriends(
    userId: string,
  ): Promise<(Partial<User> & { totalLent: number; totalBorrowed: number })[]> {
    const friendships = await this.friendshipRepository.find({
      where: {
        $or: [
          { userId1: new ObjectId(userId) },
          { userId2: new ObjectId(userId) },
        ],
      } as MongoQuery<Friendship>,
    });

    const friendIds = friendships.map((friendship) => {
      const friendId =
        friendship.userId1.toString() === userId
          ? friendship.userId2
          : friendship.userId1;
      return friendId;
    });

    const friends = await Promise.all(
      friendIds.map((id) =>
        this.userRepository.findOne({
          where: { _id: id } as MongoQuery<User>,
        }),
      ),
    );

    // Calculate per-friend balances
    const friendsWithBalances = await Promise.all(
      friends
        .filter((friend): friend is User => friend !== null)
        .map(async (friend) => {
          // Get all accepted and completed transactions between user and friend
          const transactions = await this.transactionRepository.find({
            where: createOrQuery<Transaction>([
              {
                senderId: new ObjectId(userId),
                receiverId: friend._id,
                status: TransactionStatus.ACCEPTED,
              },
              {
                senderId: new ObjectId(userId),
                receiverId: friend._id,
                status: TransactionStatus.COMPLETED,
              },
              {
                senderId: friend._id,
                receiverId: new ObjectId(userId),
                status: TransactionStatus.ACCEPTED,
              },
              {
                senderId: friend._id,
                receiverId: new ObjectId(userId),
                status: TransactionStatus.COMPLETED,
              },
            ]),
          });

          // Calculate balances from user's perspective
          let totalLent = 0;
          let totalBorrowed = 0;

          transactions.forEach((tx) => {
            if (tx.senderId.toString() === userId) {
              // User sent this transaction
              if (tx.type === TransactionType.LENT) {
                totalLent += tx.amount;
              } else {
                totalBorrowed += tx.amount;
              }
            } else {
              // Friend sent this transaction
              if (tx.type === TransactionType.LENT) {
                totalBorrowed += tx.amount;
              } else {
                totalLent += tx.amount;
              }
            }
          });

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _, ...result } = friend;
          return {
            ...result,
            totalLent,
            totalBorrowed,
          };
        }),
    );

    return friendsWithBalances;
  }

  /**
   * Get pending incoming friend requests
   */
  async getIncomingRequests(
    userId: string,
  ): Promise<IncomingFriendRequestResponse[]> {
    const requests = await this.friendRequestRepository.find({
      where: {
        receiverId: new ObjectId(userId),
        status: FriendRequestStatus.PENDING,
      } as MongoQuery<FriendRequest>,
    });

    const requestsWithSenders = await Promise.all(
      requests.map(async (request) => {
        const sender = await this.userRepository.findOne({
          where: { _id: request.senderId } as MongoQuery<User>,
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...senderData } = sender || {};

        return {
          _id: request._id,
          sender: senderData,
          status: request.status,
          createdAt: request.createdAt,
        };
      }),
    );

    return requestsWithSenders;
  }

  /**
   * Get pending outgoing friend requests
   */
  async getOutgoingRequests(
    userId: string,
  ): Promise<OutgoingFriendRequestResponse[]> {
    const requests = await this.friendRequestRepository.find({
      where: {
        senderId: new ObjectId(userId),
        status: FriendRequestStatus.PENDING,
      } as MongoQuery<FriendRequest>,
    });

    const requestsWithReceivers = await Promise.all(
      requests.map(async (request) => {
        const receiver = await this.userRepository.findOne({
          where: { _id: request.receiverId } as MongoQuery<User>,
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...receiverData } = receiver || {};

        return {
          _id: request._id,
          receiver: receiverData,
          status: request.status,
          createdAt: request.createdAt,
        };
      }),
    );

    return requestsWithReceivers;
  }

  /**
   * Remove a friend
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    const friendship = await this.friendshipRepository.findOne({
      where: {
        $or: [
          {
            userId1: new ObjectId(userId),
            userId2: new ObjectId(friendId),
          },
          {
            userId1: new ObjectId(friendId),
            userId2: new ObjectId(userId),
          },
        ],
      } as MongoQuery<Friendship>,
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.friendshipRepository.remove(friendship);

    // WebSocket events are now handled by RealtimeGateway
    // Will be triggered via FriendController -> RealtimeGateway
  }

  /**
   * Cancel a friend request (sender only)
   */
  async cancelFriendRequest(
    requestId: string,
    userId: string,
  ): Promise<FriendRequest> {
    const request = await this.friendRequestRepository.findOne({
      where: { _id: new ObjectId(requestId) } as MongoQuery<FriendRequest>,
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Validate that the user is the sender
    if (request.senderId.toString() !== userId) {
      throw new BadRequestException('You can only cancel requests you sent');
    }

    // Validate request is still pending
    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Friend request is not pending');
    }

    // Delete the request instead of updating status
    await this.friendRequestRepository.remove(request);

    return request;
  }

  /**
   * Check if two users are friends
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await this.friendshipRepository.findOne({
      where: {
        $or: [
          {
            userId1: new ObjectId(userId1),
            userId2: new ObjectId(userId2),
          },
          {
            userId1: new ObjectId(userId2),
            userId2: new ObjectId(userId1),
          },
        ],
      } as MongoQuery<Friendship>,
    });

    return !!friendship;
  }
}
