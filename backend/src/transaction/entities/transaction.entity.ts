import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export enum TransactionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REJECTED = 'rejected',
}

export enum TransactionType {
  LENT = 'lent',
  BORROWED = 'borrowed',
}

@Entity('transactions')
export class Transaction {
  @ObjectIdColumn()
  _id: ObjectId;

  /** 👤 Sender Information */
  @Column('objectid')
  senderId: ObjectId;

  /** 👥 Receiver Information */
  @Column('objectid')
  receiverId: ObjectId;

  /** 💰 Transaction Amount */
  @Column({ type: 'number' })
  amount: number;

  /** 📋 Transaction Type (from sender's perspective) */
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  /** 📊 Transaction Status */
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  /** 📝 Optional Remarks */
  @Column({ nullable: true })
  remarks?: string;

  /** 🕓 Timestamps */
  @Column({ type: 'date', default: () => 'NOW()' })
  timestamp: Date;

  @Column({ type: 'date', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ type: 'date', default: () => 'NOW()' })
  updatedAt: Date;

  /** 🔒 Auto-handled timestamps */
  @BeforeInsert()
  setCreateTimestamp() {
    const now = new Date();
    this.timestamp = now;
    this.createdAt = now;
    this.updatedAt = now;
    if (this.status === undefined) {
      this.status = TransactionStatus.PENDING;
    }
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
