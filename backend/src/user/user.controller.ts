import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Auth, CurrentUser } from '../auth/auth.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import {
  UpdateUserDto,
  UpdateUserBalanceDto,
  UserQueryDto,
} from './schema/user.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway?: RealtimeGateway,
  ) {}

  /**
   * GET /user/profile
   * View the current user's profile
   */
  @Get('profile')
  @Auth()
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getUserWithoutPassword(user.userId);
  }

  /**
   * PATCH /user/profile
   * Edit the current user's profile
   */
  @Patch('profile')
  @Auth()
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateProfile(user.userId, updateUserDto);
  }

  /**
   * DELETE /user/profile
   * Delete the current user's account
   */
  @Delete('profile')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@CurrentUser() user: AuthenticatedUser) {
    await this.userService.deleteUser(user.userId);
  }

  /**
   * GET /user/search
   * Search for users by email, name, or phone
   */
  @Get('search')
  @Auth()
  async searchUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Query() queryDto: UserQueryDto,
  ) {
    const { search } = queryDto;

    // If isActive is specified and gateway is available, search only online users
    if (queryDto.isActive !== undefined && this.realtimeGateway) {
      const onlineUserIds = this.realtimeGateway.getOnlineUserIds();
      return this.userService.searchOnlineUsers(
        search || '',
        user.userId,
        onlineUserIds,
      );
    }

    // Otherwise, search all users
    return this.userService.searchUsers(search || '', user.userId);
  }

  /**
   * PATCH /user/ledger
   * Update ledger balances (for transaction updates)
   */
  @Patch('ledger')
  @Auth()
  async updateLedgerBalances(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateUserBalanceDto,
  ) {
    return this.userService.updateLedgerBalances(
      user.userId,
      body.totalLent,
      body.totalBorrowed,
    );
  }
}
