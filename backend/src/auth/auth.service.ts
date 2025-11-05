import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { SignupDto } from './schema/auth.schema';
import { AuthenticatedUser } from './interfaces';
import {
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
} from '../constants';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials (used by LocalStrategy)
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<Partial<User> | null> {
    return this.userService.validateCredentials(email, password);
  }

  /**
   * Generate JWT access token (short-lived)
   */
  generateAccessToken(user: User): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      type: 'access' as const,
      tokenVersion: user.tokenVersion,
    };

    return this.jwtService.sign(payload, {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: JWT_EXPIRES_IN as any,
    });
  }

  /**
   * Generate JWT refresh token (long-lived)
   */
  generateRefreshToken(user: User): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      type: 'refresh' as const,
      tokenVersion: user.tokenVersion,
    };

    return this.jwtService.sign(payload, {
      secret: JWT_REFRESH_SECRET,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: JWT_REFRESH_EXPIRES_IN as any,
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokens(user: User) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  async signup(signupDto: SignupDto) {
    const { email, password, name, phone } = signupDto;

    // Create new user (UserService handles duplicate check and password hashing)
    const user = await this.userService.create(email, password, name, phone);

    // Generate access and refresh tokens
    const tokens = this.generateTokens(user);

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return {
      message: 'User registered successfully',
      user: result,
      ...tokens,
    };
  }

  async signin(authenticatedUser: Partial<User> | AuthenticatedUser) {
    // Fetch full user from database using email
    const user = await this.userService.findByEmail(authenticatedUser.email!);

    if (!user) {
      throw new Error('User not found');
    }

    // Update last login and set user as active
    await this.userService.updateLastLogin(user._id.toString());

    // Generate access and refresh tokens
    const tokens = this.generateTokens(user);

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return {
      message: 'Signed in successfully',
      user: result,
      ...tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(authenticatedUser: AuthenticatedUser) {
    if (!authenticatedUser) {
      throw new Error('User information not found in token');
    }

    // Fetch the full user from database
    const user = await this.userService.findById(authenticatedUser.userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(user);

    return {
      message: 'Access token refreshed successfully',
      accessToken,
    };
  }
  async signout(userId: string) {
    // Set user as inactive
    await this.userService.setInactive(userId);

    // Invalidate all tokens by incrementing tokenVersion
    await this.invalidateUserTokens(userId);

    return {
      message: 'Signed out successfully. All tokens have been invalidated.',
    };
  }

  /**
   * Force logout user from all devices by incrementing tokenVersion
   */
  async invalidateUserTokens(userId: string) {
    await this.userService.incrementTokenVersion(userId);
  }
}
