import {
  TransactionStatus,
  TransactionType,
} from '../entities/transaction.entity';

/**
 * Transaction response DTO for API responses
 */
export interface TransactionResponse {
  _id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  remarks?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction with user details
 */
export interface TransactionWithUser extends TransactionResponse {
  senderName?: string;
  receiverName?: string;
  senderEmail?: string;
  receiverEmail?: string;
}

/**
 * User transaction summary
 */
export interface UserTransactionSummary {
  totalSent: number;
  totalReceived: number;
  pendingCount: number;
  acceptedCount: number;
  completedCount: number;
  failedCount: number;
  transactions: TransactionWithUser[];
}
