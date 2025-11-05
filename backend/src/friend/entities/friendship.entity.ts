import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity('friendships')
export class Friendship {
  @ObjectIdColumn()
  _id: ObjectId;

  /** 👤 First user in the friendship */
  @Column('objectid')
  userId1: ObjectId;

  /** 👥 Second user in the friendship */
  @Column('objectid')
  userId2: ObjectId;

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
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
