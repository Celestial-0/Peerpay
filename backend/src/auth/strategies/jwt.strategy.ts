import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { JWT_SECRET } from '../../constants';
import { JwtPayload } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    // Ensure this is an access token (not refresh token)
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userRepository.findOne({
      where: { email: payload.email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isActive === false) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Check token version to support forced logout
    // Treat null/undefined as 0 for backwards compatibility
    const userTokenVersion = user.tokenVersion ?? 0;
    const payloadTokenVersion = payload.tokenVersion ?? 0;

    if (userTokenVersion !== payloadTokenVersion) {
      throw new UnauthorizedException(
        'Token has been invalidated. Please sign in again.',
      );
    }

    // Return user object (will be attached to request.user)
    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
  }
}
