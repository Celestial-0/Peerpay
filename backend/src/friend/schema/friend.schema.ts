import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * Schema for sending a friend request
 */
export const sendFriendRequestSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
});

/**
 * Schema for handling a friend request (accept/reject)
 */
export const handleFriendRequestSchema = z.object({
  decision: z.enum(['accept', 'reject'], {
    message: 'Decision must be either "accept" or "reject"',
  }),
});

/**
 * DTO Classes for NestJS validation
 */
export class SendFriendRequestDto extends createZodDto(
  sendFriendRequestSchema,
) {}

export class HandleFriendRequestDto extends createZodDto(
  handleFriendRequestSchema,
) {}
