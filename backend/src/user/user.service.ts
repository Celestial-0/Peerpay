import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: { _id: new ObjectId(userId) as any },
    });
  }

  /**
   * Validate user credentials
   */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<Partial<User> | null> {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Create a new user
   */
  async create(
    email: string,
    password: string,
    name: string,
    phone?: string,
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user (password will be hashed by @BeforeInsert hook in entity)
    const user = this.userRepository.create({
      email,
      password,
      name,
      phone,
      tokenVersion: 0,
    });

    return this.userRepository.save(user);
  }

  /**
   * Update user's last login and set active status
   */
  async updateLastLogin(userId: string): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.lastLogin = new Date();
    user.isActive = true;

    return this.userRepository.save(user);
  }

  /**
   * Set user as inactive
   */
  async setInactive(userId: string): Promise<void> {
    const user = await this.findById(userId);

    if (user) {
      user.isActive = false;
      await this.userRepository.save(user);
    }
  }

  /**
   * Increment token version to invalidate all existing tokens
   */
  async incrementTokenVersion(userId: string): Promise<void> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.tokenVersion += 1;
    await this.userRepository.save(user);
  }

  /**
   * Get user without password
   */
  async getUserWithoutPassword(userId: string): Promise<Partial<User>> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: { name?: string; avatar?: string; phone?: string },
  ): Promise<Partial<User>> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update fields if provided
    if (updateData.name !== undefined) {
      user.name = updateData.name;
    }

    if (updateData.avatar !== undefined) {
      user.avatar = updateData.avatar;
    }

    if (updateData.phone !== undefined) {
      user.phone = updateData.phone;
    }

    const updatedUser = await this.userRepository.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = updatedUser;
    return result;
  }

  /**
   * Update ledger balances
   */
  async updateLedgerBalances(
    userId: string,
    totalLent?: number,
    totalBorrowed?: number,
  ): Promise<Partial<User>> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (totalLent !== undefined) {
      user.totalLent = totalLent;
    }

    if (totalBorrowed !== undefined) {
      user.totalBorrowed = totalBorrowed;
    }

    // Recalculate net balance
    user.recalculateBalance();

    const updatedUser = await this.userRepository.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = updatedUser;
    return result;
  }

  /**
   * Search users by email or name
   */
  async searchUsers(
    query: string,
    currentUserId: string,
  ): Promise<Partial<User>[]> {
    const users = await this.userRepository.find();

    const filteredUsers = users.filter(
      (user) =>
        user._id.toString() !== currentUserId &&
        (user.email.toLowerCase().includes(query.toLowerCase()) ||
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          (user.phone &&
            user.phone.toLowerCase().includes(query.toLowerCase()))),
    );

    return filteredUsers.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
    });
  }

  /**
   * Search online users by email, name, or phone
   * This method requires integration with the FriendGateway to check online status
   */
  async searchOnlineUsers(
    query: string,
    currentUserId: string,
    onlineUserIds: string[],
  ): Promise<Partial<User>[]> {
    const users = await this.userRepository.find();

    const filteredUsers = users.filter(
      (user) =>
        user._id.toString() !== currentUserId &&
        onlineUserIds.includes(user._id.toString()) &&
        (user.email.toLowerCase().includes(query.toLowerCase()) ||
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          (user.phone &&
            user.phone.toLowerCase().includes(query.toLowerCase()))),
    );

    return filteredUsers.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
    });
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);
  }
}
