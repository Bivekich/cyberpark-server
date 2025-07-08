import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Car, CarStatus } from './car.entity';

@Entity('car_units')
export class CarUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Car, (car) => car.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'car_id' })
  car: Car;

  @Column({ name: 'car_id' })
  carId: string;

  @Column({ length: 100, nullable: true })
  name: string;

  @Column({ type: 'enum', enum: CarStatus, default: CarStatus.AVAILABLE })
  status: CarStatus;

  @Column({ name: 'current_user_id', nullable: true })
  currentUserId: string | null;

  @Column({ type: 'int', default: 100 })
  battery: number; // percentage 0-100

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 