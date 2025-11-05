import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './schema/auth.schema';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { Public, CurrentUser } from './auth.decorator';
import type { RequestWithUser } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Request() req: RequestWithUser) {
    // LocalAuthGuard will validate and attach user to request
    return this.authService.signin(req.user);
  }

  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req: RequestWithUser) {
    // JwtRefreshAuthGuard validates refresh token and attaches user to request
    return this.authService.refreshAccessToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async signout(@CurrentUser('userId') userId: string) {
    return this.authService.signout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invalidate-tokens')
  @HttpCode(HttpStatus.OK)
  async invalidateTokens(@CurrentUser('userId') userId: string) {
    await this.authService.invalidateUserTokens(userId);
    return {
      message: 'All tokens destroyed successfully. Please sign in again.',
    };
  }
}
