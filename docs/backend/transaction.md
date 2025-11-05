
# 💰 Transaction Module

**Version:** 0.0.1  

---

## Overview

The Transaction Module manages peer-to-peer money lending and borrowing transactions with a two-phase commit system (create → accept), automatic balance updates, atomic operations, and real-time notifications.

### Key Features

- ✅ **Transaction Creation** - Create LENT/BORROWED transactions (pending state)
- ✅ **Transaction Acceptance** - Two-phase commit with receiver approval
- ✅ **Transaction Rejection** - Reject pending transactions
- ✅ **Settlement System** - Settle outstanding balances between friends
- ✅ **Atomic Operations** - Database transactions for data consistency
- ✅ **Smart Balance Updates** - Balances update only on acceptance
- ✅ **Status Management** - Pending, accepted, rejected, completed, failed states
- ✅ **Transaction History** - Filter and pagination support
- ✅ **Rollback Safety** - Safe deletion of pending transactions
- ✅ **Real-time Notifications** - WebSocket integration

---

## Architecture

### Entity Schema

```typescript
@Entity('transactions')
export class Transaction {
  @ObjectIdColumn()
  _id: ObjectId;
  
  @Column()
  senderId: ObjectId;  // User who initiated the transaction
  
  @Column()
  receiverId: ObjectId;  // User who receives/accepts the transaction
  
  @Column({ type: 'decimal' })
  amount: number;
  
  @Column({
    type: 'enum',
    enum: TransactionType
  })
  type: TransactionType;  // LENT or BORROWED
  
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  status: TransactionStatus;  // PENDING, ACCEPTED, REJECTED, COMPLETED, FAILED
  
  @Column({ nullable: true })
  remarks?: string;
  
  @Column()
  timestamp: Date;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}

export enum TransactionType {
  LENT = 'lent',
  BORROWED = 'borrowed'
}

export enum TransactionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

---

## API Endpoints

### 1. Create Transaction


**POST** `/transactions`

Create a new transaction in PENDING state. Balances are NOT updated until the receiver accepts.


**Request Body:**

```json
{
  "receiverId": "507f1f77bcf86cd799439012",
  "amount": 500.00,
  "type": "lent",
  "remarks": "Lunch money"
}
```

**Response:** `201 Created`

```json
{
  "_id": "507f1f77bcf86cd799439040",
  "senderId": "507f1f77bcf86cd799439011",
  "receiverId": "507f1f77bcf86cd799439012",
  "amount": 500.00,
  "type": "lent",
  "status": "pending",
  "remarks": "Lunch money",
  "timestamp": "2024-11-06T00:00:00.000Z",
  "createdAt": "2024-11-06T00:00:00.000Z",
  "updatedAt": "2024-11-06T00:00:00.000Z"
}
```

**Transaction Types:**
- **lent** - Sender lent money to receiver
- **borrowed** - Sender borrowed money from receiver

**Important Notes:**
- Transaction starts in `pending` status
- Balances are NOT updated yet
- Receiver must accept the transaction for balances to update
- Emits WebSocket notification to receiver

---

### 2. Get All Transactions


**GET** `/transactions`

Get all transactions with summary.


**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by LENT/BORROWED |
| `status` | string | Filter by status |
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset |

**Response:** `200 OK`

```json
{
  "transactions": [
    {
      "id": "507f1f77bcf86cd799439040",
      "from": "507f1f77bcf86cd799439011",
      "to": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Jane Doe",
        "avatar": "https://example.com/avatars/jane.jpg"
      },
      "amount": 500.00,
      "type": "LENT",
      "status": "PENDING",
      "description": "Lunch money",
      "createdAt": "2024-11-06T00:00:00.000Z"
    }
  ],
  "summary": {
    "totalLent": 2500.00,
    "totalBorrowed": 1000.00,
    "netBalance": 1500.00,
    "pendingCount": 3,
    "completedCount": 15
  },
  "total": 18,
  "limit": 50,
  "offset": 0
}
```

---

### 3. Get Transactions with Specific User


**GET** `/transactions/with/:userId`

Get all transactions with a specific user.


**Response:** `200 OK`

```json
{
  "transactions": [
    {
      "id": "507f1f77bcf86cd799439040",
      "amount": 500.00,
      "type": "LENT",
      "status": "COMPLETED",
      "description": "Lunch money",
      "createdAt": "2024-11-06T00:00:00.000Z"
    }
  ],
  "summary": {
    "totalLent": 1500.00,
    "totalBorrowed": 500.00,
    "netBalance": 1000.00
  },
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Jane Doe",
    "avatar": "https://example.com/avatars/jane.jpg"
  }
}
```

---

### 4. Update Transaction Status


**PATCH** `/transactions/:id/status`

Update transaction status.


**Request Body:**

```json
{
  "status": "COMPLETED"
}
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439040",
  "status": "COMPLETED",
  "updatedAt": "2024-11-06T00:00:00.000Z"
}
```

---

### 5. Delete Transaction


**DELETE** `/transactions/:id`

Delete a pending transaction. Only the sender can delete, and only if status is PENDING.


**Response:** `204 No Content`

**Important Notes:**
- Only PENDING transactions can be deleted
- Only the sender can delete their transaction
- No balance rollback needed (balances weren't updated yet)

---

### 6. Accept Transaction


**PATCH** `/transactions/:id/accept`

Accept a pending transaction. Updates balances based on transaction type.


**Response:** `200 OK`

```json
{
  "_id": "507f1f77bcf86cd799439040",
  "senderId": "507f1f77bcf86cd799439011",
  "receiverId": "507f1f77bcf86cd799439012",
  "amount": 500.00,
  "type": "lent",
  "status": "accepted",
  "remarks": "Lunch money",
  "timestamp": "2024-11-06T00:00:00.000Z",
  "updatedAt": "2024-11-06T00:00:01.000Z"
}
```

**Balance Updates:**

For **LENT** transaction (sender lent to receiver):
- `sender.totalLent += amount`
- `receiver.totalBorrowed += amount`

For **BORROWED** transaction (sender borrowed from receiver):
- `sender.totalBorrowed += amount`
- `receiver.totalLent += amount`

**Authorization:**
- Only the receiver can accept
- Transaction must be in PENDING status

---

### 7. Reject Transaction


**PATCH** `/transactions/:id/reject`

Reject a pending transaction.


**Response:** `204 No Content`

**Authorization:**
- Only the receiver can reject
- Transaction must be in PENDING status
- No balance updates occur

---

### 8. Settle with Friend


**POST** `/transactions/settle/:friendId`

Create a settlement transaction to clear outstanding balance with a friend.


**Request Body:**

```json
{
  "amount": 200.00
}
```

**Response:** `201 Created`

```json
{
  "_id": "507f1f77bcf86cd799439050",
  "senderId": "507f1f77bcf86cd799439011",
  "receiverId": "507f1f77bcf86cd799439012",
  "amount": 200.00,
  "type": "lent",
  "status": "completed",
  "remarks": "Settlement",
  "timestamp": "2024-11-06T00:00:00.000Z",
  "createdAt": "2024-11-06T00:00:00.000Z"
}
```

**Settlement Logic:**

The system automatically determines the correct transaction type based on who owes whom:

1. Calculate net balance: `userNetBalance = user.totalLent - user.totalBorrowed`
2. If `userNetBalance < 0` (user owes friend):
   - Creates **LENT** settlement transaction
   - `user.totalLent += amount`
   - `friend.totalBorrowed += amount`
3. If `userNetBalance > 0` (friend owes user):
   - Creates **BORROWED** settlement transaction
   - `user.totalBorrowed += amount`
   - `friend.totalLent += amount`

**Important Notes:**
- Settlement transaction is created with `completed` status
- Balances are updated immediately
- Emits WebSocket notification to both users

---

### 9. Get Pending Transactions


**GET** `/transactions/pending`

Get all pending transactions where the current user is the receiver.


**Response:** `200 OK`

```json
{
  "transactions": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "sender": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "amount": 500.00,
      "type": "borrowed",
      "status": "pending",
      "remarks": "Lunch money",
      "timestamp": "2024-11-06T00:00:00.000Z"
    }
  ],
  "totalSent": 0,
  "totalReceived": 0,
  "pendingCount": 1,
  "acceptedCount": 0,
  "completedCount": 0,
  "failedCount": 0
}
```

**Important Notes:**
- Returns transactions where current user is the receiver
- Transaction type is flipped from receiver's perspective
- Only includes PENDING status transactions

---

## Business Logic

### Transaction Creation (Two-Phase Commit - Phase 1)

```typescript
async createTransaction(createDto: CreateTransactionDto, userId: string) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    // Create transaction in PENDING state
    const transaction = this.transactionRepository.create({
      senderId: new ObjectId(userId),
      receiverId: new ObjectId(createDto.receiverId),
      amount: createDto.amount,
      type: createDto.type,
      remarks: createDto.remarks,
      status: TransactionStatus.PENDING,
      timestamp: new Date()
    });
    
    const savedTransaction = await queryRunner.manager.save(
      Transaction,
      transaction
    );
    
    await queryRunner.commitTransaction();
    
    // Emit WebSocket event to receiver
    try {
      const server = this.realtimeGateway.getServer();
      const transactionEvents = this.realtimeGateway.getTransactionEvents();
      
      transactionEvents.emitTransactionCreated(
        server,
        savedTransaction._id.toString(),
        savedTransaction.amount,
        savedTransaction.type,
        userId,
        createDto.receiverId
      );
    } catch (error) {
      this.logger.warn('Failed to emit WebSocket event');
    }
    
    return this.mapToResponse(savedTransaction);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### Transaction Acceptance (Two-Phase Commit - Phase 2)

