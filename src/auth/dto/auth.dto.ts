import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  fullName: string;
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

export class TokensDto {
  accessToken: string;
  refreshToken: string;
}

export class TelegramAuthDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  first_name: string;

  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export class AppleAuthDto {
  @IsNotEmpty()
  idToken: string;

  @IsNotEmpty()
  authorizationCode: string;

  fullName?: {
    firstName?: string;
    lastName?: string;
  };

  email?: string;
}
