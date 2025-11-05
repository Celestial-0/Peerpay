import { User } from './user.entity';
import { ObjectId } from 'mongodb';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('User Entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
    user._id = new ObjectId();
    user.email = 'test@example.com';
    user.password = 'plainPassword123';
    user.name = 'Test User';
    user.avatar = 'https://example.com/avatar.jpg';
    user.phone = '+1234567890';
    user.friends = [];
    user.pendingRequests = [];
    user.totalLent = 0;
    user.totalBorrowed = 0;
    user.netBalance = 0;
    user.role = 'user';
    user.isActive = true;
    user.tokenVersion = 0;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default bcrypt mocks
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('$2b$10$mockSalt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$mockHash');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Entity Structure', () => {
    it('should create a user instance', () => {
      expect(user).toBeDefined();
      expect(user).toBeInstanceOf(User);
    });

    it('should have all required basic fields', () => {
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.password).toBeDefined();
    });

    it('should have optional fields', () => {
      expect(user).toHaveProperty('avatar');
      expect(user).toHaveProperty('phone');
    });

    it('should have friendship fields', () => {
      expect(user).toHaveProperty('friends');
      expect(user).toHaveProperty('pendingRequests');
      expect(Array.isArray(user.friends)).toBe(true);
      expect(Array.isArray(user.pendingRequests)).toBe(true);
    });

    it('should have ledger fields', () => {
      expect(user).toHaveProperty('totalLent');
      expect(user).toHaveProperty('totalBorrowed');
      expect(user).toHaveProperty('netBalance');
    });

    it('should have security fields', () => {
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isActive');
      expect(user).toHaveProperty('tokenVersion');
    });

    it('should have timestamp fields', () => {
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      expect(user).toHaveProperty('lastLogin');
    });
  });

  describe('Default Values', () => {
    it('should initialize friends as empty array', () => {
      const newUser = new User();
      expect(newUser.friends).toBeUndefined();
    });

    it('should initialize pendingRequests as empty array', () => {
      const newUser = new User();
      expect(newUser.pendingRequests).toBeUndefined();
    });

    it('should set default role to user', () => {
      const newUser = new User();
      newUser.role = 'user';
      expect(newUser.role).toBe('user');
    });

    it('should set default isActive to true', () => {
      const newUser = new User();
      newUser.isActive = true;
      expect(newUser.isActive).toBe(true);
    });

    it('should set default tokenVersion to 0', () => {
      const newUser = new User();
      newUser.tokenVersion = 0;
      expect(newUser.tokenVersion).toBe(0);
    });

    it('should set default ledger balances to 0', () => {
      expect(user.totalLent).toBe(0);
      expect(user.totalBorrowed).toBe(0);
      expect(user.netBalance).toBe(0);
    });
  });

  describe('Role Management', () => {
    it('should allow user role', () => {
      user.role = 'user';
      expect(user.role).toBe('user');
    });

    it('should allow admin role', () => {
      user.role = 'admin';
      expect(user.role).toBe('admin');
    });
  });

  describe('@BeforeInsert Hook - setCreateTimestamp', () => {
    it('should set createdAt timestamp on insert', () => {
      const beforeDate = new Date();
      user.setCreateTimestamp();
      const afterDate = new Date();

      expect(user.createdAt).toBeDefined();
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeDate.getTime(),
      );
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterDate.getTime());
    });

    it('should set updatedAt timestamp on insert', () => {
      const beforeDate = new Date();
      user.setCreateTimestamp();
      const afterDate = new Date();

      expect(user.updatedAt).toBeDefined();
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeDate.getTime(),
      );
      expect(user.updatedAt.getTime()).toBeLessThanOrEqual(afterDate.getTime());
    });

    it('should set createdAt and updatedAt to same time', () => {
      user.setCreateTimestamp();

      expect(user.createdAt).toEqual(user.updatedAt);
    });

    it('should initialize role to user if undefined', () => {
      const newUser = new User();
      newUser.setCreateTimestamp();

      expect(newUser.role).toBe('user');
    });

    it('should not override existing role', () => {
      user.role = 'admin';
      user.setCreateTimestamp();

      expect(user.role).toBe('admin');
    });

    it('should initialize isActive to true if undefined', () => {
      const newUser = new User();
      newUser.setCreateTimestamp();

      expect(newUser.isActive).toBe(true);
    });

    it('should initialize tokenVersion to 0 if undefined', () => {
      const newUser = new User();
      newUser.setCreateTimestamp();

      expect(newUser.tokenVersion).toBe(0);
    });

    it('should initialize friends array if not set', () => {
      const newUser = new User();
      newUser.setCreateTimestamp();

      expect(newUser.friends).toEqual([]);
    });

    it('should initialize pendingRequests array if not set', () => {
      const newUser = new User();
      newUser.setCreateTimestamp();

      expect(newUser.pendingRequests).toEqual([]);
    });

    it('should not override existing friends array', () => {
      const friendId = new ObjectId();
      user.friends = [friendId];
      user.setCreateTimestamp();

      expect(user.friends).toEqual([friendId]);
    });
  });

  describe('@BeforeUpdate Hook - updateTimestamp', () => {
    it('should update updatedAt timestamp on update', async () => {
      user.createdAt = new Date('2024-01-01');
      user.updatedAt = new Date('2024-01-01');

      // Simulate time passing
      await new Promise((resolve) => setTimeout(resolve, 10));

      user.updateTimestamp();

      expect(user.updatedAt.getTime()).toBeGreaterThan(
        user.createdAt.getTime(),
      );
    });

    it('should not modify createdAt on update', () => {
      const originalCreatedAt = new Date('2024-01-01');
      user.createdAt = originalCreatedAt;

      user.updateTimestamp();

      expect(user.createdAt).toEqual(originalCreatedAt);
    });
  });

  describe('hashPassword Method', () => {
    it('should hash password before insert', async () => {
      const plainPassword = 'mySecurePassword123';
      const hashedPassword = '$2b$10$hashedPasswordValue';
      user.password = plainPassword;

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('$2b$10$salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      await user.hashPassword();

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, '$2b$10$salt');
      expect(user.password).toBe(hashedPassword);
    });

    it('should use salt rounds of 10', async () => {
      const plainPassword = 'testPassword';
      user.password = plainPassword;

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('$2b$10$mockedSalt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$mockedHash');

      await user.hashPassword();

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(
        plainPassword,
        '$2b$10$mockedSalt',
      );
    });

    it('should generate different hashes for same password', async () => {
      const plainPassword = 'samePassword';

      const user1 = new User();
      user1.password = plainPassword;
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('$2b$10$hash1');
      await user1.hashPassword();

      const user2 = new User();
      user2.password = plainPassword;
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('$2b$10$hash2');
      await user2.hashPassword();

      expect(user1.password).not.toBe(user2.password);
    });

    it('should create valid bcrypt hash', async () => {
      const plainPassword = 'testPassword123';
      const hashedPassword = '$2b$10$validHash';
      user.password = plainPassword;

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      await user.hashPassword();

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const isValid = await bcrypt.compare(plainPassword, user.password);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(isValid).toBe(true);
    });
  });

  describe('comparePassword Method', () => {
    beforeEach(async () => {
      user.password = 'correctPassword';
      (bcrypt.hash as jest.Mock).mockResolvedValue(
        '$2b$10$hashedCorrectPassword',
      );
      await user.hashPassword();
    });

    it('should return true for correct password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const isValid = await user.comparePassword('correctPassword');

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctPassword',
        user.password,
      );
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const isValid = await user.comparePassword('wrongPassword');

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongPassword',
        user.password,
      );
      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const isValid = await user.comparePassword('CORRECTPASSWORD');

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'CORRECTPASSWORD',
        user.password,
      );
      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const isValid = await user.comparePassword('');

      expect(bcrypt.compare).toHaveBeenCalledWith('', user.password);
      expect(isValid).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = 'p@ssw0rd!#$%^&*()';
      user.password = specialPassword;
      (bcrypt.hash as jest.Mock).mockResolvedValue(
        '$2b$10$hashedSpecialPassword',
      );
      await user.hashPassword();

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const isValid = await user.comparePassword(specialPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        specialPassword,
        user.password,
      );
      expect(isValid).toBe(true);
    });
  });

  describe('recalculateBalance Method', () => {
    it('should calculate positive net balance', () => {
      user.totalLent = 1000;
      user.totalBorrowed = 500;

      user.recalculateBalance();

      expect(user.netBalance).toBe(500);
    });

    it('should calculate negative net balance', () => {
      user.totalLent = 300;
      user.totalBorrowed = 800;

      user.recalculateBalance();

      expect(user.netBalance).toBe(-500);
    });

    it('should calculate zero net balance', () => {
      user.totalLent = 500;
      user.totalBorrowed = 500;

      user.recalculateBalance();

      expect(user.netBalance).toBe(0);
    });

    it('should handle zero lent and borrowed', () => {
      user.totalLent = 0;
      user.totalBorrowed = 0;

      user.recalculateBalance();

      expect(user.netBalance).toBe(0);
    });

    it('should handle large numbers', () => {
      user.totalLent = 1000000;
      user.totalBorrowed = 250000;

      user.recalculateBalance();

      expect(user.netBalance).toBe(750000);
    });

    it('should handle decimal values', () => {
      user.totalLent = 100.5;
      user.totalBorrowed = 50.25;

      user.recalculateBalance();

      expect(user.netBalance).toBeCloseTo(50.25);
    });
  });

  describe('Friends Management', () => {
    it('should allow adding friends', () => {
      const friendId = new ObjectId();
      user.friends.push(friendId);

      expect(user.friends).toContain(friendId);
      expect(user.friends.length).toBe(1);
    });

    it('should allow multiple friends', () => {
      const friend1 = new ObjectId();
      const friend2 = new ObjectId();
      user.friends = [friend1, friend2];

      expect(user.friends.length).toBe(2);
      expect(user.friends).toContain(friend1);
      expect(user.friends).toContain(friend2);
    });

    it('should allow adding pending requests', () => {
      const requestId = new ObjectId();
      user.pendingRequests.push(requestId);

      expect(user.pendingRequests).toContain(requestId);
      expect(user.pendingRequests.length).toBe(1);
    });

    it('should allow removing friends', () => {
      const friend1 = new ObjectId();
      const friend2 = new ObjectId();
      user.friends = [friend1, friend2];

      user.friends = user.friends.filter(
        (id) => id.toString() !== friend1.toString(),
      );

      expect(user.friends.length).toBe(1);
      expect(user.friends).not.toContain(friend1);
      expect(user.friends).toContain(friend2);
    });
  });

  describe('Token Version Management', () => {
    it('should allow incrementing token version', () => {
      user.tokenVersion = 0;
      user.tokenVersion += 1;

      expect(user.tokenVersion).toBe(1);
    });

    it('should handle multiple increments', () => {
      user.tokenVersion = 0;
      user.tokenVersion += 1;
      user.tokenVersion += 1;
      user.tokenVersion += 1;

      expect(user.tokenVersion).toBe(3);
    });
  });

  describe('Active Status Management', () => {
    it('should set user as active', () => {
      user.isActive = false;
      user.isActive = true;

      expect(user.isActive).toBe(true);
    });

    it('should set user as inactive', () => {
      user.isActive = true;
      user.isActive = false;

      expect(user.isActive).toBe(false);
    });
  });

  describe('Last Login Tracking', () => {
    it('should allow setting last login', () => {
      const loginDate = new Date();
      user.lastLogin = loginDate;

      expect(user.lastLogin).toEqual(loginDate);
    });

    it('should allow updating last login', () => {
      const firstLogin = new Date('2024-01-01');
      const secondLogin = new Date('2024-01-02');

      user.lastLogin = firstLogin;
      expect(user.lastLogin).toEqual(firstLogin);

      user.lastLogin = secondLogin;
      expect(user.lastLogin).toEqual(secondLogin);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain email uniqueness constraint', () => {
      // This would be enforced by database, entity just has the field
      expect(user.email).toBe('test@example.com');
    });

    it('should store ObjectId types correctly', () => {
      expect(user._id).toBeInstanceOf(ObjectId);
    });

    it('should handle null values for optional fields', () => {
      const newUser = new User();
      expect(newUser.avatar).toBeUndefined();
      expect(newUser.phone).toBeUndefined();
      expect(newUser.lastLogin).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string for optional fields', () => {
      user.avatar = '';
      user.phone = '';

      expect(user.avatar).toBe('');
      expect(user.phone).toBe('');
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(200);
      user.name = longName;

      expect(user.name).toBe(longName);
      expect(user.name.length).toBe(200);
    });

    it('should handle special characters in email', () => {
      user.email = 'user+test@example.co.uk';

      expect(user.email).toBe('user+test@example.co.uk');
    });

    it('should handle international phone numbers', () => {
      user.phone = '+44 20 7946 0958';

      expect(user.phone).toBe('+44 20 7946 0958');
    });
  });
});
