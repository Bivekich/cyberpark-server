import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AppleAuthDto,
  SignInDto,
  SignUpDto,
  TelegramAuthDto,
  TokensDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtRefreshGuard } from './jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto): Promise<TokensDto> {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  async signIn(@Body() signInDto: SignInDto): Promise<TokensDto> {
    return this.authService.signIn(signInDto);
  }

  @Post('telegram')
  async telegramAuth(
    @Body() telegramAuthDto: TelegramAuthDto,
  ): Promise<TokensDto> {
    return this.authService.telegramAuth(telegramAuthDto);
  }

  @Post('apple')
  async appleAuth(@Body() appleAuthDto: AppleAuthDto): Promise<TokensDto> {
    return this.authService.appleAuth(appleAuthDto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refreshTokens(@Req() req) {
    const userId = req.user.id;
    const refreshToken = req.user.refreshToken;
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }
}
