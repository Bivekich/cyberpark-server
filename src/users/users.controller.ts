import { Controller, Get, Param, UseGuards, Post, Body, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { S3Service } from '../aws/s3.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService, private s3Service: S3Service) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  /**
   * Получаем presigned URL для загрузки аватара
   */
  @Post('avatar/upload-url')
  @UseGuards(JwtAuthGuard)
  async getAvatarUploadUrl(
    @Request() req,
    @Body('contentType') contentType: string = 'image/jpeg',
  ) {
    const key = `avatars/${req.user.id}-${Date.now()}.jpg`;
    const uploadUrl = await this.s3Service.getUploadUrl(key, contentType);
    const publicUrl = this.s3Service.getPublicUrl(key);
    return { uploadUrl, publicUrl };
  }

  /**
   * Сохраняем URL аватара в профиле пользователя
   */
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  async saveAvatar(@Request() req, @Body('avatarUrl') avatarUrl: string) {
    console.log(`saveAvatar called for user ${req.user.id} with URL: ${avatarUrl}`);
    await this.usersService.updateProfileImage(req.user.id, avatarUrl);
    console.log(`Avatar saved successfully for user ${req.user.id}`);
    return { success: true, avatarUrl };
  }
}
