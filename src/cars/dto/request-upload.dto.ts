import { IsString, IsNotEmpty } from 'class-validator';

export class RequestUploadDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;
} 