```typescript
async acceptTransaction(transactionId: string, userId: string) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    const transaction = await this.transactionRepository.findOne({
      where: createObjectIdQuery<Transaction>('_id', transactionId)
    });
    
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    
    // Verify user is the receiver
    if (transaction.receiverId.toString() !== userId) {
      throw new BadRequestException('Only the receiver can accept');
    }
    
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not pending');
    }
    
    // Update transaction status
    transaction.status = TransactionStatus.ACCEPTED;
    await queryRunner.manager.save(Transaction, transaction);
    
    // Update balances based on transaction type
    const sender = await this.userRepository.findOne({
      where: createObjectIdQuery<User>('_id', transaction.senderId)
    });
    const receiver = await this.userRepository.findOne({
      where: createObjectIdQuery<User>('_id', transaction.receiverId)
    });
    
    if (sender && receiver) {
      if (transaction.type === TransactionType.LENT) {
        // Sender lent money to receiver
        sender.totalLent += transaction.amount;
        receiver.totalBorrowed += transaction.amount;
      } else {
        // Sender borrowed money from receiver
        sender.totalBorrowed += transaction.amount;
        receiver.totalLent += transaction.amount;
      }
      
      sender.recalculateBalance();
      receiver.recalculateBalance();
      
      await queryRunner.manager.save(User, [sender, receiver]);
    }
    
    await queryRunner.commitTransaction();
    
    // Emit WebSocket events
    try {
      const server = this.realtimeGateway.getServer();
      const transactionEvents = this.realtimeGateway.getTransactionEvents();
      
      transactionEvents.emitTransactionAccepted(
        server,
        transactionId,
        [transaction.senderId.toString(), transaction.receiverId.toString()]
      );
    } catch (error) {
      this.logger.warn('Failed to emit WebSocket event');
    }
    
    return this.mapToResponse(transaction);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### Settlement Logic

```typescript
async settleWithFriend(userId: string, friendId: string, amount: number) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    const user = await this.userRepository.findOne({
      where: createObjectIdQuery<User>('_id', userId)
    });
    const friend = await this.userRepository.findOne({
      where: createObjectIdQuery<User>('_id', friendId)
    });
    
    if (!user || !friend) {
      throw new NotFoundException('User not found');
    }
    
    // Calculate who owes whom
    const userNetBalance = user.totalLent - user.totalBorrowed;
    
    // Determine the settlement direction
    const userOwesFriend = userNetBalance < 0;
    
    // Create a settlement transaction (marked as completed)
    const settlementTransaction = this.transactionRepository.create({
      senderId: new ObjectId(userId),
      receiverId: new ObjectId(friendId),
      amount,
      type: userOwesFriend ? TransactionType.LENT : TransactionType.BORROWED,
      remarks: 'Settlement',
      status: TransactionStatus.COMPLETED,
      timestamp: new Date()
    });
    
    const savedTransaction = await queryRunner.manager.save(
      Transaction,
      settlementTransaction
    );
    
    // Update balances to reflect settlement
    if (userOwesFriend) {
      // User owes friend, so user is paying back
      user.totalLent += amount;
      friend.totalBorrowed += amount;
    } else {
      // Friend owes user, so friend is paying back
      user.totalBorrowed += amount;
      friend.totalLent += amount;
    }
    
    user.recalculateBalance();
    friend.recalculateBalance();
    
    await queryRunner.manager.save(User, [user, friend]);
    await queryRunner.commitTransaction();
    
    // Emit WebSocket events
    try {
      const server = this.realtimeGateway.getServer();
      const transactionEvents = this.realtimeGateway.getTransactionEvents();
      
      transactionEvents.emitTransactionSettled(
        server,
        savedTransaction._id.toString(),
        [userId, friendId]
      );
    } catch (error) {
      this.logger.warn('Failed to emit WebSocket event');
    }
    
    return this.mapToResponse(savedTransaction);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### Safe Deletion (No Balance Rollback Needed)

