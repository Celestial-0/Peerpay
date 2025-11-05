import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPTED = 'friend_accepted',
  TRANSACTION_REQUEST = 'transaction_request',
  TRANSACTION_VERIFIED = 'transaction_verified',
  TRANSACTION_REJECTED = 'transaction_rejected',
  PAYMENT_REMINDER = 'payment_reminder',
  SYSTEM = 'system',
  OTHER = 'other',
}

@Entity('notifications')
export class Notification {
  @ObjectIdColumn()
  _id: ObjectId;

  /** 👤 User Association */
  @Column('objectId')
  userId: ObjectId; // The user who will receive this notification

  /** 📬 Notification Content */
  @Column()
  title: string;

  @Column()
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.OTHER,
  })
  type: NotificationType;

  /** 📊 Status & Metadata */
  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  actionUrl?: string; // Optional URL for navigation (e.g., /transactions/123)

  @Column({ nullable: true, type: 'json' })
  metadata?: Record<string, any>; // Additional data (e.g., transactionId, friendId)

  /** 🕓 Timestamps */
  @Column({ type: 'date', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ type: 'date', default: () => 'NOW()' })
  updatedAt: Date;

  /** 🔒 Auto-handled timestamps */
  @BeforeInsert()
  setCreateTimestamp() {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
    if (this.isRead === undefined) this.isRead = false;
    if (this.type === undefined) this.type = NotificationType.OTHER;
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
