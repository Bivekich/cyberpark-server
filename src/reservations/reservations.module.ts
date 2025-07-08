import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './reservation.entity';
import { CarUnit } from '../cars/car-unit.entity';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, CarUnit])],
  providers: [ReservationsService],
  controllers: [ReservationsController],
  exports: [ReservationsService],
})
export class ReservationsModule {} 