```typescript
async deleteTransaction(transactionId: string, userId: string) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    const transaction = await this.transactionRepository.findOne({
      where: createObjectIdQuery<Transaction>('_id', transactionId)
    });
    
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    
    // Verify user is the sender
    if (transaction.senderId.toString() !== userId) {
      throw new BadRequestException('Only the sender can delete');
    }
    
    // Only allow deletion of pending or rejected transactions
    if (
      transaction.status !== TransactionStatus.PENDING &&
      transaction.status !== TransactionStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Only pending or rejected transactions can be deleted'
      );
    }
    
    // No need to rollback balances since they weren't updated for pending transactions
    
    // Delete the transaction
    await queryRunner.manager.delete(Transaction, transaction._id);
    await queryRunner.commitTransaction();
    
    this.logger.log(`Transaction ${transactionId} deleted by user ${userId}`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

## WebSocket Integration

### Transaction Events

```typescript
@Injectable()
export class TransactionEventsService {
  emitTransactionCreated(recipientId: string, transaction: Transaction) {
    this.gateway.server
      .to(`user:${recipientId}`)
      .emit('transaction.created', {
        transactionId: transaction._id,
        from: transaction.from,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description
      });
  }
  
  emitTransactionUpdated(userId: string, transaction: Transaction) {
    this.gateway.server
      .to(`user:${userId}`)
      .emit('transaction.updated', {
        transactionId: transaction._id,
        status: transaction.status
      });
  }
}
```

---

## Data Validation

```typescript
import { z } from 'zod';

