import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { Auth, CurrentUser } from '../auth/auth.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import {
  SendFriendRequestDto,
  HandleFriendRequestDto,
} from './schema/friend.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Controller('friend')
export class FriendController {
  private readonly logger = new Logger(FriendController.name);

  constructor(
    private readonly friendService: FriendService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway?: RealtimeGateway,
  ) {}

  /**
   * POST /friend/request
   * Send a friend request
   */
  @Post('request')
  @Auth()
  async sendFriendRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendFriendRequestDto,
  ) {
    this.logger.log(
      `User ${user.userId} sending friend request to ${dto.receiverId}`,
    );

    const request = await this.friendService.sendFriendRequest(
      user.userId,
      dto.receiverId,
    );

    // Emit WebSocket event
    if (this.realtimeGateway) {
      const server = this.realtimeGateway.getServer();
      const friendEvents = this.realtimeGateway.getFriendEvents();
      friendEvents.emitFriendRequested(
        server,
        user.userId,
        dto.receiverId,
        request._id.toString(),
      );
    }

    return request;
  }

  /**
   * POST /friend/request/:requestId/handle
   * Accept or reject a friend request
   */
  @Post('request/:requestId/handle')
  @Auth()
  async handleFriendRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId') requestId: string,
    @Body() dto: HandleFriendRequestDto,
  ) {
    if (dto.decision === 'accept') {
      const request = await this.friendService.acceptFriendRequest(
        requestId,
        user.userId,
      );

      // Emit WebSocket event
      if (this.realtimeGateway) {
        const server = this.realtimeGateway.getServer();
        const friendEvents = this.realtimeGateway.getFriendEvents();
        friendEvents.emitFriendAccepted(
          server,
          request.senderId.toString(),
          request.receiverId.toString(),
        );
      }

      return request;
    } else {
      const request = await this.friendService.rejectFriendRequest(
        requestId,
        user.userId,
      );

      // Emit WebSocket event
      if (this.realtimeGateway) {
        const server = this.realtimeGateway.getServer();
        const friendEvents = this.realtimeGateway.getFriendEvents();
        friendEvents.emitFriendRejected(
          server,
          request.senderId.toString(),
          request.receiverId.toString(),
        );
      }

      return request;
    }
  }

  /**
   * GET /friend/list
   * Get all friends
   */
  @Get('list')
  @Auth()
  async getFriends(@CurrentUser() user: AuthenticatedUser) {
    return this.friendService.getFriends(user.userId);
  }

  /**
   * GET /friend/requests/incoming
   * Get incoming friend requests
   */
  @Get('requests/incoming')
  @Auth()
  async getIncomingRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.friendService.getIncomingRequests(user.userId);
  }

  /**
   * GET /friend/requests/outgoing
   * Get outgoing friend requests
   */
  @Get('requests/outgoing')
  @Auth()
  async getOutgoingRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.friendService.getOutgoingRequests(user.userId);
  }

  /**
   * DELETE /friend/request/:requestId
   * Cancel a friend request (sender only)
   */
  @Delete('request/:requestId')
  @Auth()
  async cancelFriendRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId') requestId: string,
  ) {
    const request = await this.friendService.cancelFriendRequest(
      requestId,
      user.userId,
    );

    // Emit WebSocket event to notify receiver
    if (this.realtimeGateway) {
      const server = this.realtimeGateway.getServer();
      const friendEvents = this.realtimeGateway.getFriendEvents();
      friendEvents.emitFriendRequestCancelled(
        server,
        request.receiverId.toString(),
        requestId,
      );
    }

    return { message: 'Friend request cancelled successfully' };
  }

  /**
   * DELETE /friend/:friendId
   * Remove a friend
   */
  @Delete(':friendId')
  @Auth()
  async removeFriend(
    @CurrentUser() user: AuthenticatedUser,
    @Param('friendId') friendId: string,
  ) {
    await this.friendService.removeFriend(user.userId, friendId);

    // Emit WebSocket event
    if (this.realtimeGateway) {
      const server = this.realtimeGateway.getServer();
      const friendEvents = this.realtimeGateway.getFriendEvents();
      friendEvents.emitFriendRemoved(server, user.userId, friendId);
    }

    return { message: 'Friend removed successfully' };
  }
}
