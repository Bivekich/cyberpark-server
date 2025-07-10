import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './location.entity';
import { Car } from '../cars/car.entity';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { S3Service } from '../aws/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Car])],
  providers: [LocationsService, S3Service],
  controllers: [LocationsController],
  exports: [LocationsService],
})
export class LocationsModule {} 