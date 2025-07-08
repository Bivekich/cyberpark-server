import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ReservationStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  USED = 'used',
  CANCELED = 'canceled',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  carId: string;

  @Column({ name: 'car_unit_id', nullable: true })
  carUnitId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.ACTIVE })
  status: ReservationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 