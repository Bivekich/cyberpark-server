import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import {
  SignUpDto,
  SignInDto,
  TokensDto,
  TelegramAuthDto,
  AppleAuthDto,
} from './dto/auth.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<TokensDto> {
    const user = await this.usersService.create(
      signUpDto.email,
      signUpDto.password,
      signUpDto.fullName,
    );

    const tokens = await this.getTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async signIn(signInDto: SignInDto): Promise<TokensDto> {
    const user = await this.usersService.findByEmail(signInDto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(
      signInDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async telegramAuth(telegramAuthDto: TelegramAuthDto): Promise<TokensDto> {
    // Проверка подлинности данных от Telegram
    if (!this.verifyTelegramAuth(telegramAuthDto)) {
      throw new UnauthorizedException('Недействительные данные Telegram');
    }

    // Найти пользователя по идентификатору Telegram или создать нового
    let user = await this.usersService.findByTelegramId(telegramAuthDto.id);

    if (!user) {
      // Создать нового пользователя
      const fullName = telegramAuthDto.last_name
        ? `${telegramAuthDto.first_name} ${telegramAuthDto.last_name}`
        : telegramAuthDto.first_name;

      // Генерируем временный email если пользователь без username
      const email = telegramAuthDto.username
        ? `${telegramAuthDto.username}@telegram.user`
        : `telegram_${telegramAuthDto.id}@telegram.user`;

      user = await this.usersService.createSocialUser(email, fullName, {
        telegramId: telegramAuthDto.id,
      });
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async appleAuth(appleAuthDto: AppleAuthDto): Promise<TokensDto> {
    try {
      // Проверка и декодирование токена от Apple
      // В реальном приложении здесь должна быть проверка подписи токена
      const decodedToken = this.decodeAppleToken(appleAuthDto.idToken);

      // Получаем уникальный идентификатор пользователя из токена
      const appleUserId = decodedToken.sub;

      // Найти пользователя по идентификатору Apple или создать нового
      let user = await this.usersService.findByAppleId(appleUserId);

      if (!user) {
        // Создать нового пользователя
        let fullName = 'Apple User';
        let email = `apple_${appleUserId}@apple.user`;

        // Если у нас есть информация о пользователе из запроса
        if (appleAuthDto.fullName) {
          const { firstName, lastName } = appleAuthDto.fullName;
          if (firstName || lastName) {
            fullName = `${firstName || ''} ${lastName || ''}`.trim();
          }
        }

        if (appleAuthDto.email) {
          email = appleAuthDto.email;
        }

        user = await this.usersService.createSocialUser(email, fullName, {
          appleId: appleUserId,
        });
      }

      const tokens = await this.getTokens(user.id, user.email);
      await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } catch (error: any) {
      console.error('Apple auth error:', error.message);
      throw new UnauthorizedException('Недействительные данные Apple ID');
    }
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<TokensDto> {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Доступ запрещен');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Доступ запрещен');
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<boolean> {
    await this.usersService.updateRefreshToken(userId, null);
    return true;
  }

  private async getTokens(userId: string, email: string): Promise<TokensDto> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: process.env.JWT_SECRET || 'your-secret-key',
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private verifyTelegramAuth(telegramAuthDto: TelegramAuthDto): boolean {
    // Telegram Bot API token должен быть сохранен в переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN не найден в переменных окружения');
    }

    // Создаем хеш для проверки данных
    const { hash, ...data } = telegramAuthDto;

    // Сортируем ключи в алфавитном порядке
    const dataCheckString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('\n');

    // Создаем HMAC-SHA256 хеш с секретным ключом
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Сравниваем вычисленный хеш с полученным
    return calculatedHash === hash;
  }

  private decodeAppleToken(idToken: string): any {
    // В реальном проекте здесь должна быть проверка подписи JWT
    // Сейчас делаем простую версию - просто декодируем
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Недействительный JWT токен');
    }

    try {
      const payload = parts[1];
      const decodedPayload = Buffer.from(payload, 'base64').toString('utf8');
      return JSON.parse(decodedPayload);
    } catch (error: any) {
      console.error('Token decode error:', error.message);
      throw new Error('Не удалось декодировать токен');
    }
  }
}
