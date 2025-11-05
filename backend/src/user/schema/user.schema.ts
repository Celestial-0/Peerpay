import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * Schema for creating a new user (signup)
 */
export const createUserSchema = z
  .object({
    email: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? 'Email is required'
            : 'Email must be a string',
      })
      .min(1, 'Email is required')
      .trim()
      .toLowerCase()
      .pipe(z.email('Invalid email format')),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password cannot exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      ),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    avatar: z.url('Avatar must be a valid URL').optional().or(z.literal('')),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Schema for updating user profile
 */
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name cannot exceed 100 characters')
    .trim()
    .optional(),
  avatar: z.url('Avatar must be a valid URL').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema for updating user email
 */
export const updateUserEmailSchema = z.object({
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Email is required'
          : 'Email must be a string',
    })
    .trim()
    .toLowerCase()
    .pipe(z.email('Invalid email format')),

  password: z.string().min(1, 'Current password is required'),
});

/**
 * Schema for changing password
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'New password cannot exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      ),
    confirmNewPassword: z.string().min(1, 'Confirm new password is required'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Schema for user query parameters
 */
export const userQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  limit: z
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(50),
  offset: z
    .number()
    .int('Offset must be an integer')
    .nonnegative('Offset cannot be negative')
    .optional()
    .default(0),
  sortBy: z.enum(['createdAt', 'name', 'email', 'netBalance']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Schema for user ID parameter validation
 */
export const userIdParamSchema = z.object({
  id: z
    .string()
    .min(1, 'User ID is required')
    .regex(/^[a-f\d]{24}$/i, 'Invalid user ID format'),
});

/**
 * Schema for updating user role (admin only)
 */
export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin'], {
    message: 'Role must be either "user" or "admin"',
  }),
});

/**
 * Schema for updating user status (admin only)
 */
export const updateUserStatusSchema = z.object({
  isActive: z.boolean({
    message: 'isActive must be a boolean',
  }),
});

/**
 * Schema for balance update validation (internal use)
 */
export const updateUserBalanceSchema = z.object({
  totalLent: z.number().nonnegative('Total lent cannot be negative').optional(),
  totalBorrowed: z
    .number()
    .nonnegative('Total borrowed cannot be negative')
    .optional(),
});

/**
 * Schema for user search by email
 */
export const searchUserByEmailSchema = z.object({
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Email is required'
          : 'Email must be a string',
    })
    .trim()
    .toLowerCase()
    .pipe(z.email('Invalid email format')),
});

/**
 * Schema for bulk user operations
 */
export const bulkUserIdsSchema = z.object({
  userIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user ID format'))
    .min(1, 'At least one user ID is required')
    .max(100, 'Cannot process more than 100 users at once'),
});

/**
 * DTO Classes for NestJS validation
 */
export class CreateUserDto extends createZodDto(createUserSchema) {}
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
export class UpdateUserEmailDto extends createZodDto(updateUserEmailSchema) {}
export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
export class UserQueryDto extends createZodDto(userQuerySchema) {}
export class UserIdParamDto extends createZodDto(userIdParamSchema) {}
export class UpdateUserRoleDto extends createZodDto(updateUserRoleSchema) {}
export class UpdateUserStatusDto extends createZodDto(updateUserStatusSchema) {}
export class UpdateUserBalanceDto extends createZodDto(
  updateUserBalanceSchema,
) {}
export class SearchUserByEmailDto extends createZodDto(
  searchUserByEmailSchema,
) {}
export class BulkUserIdsDto extends createZodDto(bulkUserIdsSchema) {}
