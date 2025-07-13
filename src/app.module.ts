import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';
import { ReservationsModule } from './reservations/reservations.module';
import { CarsModule } from './cars/cars.module';
import { CarUnitsModule } from './cars/car-units.module';
import { LocationsModule } from './locations/locations.module';
import { config } from 'dotenv';

// Load Environment Variables
config({
  path: ['.env', '.env.production', '.env.local'],
});

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // В продакшене должно быть false
      ssl: true,
    }),
    UsersModule,
    AuthModule,
    PaymentsModule,
    ReservationsModule,
    CarsModule,
    CarUnitsModule,
    LocationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
