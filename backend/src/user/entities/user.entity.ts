import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('users')
export class User {
  @ObjectIdColumn()
  _id: ObjectId;

  /** 📧 Basic Identity */
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar?: string;

  /** 📱 Contact & Social */
  @Column({ nullable: true })
  phone?: string;

  /** 🤝 Friends & Connections */
  @Column({ type: 'array', default: [] })
  friends: ObjectId[]; // Array of user IDs representing accepted friends

  @Column({ type: 'array', default: [] })
  pendingRequests: ObjectId[]; // Friend requests awaiting confirmation

  /** 💰 Ledger & Balance */
  @Column({ default: 0 })
  totalLent: number; // Sum of verified outgoing transactions

  @Column({ default: 0 })
  totalBorrowed: number; // Sum of verified incoming transactions

  @Column({ default: 0 })
  netBalance: number; // totalLent - totalBorrowed

  /** 🛡️ Access & Roles */
  @Column({ default: 'user' })
  role: 'user' | 'admin' = 'user';

  @Column({ default: true })
  isActive: boolean = true;

  /** 🔐 Security & Auth */
  @Column({ default: 0 })
  tokenVersion: number = 0;

  @Column({ nullable: true })
  refreshTokenHash?: string;

  /** 🕓 Activity */
  @Column({ nullable: true })
  lastLogin?: Date;

  @Column({ type: 'date', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ type: 'date', default: () => 'NOW()' })
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt?: Date;

  /** 🔒 Auto-handled timestamps */
  @BeforeInsert()
  setCreateTimestamp() {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
    if (this.role === undefined) this.role = 'user';
    if (this.isActive === undefined) this.isActive = true;
    if (this.tokenVersion === undefined) this.tokenVersion = 0;
    if (!this.friends) this.friends = [];
    if (!this.pendingRequests) this.pendingRequests = [];
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }

  /** ✅ Compare plain password with hashed one */
  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  /** 🔄 Hash password before saving */
  @BeforeInsert()
  async hashPassword() {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  /** 💡 Helper: Recalculate net balance */
  recalculateBalance() {
    this.netBalance = this.totalLent - this.totalBorrowed;
  }
}
