import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Car } from './car.entity';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { S3Service } from '../aws/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Car])],
  providers: [CarsService, S3Service],
  controllers: [CarsController],
  exports: [CarsService],
})
export class CarsModule {} 