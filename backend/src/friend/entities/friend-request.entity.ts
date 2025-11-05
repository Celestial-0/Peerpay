import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('friend_requests')
export class FriendRequest {
  @ObjectIdColumn()
  _id: ObjectId;

  /** 👤 Sender of the friend request */
  @Column('objectid')
  senderId: ObjectId;

  /** 👥 Receiver of the friend request */
  @Column('objectid')
  receiverId: ObjectId;

  /** 📊 Status of the request */
  @Column({ default: FriendRequestStatus.PENDING })
  status: FriendRequestStatus;

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
    if (!this.status) {
      this.status = FriendRequestStatus.PENDING;
    }
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
