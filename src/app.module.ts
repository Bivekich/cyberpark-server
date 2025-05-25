import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || '62.118.109.7',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'car',
      password: process.env.DB_PASSWORD || 'Smr63163',
      database: process.env.DB_DATABASE || 'cardb',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // В продакшене должно быть false
      ssl: {
        rejectUnauthorized: false, // Только для разработки
      },
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
