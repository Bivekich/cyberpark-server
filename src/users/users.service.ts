import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['selectedLocation'] });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { id },
      relations: ['selectedLocation']
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ 
      where: { email },
      relations: ['selectedLocation']
    });
  }

  async findByTelegramId(telegramId: string): Promise<User> {
    return this.usersRepository.findOne({ 
      where: { telegramId },
      relations: ['selectedLocation']
    });
  }

  async findByAppleId(appleId: string): Promise<User> {
    return this.usersRepository.findOne({ 
      where: { appleId },
      relations: ['selectedLocation']
    });
  }

  async create(
    email: string,
    password: string,
    fullName: string,
  ): Promise<User> {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = new User();
    user.email = email;
    user.password = password;
    user.fullName = fullName;
    user.isActive = true;

    return this.usersRepository.save(user);
  }

  async createSocialUser(
    email: string,
    fullName: string,
    socialData: { telegramId?: string; appleId?: string },
  ): Promise<User> {
    // Проверяем, существует ли пользователь с таким email
    let user = await this.findByEmail(email);

    if (user) {
      // Обновляем данные пользователя, добавляя идентификаторы соцсетей
      if (socialData.telegramId) {
        user.telegramId = socialData.telegramId;
      }
      if (socialData.appleId) {
        user.appleId = socialData.appleId;
      }
      return this.usersRepository.save(user);
    }

    // Создаем нового пользователя
    user = new User();
    user.email = email;
    user.fullName = fullName;
    user.isActive = true;

    // Генерируем случайный пароль для пользователей из соцсетей
    const randomPassword = Math.random().toString(36).slice(-10);
    user.password = randomPassword;

    if (socialData.telegramId) {
      user.telegramId = socialData.telegramId;
    }
    if (socialData.appleId) {
      user.appleId = socialData.appleId;
    }

    return this.usersRepository.save(user);
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      refreshToken: refreshToken ? await bcrypt.hash(refreshToken, 10) : null,
    });
  }

  /**
   * Update user's selected location
   */
  async updateSelectedLocation(userId: string, locationId: string | null): Promise<User> {
    console.log(`Updating selected location for user ${userId} to location: ${locationId}`);
    
    // Check that user exists
    const user = await this.findOne(userId);
    console.log(`User found: ${user.email}, current selectedLocationId: ${user.selectedLocationId}`);
    
    // Update the location
    await this.usersRepository.update(userId, { selectedLocationId: locationId });
    
    // Return updated user with relation
    const updatedUser = await this.findOne(userId);
    console.log(`After update, selectedLocationId: ${updatedUser.selectedLocationId}`);
    
    return updatedUser;
  }

  /**
   * Обновляем ссылку на аватар пользователя
   */
  async updateProfileImage(userId: string, avatarUrl: string): Promise<void> {
    console.log(`Updating profile image for user ${userId} with URL: ${avatarUrl}`);
    
    // Проверяем, что пользователь существует
    const user = await this.findOne(userId);
    console.log(`User found: ${user.email}, current profileImage: ${user.profileImage}`);
    
    const result = await this.usersRepository.update(userId, { profileImage: avatarUrl });
    console.log(`Update result:`, result);
    
    // Проверяем, что обновление прошло успешно
    const updatedUser = await this.findOne(userId);
    console.log(`After update, profileImage: ${updatedUser.profileImage}`);
  }
}
