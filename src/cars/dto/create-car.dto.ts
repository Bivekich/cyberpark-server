import { IsNotEmpty, IsString, IsNumber, IsOptional, IsUrl, IsUUID, Min, MaxLength } from 'class-validator';

export class CreateCarDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(1)
  topSpeed: number;

  @IsNumber()
  @Min(0)
  pricePerMinute: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minLevel?: number;

  @IsOptional()
  @IsUUID()
  locationId?: string;
} 