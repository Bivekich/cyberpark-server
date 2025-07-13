import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Transaction } from './entities/transaction.entity';
import { Location } from '../locations/location.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken: string;

  @Column({ name: 'telegram_id', nullable: true })
  telegramId: string;

  @Column({ name: 'apple_id', nullable: true })
  appleId: string;

  @Column({ name: 'balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'level', type: 'int', default: 1 })
  level: number;

  @Column({ name: 'total_spent', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ name: 'profile_image', nullable: true })
  profileImage: string;

  // Add selected location relationship
  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'selected_location_id' })
  selectedLocation: Location | null;

  @Column({ name: 'selected_location_id', nullable: true })
  selectedLocationId: string | null;

  @OneToMany(() => Transaction, transaction => transaction.user)
  transactions: Transaction[];

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
