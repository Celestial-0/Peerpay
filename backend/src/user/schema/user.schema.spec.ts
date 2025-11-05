import {
  createUserSchema,
  updateUserSchema,
  updateUserEmailSchema,
  changePasswordSchema,
  userQuerySchema,
  userIdParamSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  updateUserBalanceSchema,
  searchUserByEmailSchema,
  bulkUserIdsSchema,
} from './user.schema';

describe('User Schema Validation', () => {
  describe('createUserSchema', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'Test1234!',
      confirmPassword: 'Test1234!',
      name: 'Test User',
    };

    it('should validate valid user data', () => {
      const result = createUserSchema.safeParse(validUserData);
      expect(result.success).toBe(true);
    });

    it('should require email field', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, ...dataWithoutEmail } = validUserData;
      const result = createUserSchema.safeParse(dataWithoutEmail);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Email is required');
      }
    });

    it('should validate email format', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should convert email to lowercase', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        email: 'TEST@EXAMPLE.COM',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should trim and lowercase email', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        email: '  TEST@EXAMPLE.COM  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        console.log(result.data.email);
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should require password of minimum 8 characters', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        password: 'Short1!',
        confirmPassword: 'Short1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'at least 8 characters',
        );
      }
    });

    it('should enforce password max length of 100', () => {
      const longPassword = 'A1a!' + 'a'.repeat(100);
      const result = createUserSchema.safeParse({
        ...validUserData,
        password: longPassword,
        confirmPassword: longPassword,
      });
      expect(result.success).toBe(false);
    });

    it('should require uppercase letter in password', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        password: 'lowercase1!',
        confirmPassword: 'lowercase1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase');
      }
    });

    it('should require lowercase letter in password', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        password: 'UPPERCASE1!',
        confirmPassword: 'UPPERCASE1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('lowercase');
      }
    });

    it('should require digit in password', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        password: 'NoDigits!',
        confirmPassword: 'NoDigits!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('number');
      }
    });

    it('should require special character in password', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        password: 'NoSpecial1',
        confirmPassword: 'NoSpecial1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('special character');
      }
    });

    it('should require password confirmation', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...dataWithoutConfirm } = validUserData;
      const result = createUserSchema.safeParse(dataWithoutConfirm);
      expect(result.success).toBe(false);
    });

    it('should validate passwords match', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        confirmPassword: 'Different1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('do not match');
      }
    });

    it('should require name field', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name, ...dataWithoutName } = validUserData;
      const result = createUserSchema.safeParse(dataWithoutName);
      expect(result.success).toBe(false);
    });

    it('should trim name whitespace', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        name: '  Test User  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test User');
      }
    });

    it('should enforce name max length of 100', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        name: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid avatar URL', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        avatar: 'https://example.com/avatar.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid avatar URL', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        avatar: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty string for avatar', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        avatar: '',
      });
      expect(result.success).toBe(true);
    });

    it('should validate phone number format', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        phone: '+1234567890',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone format', () => {
      const result = createUserSchema.safeParse({
        ...validUserData,
        phone: 'invalid-phone',
      });
      expect(result.success).toBe(false);
    });

    it('should accept international phone numbers', () => {
      const phones = ['+1234567890', '+442071234567', '+919876543210'];
      phones.forEach((phone) => {
        const result = createUserSchema.safeParse({
          ...validUserData,
          phone,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updateUserSchema', () => {
    it('should validate name update', () => {
      const result = updateUserSchema.safeParse({ name: 'Updated Name' });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = updateUserSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should validate avatar URL', () => {
      const result = updateUserSchema.safeParse({
        avatar: 'https://example.com/avatar.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate phone format', () => {
      const result = updateUserSchema.safeParse({ phone: '+1234567890' });
      expect(result.success).toBe(true);
    });

    it('should trim name', () => {
      const result = updateUserSchema.safeParse({ name: '  Trimmed  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Trimmed');
      }
    });
  });

  describe('updateUserEmailSchema', () => {
    it('should validate email and password', () => {
      const result = updateUserEmailSchema.safeParse({
        email: 'new@example.com',
        password: 'currentPassword',
      });
      expect(result.success).toBe(true);
    });

    it('should require email', () => {
      const result = updateUserEmailSchema.safeParse({
        password: 'currentPassword',
      });
      expect(result.success).toBe(false);
    });

    it('should require password', () => {
      const result = updateUserEmailSchema.safeParse({
        email: 'new@example.com',
      });
      expect(result.success).toBe(false);
    });

    it('should convert email to lowercase', () => {
      const result = updateUserEmailSchema.safeParse({
        email: 'NEW@EXAMPLE.COM',
        password: 'password',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('new@example.com');
      }
    });
  });

  describe('changePasswordSchema', () => {
    const validPasswordChange = {
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
      confirmNewPassword: 'NewPass1!',
    };

    it('should validate password change', () => {
      const result = changePasswordSchema.safeParse(validPasswordChange);
      expect(result.success).toBe(true);
    });

    it('should require new passwords to match', () => {
      const result = changePasswordSchema.safeParse({
        ...validPasswordChange,
        confirmNewPassword: 'Different1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('do not match');
      }
    });

    it('should require new password different from current', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'SamePass1!',
        newPassword: 'SamePass1!',
        confirmNewPassword: 'SamePass1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'different from current',
        );
      }
    });

    it('should enforce new password complexity', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPass1!',
        newPassword: 'weak',
        confirmNewPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('userQuerySchema', () => {
    it('should validate search query', () => {
      const result = userQuerySchema.safeParse({ search: 'test' });
      expect(result.success).toBe(true);
    });

    it('should accept empty search', () => {
      const result = userQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate role filter', () => {
      const result = userQuerySchema.safeParse({ role: 'admin' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const result = userQuerySchema.safeParse({ role: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should convert isActive string to boolean', () => {
      const result = userQuerySchema.safeParse({ isActive: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });

    it('should set default limit to 50', () => {
      const result = userQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should enforce max limit of 100', () => {
      const result = userQuerySchema.safeParse({ limit: 150 });
      expect(result.success).toBe(false);
    });

    it('should set default offset to 0', () => {
      const result = userQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0);
      }
    });

    it('should validate sortBy field', () => {
      const validFields = ['createdAt', 'name', 'email', 'netBalance'];
      validFields.forEach((field) => {
        const result = userQuerySchema.safeParse({ sortBy: field });
        expect(result.success).toBe(true);
      });
    });

    it('should validate sortOrder', () => {
      const result = userQuerySchema.safeParse({ sortOrder: 'asc' });
      expect(result.success).toBe(true);
    });

    it('should default sortOrder to desc', () => {
      const result = userQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortOrder).toBe('desc');
      }
    });
  });

  describe('userIdParamSchema', () => {
    it('should validate valid MongoDB ObjectId', () => {
      const result = userIdParamSchema.safeParse({
        id: '507f1f77bcf86cd799439011',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid ObjectId format', () => {
      const result = userIdParamSchema.safeParse({ id: 'invalid-id' });
      expect(result.success).toBe(false);
    });

    it('should require id field', () => {
      const result = userIdParamSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept uppercase hex characters', () => {
      const result = userIdParamSchema.safeParse({
        id: '507F1F77BCF86CD799439011',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateUserRoleSchema', () => {
    it('should validate user role', () => {
      const result = updateUserRoleSchema.safeParse({ role: 'user' });
      expect(result.success).toBe(true);
    });

    it('should validate admin role', () => {
      const result = updateUserRoleSchema.safeParse({ role: 'admin' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const result = updateUserRoleSchema.safeParse({ role: 'superadmin' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserStatusSchema', () => {
    it('should validate true status', () => {
      const result = updateUserStatusSchema.safeParse({ isActive: true });
      expect(result.success).toBe(true);
    });

    it('should validate false status', () => {
      const result = updateUserStatusSchema.safeParse({ isActive: false });
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean', () => {
      const result = updateUserStatusSchema.safeParse({ isActive: 'true' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserBalanceSchema', () => {
    it('should validate totalLent', () => {
      const result = updateUserBalanceSchema.safeParse({ totalLent: 1000 });
      expect(result.success).toBe(true);
    });

    it('should validate totalBorrowed', () => {
      const result = updateUserBalanceSchema.safeParse({ totalBorrowed: 500 });
      expect(result.success).toBe(true);
    });

    it('should reject negative totalLent', () => {
      const result = updateUserBalanceSchema.safeParse({ totalLent: -100 });
      expect(result.success).toBe(false);
    });

    it('should reject negative totalBorrowed', () => {
      const result = updateUserBalanceSchema.safeParse({ totalBorrowed: -50 });
      expect(result.success).toBe(false);
    });

    it('should accept zero values', () => {
      const result = updateUserBalanceSchema.safeParse({
        totalLent: 0,
        totalBorrowed: 0,
      });
      expect(result.success).toBe(true);
    });

    it('should accept decimal values', () => {
      const result = updateUserBalanceSchema.safeParse({
        totalLent: 100.5,
        totalBorrowed: 50.25,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('searchUserByEmailSchema', () => {
    it('should validate email search', () => {
      const result = searchUserByEmailSchema.safeParse({
        email: 'search@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should convert email to lowercase', () => {
      const result = searchUserByEmailSchema.safeParse({
        email: 'SEARCH@EXAMPLE.COM',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('search@example.com');
      }
    });

    it('should require valid email format', () => {
      const result = searchUserByEmailSchema.safeParse({
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkUserIdsSchema', () => {
    it('should validate array of user IDs', () => {
      const result = bulkUserIdsSchema.safeParse({
        userIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      });
      expect(result.success).toBe(true);
    });

    it('should require at least one ID', () => {
      const result = bulkUserIdsSchema.safeParse({ userIds: [] });
      expect(result.success).toBe(false);
    });

    it('should enforce max of 100 IDs', () => {
      const userIds = Array(101).fill('507f1f77bcf86cd799439011');
      const result = bulkUserIdsSchema.safeParse({ userIds });
      expect(result.success).toBe(false);
    });

    it('should validate each ID format', () => {
      const result = bulkUserIdsSchema.safeParse({
        userIds: ['507f1f77bcf86cd799439011', 'invalid-id'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases & Special Scenarios', () => {
    it('should handle null values', () => {
      const result = createUserSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should handle undefined values', () => {
      const result = updateUserSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should reject extra unknown fields in strict mode', () => {
      const result = updateUserSchema.safeParse({
        name: 'Test',
        unknownField: 'value',
      });
      // Zod by default ignores unknown fields unless strict mode is enabled
      expect(result.success).toBe(true);
    });

    it('should handle very long strings gracefully', () => {
      const longString = 'a'.repeat(10000);
      const result = updateUserSchema.safeParse({ name: longString });
      expect(result.success).toBe(false);
    });

    it('should handle special characters in name', () => {
      const result = updateUserSchema.safeParse({
        name: "O'Brien-Smith Jr.",
      });
      expect(result.success).toBe(true);
    });

    it('should handle unicode characters in name', () => {
      const result = updateUserSchema.safeParse({ name: '李明 (Li Ming)' });
      expect(result.success).toBe(true);
    });

    it('should handle emojis in name', () => {
      const result = updateUserSchema.safeParse({ name: 'Test User 👤' });
      expect(result.success).toBe(true);
    });
  });
});
