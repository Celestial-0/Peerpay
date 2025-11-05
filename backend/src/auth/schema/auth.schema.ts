import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * Schema for user signup
 */
export const signupSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, "Password can't be longer than 128 characters"),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

/**
 * Schema for user signin
 */
export const signinSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, "Password can't be longer than 128 characters"),
});

/**
 * DTO Classes for NestJS validation
 */
export class SignupDto extends createZodDto(signupSchema) {}
export class SigninDto extends createZodDto(signinSchema) {}