export const CreateTransactionSchema = z.object({
  recipientId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount too large'),
  
  type: z.enum(['LENT', 'BORROWED']),
  
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  
  category: z.string()
    .max(50, 'Category too long')
    .optional()
});
```

---

## Performance Optimization

### Indexing

```typescript
@Entity('transactions')
@Index(['from', 'createdAt'])
@Index(['to', 'createdAt'])
@Index(['from', 'to'])
@Index(['status'])
export class Transaction {
  // ...
}
```

---

## Error Handling

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| `400` | `INVALID_AMOUNT` | Amount ≤ 0 | Use positive amount |
| `400` | `CANNOT_TRANSACT_SELF` | Same user | Choose different user |
| `400` | `NOT_PENDING` | Status not pending | Cannot accept/reject |
| `400` | `NOT_RECEIVER` | User is not receiver | Only receiver can accept/reject |
| `400` | `NOT_SENDER` | User is not sender | Only sender can delete |
| `400` | `CANNOT_DELETE` | Transaction not pending/rejected | Can only delete pending/rejected |
| `404` | `TRANSACTION_NOT_FOUND` | Invalid ID | Check transaction exists |
| `404` | `USER_NOT_FOUND` | Invalid user ID | Check user exists |

---

## Transaction Flow Diagram

```
┌─────────────┐
│   CREATE    │ → Transaction created in PENDING state
│ (Phase 1)   │    No balance updates yet
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐  ┌─────────────┐
│   ACCEPT    │  │   REJECT    │
│ (Phase 2)   │  │             │
└──────┬──────┘  └──────┬──────┘
       │                │
       │                │
       ▼                ▼
  Balances         No balance
  Updated          changes
  Status:          Status:
  ACCEPTED         REJECTED
