import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarUnit } from './car-unit.entity';
import { Car } from './car.entity';
import { CarUnitsService } from './car-units.service';
import { CarUnitsController } from './car-units.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CarUnit, Car])],
  providers: [CarUnitsService],
  controllers: [CarUnitsController],
  exports: [CarUnitsService],
})
export class CarUnitsModule {} 