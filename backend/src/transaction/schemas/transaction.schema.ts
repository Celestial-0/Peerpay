import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { TransactionStatus } from '../entities/transaction.entity';

/**
 * Schema for creating a new transaction
 */
export const createTransactionSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['lent', 'borrowed']),
  remarks: z
    .string()
    .max(500, 'Remarks cannot exceed 500 characters')
    .optional(),
});

/**
 * Schema for updating transaction status
 */
export const updateTransactionStatusSchema = z.object({
  status: z.nativeEnum(TransactionStatus),
});

/**
 * Schema for transaction query parameters
 */
export const transactionQuerySchema = z.object({
  status: z.enum(TransactionStatus).optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

/**
 * DTO Classes for NestJS validation
 */
export class CreateTransactionDto extends createZodDto(
  createTransactionSchema,
) {}

export class UpdateTransactionStatusDto extends createZodDto(
  updateTransactionStatusSchema,
) {}

export class TransactionQueryDto extends createZodDto(transactionQuerySchema) {}