```

---

## Balance Calculation Logic

### For LENT Transaction:
```
Sender perspective: "I lent money"
- sender.totalLent += amount
- receiver.totalBorrowed += amount

Example:
- Alice creates LENT transaction of $100 to Bob
- Bob accepts
- Alice.totalLent += 100 (Alice lent $100)
- Bob.totalBorrowed += 100 (Bob borrowed $100)
```

### For BORROWED Transaction:
```
Sender perspective: "I borrowed money"
- sender.totalBorrowed += amount
- receiver.totalLent += amount

Example:
- Alice creates BORROWED transaction of $50 from Bob
- Bob accepts
- Alice.totalBorrowed += 50 (Alice borrowed $50)
- Bob.totalLent += 50 (Bob lent $50)
```

### Settlement Logic:
```
Net Balance = totalLent - totalBorrowed

If netBalance < 0 (user owes friend):
  → Create LENT settlement
  → user.totalLent += amount
  → friend.totalBorrowed += amount

If netBalance > 0 (friend owes user):
  → Create BORROWED settlement
  → user.totalBorrowed += amount
  → friend.totalLent += amount
```

---

## Best Practices

```typescript
// ✅ Good: Use QueryRunner for atomicity
async acceptTransaction() {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    // Multiple operations
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// ✅ Good: Validate before operations
if (transaction.status !== TransactionStatus.PENDING) {
  throw new BadRequestException('Transaction is not pending');
}

// ✅ Good: Check authorization
if (transaction.receiverId.toString() !== userId) {
  throw new BadRequestException('Only the receiver can accept');
}

// ✅ Good: Handle WebSocket errors gracefully
try {
  this.transactionEvents.emitTransactionCreated(...);
} catch (error) {
  this.logger.warn('Failed to emit WebSocket event');
  // Don't fail the transaction due to WebSocket errors
}
```

---

## Key Changes in v0.0.1

### Two-Phase Commit System
- **Before:** Balances updated immediately on transaction creation
- **After:** Balances update only when receiver accepts

### Benefits:
1. ✅ **Receiver Approval** - Transactions require explicit acceptance
2. ✅ **No Rollback Needed** - Pending transactions can be deleted safely
3. ✅ **Better UX** - Users can review before accepting
4. ✅ **Accurate Balances** - Only accepted transactions affect balances

### Settlement System
- **New Feature:** Automatic settlement transaction creation
- **Smart Direction:** System determines LENT vs BORROWED based on net balance
- **Immediate Completion:** Settlement transactions are marked as completed

---

## Related Modules

- [User Module](./user.md) - Ledger balance updates
- [Friend Module](./friend.md) - Friend relationships and per-friend balances
- [Notification Module](./notification.md) - Transaction notifications
- [Realtime Module](./realtime.md) - Real-time transaction events

---

**Last Updated:** November 6, 2025  
**Version:** 0.0.1  
**Maintained By:** Backend Team
